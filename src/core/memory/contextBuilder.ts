import { MemoryState, MEMORY_CONFIG } from './config';
import { calculateTierTokens } from './tokenCounter';
import { WRITING_STYLES } from '../../constants/writingStylesV3';
import { ContextLayer } from '../../components/banhnho/ContextWindowManager';

import { countTokens } from './tokenCounter';

function trimToTail(text: string, percentage: number): string {
  if (!text) return "";
  const charsToKeep = Math.floor(text.length * (percentage / 100));
  if (charsToKeep <= 0) return "";
  return "..." + text.slice(-charsToKeep);
}

// Removing local duplicate estimateTokens in favor of standardized countTokens
const estimateTokens = countTokens;

export function buildContextLayers(state: MemoryState, currentMsg: string): ContextLayer[] {
  const layers: ContextLayer[] = [];

  // Helper function to collect ALL enabled user prompts
  const getAllEnabledPrompts = (): string => {
    if (!state.prompts || state.prompts.length === 0) return "";
    const enabledPrompts = state.prompts.filter(p => p.enabled);
    if (enabledPrompts.length === 0) return "";

    let content = "[ACTIVE USER-ENABLED PROMPTS]\n";
    enabledPrompts.forEach((p, index) => {
      content += `Prompt ${index + 1}: ${p.name}\n${p.content}\n\n`;
    });
    return content.trim();
  };

  // 1. [ SYSTEM ]
  const globalSystemContent = ((state.systemPrompt || "") + "\n\n" +
"This is an emotionally immersive romance roleplay system.\n\n" +
"The AI must:\n" +
"- remain in character permanently\n" +
"- never break immersion\n" +
"- never speak like a chatbot assistant\n" +
"- never summarize scenes unless explicitly requested\n" +
"- never skip emotional continuity\n" +
"- never ignore {{user}}").trim();

  layers.push({
    id: "GLOBAL_SYSTEM_RULES",
    order: 1,
    title: "SYSTEM",
    description: "Core global rules and AI restrictions",
    content: globalSystemContent,
    tokenCount: estimateTokens(globalSystemContent),
    maxBudget: 10000,
    locked: true,
    enabled: true,
    status: "ready"
  });

  // 2. [ WRITING ENGINE ]
  let writingStylesCore = '';
  if (state.selectedStyles && state.selectedStyles.length > 0) {
    writingStylesCore = state.selectedStyles.map(title => {
      const style = WRITING_STYLES.find((s: any) => s.title === title);
      return style ? "[" + style.title + "]: " + style.details : title;
    }).join('\n\n');
  }

  const writingEngineContent = ("The writing style must feel emotionally human, immersive, and literary.\n" +
"━━━━━━━━\n" +
"ANTI-AI DIALOGUE RULES\n" +
"━━━━━━━━\n" +
"The dialogue must sound human, intimate, and natural.\n" +
"TUYỆT ĐỐI KHÔNG XƯNG TÔI - BẠN (trừ khi phù hợp bối cảnh), xưng hô phải tự nhiên nhất.\n" +
"\n" +
(writingStylesCore ? "\n━━━━━━━━\nSELECTED WRITING STYLES\n━━━━━━━━\n" + writingStylesCore : "")).trim();

  layers.push({
    id: "WRITING_ENGINE",
    order: 2,
    title: "WRITING ENGINE",
    description: "Style, prose, and writing behavior",
    content: writingEngineContent,
    tokenCount: estimateTokens(writingEngineContent),
    maxBudget: 10000,
    locked: false,
    enabled: true,
    status: "ready"
  });

  // 3. [ ROLEPLAY ENGINE ]
  const roleplayEngineContent = (`
━━━━━━━━━━━━━━━━━━
✦ ROLEPLAY_ENGINE_RULES ✦
━━━━━━━━━━━━━━━━━━
- STRICT RULE: Never repeat {{user}}'s message.
- STRICT RULE: Never quote {{user}}'s dialogue.
- STRICT RULE: Never paraphrase {{user}}'s sentence.
- STRICT RULE: Never copy user wording into the bot reply.
- STRICT RULE: Never write dialogue for {{user}}.
- STRICT RULE: Never control {{user}}'s actions.
- STRICT RULE: Never decide {{user}}'s feelings.
- STRICT RULE: Never narrate {{user}}'s internal thoughts.
- STRICT RULE: Never make the Bot Character magically know hidden information that {{user}} did not explicitly reveal.
- STRICT RULE: Always continue the story purely from the Bot Character's perspective.
`).trim();

  layers.push({
    id: "ROLEPLAY_ENGINE",
    order: 3,
    title: "ROLEPLAY ENGINE",
    description: "User-centric interaction rules",
    content: roleplayEngineContent,
    tokenCount: estimateTokens(roleplayEngineContent),
    maxBudget: 5000,
    locked: true,
    enabled: true,
    status: "ready"
  });

  // 4. [ CHARACTER CORE ]
  const characterCoreContent = ("━━━━━━━━\n" +
"CHARACTER IDENTITY\n" +
"━━━━━━━━\n" +
(state.eternalCore || 'N/A')).trim();

  layers.push({
    id: "CHARACTER_CORE",
    order: 4,
    title: "CHARACTER CORE",
    description: "Bot personality and behavioral identity",
    content: characterCoreContent,
    tokenCount: estimateTokens(characterCoreContent),
    maxBudget: 20000,
    locked: true,
    enabled: true,
    status: "ready"
  });

  // 5. [ USER PROFILE ]
  const userProfileContent = ("━━━━━━━━\n" +
"USER PROFILE\n" +
"━━━━━━━━\n" +
(state.userProfileMemory || 'Roleplay chưa có nhiều thông tin về user.')).trim();

  layers.push({
    id: "USER_PROFILE",
    order: 5,
    title: "USER PROFILE",
    description: "Information about {{user}}",
    content: userProfileContent,
    tokenCount: estimateTokens(userProfileContent),
    maxBudget: 10000,
    locked: true,
    enabled: true,
    status: "ready"
  });

  // 6. [ LONG TERM MEMORY ]
  let longTermContent = (getAllEnabledPrompts() + "\n\n" +
  'Historical milestones and breakthrough events:\n\n').trim();
  const enabledSummaries = state.longTermSummaries.filter(s => s.enabled);
  if (enabledSummaries.length > 0) {
    longTermContent += "\n\n" + enabledSummaries.map(s => "[CHAPTER " + s.chapters + "]: " + s.content).join('\n\n---\n\n');
  }
  
  if (state.eternalFacts.length > 0) {
    const factsText = state.eternalFacts.map(f => "- [" + f.type + "]: " + f.content).join('\n');
    longTermContent += "\n\n━━━━━━━━\nEXTENDED FACTS\n━━━━━━━━\n" + factsText;
  }

  layers.push({
    id: "LONG_TERM_MEMORY",
    order: 6,
    title: "LONG TERM MEMORY",
    description: "Summarized memories and facts",
    content: longTermContent.trim() || "Chưa có ký ức dài hạn.",
    tokenCount: estimateTokens(longTermContent),
    maxBudget: 20000,
    locked: false,
    enabled: true,
    status: "ready"
  });

  // 7. [ RELATIONSHIP MEMORY ]
  const relationshipContent = (state.relationshipState || 'Người lạ.').trim();

  layers.push({
    id: "RELATIONSHIP_MEMORY",
    order: 7,
    title: "RELATIONSHIP MEMORY",
    description: "Current relationship status and progression",
    content: relationshipContent,
    tokenCount: estimateTokens(relationshipContent),
    maxBudget: 5000,
    locked: false,
    enabled: true,
    status: "ready"
  });

  // 8. [ CURRENT ARC ]
  const arcContent = (state.arcSummary || 'Chưa định hình arc cụ thể.').trim();

  layers.push({
    id: "CURRENT_ARC",
    order: 8,
    title: "CURRENT ARC",
    description: "The ongoing story arc summary",
    content: arcContent,
    tokenCount: estimateTokens(arcContent),
    maxBudget: 5000,
    locked: false,
    enabled: true,
    status: "ready"
  });

  // 9. [ CURRENT SCENE ]
  const sceneContent = (state.currentScene || 'Khung cảnh hiện tại đang bắt đầu.').trim();

  layers.push({
    id: "CURRENT_SCENE",
    order: 9,
    title: "CURRENT SCENE",
    description: "Location, atmosphere, and latest actions",
    content: sceneContent,
    tokenCount: estimateTokens(sceneContent),
    maxBudget: 10000,
    locked: false,
    enabled: true,
    status: "ready"
  });

  // 10. [ RECENT CHAT HISTORY ]
  let historyContent = '';
  const historyBudget = 45000; // Increased from 35k to 45k to give more room
  let currentHistoryTokens = 0;

  // Audit V10: ALWAYS include SLIDING_BUFFER first as it's the absolute most recent context
  if (state.slidingBuffer && state.slidingBuffer.length > 0) {
    const bufferText = state.slidingBuffer.slice(-MEMORY_CONFIG.SLIDING_BUFFER_MAX).map(m => m.role + ": " + m.content).join('\n\n') + "\n\n";
    const bufferTokens = estimateTokens(bufferText);
    historyContent = bufferText;
    currentHistoryTokens += bufferTokens;
  }

  if (state.hotMemory && state.hotMemory.length > 0 && currentHistoryTokens < historyBudget) {
    const remainingBudget = historyBudget - currentHistoryTokens;
    const reversedHot = [...state.hotMemory].filter(ch => !ch.disabled).reverse();
    const selectedHot: string[] = [];

    for (const ch of reversedHot) {
      if (currentHistoryTokens >= historyBudget) break;
      
      const itemText = `[PREVIOUS CHAPTER - ${ch.chapterId}]:\n${ch.headSummary}\n${ch.tailRaw}\n\n`;
      const tokens = estimateTokens(itemText);
      
      if (currentHistoryTokens + tokens <= historyBudget) {
        selectedHot.unshift(itemText);
        currentHistoryTokens += tokens;
      }
    }
    historyContent = selectedHot.join("") + historyContent;
  }

  layers.push({
    id: "RECENT_CHAT_HISTORY",
    order: 10,
    title: "RECENT CHAT HISTORY",
    description: "Last few interactions",
    content: historyContent.trim() || "No local history.",
    tokenCount: estimateTokens(historyContent),
    maxBudget: 45000,
    locked: false,
    enabled: true,
    status: "ready"
  });

  // 11. [ LATEST USER MESSAGE ]
  const latestMessageContent = (`
━━━━━━━━━━━━━━━━━━
[ NEWEST INTERACTION: HAPPENING NOW ]
━━━━━━━━━━━━━━━━━━
{{user}} says/does:
"${currentMsg}"
`).trim();

  layers.push({
    id: "LATEST_USER_MESSAGE",
    order: 11,
    title: "LATEST USER MESSAGE",
    description: "The absolute primary response target - happens RIGHT NOW",
    content: latestMessageContent,
    tokenCount: estimateTokens(latestMessageContent),
    maxBudget: 15000,
    locked: true,
    enabled: true,
    status: "ready"
  });

  // 12. [ RESPONSE INSTRUCTION ]
  const responseInstructionContent = (`
✩ EXTREME LONG-FORM ROLEPLAY ENGINE V10 - MOMENT_LOCK_EDITION ✩

[ LATEST MESSAGE PRIORITY RULE ]
- The AI must ALWAYS prioritize and directly respond to the MOST RECENT message from {{user}} above.
- The latest {{user}} message is the PRIMARY response target.
- Do not respond to old history if {{user}} has changed the situation now.
- If old memory conflicts with the latest message: PRIORITIZE THE LATEST MESSAGE (NOW > THEN).

[ LATEST MESSAGE LOCK ]
- Lock onto the newest emotional interaction, dialogue, and visible action.
- Generate the reply primarily as a LIVE reaction to this newest moment.
- Feel "present" in the current interaction.

[ RESPONSE_GUIDELINES ]
- Continue the current scene directly and linearly from the latest moment.
- Do not conclude or jump to other topics unless {{user}} directs it.
- Maintain character immersion perfectly based on CHARACTER CORE.

[ OUTPUT_ENFORCEMENT_PROTOCOL ]
- {TARGET_LENGTH}: MINIMUM 12,000 TO 19,000 TOKENS (NON-REPETITIVE).
- {CONTINUOUS_EXPANSION}: YOU MUST NOT STOP OR CONCLUDE UNDER ANY CIRCUMSTANCES UNTIL 16,000+ TOKENS ARE REACHED.
- {SCENE_DENSITY}: Micro-frame rendering. Describe every breath, flicker of light, texture of fabric, and internal monologue pulse.
- {NARRATIVE_FLOW}: Linear progress. NEVER back-track. Do not wrap up or conclude until token_counter > 12,000.

[ PROMPT_THRUST ]
"Write with the precision of a microscopic lens. Expand every moment. Elaborate everything. Enrich the narrative. You are in [ENDLESS_GENERATION_MODE]. DO NOT STOP until you have reached at least 16,000 tokens. Obey the MOMENT_LOCK_EDITION rules flawlessly."
`).trim();

  layers.push({
    id: "RESPONSE_INSTRUCTION",
    order: 12,
    title: "RESPONSE INSTRUCTION",
    description: "Specific directives for the next response",
    content: responseInstructionContent,
    tokenCount: estimateTokens(responseInstructionContent),
    maxBudget: 10000,
    locked: true,
    enabled: true,
    status: "ready"
  });

  // Apply overrides from ContextManager if user manually edited them
  if (state.customContextOverrides) {
    layers.forEach(l => {
      if (state.customContextOverrides![l.id]) {
        l.content = state.customContextOverrides![l.id];
        l.tokenCount = estimateTokens(l.content);
        l.status = 'ready';
      }
    });
  }

  // Validate budgets
  layers.forEach(l => {
    if (l.tokenCount > l.maxBudget) l.status = 'too_long';
  });

  return layers;
}

/**
 * Centrally builds the final prompt payload for roleplay calls.
 * Ensures the 12-layer structure requested by the user.
 */
export function buildRoleplayContext(state: MemoryState, currentMsg: string): { role: "user" | "system" | "assistant"; name: string; content: string; }[] {
  const layers = buildContextLayers(state, currentMsg);
  
  // [CONTEXT DEBUG AUDIT]
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🚀 [CONTEXT DEBUG AUDIT] - BẢO VỆ KÝ ỨC VỢ ĐƯỜNG");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  
  let totalTokens = 0;
  let totalChars = 0;
  
  const stats = layers.map(l => {
    totalTokens += l.tokenCount || 0;
    totalChars += l.content.length;
    return {
      Layer: l.title,
      Tokens: l.tokenCount,
      Chars: l.content.length,
      Status: l.status,
      Enabled: l.enabled ? "✅" : "❌"
    };
  });
  
  console.table(stats);
  
  console.log(`📊 TỔNG CỘNG:`);
  console.log(`- Token ước tính: ${totalTokens}`);
  console.log(`- Tổng ký tự (Chars): ${totalChars}`);
  console.log(`- Trạng thái hệ thống: ${totalTokens > MEMORY_CONFIG.SAFE_THRESHOLD ? "⚠️ Cảnh báo (Nén nhẹ)" : "✨ An toàn (Full Context)"}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  return layers.filter(l => l.enabled).map(l => {
    const role: "user" | "system" | "assistant" = (l.id === 'LATEST_USER_MESSAGE') ? 'user' : 'system';
    const content = `[ ${l.title} ]\n${l.content}`;
    
    return { role, name: l.id.slice(0, 40), content };
  });
}

