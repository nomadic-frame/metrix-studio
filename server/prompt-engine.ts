import type { Project, Character, Scene, InsertScene, InsertPrompt } from "@shared/schema";

// ─── Camera Rigs ───
const CAMERAS = ["ARRI Alexa 35", "Red V-Raptor", "Sony Venice 2", "Blackmagic URSA Mini Pro"];
const LENSES = ["Hawk V-Lite Anamorphic", "Cooke S7/i Spherical", "Zeiss Supreme Prime", "Panavision Ultra Vista"];
const FOCAL_LENGTHS = ["24mm", "35mm", "50mm", "85mm", "100mm", "135mm"];
const APERTURES = ["f/1.4", "f/2.0", "f/2.8", "f/4.0"];
const MOVEMENTS = ["slow push-in", "orbit", "dolly", "handheld", "static", "crane up", "tracking", "pull-back reveal", "whip pan", "steadicam"];
const LIGHTING = ["soft natural window light", "golden hour backlight", "dramatic Rembrandt lighting", "high-key flat lighting", "moody chiaroscuro", "neon-lit", "overcast diffused", "studio three-point lighting"];
const COLOR_GRADES = ["warm amber tones, medium contrast", "cool desaturated, high contrast", "vivid saturated, low contrast", "film stock emulation, subtle grain", "teal and orange split toning", "neutral balanced, clean grade"];

// Shot size vocabulary for MCSLA formula
const SHOT_SIZES = ["ECU", "CU", "MCU", "MS", "MLS", "LS", "WS"];
const ANGLES = ["eye-level", "low angle", "high angle", "bird's eye", "worm's eye"];

// Soul Cast micro-expression vocabulary (from Higgsfield best practices)
// Use specific, observable expressions — not generic emotion words
const MICRO_EXPRESSIONS: Record<string, string[]> = {
  aspirational: ["Suppressed Smile", "Quiet Confidence", "Warm Openness"],
  emotional: ["Quiet Devastation", "Frozen Shock", "Vulnerable Openness"],
  tense: ["Fierce Focus", "Cold Calculation", "Simmering Rage"],
  triumphant: ["Fierce Focus", "Suppressed Smile", "Bitter Amusement"],
  dynamic: ["Fierce Focus", "Determined Drive", "Charged Energy"],
  authentic: ["Warm Openness", "Quiet Confidence", "Genuine Surprise"],
  intimate: ["Vulnerable Openness", "Suppressed Smile", "Quiet Devotion"],
  hero: ["Fierce Focus", "Quiet Confidence", "Cold Determination"],
  hopeful: ["Suppressed Smile", "Warm Openness", "Quiet Wonder"],
  default: ["Deadpan Neutral", "Quiet Confidence", "Fierce Focus"],
};

// Higgsfield DoP camera preset names (recognized by the model)
const DOP_PRESETS = [
  "Dolly Zoom", "Parallax Push", "Orbital Sweep", "Crane Rise", "Whip Cut",
  "Handheld Chase", "Steadicam Prowl", "Static Master", "Pull-Back Reveal", "Drift Float",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ─── MCSLA Image Prompt Builder ───
// Formula: [Shot Size] [Angle] of [Subject]. [Action/Pose + Micro-Expression]. [Environment]. [Lighting]. Shot on [Camera], [Lens], [Focal]. [Aperture] DOF. [Color Grade].
// Key rules: one camera move, observable specifics only, no vague descriptors
function buildImagePrompt(
  scene: { description: string; camera: string; lens: string; focalLength: string; aperture: string; lighting: string; mood: string },
  aspectRatio: string,
  characters?: Character[]
): string {
  const shotSize = pick(SHOT_SIZES);
  const angle = pick(ANGLES);
  const colorGrade = pick(COLOR_GRADES);
  const subject = scene.description.split(".")[0].trim();

  // Soul Cast character injection — full parametric spec
  let charSpec = "";
  if (characters && characters.length > 0) {
    const char = characters[0];
    const physique = [char.gender, char.ethnicity, char.ageRange, char.build, char.hair].filter(Boolean).join(", ");
    const styleOutfit = char.outfit || "";
    const microExpr = pick(MICRO_EXPRESSIONS[scene.mood] || MICRO_EXPRESSIONS.default);
    const personality = char.personality ? ` ${char.personality}.` : "";
    charSpec = ` ${physique}${styleOutfit ? `. ${styleOutfit}` : ""}. Expression: ${microExpr}.${personality}`;
  }

  return `${shotSize} ${angle} — ${subject}.${charSpec} ${scene.lighting}. Shot on ${scene.camera} with ${scene.lens}, ${scene.focalLength}. ${scene.aperture} depth of field. ${colorGrade}. ${scene.mood} atmosphere. Aspect ratio ${aspectRatio}. Photorealistic cinematic, ultra-sharp detail.`;
}

// ─── Video Prompt Builder (I2V — motion only, no content re-description) ───
//
// Seedance 2.0 formula (primary model):
//   [Sequential action steps] → [Camera + motion] → [Scene & lighting] → [Quality guardrail]
//   "Slow is Pro" — subtle continuous motion outperforms rapid action
//   Include quality/guardrail clause to prevent distortion
//
// Kling 3.0 formula (precision / API):
//   [Camera movement] → [Camera spec] → [Elements 3.0 @anchor] → [Motion preset]
function buildVideoPrompt(
  scene: { description: string; movement: string; camera: string; lens: string; focalLength: string; aperture: string; lighting: string; mood: string },
  model: string,
  aspectRatio: string
): string {
  const dopPreset = pick(DOP_PRESETS);

  if (model === "seedance-2.0") {
    // Seedance 2.0: sequential action → camera → lighting → guardrail
    // "Slow is Pro" — describe intent and emotional beat, not pixel-level detail
    const action = scene.description.split(".")[0].trim();
    return `${action}. Motion unfolds slowly and continuously — ${scene.movement}. ${scene.camera}, ${scene.lens}. ${scene.lighting}. ${scene.mood} atmosphere. No rapid cuts, no distortion, no morphing artifacts. Photorealistic, cinematic quality. Aspect ratio ${aspectRatio}.`;
  }

  if (model === "kling-3.0") {
    // Kling 3.0: precise camera control + Elements 3.0 @subject_anchor for cross-shot consistency
    return `Camera: ${scene.movement}. ${scene.camera}, ${scene.lens} ${scene.focalLength}. ${scene.aperture} bokeh. ${scene.lighting}. ${scene.mood} atmosphere. Motion preset: ${dopPreset}. @subject_anchor. Aspect ratio ${aspectRatio}. Smooth, photorealistic motion.`;
  }

  // Default fallback
  return `${scene.movement}. ${scene.camera}, ${scene.lens}, ${scene.focalLength}. ${scene.lighting}. ${scene.mood} atmosphere. Aspect ratio ${aspectRatio}.`;
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
  model: string; // video model recommendation
  imageModel: string; // image model recommendation
}

function getProductAdScenes(project: Project): SceneTemplate[] {
  const product = project.productName || "product";
  const mood = project.moodKeywords || "premium, aspirational";
  return [
    { description: `Wide establishing. ${product} on minimalist surface, lifestyle context. ${mood} world.`, camera: "ARRI Alexa 35", movement: "slow push-in", lens: "Cooke S7/i Spherical", focalLength: "35mm", aperture: "f/2.8", lighting: "soft natural window light", mood: "aspirational", model: "seedance-2.0", imageModel: "flux-2-pro" },
    { description: `Extreme close-up of ${product} surface texture and detail. Craftsmanship isolated.`, camera: "Red V-Raptor", movement: "static", lens: "Zeiss Supreme Prime", focalLength: "100mm", aperture: "f/1.4", lighting: "studio three-point lighting", mood: "detail-focused", model: "kling-3.0", imageModel: "flux-2-pro" },
    { description: `Character with ${product}, examining with genuine interest. Eye-level, authentic.`, camera: "Sony Venice 2", movement: "handheld", lens: "Hawk V-Lite Anamorphic", focalLength: "50mm", aperture: "f/2.0", lighting: "golden hour backlight", mood: "authentic", model: "seedance-2.0", imageModel: "higgsfield-soul" },
    { description: `B-roll: ${product} in natural use environment. Lifestyle context, the product's world.`, camera: "ARRI Alexa 35", movement: "tracking", lens: "Cooke S7/i Spherical", focalLength: "24mm", aperture: "f/4.0", lighting: "overcast diffused", mood: "editorial", model: "seedance-2.0", imageModel: "flux-2-pro" },
    { description: `Hands interacting with ${product}. Tactile moment showing key feature in action.`, camera: "Red V-Raptor", movement: "dolly", lens: "Zeiss Supreme Prime", focalLength: "85mm", aperture: "f/2.0", lighting: "soft natural window light", mood: "intimate", model: "seedance-2.0", imageModel: "flux-2-pro" },
    { description: `Hero reveal. ${product} centered, dramatic lighting, final beauty frame.`, camera: "ARRI Alexa 35", movement: "pull-back reveal", lens: "Hawk V-Lite Anamorphic", focalLength: "50mm", aperture: "f/2.8", lighting: "dramatic Rembrandt lighting", mood: "hero", model: "seedance-2.0", imageModel: "flux-2-pro" },
  ];
}

function getCharacterBrandScenes(project: Project): SceneTemplate[] {
  const brand = project.productName || "brand";
  const mood = project.moodKeywords || "authentic, compelling";
  return [
    { description: `Character introduction. Wide establishing their world. ${brand} context visible.`, camera: "ARRI Alexa 35", movement: "slow push-in", lens: "Cooke S7/i Spherical", focalLength: "35mm", aperture: "f/2.8", lighting: "golden hour backlight", mood: "cinematic", model: "seedance-2.0", imageModel: "higgsfield-soul" },
    { description: `Character close-up. Defining emotional moment. Direct gaze, raw presence.`, camera: "Red V-Raptor", movement: "static", lens: "Zeiss Supreme Prime", focalLength: "85mm", aperture: "f/1.4", lighting: "dramatic Rembrandt lighting", mood: "emotional", model: "seedance-2.0", imageModel: "higgsfield-soul" },
    { description: `Character in full action. Dynamic movement showing personality. ${brand} integration.`, camera: "Sony Venice 2", movement: "steadicam", lens: "Hawk V-Lite Anamorphic", focalLength: "50mm", aperture: "f/2.0", lighting: "overcast diffused", mood, model: "seedance-2.0", imageModel: "higgsfield-soul" },
    { description: `Environmental detail. Character's world — textures, objects, atmosphere telling story.`, camera: "ARRI Alexa 35", movement: "dolly", lens: "Cooke S7/i Spherical", focalLength: "24mm", aperture: "f/4.0", lighting: "soft natural window light", mood: "atmospheric", model: "seedance-2.0", imageModel: "flux-2-pro" },
    { description: `Transformation beat. The turning point realization — character changes.`, camera: "Red V-Raptor", movement: "crane up", lens: "Zeiss Supreme Prime", focalLength: "50mm", aperture: "f/2.8", lighting: "moody chiaroscuro", mood: "transformative", model: "seedance-2.0", imageModel: "higgsfield-soul" },
    { description: `Final frame. Character and ${brand} united — resolution. Wide, epic, aspirational.`, camera: "ARRI Alexa 35", movement: "pull-back reveal", lens: "Hawk V-Lite Anamorphic", focalLength: "35mm", aperture: "f/2.8", lighting: "golden hour backlight", mood: "triumphant", model: "seedance-2.0", imageModel: "higgsfield-soul" },
  ];
}

function getViralClipScenes(project: Project): SceneTemplate[] {
  const product = project.productName || "product";
  return [
    { description: `HOOK: Scroll-stopping visual. ${product} teased. First 2 seconds must arrest attention.`, camera: "Sony Venice 2", movement: "whip pan", lens: "Zeiss Supreme Prime", focalLength: "24mm", aperture: "f/2.8", lighting: "neon-lit", mood: "attention-grabbing", model: "seedance-2.0", imageModel: "flux-2-pro" },
    { description: `Product reveal from unexpected angle. Fast energy. Text overlay zone clear.`, camera: "Red V-Raptor", movement: "handheld", lens: "Hawk V-Lite Anamorphic", focalLength: "35mm", aperture: "f/2.0", lighting: "high-key flat lighting", mood: "energetic", model: "seedance-2.0", imageModel: "flux-2-pro" },
    { description: `Authentic use moment. Relatable reaction shot with ${product}.`, camera: "ARRI Alexa 35", movement: "static", lens: "Cooke S7/i Spherical", focalLength: "50mm", aperture: "f/2.0", lighting: "soft natural window light", mood: "relatable", model: "seedance-2.0", imageModel: "higgsfield-soul" },
    { description: `Satisfying detail. Tactile close-up triggering visual ASMR.`, camera: "Red V-Raptor", movement: "slow push-in", lens: "Zeiss Supreme Prime", focalLength: "100mm", aperture: "f/1.4", lighting: "studio three-point lighting", mood: "satisfying", model: "seedance-2.0", imageModel: "flux-2-pro" },
    { description: `Payoff shot. The "wow" transformation or final result moment.`, camera: "Sony Venice 2", movement: "dolly", lens: "Hawk V-Lite Anamorphic", focalLength: "35mm", aperture: "f/2.8", lighting: "golden hour backlight", mood: "triumphant", model: "seedance-2.0", imageModel: "flux-2-pro" },
    { description: `CTA frame. ${product} hero shot, clean space for text overlay and branding.`, camera: "ARRI Alexa 35", movement: "static", lens: "Cooke S7/i Spherical", focalLength: "50mm", aperture: "f/4.0", lighting: "high-key flat lighting", mood: "clean", model: "kling-3.0", imageModel: "flux-2-pro" },
  ];
}

function getCinematicFilmScenes(project: Project): SceneTemplate[] {
  const brand = project.productName || "brand";
  const mood = project.moodKeywords || "cinematic, emotional";
  return [
    { description: `Opening wide. The world before the story. Atmospheric, weighted with possibility.`, camera: "ARRI Alexa 35", movement: "crane up", lens: "Hawk V-Lite Anamorphic", focalLength: "24mm", aperture: "f/2.8", lighting: "overcast diffused", mood: "atmospheric", model: "seedance-2.0", imageModel: "flux-2-pro" },
    { description: `Character introduction. Medium with environmental storytelling. ${brand} world established.`, camera: "Red V-Raptor", movement: "steadicam", lens: "Cooke S7/i Spherical", focalLength: "50mm", aperture: "f/2.0", lighting: "soft natural window light", mood: "narrative", model: "seedance-2.0", imageModel: "higgsfield-soul" },
    { description: `Inciting moment. Close-up on the emotional beat. Shallow depth, intimate.`, camera: "ARRI Alexa 35", movement: "slow push-in", lens: "Zeiss Supreme Prime", focalLength: "85mm", aperture: "f/1.4", lighting: "dramatic Rembrandt lighting", mood: "emotional", model: "seedance-2.0", imageModel: "higgsfield-soul" },
    { description: `Rising action. Dynamic movement, energy building. Character moving through space.`, camera: "Sony Venice 2", movement: "tracking", lens: "Hawk V-Lite Anamorphic", focalLength: "35mm", aperture: "f/2.8", lighting: "golden hour backlight", mood: "dynamic", model: "seedance-2.0", imageModel: "higgsfield-soul" },
    { description: `Tension peak. Contrasting light and frame. The challenge or confrontation.`, camera: "Red V-Raptor", movement: "handheld", lens: "Cooke S7/i Spherical", focalLength: "50mm", aperture: "f/2.0", lighting: "moody chiaroscuro", mood: "tense", model: "seedance-2.0", imageModel: "higgsfield-soul" },
    { description: `Turning point. Revelation moment. Camera language shifts — wider, more stable.`, camera: "ARRI Alexa 35", movement: "dolly", lens: "Zeiss Supreme Prime", focalLength: "35mm", aperture: "f/2.8", lighting: "soft natural window light", mood: "hopeful", model: "seedance-2.0", imageModel: "higgsfield-soul" },
    { description: `${brand} integration. Product woven naturally into the narrative climax.`, camera: "Sony Venice 2", movement: "slow push-in", lens: "Hawk V-Lite Anamorphic", focalLength: "50mm", aperture: "f/2.0", lighting: "studio three-point lighting", mood: "premium", model: "seedance-2.0", imageModel: "flux-2-pro" },
    { description: `Resolution. Character transformed. Visual callback to opening — but different.`, camera: "ARRI Alexa 35", movement: "steadicam", lens: "Cooke S7/i Spherical", focalLength: "35mm", aperture: "f/2.8", lighting: "golden hour backlight", mood: "resolved", model: "seedance-2.0", imageModel: "higgsfield-soul" },
    { description: `Closing wide. Mirror of opening. The world after the story. Same frame, new meaning.`, camera: "ARRI Alexa 35", movement: "pull-back reveal", lens: "Hawk V-Lite Anamorphic", focalLength: "24mm", aperture: "f/4.0", lighting: "overcast diffused", mood: "reflective", model: "seedance-2.0", imageModel: "flux-2-pro" },
    { description: `End card. Brand mark or logo. Clean, minimal, impactful.`, camera: "Red V-Raptor", movement: "static", lens: "Zeiss Supreme Prime", focalLength: "50mm", aperture: "f/8.0", lighting: "high-key flat lighting", mood: "conclusive", model: "kling-3.0", imageModel: "flux-2-pro" },
  ];
}

function get3DCommercialScenes(project: Project): SceneTemplate[] {
  const product = project.productName || "product";
  return [
    { description: `Environment establishing. The ${product} world — abstract space introduction.`, camera: "Red V-Raptor", movement: "crane up", lens: "Hawk V-Lite Anamorphic", focalLength: "24mm", aperture: "f/4.0", lighting: "studio three-point lighting", mood: "immersive", model: "seedance-2.0", imageModel: "flux-2-pro" },
    { description: `${product} materializes in environment. Elegant entrance. Floating or rotating reveal.`, camera: "ARRI Alexa 35", movement: "orbit", lens: "Zeiss Supreme Prime", focalLength: "50mm", aperture: "f/2.8", lighting: "dramatic Rembrandt lighting", mood: "reveal", model: "kling-3.0", imageModel: "flux-2-pro" },
    { description: `360° product rotation. Clean hero angle. Every surface, every material visible.`, camera: "Red V-Raptor", movement: "orbit", lens: "Cooke S7/i Spherical", focalLength: "85mm", aperture: "f/2.0", lighting: "studio three-point lighting", mood: "detail", model: "kling-3.0", imageModel: "flux-2-pro" },
    { description: `Macro detail dive. Camera pushes into ${product} surface. Texture, material, craft.`, camera: "Sony Venice 2", movement: "slow push-in", lens: "Zeiss Supreme Prime", focalLength: "135mm", aperture: "f/1.4", lighting: "soft natural window light", mood: "intimate", model: "seedance-2.0", imageModel: "flux-2-pro" },
    { description: `Environment shift. ${product} in new context. Different world, same product.`, camera: "ARRI Alexa 35", movement: "whip pan", lens: "Hawk V-Lite Anamorphic", focalLength: "35mm", aperture: "f/2.8", lighting: "neon-lit", mood: "dynamic", model: "seedance-2.0", imageModel: "flux-2-pro" },
    { description: `Final hero frame. ${product} in ultimate beauty pose. Pull-back to full environment.`, camera: "Red V-Raptor", movement: "pull-back reveal", lens: "Cooke S7/i Spherical", focalLength: "50mm", aperture: "f/2.8", lighting: "golden hour backlight", mood: "epic", model: "seedance-2.0", imageModel: "flux-2-pro" },
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
    timing: `${(i * interval).toFixed(1)}s – ${((i + 1) * interval).toFixed(1)}s`,
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
  // Image models — API available
  "flux-2-pro": true,
  "higgsfield-soul": true,         // Soul 2.0 — pairs with Soul ID
  "soul-character": true,
  "soul-reference": true,
  "soul-standard": true,
  "reve": true,
  "reve-edit": true,
  // Video models — API available
  "kling-3.0": true,
  "kling-2.6": true,
  "kling-2.1-pro": true,
  "kling-2.1-standard": true,
  "dop-standard": true,
  "dop-lite": true,
  "dop-turbo": true,
  // UI-only models
  "seedance-2.0": false,           // Higgsfield platform UI only
  "cinema-studio-3.0": false,      // UI only — reasoning engine
  "cinema-studio-2.5": false,      // UI only
  "veo-3.1": false,
  "sora-2": false,
  "recast": false,
  "vibe-motion": false,
  "soul-cinema": false,            // UI only — Soul Cinema Preview
  "nano-banana-pro": false,        // UI only — Gemini-powered character sheets
};

function isApiAvailable(model: string): boolean {
  return API_MODELS[model] ?? false;
}

export function generatePrompts(
  project: Project,
  scenesList: { id: number; sceneNumber: number; description: string; camera: string; movement: string; lens: string; focalLength: string; aperture: string; lighting: string; mood: string; modelRecommendation: string; timing: string }[],
  characters?: Character[]
): InsertPrompt[] {
  const allPrompts: InsertPrompt[] = [];
  const aspectRatio = project.aspectRatio || "16:9";

  // Get image model for each scene from the template data
  // We derive it from the video model recommendation: soul scenes → higgsfield-soul, product → flux-2-pro
  const getImageModel = (videoModel: string, description: string): string => {
    const descLower = description.toLowerCase();
    const hasCharacter = descLower.includes("character") || descLower.includes("person") || descLower.includes("hands") || (characters && characters.length > 0);
    if (hasCharacter && videoModel !== "seedance-2.0" && project.contentType !== "3d-commercial") {
      return "higgsfield-soul";
    }
    return "flux-2-pro";
  };

  for (const scene of scenesList) {
    // ─── Image prompt (MCSLA formula) ───
    const imageModel = getImageModel(scene.modelRecommendation, scene.description);
    const imagePrompt = buildImagePrompt(scene, aspectRatio, characters);

    allPrompts.push({
      projectId: project.id,
      sceneId: scene.id,
      type: "image",
      model: imageModel,
      promptText: imagePrompt,
      isApiAvailable: isApiAvailable(imageModel) ? 1 : 0,
      status: "pending",
    });

    // ─── Video prompt (I2V motion-only) ───
    const videoModel = scene.modelRecommendation;
    const videoPrompt = buildVideoPrompt(scene, videoModel, aspectRatio);

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

  // ─── Seedance 2.0 Multi-Shot Block ───
  // Uses @img1 reference syntax for character anchor
  const durationSec = parseInt(project.duration) || 15;
  const shotCount = Math.min(scenesList.length, 10);
  const shotInterval = durationSec / shotCount;

  const hasCharacters = characters && characters.length > 0;
  const charAnchor = hasCharacters ? `@img1 — ${characters![0].name} character anchor\n\n` : "";

  const multiShotLines: string[] = [];
  for (let i = 0; i < shotCount; i++) {
    const s = scenesList[i];
    const startT = (i * shotInterval).toFixed(1);
    const endT = ((i + 1) * shotInterval).toFixed(1);
    const imgRef = i === 0 ? " @img1" : i === 1 ? " @img2" : "";
    multiShotLines.push(`Shot ${i + 1} (${startT}–${endT}s): [${s.movement}, ${s.description.split(".")[0].trim()}${imgRef}]`);
  }

  allPrompts.push({
    projectId: project.id,
    sceneId: null,
    type: "multi-shot",
    model: "seedance-2.0",
    promptText: charAnchor + multiShotLines.join("\n"),
    isApiAvailable: 0,
    status: "pending",
  });

  // ─── Cinema Studio 3.0 Spec ───
  // The reasoning engine takes a story prompt + up to 9 reference images
  const charSpec = hasCharacters
    ? characters!.map(c => `${c.name} (${c.archetype}, ${[c.gender, c.ethnicity, c.ageRange].filter(Boolean).join(", ")})`).join("; ")
    : "No characters defined";

  const movementSeq = scenesList.map(s => s.movement).filter((v, i, a) => a.indexOf(v) === i).join(" → ");
  const grade = pick(COLOR_GRADES);
  const primaryCamera = scenesList[0]?.camera || "ARRI Alexa 35";
  const primaryLens = scenesList[0]?.lens || "Hawk V-Lite Anamorphic";

  const cinemaSpec = `Cinema Studio 3.0 — Reasoning Engine Spec

Project: ${project.name}
Client: ${project.client || "—"}
Duration: ${project.duration}  Aspect Ratio: ${project.aspectRatio}
Mood: ${project.moodKeywords || "cinematic, premium"}

Cast: ${charSpec}

Story Prompt:
${project.productDescription || project.name}. Target audience: ${project.targetAudience || "general"}. Tone: ${project.moodKeywords || "cinematic"}.

Camera Package:
Primary: ${primaryCamera} + ${primaryLens}
Movement sequence: ${movementSeq}
Color grade: ${grade}

Reference Images (upload in order):
${scenesList.slice(0, 9).map((s, i) => `[${i + 1}] ${s.description.split(".")[0].trim()}`).join("\n")}`;

  allPrompts.push({
    projectId: project.id,
    sceneId: null,
    type: "cinema-spec",
    model: "cinema-studio-3.0",
    promptText: cinemaSpec,
    isApiAvailable: 0,
    status: "pending",
  });

  return allPrompts;
}
