import { type GenerateTweetRequest, type GenerateTweetResponse } from "@shared/schema";

export interface IStorage {
  // No persistent storage needed for this app - all operations are stateless
}

export class MemStorage implements IStorage {
  constructor() {
    // No storage needed for tweet generation
  }
}

export const storage = new MemStorage();
