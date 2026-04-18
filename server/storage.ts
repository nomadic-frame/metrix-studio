import {
  type Project, type InsertProject, projects,
  type Character, type InsertCharacter, characters,
  type Scene, type InsertScene, scenes,
  type Prompt, type InsertPrompt, prompts,
  type PromptLibraryEntry, type InsertPromptLibrary, promptLibrary,
  type Setting, type InsertSetting, settings,
} from "@shared/schema";
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { eq, desc, and } from "drizzle-orm";

const sqlite = new Database("data.db");
sqlite.pragma("journal_mode = WAL");

export const db = drizzle(sqlite);

export interface IStorage {
  // Projects
  getProjects(): Promise<Project[]>;
  getProject(id: number): Promise<Project | undefined>;
  createProject(data: InsertProject): Promise<Project>;
  updateProject(id: number, data: Partial<InsertProject>): Promise<Project | undefined>;
  deleteProject(id: number): Promise<void>;

  // Characters
  getCharactersByProject(projectId: number): Promise<Character[]>;
  getSavedCharacters(): Promise<Character[]>;
  getCharacter(id: number): Promise<Character | undefined>;
  createCharacter(data: InsertCharacter): Promise<Character>;
  updateCharacter(id: number, data: Partial<InsertCharacter>): Promise<Character | undefined>;
  deleteCharacter(id: number): Promise<void>;

  // Scenes
  getScenesByProject(projectId: number): Promise<Scene[]>;
  createScene(data: InsertScene): Promise<Scene>;
  updateScene(id: number, data: Partial<InsertScene>): Promise<Scene | undefined>;
  deleteScene(id: number): Promise<void>;
  deleteScenesByProject(projectId: number): Promise<void>;

  // Prompts
  getPrompt(id: number): Promise<Prompt | undefined>;
  getPromptsByProject(projectId: number): Promise<Prompt[]>;
  getPromptsByScene(sceneId: number): Promise<Prompt[]>;
  createPrompt(data: InsertPrompt): Promise<Prompt>;
  updatePrompt(id: number, data: Partial<InsertPrompt>): Promise<Prompt | undefined>;
  deletePrompt(id: number): Promise<void>;
  deletePromptsByProject(projectId: number): Promise<void>;

  // Prompt Library
  getPromptLibrary(): Promise<PromptLibraryEntry[]>;
  createPromptLibraryEntry(data: InsertPromptLibrary): Promise<PromptLibraryEntry>;
  deletePromptLibraryEntry(id: number): Promise<void>;

  // Settings
  getSetting(key: string): Promise<string | undefined>;
  setSetting(key: string, value: string): Promise<void>;
  getAllSettings(): Promise<Setting[]>;
}

export class DatabaseStorage implements IStorage {
  // ─── Projects ───
  async getProjects(): Promise<Project[]> {
    return db.select().from(projects).orderBy(desc(projects.id)).all();
  }
  async getProject(id: number): Promise<Project | undefined> {
    return db.select().from(projects).where(eq(projects.id, id)).get();
  }
  async createProject(data: InsertProject): Promise<Project> {
    return db.insert(projects).values(data).returning().get();
  }
  async updateProject(id: number, data: Partial<InsertProject>): Promise<Project | undefined> {
    return db.update(projects).set(data).where(eq(projects.id, id)).returning().get();
  }
  async deleteProject(id: number): Promise<void> {
    db.delete(projects).where(eq(projects.id, id)).run();
  }

  // ─── Characters ───
  async getCharactersByProject(projectId: number): Promise<Character[]> {
    return db.select().from(characters).where(eq(characters.projectId, projectId)).all();
  }
  async getSavedCharacters(): Promise<Character[]> {
    return db.select().from(characters).where(eq(characters.saved, 1)).all();
  }
  async getCharacter(id: number): Promise<Character | undefined> {
    return db.select().from(characters).where(eq(characters.id, id)).get();
  }
  async createCharacter(data: InsertCharacter): Promise<Character> {
    return db.insert(characters).values(data).returning().get();
  }
  async updateCharacter(id: number, data: Partial<InsertCharacter>): Promise<Character | undefined> {
    return db.update(characters).set(data).where(eq(characters.id, id)).returning().get();
  }
  async deleteCharacter(id: number): Promise<void> {
    db.delete(characters).where(eq(characters.id, id)).run();
  }

  // ─── Scenes ───
  async getScenesByProject(projectId: number): Promise<Scene[]> {
    return db.select().from(scenes).where(eq(scenes.projectId, projectId)).orderBy(scenes.sceneNumber).all();
  }
  async createScene(data: InsertScene): Promise<Scene> {
    return db.insert(scenes).values(data).returning().get();
  }
  async updateScene(id: number, data: Partial<InsertScene>): Promise<Scene | undefined> {
    return db.update(scenes).set(data).where(eq(scenes.id, id)).returning().get();
  }
  async deleteScene(id: number): Promise<void> {
    db.delete(scenes).where(eq(scenes.id, id)).run();
  }
  async deleteScenesByProject(projectId: number): Promise<void> {
    db.delete(scenes).where(eq(scenes.projectId, projectId)).run();
  }

  // ─── Prompts ───
  async getPrompt(id: number): Promise<Prompt | undefined> {
    return db.select().from(prompts).where(eq(prompts.id, id)).get();
  }
  async getPromptsByProject(projectId: number): Promise<Prompt[]> {
    return db.select().from(prompts).where(eq(prompts.projectId, projectId)).all();
  }
  async getPromptsByScene(sceneId: number): Promise<Prompt[]> {
    return db.select().from(prompts).where(eq(prompts.sceneId, sceneId)).all();
  }
  async createPrompt(data: InsertPrompt): Promise<Prompt> {
    return db.insert(prompts).values(data).returning().get();
  }
  async updatePrompt(id: number, data: Partial<InsertPrompt>): Promise<Prompt | undefined> {
    return db.update(prompts).set(data).where(eq(prompts.id, id)).returning().get();
  }
  async deletePrompt(id: number): Promise<void> {
    db.delete(prompts).where(eq(prompts.id, id)).run();
  }
  async deletePromptsByProject(projectId: number): Promise<void> {
    db.delete(prompts).where(eq(prompts.projectId, projectId)).run();
  }

  // ─── Prompt Library ───
  async getPromptLibrary(): Promise<PromptLibraryEntry[]> {
    return db.select().from(promptLibrary).all();
  }
  async createPromptLibraryEntry(data: InsertPromptLibrary): Promise<PromptLibraryEntry> {
    return db.insert(promptLibrary).values(data).returning().get();
  }
  async deletePromptLibraryEntry(id: number): Promise<void> {
    db.delete(promptLibrary).where(eq(promptLibrary.id, id)).run();
  }

  // ─── Settings ───
  async getSetting(key: string): Promise<string | undefined> {
    const row = db.select().from(settings).where(eq(settings.key, key)).get();
    return row?.value;
  }
  async setSetting(key: string, value: string): Promise<void> {
    const existing = db.select().from(settings).where(eq(settings.key, key)).get();
    if (existing) {
      db.update(settings).set({ value }).where(eq(settings.key, key)).run();
    } else {
      db.insert(settings).values({ key, value }).run();
    }
  }
  async getAllSettings(): Promise<Setting[]> {
    return db.select().from(settings).all();
  }
}

export const storage = new DatabaseStorage();
