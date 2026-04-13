import type { Project, Character, Scene, InsertScene, InsertPrompt } from "@shared/schema";

// ─── Camera Rigs ───
const CAMERAS = ["ARRI Alexa 35", "Red V-Raptor", "Sony Venice 2", "Blackmagic URSA Mini Pro"];
const LENSES = ["Hawk V-Lite Anamorphic", "Cooke S7/i Spherical", "Zeiss Supreme Prime", "Panavision Ultra Vista"];
const FOCAL_LENGTHS = ["24mm", "35mm", "50mm", "85mm", "100mm", "135mm"];
const APERTURES = ["f/1.4", "f/2.0", "f/2.8", "f/4.0", "f/8.0"];
const MOVEMENTS = ["slow push-in", "orbit", "dolly", "handheld", "static", "crane up", "tracking", "pull-back reveal", "whip pan", "steadicam"];
const LIGHTING = ["soft natural window light", "golden hour backlight", "dramatic Rembrandt lighting", "high-key flat lighting", "moody chiaroscuro", "neon-lit", "overcast diffused", "studio three-point lighting"];
const COLOR_GRADES = ["warm amber tones, medium contrast", "cool desaturated, high contrast", "vivid saturated, low contrast", "film stock emulation, subtle grain", "teal and orange split toning", "neutral balanced, clean grade"];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickIdx<T>(arr: T[], idx: number): T {
  return arr[idx % arr.length];
}

// ─── Scene Templates by Content Type ───

interface SceneTemplate {
  description: string;
  camera: string;
  movement: string;
  lens: string;
  focalLength: string;
  aperture: string;
  lighting: string;
  mood: string;
  model: string;
}

function getProductAdScenes(project: Project): SceneTemplate[] {
  const product = project.productName || "product";
  const mood = project.moodKeywords || "premium, aspirational";
  return [
    { description: `Wide establishing shot. ${product} sits on a minimalist surface with lifestyle context. Environment suggests ${mood}.`, camera: "ARRI Alexa 35", movement: "slow push-in", lens: "Cooke S7/i Spherical", focalLength: "35mm", aperture: "f/2.8", lighting: "soft natural window light", mood: "aspirational", model: "seedance-2.0" },
    { description: `Close-up of ${product} texture and detail. Shallow depth of field isolates the craftsmanship.`, camera: "Red V-Raptor", movement: "static", lens: "Zeiss Supreme Prime", focalLength: "100mm", aperture: "f/1.4", lighting: "studio three-point lighting", mood: "detail-focused", model: "kling-3.0" },
    { description: `Model/influencer picks up ${product}, examining it with genuine interest. Medium shot, eye-level.`, camera: "Sony Venice 2", movement: "handheld", lens: "Hawk V-Lite Anamorphic", focalLength: "50mm", aperture: "f/2.0", lighting: "golden hour backlight", mood: "authentic", model: "seedance-2.0" },
    { description: `B-roll: ${product} in natural use environment. Lifestyle context showing the product's world.`, camera: "ARRI Alexa 35", movement: "tracking", lens: "Cooke S7/i Spherical", focalLength: "24mm", aperture: "f/4.0", lighting: "overcast diffused", mood: "editorial", model: "kling-3.0" },
    { description: `Medium close-up: hands interacting with ${product}. Tactile moment showing key feature.`, camera: "Red V-Raptor", movement: "dolly", lens: "Zeiss Supreme Prime", focalLength: "85mm", aperture: "f/2.0", lighting: "soft natural window light", mood: "intimate", model: "cinema-studio-2.5" },
    { description: `Hero reveal shot. ${product} centered, dramatic lighting, final beauty frame. Slow pull-back.`, camera: "ARRI Alexa 35", movement: "pull-back reveal", lens: "Hawk V-Lite Anamorphic", focalLength: "50mm", aperture: "f/2.8", lighting: "dramatic Rembrandt lighting", mood: "hero", model: "seedance-2.0" },
  ];
}

function getCharacterBrandScenes(project: Project): SceneTemplate[] {
  const brand = project.productName || "brand";
  const mood = project.moodKeywords || "authentic, compelling";
  return [
    { description: `Character introduction. Wide shot establishing the character's world. ${brand} context visible.`, camera: "ARRI Alexa 35", movement: "slow push-in", lens: "Cooke S7/i Spherical", focalLength: "35mm", aperture: "f/2.8", lighting: "golden hour backlight", mood: "cinematic", model: "soul-cinema" },
    { description: `Character close-up. Emotional beat — the character's defining moment. Direct gaze.`, camera: "Red V-Raptor", movement: "static", lens: "Zeiss Supreme Prime", focalLength: "85mm", aperture: "f/1.4", lighting: "dramatic Rembrandt lighting", mood: "emotional", model: "soul-cinema" },
    { description: `Character in action. Dynamic movement showing personality and energy. ${brand} integration.`, camera: "Sony Venice 2", movement: "steadicam", lens: "Hawk V-Lite Anamorphic", focalLength: "50mm", aperture: "f/2.0", lighting: "overcast diffused", mood: mood, model: "seedance-2.0" },
    { description: `Environmental detail. The character's world — textures, objects, atmosphere.`, camera: "ARRI Alexa 35", movement: "dolly", lens: "Cooke S7/i Spherical", focalLength: "24mm", aperture: "f/4.0", lighting: "soft natural window light", mood: "atmospheric", model: "kling-3.0" },
    { description: `Character transformation moment. Before/after beat showing growth or realization.`, camera: "Red V-Raptor", movement: "crane up", lens: "Zeiss Supreme Prime", focalLength: "50mm", aperture: "f/2.8", lighting: "moody chiaroscuro", mood: "transformative", model: "cinema-studio-2.5" },
    { description: `Final frame. Character and ${brand} together — the resolution. Wide, epic, aspirational.`, camera: "ARRI Alexa 35", movement: "pull-back reveal", lens: "Hawk V-Lite Anamorphic", focalLength: "35mm", aperture: "f/2.8", lighting: "golden hour backlight", mood: "triumphant", model: "seedance-2.0" },
  ];
}

function getViralClipScenes(project: Project): SceneTemplate[] {
  const product = project.productName || "product";
  return [
    { description: `HOOK: Arresting visual or statement that stops the scroll. ${product} teased. Vertical 9:16.`, camera: "Sony Venice 2", movement: "whip pan", lens: "Zeiss Supreme Prime", focalLength: "24mm", aperture: "f/2.8", lighting: "neon-lit", mood: "attention-grabbing", model: "kling-3.0" },
    { description: `Quick cut: product reveal from unexpected angle. Fast energy. Text overlay zone clear.`, camera: "Red V-Raptor", movement: "handheld", lens: "Hawk V-Lite Anamorphic", focalLength: "35mm", aperture: "f/2.0", lighting: "high-key flat lighting", mood: "energetic", model: "kling-3.0" },
    { description: `Reaction shot / use demonstration. Authentic, relatable moment with ${product}.`, camera: "ARRI Alexa 35", movement: "static", lens: "Cooke S7/i Spherical", focalLength: "50mm", aperture: "f/2.0", lighting: "soft natural window light", mood: "relatable", model: "seedance-2.0" },
    { description: `Detail/texture moment. Satisfying close-up that triggers visual ASMR.`, camera: "Red V-Raptor", movement: "slow push-in", lens: "Zeiss Supreme Prime", focalLength: "100mm", aperture: "f/1.4", lighting: "studio three-point lighting", mood: "satisfying", model: "kling-3.0" },
    { description: `Payoff / transformation. The "wow" moment. Before/after or final result.`, camera: "Sony Venice 2", movement: "dolly", lens: "Hawk V-Lite Anamorphic", focalLength: "35mm", aperture: "f/2.8", lighting: "golden hour backlight", mood: "triumphant", model: "seedance-2.0" },
    { description: `CTA frame. ${product} hero shot with clear space for text overlay and branding.`, camera: "ARRI Alexa 35", movement: "static", lens: "Cooke S7/i Spherical", focalLength: "50mm", aperture: "f/4.0", lighting: "high-key flat lighting", mood: "clean", model: "kling-3.0" },
  ];
}

function getCinematicFilmScenes(project: Project): SceneTemplate[] {
  const brand = project.productName || "brand";
  const mood = project.moodKeywords || "cinematic, emotional";
  return [
    { description: `Opening frame. Establishing wide — the world before the story. Atmospheric, moody.`, camera: "ARRI Alexa 35", movement: "crane up", lens: "Hawk V-Lite Anamorphic", focalLength: "24mm", aperture: "f/2.8", lighting: "overcast diffused", mood: "atmospheric", model: "cinema-studio-2.5" },
    { description: `Character introduction. Medium shot with environmental storytelling. ${brand} world.`, camera: "Red V-Raptor", movement: "steadicam", lens: "Cooke S7/i Spherical", focalLength: "50mm", aperture: "f/2.0", lighting: "soft natural window light", mood: "narrative", model: "seedance-2.0" },
    { description: `Inciting moment. Close-up on the key emotional beat. Shallow depth, intimate.`, camera: "ARRI Alexa 35", movement: "slow push-in", lens: "Zeiss Supreme Prime", focalLength: "85mm", aperture: "f/1.4", lighting: "dramatic Rembrandt lighting", mood: "emotional", model: "cinema-studio-2.5" },
    { description: `Rising action. Dynamic movement sequence. Energy builds. Multiple cuts possible.`, camera: "Sony Venice 2", movement: "tracking", lens: "Hawk V-Lite Anamorphic", focalLength: "35mm", aperture: "f/2.8", lighting: "golden hour backlight", mood: "dynamic", model: "seedance-2.0" },
    { description: `Tension peak. Contrasting lighting and framing. The challenge or conflict.`, camera: "Red V-Raptor", movement: "handheld", lens: "Cooke S7/i Spherical", focalLength: "50mm", aperture: "f/2.0", lighting: "moody chiaroscuro", mood: "tense", model: "cinema-studio-2.5" },
    { description: `Turning point. Revelation or decision moment. Camera language shifts — wider, more stable.`, camera: "ARRI Alexa 35", movement: "dolly", lens: "Zeiss Supreme Prime", focalLength: "35mm", aperture: "f/2.8", lighting: "soft natural window light", mood: "hopeful", model: "seedance-2.0" },
    { description: `${brand} integration moment. Product or brand naturally woven into the narrative climax.`, camera: "Sony Venice 2", movement: "slow push-in", lens: "Hawk V-Lite Anamorphic", focalLength: "50mm", aperture: "f/2.0", lighting: "studio three-point lighting", mood: "premium", model: "cinema-studio-2.5" },
    { description: `Resolution. Character transformation complete. Visual callback to opening — but different.`, camera: "ARRI Alexa 35", movement: "steadicam", lens: "Cooke S7/i Spherical", focalLength: "35mm", aperture: "f/2.8", lighting: "golden hour backlight", mood: "resolved", model: "seedance-2.0" },
    { description: `Closing wide. Mirror of opening shot — but transformed. The world after the story.`, camera: "ARRI Alexa 35", movement: "pull-back reveal", lens: "Hawk V-Lite Anamorphic", focalLength: "24mm", aperture: "f/4.0", lighting: "overcast diffused", mood: "reflective", model: "cinema-studio-2.5" },
    { description: `End card. Brand mark or logo reveal. Clean, minimal, impactful.`, camera: "Red V-Raptor", movement: "static", lens: "Zeiss Supreme Prime", focalLength: "50mm", aperture: "f/8.0", lighting: "high-key flat lighting", mood: "conclusive", model: "kling-3.0" },
  ];
}

function get3DCommercialScenes(project: Project): SceneTemplate[] {
  const product = project.productName || "product";
  return [
    { description: `Environment establishing shot. The ${product} world — abstract or real. 3D space introduction.`, camera: "Red V-Raptor", movement: "crane up", lens: "Hawk V-Lite Anamorphic", focalLength: "24mm", aperture: "f/4.0", lighting: "studio three-point lighting", mood: "immersive", model: "cinema-studio-2.5" },
    { description: `${product} materializes in environment. Elegant entrance animation. Floating/rotating.`, camera: "ARRI Alexa 35", movement: "orbit", lens: "Zeiss Supreme Prime", focalLength: "50mm", aperture: "f/2.8", lighting: "dramatic Rembrandt lighting", mood: "reveal", model: "kling-3.0" },
    { description: `360° product rotation. Clean hero angle. Every surface visible. Premium lighting.`, camera: "Red V-Raptor", movement: "orbit", lens: "Cooke S7/i Spherical", focalLength: "85mm", aperture: "f/2.0", lighting: "studio three-point lighting", mood: "detail", model: "cinema-studio-2.5" },
    { description: `Macro detail dive. Camera pushes into ${product} surface. Texture, material, craftsmanship.`, camera: "Sony Venice 2", movement: "slow push-in", lens: "Zeiss Supreme Prime", focalLength: "135mm", aperture: "f/1.4", lighting: "soft natural window light", mood: "intimate", model: "kling-3.0" },
    { description: `Environment shift. ${product} teleports to new context. Different world, same product.`, camera: "ARRI Alexa 35", movement: "whip pan", lens: "Hawk V-Lite Anamorphic", focalLength: "35mm", aperture: "f/2.8", lighting: "neon-lit", mood: "dynamic", model: "cinema-studio-2.5" },
    { description: `Final hero frame. ${product} in ultimate beauty pose. Pull-back to reveal full environment.`, camera: "Red V-Raptor", movement: "pull-back reveal", lens: "Cooke S7/i Spherical", focalLength: "50mm", aperture: "f/2.8", lighting: "golden hour backlight", mood: "epic", model: "seedance-2.0" },
  ];
}

// ─── Public API ───

export function generateScenes(project: Project): InsertScene[] {
  let templates: SceneTemplate[];
  switch (project.contentType) {
    case "product-ad": templates = getProductAdScenes(project); break;
    case "character-brand": templates = getCharacterBrandScenes(project); break;
    case "viral-clip": templates = getViralClipScenes(project); break;
    case "cinematic-film": templates = getCinematicFilmScenes(project); break;
    case "3d-commercial": templates = get3DCommercialScenes(project); break;
    default: templates = getProductAdScenes(project);
  }

  const durationSec = parseInt(project.duration) || 15;
  const interval = durationSec / templates.length;

  return templates.map((t, i) => ({
    projectId: project.id,
    sceneNumber: i + 1,
    timing: `${(i * interval).toFixed(1)}s - ${((i + 1) * interval).toFixed(1)}s`,
    description: t.description,
    camera: t.camera,
    movement: t.movement,
    lens: t.lens,
    focalLength: t.focalLength,
    aperture: t.aperture,
    lighting: t.lighting,
    mood: t.mood,
    modelRecommendation: t.model,
    characterId: null,
  }));
}

// ─── Model Availability Map ───
const API_MODELS: Record<string, boolean> = {
  "flux-2-pro": true,
  "higgsfield-soul": true,
  "reve": true,
  "soul-character": true,
  "soul-reference": true,
  "soul-standard": true,
  "dop-standard": true,
  "kling-2.1-pro": true,
  "kling-2.1-standard": true,
  "kling-2.6": true,
  "kling-3.0": true,
  "reve-edit": true,
  "soul-id": true,
  // UI-only models
  "seedance-2.0": false,
  "cinema-studio-2.5": false,
  "veo-3.1": false,
  "sora-2": false,
  "recast": false,
  "vibe-motion": false,
  "soul-cinema": false,
};

function isApiAvailable(model: string): boolean {
  return API_MODELS[model] ?? false;
}

function modelSlugToDisplay(slug: string): string {
  const map: Record<string, string> = {
    "flux-2-pro": "Flux 2 Pro",
    "higgsfield-soul": "Higgsfield Soul",
    "reve": "Reve",
    "soul-character": "Soul Character",
    "soul-reference": "Soul Reference",
    "soul-standard": "Soul Standard",
    "dop-standard": "DOP Standard",
    "kling-2.1-pro": "Kling 2.1 Pro",
    "kling-2.1-standard": "Kling 2.1 Standard",
    "kling-2.6": "Kling 2.6",
    "kling-3.0": "Kling 3.0 Standard",
    "reve-edit": "Reve Edit",
    "soul-id": "Soul ID",
    "seedance-2.0": "Seedance 2.0",
    "cinema-studio-2.5": "Cinema Studio 2.5",
    "veo-3.1": "Veo 3.1",
    "sora-2": "Sora 2",
    "soul-cinema": "Soul Cinema",
  };
  return map[slug] || slug;
}

export function generatePrompts(project: Project, scenesList: { id: number; sceneNumber: number; description: string; camera: string; movement: string; lens: string; focalLength: string; aperture: string; lighting: string; mood: string; modelRecommendation: string; timing: string }[]): InsertPrompt[] {
  const allPrompts: InsertPrompt[] = [];
  const aspectRatio = project.aspectRatio || "16:9";

  for (const scene of scenesList) {
    // Image prompt (keyframe)
    const imageModel = scene.modelRecommendation === "cinema-studio-2.5" ? "flux-2-pro" : "flux-2-pro";
    const imagePrompt = `${scene.description} Shot on ${scene.camera} with ${scene.lens}. ${scene.focalLength} focal length. ${scene.lighting}. Shallow depth of field (${scene.aperture}), smooth circular bokeh. Subtle lens flare. ${pick(COLOR_GRADES)}. ${scene.mood}. ${aspectRatio}.`;

    allPrompts.push({
      projectId: project.id,
      sceneId: scene.id,
      type: "image",
      model: imageModel,
      promptText: imagePrompt,
      isApiAvailable: isApiAvailable(imageModel) ? 1 : 0,
      status: "pending",
    });

    // Video prompt
    const videoModel = scene.modelRecommendation;
    const videoPrompt = `${scene.description} Camera: ${scene.camera}. Lens: ${scene.lens}, ${scene.focalLength}. Movement: ${scene.movement}. ${scene.lighting}. Depth of field: ${scene.aperture}. ${scene.mood} atmosphere. ${aspectRatio}.`;

    allPrompts.push({
      projectId: project.id,
      sceneId: scene.id,
      type: "video",
      model: videoModel,
      promptText: videoPrompt,
      isApiAvailable: isApiAvailable(videoModel) ? 1 : 0,
      status: "pending",
    });
  }

  // Multi-shot prompt (Seedance 2.0) — one block for the whole project
  const durationSec = parseInt(project.duration) || 15;
  const shotCount = Math.min(scenesList.length, 10);
  const shotInterval = durationSec / shotCount;
  let multiShotLines: string[] = [];
  for (let i = 0; i < shotCount; i++) {
    const s = scenesList[i];
    const startT = (i * shotInterval).toFixed(1);
    const endT = ((i + 1) * shotInterval).toFixed(1);
    const anchorNote = i === 0 ? ", image_1 as anchor" : i === shotCount - 1 ? `, image_${Math.min(i + 1, 3)} as anchor` : "";
    multiShotLines.push(`Shot ${i + 1} (${startT}-${endT}s): [${s.movement}, ${s.description.split('.')[0]}${anchorNote}]`);
  }
  const multiShotPrompt = multiShotLines.join("\n");

  allPrompts.push({
    projectId: project.id,
    sceneId: null,
    type: "multi-shot",
    model: "seedance-2.0",
    promptText: multiShotPrompt,
    isApiAvailable: 0,
    status: "pending",
  });

  // Cinema Studio 2.5 spec — one block for the whole project
  const primaryCamera = scenesList[0]?.camera || "ARRI Alexa 35";
  const primaryLens = scenesList[0]?.lens || "Hawk V-Lite Anamorphic";
  const primaryFocal = scenesList[0]?.focalLength || "50mm";
  const primaryAperture = scenesList[0]?.aperture || "f/2.8";
  const primaryMovement = scenesList.map(s => s.movement).filter((v, i, a) => a.indexOf(v) === i).join(" → ");
  const grade = pick(COLOR_GRADES);
  const cinemaSpec = `Camera: ${primaryCamera}
Lens: ${primaryLens}
Focal Length: ${primaryFocal}
Aperture: ${primaryAperture}
Movement Sequence: ${primaryMovement}
Color Grade: ${grade}
Film Grain: Yes
Aspect Ratio: ${project.aspectRatio}
Duration: ${project.duration}`;

  allPrompts.push({
    projectId: project.id,
    sceneId: null,
    type: "cinema-spec",
    model: "cinema-studio-2.5",
    promptText: cinemaSpec,
    isApiAvailable: 0,
    status: "pending",
  });

  return allPrompts;
}
