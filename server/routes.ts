import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertProjectSchema, insertCharacterSchema, insertSceneSchema, insertPromptSchema, insertPromptLibrarySchema } from "@shared/schema";
import { generateScenes, generatePrompts } from "./prompt-engine";
import { expandBrief } from "./brief-expander";
import fs from "fs";
import path from "path";
import archiver from "archiver";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // ─── Projects ───
  app.get("/api/projects", async (_req, res) => {
    const data = await storage.getProjects();
    res.json(data);
  });

  app.get("/api/projects/:id", async (req, res) => {
    const project = await storage.getProject(Number(req.params.id));
    if (!project) return res.status(404).json({ error: "Project not found" });
    res.json(project);
  });

  app.post("/api/projects", async (req, res) => {
    const parsed = insertProjectSchema.safeParse({ ...req.body, createdAt: new Date().toISOString() });
    if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
    const project = await storage.createProject(parsed.data);
    res.json(project);
  });

  app.patch("/api/projects/:id", async (req, res) => {
    const updated = await storage.updateProject(Number(req.params.id), req.body);
    if (!updated) return res.status(404).json({ error: "Project not found" });
    res.json(updated);
  });

  app.delete("/api/projects/:id", async (req, res) => {
    const id = Number(req.params.id);
    await storage.deletePromptsByProject(id);
    await storage.deleteScenesByProject(id);
    await storage.deleteProject(id);
    res.json({ ok: true });
  });

  // ─── Characters ───
  app.get("/api/projects/:id/characters", async (req, res) => {
    const data = await storage.getCharactersByProject(Number(req.params.id));
    res.json(data);
  });

  app.get("/api/characters/saved", async (_req, res) => {
    const data = await storage.getSavedCharacters();
    res.json(data);
  });

  app.post("/api/characters", async (req, res) => {
    const parsed = insertCharacterSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
    const character = await storage.createCharacter(parsed.data);
    res.json(character);
  });

  app.patch("/api/characters/:id", async (req, res) => {
    const updated = await storage.updateCharacter(Number(req.params.id), req.body);
    if (!updated) return res.status(404).json({ error: "Character not found" });
    res.json(updated);
  });

  app.delete("/api/characters/:id", async (req, res) => {
    await storage.deleteCharacter(Number(req.params.id));
    res.json({ ok: true });
  });

  // ─── Scenes ───
  app.get("/api/projects/:id/scenes", async (req, res) => {
    const data = await storage.getScenesByProject(Number(req.params.id));
    res.json(data);
  });

  app.post("/api/projects/:id/scenes/generate", async (req, res) => {
    const projectId = Number(req.params.id);
    const project = await storage.getProject(projectId);
    if (!project) return res.status(404).json({ error: "Project not found" });

    // Delete existing scenes & prompts
    await storage.deletePromptsByProject(projectId);
    await storage.deleteScenesByProject(projectId);

    // Generate scenes from templates
    const sceneTemplates = generateScenes(project);
    const createdScenes = [];
    for (const st of sceneTemplates) {
      const created = await storage.createScene(st);
      createdScenes.push(created);
    }

    // Generate prompts from scenes (pass characters for Soul Cast injection)
    const projectChars = await storage.getCharactersByProject(projectId);
    const promptTemplates = generatePrompts(project, createdScenes, projectChars);
    for (const pt of promptTemplates) {
      await storage.createPrompt(pt);
    }

    // Update project status
    await storage.updateProject(projectId, { status: "storyboard" });

    res.json(createdScenes);
  });

  app.post("/api/scenes", async (req, res) => {
    const parsed = insertSceneSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
    const scene = await storage.createScene(parsed.data);
    res.json(scene);
  });

  app.patch("/api/scenes/:id", async (req, res) => {
    const updated = await storage.updateScene(Number(req.params.id), req.body);
    if (!updated) return res.status(404).json({ error: "Scene not found" });
    res.json(updated);
  });

  app.delete("/api/scenes/:id", async (req, res) => {
    await storage.deleteScene(Number(req.params.id));
    res.json({ ok: true });
  });

  // ─── Prompts ───
  app.get("/api/projects/:id/prompts", async (req, res) => {
    const data = await storage.getPromptsByProject(Number(req.params.id));
    res.json(data);
  });

  app.patch("/api/prompts/:id", async (req, res) => {
    const updated = await storage.updatePrompt(Number(req.params.id), req.body);
    if (!updated) return res.status(404).json({ error: "Prompt not found" });
    res.json(updated);
  });

  app.delete("/api/prompts/:id", async (req, res) => {
    await storage.deletePrompt(Number(req.params.id));
    res.json({ ok: true });
  });

  // ─── Prompt Library ───
  app.get("/api/prompt-library", async (_req, res) => {
    const data = await storage.getPromptLibrary();
    res.json(data);
  });

  app.post("/api/prompt-library", async (req, res) => {
    const parsed = insertPromptLibrarySchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
    const entry = await storage.createPromptLibraryEntry(parsed.data);
    res.json(entry);
  });

  app.delete("/api/prompt-library/:id", async (req, res) => {
    await storage.deletePromptLibraryEntry(Number(req.params.id));
    res.json({ ok: true });
  });

  // ─── Settings ───
  app.get("/api/settings", async (_req, res) => {
    const data = await storage.getAllSettings();
    const obj: Record<string, string> = {};
    data.forEach(s => { obj[s.key] = s.value; });
    res.json(obj);
  });

  app.post("/api/settings", async (req, res) => {
    const { key, value } = req.body;
    if (!key) return res.status(400).json({ error: "key is required" });
    await storage.setSetting(key, value || "");
    res.json({ ok: true });
  });

  // ─── Brief Expansion ───
  app.post("/api/expand-brief", async (req, res) => {
    const { brief } = req.body;
    if (!brief?.trim()) return res.status(400).json({ error: "brief is required" });
    try {
      const expansion = await expandBrief(brief);
      res.json(expansion);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ─── Higgsfield API (real spec: platform.higgsfield.ai) ───

  // Helper: get API key from env first, then DB
  async function getHiggsfieldKey(): Promise<string | undefined> {
    return process.env.HIGGSFIELD_API_KEY || await storage.getSetting("higgsfield_api_key") || undefined;
  }

  // Model → endpoint mapping
  const HF_BASE = "https://platform.higgsfield.ai";
  function modelToEndpoint(model: string, genType: "image" | "video"): string {
    if (genType === "video") {
      // All video models route through image2video endpoints
      if (["kling-3.0", "kling-2.6", "kling-2.1-pro", "kling-2.1-standard"].includes(model)) {
        return "/requests/v1/image2video/dop";
      }
      return "/requests/v1/image2video/dop"; // default video endpoint
    }
    // Image generation endpoints
    switch (model) {
      case "flux-2-pro": return "/requests/flux-pro/kontext/max/text-to-image";
      case "higgsfield-soul":
      case "soul-character":
      case "soul-reference":
      case "soul-standard":
      case "reve":
        return "/requests/v1/text2image/soul";
      default: return "/requests/flux-pro/kontext/max/text-to-image";
    }
  }

  // Validate API key — GET /soul-ids returns 200 or 401, never 522
  app.post("/api/validate-key", async (req, res) => {
    const key = req.body.apiKey;
    if (!key) return res.status(400).json({ valid: false, error: "No key provided" });
    try {
      const response = await fetch(`${HF_BASE}/soul-ids?page=1&page_size=1`, {
        headers: { "Authorization": `Bearer ${key}` },
      });
      res.json({ valid: response.ok });
    } catch (err: any) {
      res.json({ valid: false, error: err.message });
    }
  });

  // POST /api/generate/image
  app.post("/api/generate/image", async (req, res) => {
    const apiKey = await getHiggsfieldKey();
    if (!apiKey) return res.status(400).json({ error: "Higgsfield API key not configured. Go to Settings." });

    const { promptId, model = "flux-2-pro", prompt, aspectRatio = "16:9", soulId, soulStrength = 1 } = req.body;
    const endpoint = modelToEndpoint(model, "image");

    const input: Record<string, unknown> = {
      prompt,
      aspect_ratio: aspectRatio,
      model,
    };
    if (soulId) {
      input.custom_reference_id = soulId;
      input.custom_reference_strength = soulStrength;
    }

    try {
      const response = await fetch(`${HF_BASE}${endpoint}`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ input }),
      });
      const data = await response.json() as any;
      if (!response.ok) return res.status(response.status).json({ error: data.message || data.error || "Higgsfield error" });

      const requestId: string = data.request_id || data.id;
      if (promptId) {
        await storage.updatePrompt(Number(promptId), { status: "generating", generationId: requestId });
      }
      res.json({ requestId, status: "generating" });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/generate/video
  app.post("/api/generate/video", async (req, res) => {
    const apiKey = await getHiggsfieldKey();
    if (!apiKey) return res.status(400).json({ error: "Higgsfield API key not configured. Go to Settings." });

    const { promptId, model = "kling-3.0", prompt, inputImageUrl, aspectRatio = "16:9" } = req.body;
    const endpoint = modelToEndpoint(model, "video");

    const input: Record<string, unknown> = {
      prompt,
      aspect_ratio: aspectRatio,
      model,
    };
    if (inputImageUrl) {
      input.input_images = [{ type: "image_url", image_url: inputImageUrl }];
    }

    try {
      const response = await fetch(`${HF_BASE}${endpoint}`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ input }),
      });
      const data = await response.json() as any;
      if (!response.ok) return res.status(response.status).json({ error: data.message || data.error || "Higgsfield error" });

      const requestId: string = data.request_id || data.id;
      if (promptId) {
        await storage.updatePrompt(Number(promptId), { status: "generating", generationId: requestId });
      }
      res.json({ requestId, status: "generating" });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/generate/status/:requestId — poll GET /requests/{request_id}/status
  app.get("/api/generate/status/:requestId", async (req, res) => {
    const apiKey = await getHiggsfieldKey();
    if (!apiKey) return res.status(400).json({ error: "Higgsfield API key not configured." });

    const { promptId, projectId, sceneNumber, assetType } = req.query;

    try {
      const response = await fetch(`${HF_BASE}/requests/${req.params.requestId}/status`, {
        headers: { "Authorization": `Bearer ${apiKey}` },
      });
      const data = await response.json() as any;
      if (!response.ok) return res.status(response.status).json({ error: data.message || "Higgsfield error" });

      // Real response: { status, request_id, images: [{url}], video: {url} }
      const status: string = data.status; // queued | in_progress | completed | failed | nsfw | canceled
      const outputUrl: string | undefined =
        data.images?.[0]?.url ||
        data.video?.url ||
        undefined;

      if (status === "completed" && outputUrl && promptId) {
        await storage.updatePrompt(Number(promptId), { status: "complete", generatedUrl: outputUrl });

        if (projectId && sceneNumber) {
          const ext = assetType === "video" ? "mp4" : "jpg";
          const localPath = await downloadAsset(outputUrl, Number(projectId), Number(sceneNumber), ext);
          return res.json({ status, outputUrl, localPath });
        }
      }

      if (["failed", "nsfw", "canceled"].includes(status) && promptId) {
        await storage.updatePrompt(Number(promptId), { status: "pending" }); // reset so user can retry
      }

      res.json({ status, outputUrl: outputUrl || null });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/create-soul-id — create Soul ID from reference image URLs
  app.post("/api/create-soul-id", async (req, res) => {
    const apiKey = await getHiggsfieldKey();
    if (!apiKey) return res.status(400).json({ error: "Higgsfield API key not configured." });

    const { characterId, name, imageUrls } = req.body;
    if (!imageUrls?.length) return res.status(400).json({ error: "At least one image URL is required" });

    try {
      const response = await fetch(`${HF_BASE}/soul-ids`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name || "Character",
          input_images: (imageUrls as string[]).map((url: string) => ({ type: "image_url", image_url: url })),
        }),
      });
      const data = await response.json() as any;
      if (!response.ok) return res.status(response.status).json({ error: data.message || "Soul ID creation failed" });

      const soulId: string = data.id || data.soul_id;
      if (characterId && soulId) {
        await storage.updateCharacter(Number(characterId), { soulId });
      }
      res.json({ soulId });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/soul-ids — list all Soul IDs from Higgsfield
  app.get("/api/soul-ids", async (_req, res) => {
    const apiKey = await getHiggsfieldKey();
    if (!apiKey) return res.status(400).json({ error: "Higgsfield API key not configured." });
    try {
      const response = await fetch(`${HF_BASE}/soul-ids?page=1&page_size=20`, {
        headers: { "Authorization": `Bearer ${apiKey}` },
      });
      const data = await response.json() as any;
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Keep legacy /api/upload/soul-id as alias
  app.post("/api/upload/soul-id", async (req, res) => {
    res.status(410).json({ error: "Deprecated. Use POST /api/create-soul-id with imageUrls array instead." });
  });

  // ─── Phase 2: Export + Webhooks ───

  // GET /api/projects/:id/export/zip — bundle all generated assets into a ZIP
  app.get("/api/projects/:id/export/zip", async (req, res) => {
    const projectId = Number(req.params.id);
    const project = await storage.getProject(projectId);
    if (!project) return res.status(404).json({ error: "Project not found" });

    const prompts = await storage.getPromptsByProject(projectId);
    const uploadsDir = path.resolve("uploads", `project_${projectId}`);

    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="${project.name.replace(/\s+/g, "_")}_export.zip"`);

    const zip = archiver("zip", { zlib: { level: 6 } });
    zip.on("error", (err) => res.destroy(err));
    zip.pipe(res);

    // Add manifest JSON
    const scenes = await storage.getScenesByProject(projectId);
    const characters = await storage.getCharactersByProject(projectId);
    const manifest = { project, scenes, characters, prompts };
    zip.append(JSON.stringify(manifest, null, 2), { name: "manifest.json" });

    // Add all prompts as text
    const promptsText = prompts.map(p => `[${p.type.toUpperCase()} — ${p.model}]\n${p.promptText}`).join("\n\n---\n\n");
    zip.append(promptsText, { name: "prompts.txt" });

    // Add downloaded asset files if they exist
    if (fs.existsSync(uploadsDir)) {
      zip.directory(uploadsDir, "assets");
    }

    await zip.finalize();
  });

  // POST /api/webhooks/higgsfield — async completion callbacks from Higgsfield
  app.post("/api/webhooks/higgsfield", async (req, res) => {
    const { generation_id, status, output_url, metadata } = req.body;
    res.json({ received: true });

    if (status === "completed" && output_url && metadata?.promptId) {
      try {
        const promptId = Number(metadata.promptId);
        await storage.updatePrompt(promptId, { status: "complete", generatedUrl: output_url });
        if (metadata.projectId && metadata.sceneNumber) {
          const ext = metadata.assetType === "video" ? "mp4" : "jpg";
          await downloadAsset(output_url, Number(metadata.projectId), Number(metadata.sceneNumber), ext);
        }
      } catch (err) {
        console.error("Webhook processing error:", err);
      }
    }
  });

  // Serve uploaded assets
  app.use("/uploads", (req, res, next) => {
    const uploadsDir = path.resolve("uploads");
    const filePath = path.join(uploadsDir, req.path);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      res.sendFile(filePath);
    } else {
      next();
    }
  });

  return httpServer;
}

// ─── Helper: download asset to disk ───
async function downloadAsset(url: string, projectId: number, sceneNumber: number, ext: string): Promise<string> {
  const dir = path.resolve("uploads", `project_${projectId}`, `scene_${sceneNumber}`);
  fs.mkdirSync(dir, { recursive: true });
  const filename = ext === "mp4" ? "video.mp4" : "image.jpg";
  const filePath = path.join(dir, filename);

  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to download asset: ${response.status}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(filePath, buffer);
  return `/uploads/project_${projectId}/scene_${sceneNumber}/${filename}`;
}
