export const MEMORY_CONFIG = {
  // Budget Context Window V10
  TOTAL_CAP: 75000, 
  SAFE_THRESHOLD: 52000, 
  WARNING_THRESHOLD: 60000,
  DANGER_THRESHOLD: 65000,
  CRITICAL_BLOCK: 70000,

  // Tier Budgets
  IMMUTABLE_CORE_MAX: 15000, 
  LONG_TERM_MAX_TOTAL: 20000, 
  LONG_TERM_COMPRESSED_TARGET: 15000,
  SYSTEM_PROMPT_MAX: 5000,
  SLIDING_BUFFER_MAX: 10, 

  // Token Ratio (Approximation for Vietnamese - 1 token ~ 3.8 chars)
  TOKEN_RATIO: 3.8, 

  // Summary Trigger
  SUMMARY_CHAPTER_INTERVAL: 3,
};

export type MemoryZone = 'SAFE' | 'WARNING' | 'DANGER' | 'CRITICAL' | 'BLOCK';

export interface LongTermSummary {
  id: string;
  chapters: string; // e.g. "1-3"
  content: string;
  enabled: boolean;
  createdAt: number;
  isArchived?: boolean;
}

export interface HotMemoryItem {
  chapterId: string;
  headSummary: string;
  tailRaw: string;
  tokens: number;
  disabled?: boolean;
}

export interface EternalFact {
  id: string;
  type: 'NPC' | 'EVENT' | 'COMMITMENT' | 'SECRET' | 'OBJECT' | 'LORE';
  content: string;
  createdAt: number;
}

export interface Prompt {
  id: string;
  name: string;
  content: string;
  folderId: string;
  enabled: boolean;
  createdAt: number;
  category: string;
}

export interface MemoryState {
  // Layer 1: Global System
  globalSystem: string;

  // Layer 2: Writing Engine
  writingEngine: string;

  // Layer 3: Roleplay Engine
  roleplayEngine: string;

  // Layer 4: Immutable Core (Bot Info + World Rules)
  eternalCore: string;
  
  // Layer 5: Core Identity/Backstory
  arcSummary: string;
  
  // Layer 6: Output Enforcement
  outputEnforcement: string;

  // Layer 7: User Profile Memory
  userProfileMemory: string;
  
  // Layer 8: Relationship State
  relationshipState: string;
  
  // Layer 9: Current Arc
  currentArc: string;

  // Layer 10: Current Scene State
  currentScene: string;
  
  // Layer 11: Long-Term Summary Cards
  longTermSummaries: LongTermSummary[];

  // Layer 12: Recent Conversation Window (Hot Memory)
  hotMemory: HotMemoryItem[];
  
  // Layer 13: Optional NPC/Lore Memory
  eternalFacts: EternalFact[];
  extendedMemory: string;

  // Meta System
  slidingBuffer: { role: 'user' | 'assistant'; content: string }[];
  systemPrompt: string;
  background?: string;
  selectedStyles?: string[];
  stylesBackground?: string;
  prompts?: Prompt[];
  customContextOverrides?: Record<string, string>;
}
