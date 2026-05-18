export interface Chapter {
  id: string;
  title: string;
  content: string;
  timestamp: string;
}

export interface NPCComment {
  id: string;
  npcName: string;
  npcAvatar: string;
  npcRole: string;
  npcBackground: string;
  content: string;
  timestamp: string;
}

export interface Novel {
  id: string;
  storyName: string;
  characterName: string;
  genre: string;
  chapterLength: number;
  chapters: Chapter[];
  coverImage: string;
  editorBackgroundImage: string;
  npcGlobalBackground: string;
  lastModified: number;
  settings: {
    proxyEndpoint: string;
    proxyKey: string;
    model: string;
    apiType?: 'auto' | 'openai' | 'claude' | 'gemini' | 'custom';
    isSetupComplete: boolean;
    useStreaming?: boolean;
    extremeCapacityMode?: boolean;
    maxTokens?: number;
    timeout?: number;
    fontSize?: number;
    responseHistory?: number[];
  };
  userPlot?: string;
  nextChapterLength?: number | '';
  botCharInfo?: string;
  userCharInfo?: string;
  writingPrompt?: string;
  selectedStyles?: string[];
  npcCount?: number;
  storyOpening?: string;
  introMainImage?: string;
  introSideImages?: string[];
  longTermMemory?: string;
  characterMemory?: string;
  memoryState?: any; // We'll store the full MemoryState here
}

export interface ApiPayload {
  model: string;
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[];
  max_tokens?: number;
  temperature?: number;
  stream?: boolean;
  [key: string]: any;
}

export type NPCRelationType =
  | "related"
  | "unrelated"
  | "friend"
  | "rival"
  | "family"
  | "classmate"
  | "coworker"
  | "neighbor"
  | "secret_admirer"
  | "custom";

export interface NPCProfile {
  id: string;
  botId: string; // The bot it belongs to
  name: string;
  avatarUrl: string;
  relationType: NPCRelationType;
  relationToBotChar: string;
  description: string;
  personalityNotes: string;
  extraInfo?: {
    age?: string;
    job?: string;
    birthday?: string;
    location?: string;
  };
  createdAt: number;
  updatedAt: number;
  chatBgUrl?: string;
  profileBgUrl?: string;
}

export interface NPCMessage {
  id: string;
  npcId: string;
  sender: "bot_char" | "npc";
  text: string;
  emotion?: string;
  createdAt: number;
}

export interface NPCConversation {
  id: string;
  npcId: string;
  botId: string;
  title: string;
  messages: NPCMessage[];
  createdAt: number;
  updatedAt: number;
}
