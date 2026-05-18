import { sendMessage, ApiProxySettings } from '../utils/apiProxy';

export interface UserProfile {
  name: string;
  intro: string;
  target: string;
  reason: string;
  mc: string;
  gender: string;
  targetGender: string;
  minChars: number;
  maxChars: number;
  avatarBg: string;
  quizCount?: number;
  cafeCount?: number;
  npcCount?: number;
  chatMode?: string;
}

export interface NPCProfile {
  id: string;
  name: string;
  age: number;
  avatarSeed: string;
  mbti: string;
  intro: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswerIndex: number;
}

export interface CafeScenario {
  npcName: string;
  coffeeOrder: string;
  problem: string;
  options: string[];
  bestAdviceIndex: number;
}

export const generateNPCs = async (
  count: number, 
  profile: UserProfile, 
  settings: ApiProxySettings,
  onProgress: (current: number, total: number, newItems: NPCProfile[]) => void
): Promise<void> => {
  const prompt = `Hãy tạo ${count} hồ sơ NPC cho ứng dụng hẹn hò. 
  Người dùng là ${profile.name}, ${profile.intro}. Gu là ${profile.target}.
  Yêu cầu trả về danh sách JSON các object NPCProfile:
  { "id": string, "name": string, "age": number, "avatarSeed": string, "mbti": string, "intro": string }
  Chỉ trả về JSON, không giải thích.`;

  try {
    const response = await sendMessage(settings, [{ role: 'user', content: prompt }], "Bạn là một chuyên gia tạo nhân vật cho ứng dụng hẹn hò.");
    const npcs = extractJSON(response);
    if (Array.isArray(npcs)) {
      const batchSize = 5;
      for (let i = 0; i < npcs.length; i += batchSize) {
        const batch = npcs.slice(i, i + batchSize);
        onProgress(Math.min(i + batchSize, npcs.length), npcs.length, batch);
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return;
    }
  } catch (e) {
    console.error("Failed to generate real NPCs, falling back to mock", e);
  }

  // Fallback to mock
  const mockNPCs: NPCProfile[] = Array.from({ length: count }, (_, i) => ({
    id: `npc-${Date.now()}-${i}`,
    name: ['Linh', 'Hùng', 'Trang', 'Tuấn', 'Lan', 'Minh'][Math.floor(Math.random() * 6)],
    age: 18 + Math.floor(Math.random() * 10),
    avatarSeed: Math.random().toString(36).substring(7),
    mbti: ['ENFP', 'INTJ', 'INFJ', 'ESTP', 'ISTJ', 'ENTP'][Math.floor(Math.random() * 6)],
    intro: 'Rất vui được làm quen với bạn!'
  }));

  const batchSize = 5;
  for (let i = 0; i < mockNPCs.length; i += batchSize) {
    const batch = mockNPCs.slice(i, i + batchSize);
    onProgress(Math.min(i + batchSize, count), count, batch);
    await new Promise(resolve => setTimeout(resolve, 500));
  }
};

export const generateLoveQuiz = async (
  count: number, 
  settings: ApiProxySettings,
  onProgress: (current: number, total: number, newItems: QuizQuestion[]) => void
): Promise<void> => {
  const prompt = `Hãy tạo ${count} câu hỏi trắc nghiệm về tình yêu và tâm lý.
  Yêu cầu trả về danh sách JSON các object QuizQuestion:
  { "question": string, "options": string[], "correctAnswerIndex": number }
  Chỉ trả về JSON, không giải thích.`;

  try {
    const response = await sendMessage(settings, [{ role: 'user', content: prompt }], "Bạn là một chuyên gia tâm lý tình yêu.");
    const quizzes = extractJSON(response);
    if (Array.isArray(quizzes)) {
      onProgress(quizzes.length, quizzes.length, quizzes);
      return;
    }
  } catch (e) {
    console.error("Failed to generate real quizzes, falling back to mock", e);
  }

  const mockQuizzes: QuizQuestion[] = Array.from({ length: count }, (_, i) => ({
    question: `Câu hỏi tình yêu số ${i + 1}?`,
    options: ['Đáp án A', 'Đáp án B', 'Đáp án C', 'Đáp án D'],
    correctAnswerIndex: Math.floor(Math.random() * 4)
  }));

  onProgress(count, count, mockQuizzes);
};

export const generateCafeScenarios = async (
  count: number, 
  settings: ApiProxySettings,
  onProgress: (current: number, total: number, newItems: CafeScenario[]) => void
): Promise<void> => {
  const prompt = `Hãy tạo ${count} tình huống khách hàng tại quán cafe tình yêu.
  Yêu cầu trả về danh sách JSON các object CafeScenario:
  { "npcName": string, "coffeeOrder": string, "problem": string, "options": string[], "bestAdviceIndex": number }
  Chỉ trả về JSON, không giải thích.`;

  try {
    const response = await sendMessage(settings, [{ role: 'user', content: prompt }], "Bạn là chủ quán cafe tình yêu.");
    const scenarios = extractJSON(response);
    if (Array.isArray(scenarios)) {
      onProgress(scenarios.length, scenarios.length, scenarios);
      return;
    }
  } catch (e) {
    console.error("Failed to generate real scenarios, falling back to mock", e);
  }

  const mockScenarios: CafeScenario[] = Array.from({ length: count }, (_, i) => ({
    npcName: ['Khách A', 'Khách B', 'Khách C'][Math.floor(Math.random() * 3)],
    coffeeOrder: 'Cà phê sữa đá',
    problem: 'Tôi đang gặp rắc rối trong chuyện tình cảm...',
    options: ['Khuyên nhủ', 'Lắng nghe', 'Mời thêm ly nữa'],
    bestAdviceIndex: 0
  }));

  onProgress(count, count, mockScenarios);
};

export const generateNPCResponse = async (
  npc: NPCProfile, 
  userMessage: string, 
  history: any[], 
  profile: UserProfile, 
  settings: ApiProxySettings,
  maxTokens?: number, 
  timeoutMinutes?: number, 
  superMode?: boolean,
  onStream?: (text: string) => void
): Promise<{ content: string, usage?: any }> => {
  const messages: { role: 'user' | 'assistant' | 'system', content: string }[] = history.map(h => ({
    role: h.role === 'model' ? 'assistant' : h.role,
    content: h.content
  }));

  messages.push({ role: 'user', content: userMessage });

  const characterInfo = `Bạn là ${npc.name}, ${npc.intro}. Người dùng là ${profile.name}, ${profile.intro}.`;
  
  const apiSettings: ApiProxySettings = {
    ...settings,
    maxTokens: maxTokens || settings.maxTokens || 30000,
    timeoutMinutes: timeoutMinutes || settings.timeoutMinutes || 5,
    isUnlimited: settings.isUnlimited,
  };

  const content = await sendMessage(apiSettings, messages, characterInfo);
  
  if (onStream) {
    // Simulate streaming for UI effect as sendMessage currently returns full text
    for (let i = 0; i < content.length; i += 10) {
      onStream(content.substring(0, i + 10));
      await new Promise(resolve => setTimeout(resolve, 20));
    }
  }

  return { 
    content: content,
    usage: undefined // Usage metadata not easily available from proxy fetch
  };
};

export const extractJSON = (text: string): any => {
  try {
    const match = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (match) {
      return JSON.parse(match[0]);
    }
    return JSON.parse(text);
  } catch (e) {
    console.error("Failed to parse JSON", e);
    return null;
  }
};
