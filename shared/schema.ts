import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ─── Projects ───
export const projects = sqliteTable("projects", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  client: text("client").notNull().default(""),
  productName: text("product_name").notNull().default(""),
  productDescription: text("product_description").notNull().default(""),
  targetAudience: text("target_audience").notNull().default(""),
  contentType: text("content_type").notNull().default("product-ad"), // product-ad | character-brand | viral-clip | cinematic-film | 3d-commercial
  aspectRatio: text("aspect_ratio").notNull().default("16:9"),
  duration: text("duration").notNull().default("15s"),
  moodKeywords: text("mood_keywords").notNull().default(""),
  referenceNotes: text("reference_notes").notNull().default(""),
  status: text("status").notNull().default("brief"), // brief | characters | storyboard | production | complete
  createdAt: text("created_at").notNull(),
});

export const insertProjectSchema = createInsertSchema(projects).omit({ id: true });
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;

// ─── Characters ───
export const characters = sqliteTable("characters", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  projectId: integer("project_id"),
  name: text("name").notNull(),
  genre: text("genre").notNull().default("Drama"),
  budget: text("budget").notNull().default("Medium"),
  era: text("era").notNull().default("2020s"),
  archetype: text("archetype").notNull().default("Everyman"),
  gender: text("gender").notNull().default(""),
  ethnicity: text("ethnicity").notNull().default(""),
  ageRange: text("age_range").notNull().default(""),
  height: text("height").notNull().default(""),
  build: text("build").notNull().default(""),
  eyeColor: text("eye_color").notNull().default(""),
  hair: text("hair").notNull().default(""),
  facialHair: text("facial_hair").notNull().default(""),
  details: text("details").notNull().default(""),
  outfit: text("outfit").notNull().default(""),
  saved: integer("saved").notNull().default(0), // 0 or 1, for character library
});

export const insertCharacterSchema = createInsertSchema(characters).omit({ id: true });
export type InsertCharacter = z.infer<typeof insertCharacterSchema>;
export type Character = typeof characters.$inferSelect;

// ─── Scenes ───
export const scenes = sqliteTable("scenes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  projectId: integer("project_id").notNull(),
  sceneNumber: integer("scene_number").notNull(),
  timing: text("timing").notNull().default(""),
  description: text("description").notNull().default(""),
  camera: text("camera").notNull().default(""),
  movement: text("movement").notNull().default(""),
  lens: text("lens").notNull().default(""),
  focalLength: text("focal_length").notNull().default(""),
  aperture: text("aperture").notNull().default(""),
  lighting: text("lighting").notNull().default(""),
  mood: text("mood").notNull().default(""),
  modelRecommendation: text("model_recommendation").notNull().default(""),
  characterId: integer("character_id"),
});

export const insertSceneSchema = createInsertSchema(scenes).omit({ id: true });
export type InsertScene = z.infer<typeof insertSceneSchema>;
export type Scene = typeof scenes.$inferSelect;

// ─── Prompts ───
export const prompts = sqliteTable("prompts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  projectId: integer("project_id").notNull(),
  sceneId: integer("scene_id"),
  type: text("type").notNull(), // image | video | multi-shot | cinema-spec
  model: text("model").notNull(), // flux-2-pro, kling-3.0, seedance-2.0, etc.
  promptText: text("prompt_text").notNull(),
  isApiAvailable: integer("is_api_available").notNull().default(0), // 0 or 1
  status: text("status").notNull().default("pending"), // pending | generated | approved
});

export const insertPromptSchema = createInsertSchema(prompts).omit({ id: true });
export type InsertPrompt = z.infer<typeof insertPromptSchema>;
export type Prompt = typeof prompts.$inferSelect;

// ─── Prompt Library ───
export const promptLibrary = sqliteTable("prompt_library", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  category: text("category").notNull(), // product-ad | character-brand | viral-clip | cinematic-film | 3d-commercial | general
  type: text("type").notNull(), // image | video | multi-shot | cinema-spec
  model: text("model").notNull(),
  promptText: text("prompt_text").notNull(),
  isApiAvailable: integer("is_api_available").notNull().default(0),
});

export const insertPromptLibrarySchema = createInsertSchema(promptLibrary).omit({ id: true });
export type InsertPromptLibrary = z.infer<typeof insertPromptLibrarySchema>;
export type PromptLibraryEntry = typeof promptLibrary.$inferSelect;

// ─── Settings ───
export const settings = sqliteTable("settings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
});

export const insertSettingSchema = createInsertSchema(settings).omit({ id: true });
export type InsertSetting = z.infer<typeof insertSettingSchema>;
export type Setting = typeof settings.$inferSelect;
