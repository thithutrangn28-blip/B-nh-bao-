import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = 'banhnho_db';
const STORE_NAME = 'bot_cards';
const BG_STORE_NAME = 'backgrounds';
const STORY_STORE_NAME = 'stories';
const KIKOKO_STORY_STORE_NAME = 'kikoko_stories';
const KIKOKO_IG_STORE_NAME = 'kikoko_ig';
const CHAT_STORE_NAME = 'chat_history';
const FORUM_STORE_NAME = 'forum_data';
export const PERMANENT_MEM_STORE = 'novel_permanent_mem';
export const SHORT_TERM_MEM_STORE = 'novel_short_term_mem';
export const LONG_TERM_MEM_STORE = 'novel_long_term_mem';
export const LOREBOOK_STORE = 'novel_lorebook';
export const NPC_PROFILE_STORE = 'npc_profiles';
export const NPC_CONVO_STORE = 'npc_conversations';
const VERSION = 17;

export async function getDB(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, VERSION, {
    upgrade(db, oldVersion, newVersion, transaction) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
      if (!db.objectStoreNames.contains(BG_STORE_NAME)) {
        db.createObjectStore(BG_STORE_NAME);
      }
      if (!db.objectStoreNames.contains(STORY_STORE_NAME)) {
        db.createObjectStore(STORY_STORE_NAME);
      }
      if (!db.objectStoreNames.contains(KIKOKO_STORY_STORE_NAME)) {
        db.createObjectStore(KIKOKO_STORY_STORE_NAME);
      }
      if (!db.objectStoreNames.contains(CHAT_STORE_NAME)) {
        db.createObjectStore(CHAT_STORE_NAME);
      }
      if (!db.objectStoreNames.contains(KIKOKO_IG_STORE_NAME)) {
        db.createObjectStore(KIKOKO_IG_STORE_NAME);
      }
      if (!db.objectStoreNames.contains(FORUM_STORE_NAME)) {
        db.createObjectStore(FORUM_STORE_NAME);
      }
      // Smart Memory Stores
      if (!db.objectStoreNames.contains(PERMANENT_MEM_STORE)) {
        db.createObjectStore(PERMANENT_MEM_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(SHORT_TERM_MEM_STORE)) {
        db.createObjectStore(SHORT_TERM_MEM_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(LONG_TERM_MEM_STORE)) {
        db.createObjectStore(LONG_TERM_MEM_STORE, { keyPath: 'id' });
      }
      const longTermStore = transaction.objectStore(LONG_TERM_MEM_STORE);
      if (!longTermStore.indexNames.contains('novelId')) {
        longTermStore.createIndex('novelId', 'novelId', { unique: false });
      }
      if (!db.objectStoreNames.contains(LOREBOOK_STORE)) {
        db.createObjectStore(LOREBOOK_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(NPC_PROFILE_STORE)) {
        const npcStore = db.createObjectStore(NPC_PROFILE_STORE, { keyPath: 'id' });
        npcStore.createIndex('botId', 'botId', { unique: false });
      }
      if (!db.objectStoreNames.contains(NPC_CONVO_STORE)) {
        const convoStore = db.createObjectStore(NPC_CONVO_STORE, { keyPath: 'id' });
        convoStore.createIndex('npcId', 'npcId', { unique: false });
        convoStore.createIndex('botId', 'botId', { unique: false });
      }
    },
  });
}

export async function saveChat(botId: string, messages: any[]) {
  const db = await getDB();
  await db.put(CHAT_STORE_NAME, messages, botId);
}

export async function loadChat(botId: string): Promise<any[]> {
  const db = await getDB();
  return (await db.get(CHAT_STORE_NAME, botId)) || [];
}

export async function saveChatSettings(botId: string, settings: any) {
  const db = await getDB();
  await db.put(CHAT_STORE_NAME, settings, `settings_${botId}`);
}

export async function loadChatSettings(botId: string): Promise<any> {
  const db = await getDB();
  return await db.get(CHAT_STORE_NAME, `settings_${botId}`);
}

export async function saveCards(cards: any[]) {
  const db = await getDB();
  await db.put(STORE_NAME, cards, 'saved_cards');
}

export async function loadCards(): Promise<any[]> {
  const db = await getDB();
  return (await db.get(STORE_NAME, 'saved_cards')) || [];
}

export async function deleteChat(botId: string) {
  const db = await getDB();
  const tx = db.transaction(CHAT_STORE_NAME, 'readwrite');
  await tx.objectStore(CHAT_STORE_NAME).delete(botId);
  await tx.objectStore(CHAT_STORE_NAME).delete(`settings_${botId}`);
  await tx.done;
}

export async function saveDraft(key: string, value: any) {
  const db = await getDB();
  await db.put(STORE_NAME, value, `draft_${key}`);
}

export async function loadDraft(key: string): Promise<any> {
  const db = await getDB();
  return await db.get(STORE_NAME, `draft_${key}`);
}

export async function clearDrafts() {
  const db = await getDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  const keys = await store.getAllKeys();
  for (const key of keys) {
    if (typeof key === 'string' && key.startsWith('draft_')) {
      await store.delete(key);
    }
  }
  await tx.done;
}

export async function saveBackground(tabId: string, base64: string) {
  const db = await getDB();
  await db.put(BG_STORE_NAME, base64, tabId);
}

export async function loadBackgrounds(): Promise<Record<string, string>> {
  const db = await getDB();
  const tx = db.transaction(BG_STORE_NAME, 'readonly');
  const store = tx.objectStore(BG_STORE_NAME);
  const keys = await store.getAllKeys();
  const values = await store.getAll();
  
  const result: Record<string, string> = {};
  keys.forEach((key, i) => {
    result[key as string] = values[i];
  });
  return result;
}

export async function getAllStories(): Promise<any[]> {
  const db = await getDB();
  return await db.getAll(STORY_STORE_NAME);
}

export async function saveStory(story: any) {
  const db = await getDB();
  await db.put(STORY_STORE_NAME, story, story.id);
}

export async function deleteStory(id: string) {
  const db = await getDB();
  await db.delete(STORY_STORE_NAME, id);
}

export async function clearAllStories() {
  const db = await getDB();
  await db.clear(STORY_STORE_NAME);
}

export async function getAllKikokoStories(): Promise<any[]> {
  const db = await getDB();
  return await db.getAll(KIKOKO_STORY_STORE_NAME);
}

export async function getKikokoStory(id: string): Promise<any> {
  const db = await getDB();
  return await db.get(KIKOKO_STORY_STORE_NAME, id);
}

export async function saveKikokoStory(story: any) {
  const db = await getDB();
  await db.put(KIKOKO_STORY_STORE_NAME, story, story.id);
}

export async function deleteKikokoStory(id: string) {
  const db = await getDB();
  await db.delete(KIKOKO_STORY_STORE_NAME, id);
}

export async function clearAllKikokoStories() {
  const db = await getDB();
  await db.clear(KIKOKO_STORY_STORE_NAME);
}

export async function saveKikokoInstagram(storyId: string, data: any) {
  const db = await getDB();
  await db.put(KIKOKO_IG_STORE_NAME, data, storyId);
}

export async function loadKikokoInstagram(storyId: string): Promise<any> {
  const db = await getDB();
  return await db.get(KIKOKO_IG_STORE_NAME, storyId);
}

export async function saveGalleryBackground(base64: string) {
  const db = await getDB();
  await db.put(BG_STORE_NAME, base64, 'kikoko_gallery_background');
}

export async function loadGalleryBackground(): Promise<string | null> {
  const db = await getDB();
  return (await db.get(BG_STORE_NAME, 'kikoko_gallery_background')) || null;
}

export async function saveForumData(key: string, value: any) {
  const db = await getDB();
  await db.put(FORUM_STORE_NAME, value, key);
}

export async function loadForumData(key: string): Promise<any> {
  const db = await getDB();
  return await db.get(FORUM_STORE_NAME, key);
}

// NPC Helper Functions
export async function saveNPCProfile(profile: any) {
  const db = await getDB();
  await db.put(NPC_PROFILE_STORE, profile);
}

export async function loadNPCProfiles(botId: string): Promise<any[]> {
  const db = await getDB();
  return await db.getAllFromIndex(NPC_PROFILE_STORE, 'botId', botId);
}

export async function deleteNPCProfile(id: string) {
  const db = await getDB();
  await db.delete(NPC_PROFILE_STORE, id);
}

export async function saveNPCConversation(convo: any) {
  const db = await getDB();
  await db.put(NPC_CONVO_STORE, convo);
}

export async function loadNPCConversations(npcId: string): Promise<any[]> {
  const db = await getDB();
  return await db.getAllFromIndex(NPC_CONVO_STORE, 'npcId', npcId);
}

export async function deleteNPCConversation(id: string) {
  const db = await getDB();
  await db.delete(NPC_CONVO_STORE, id);
}

// Background Helper Functions
export async function saveGlobalBackground(key: string, base64: string) {
  const db = await getDB();
  await db.put(BG_STORE_NAME, base64, key);
}

export async function loadGlobalBackground(key: string): Promise<string | null> {
  const db = await getDB();
  return (await db.get(BG_STORE_NAME, key)) || null;
}
