import { MemoryState, HotMemoryItem, MEMORY_CONFIG } from './config';
import { calculateTierTokens } from './tokenCounter';
import { WRITING_STYLES } from '../../constants/writingStylesV3';
import { buildContextLayers, buildRoleplayContext } from './contextBuilder';

/**
 * Trims a string to its tail based on a percentage of its current length
 */
function trimToTail(text: string, percentage: number): string {
  if (!text) return "";
  const charsToKeep = Math.floor(text.length * (percentage / 100));
  if (charsToKeep <= 0) return "";
  return "..." + text.slice(-charsToKeep);
}

/**
 * Assembles the messages payload for the AI API based on 12-layer narrative memory architecture.
 * Uses the centralized buildRoleplayContext for consistency.
 */
export function assembleMemoryPayload(state: MemoryState, currentMsg: string): { role: "user" | "system" | "assistant"; name?: string; content: string; }[] {
  return buildRoleplayContext(state, currentMsg);
}

/**
 * 3-Stage Auto Clean Logic to ensure context doesn't overflow 75k.
 * Targets 52k-60k range to reserve space for long outputs.
 */
export async function autoCleanMemory(state: MemoryState): Promise<{ state: MemoryState; logs: string[] }> {
  const logs: string[] = [];
  let { total } = calculateTierTokens(state);

  // Check if we already exceed the SAFE_THRESHOLD
  if (total < MEMORY_CONFIG.SAFE_THRESHOLD) {
    return { state, logs: [] };
  }

  logs.push(`⚠️ Quản lý bộ nhớ: Đã đạt ${Math.round(total)} token. Đang tối ưu hóa không gian ngữ cảnh...`);

  let currentState = { ...state };

  // STAGE 1: Prune Sliding Buffer (The most recent turns)
  // Only prune if we are still above threshold, and keep at least SLIDING_BUFFER_MAX/2
  if (total > MEMORY_CONFIG.SAFE_THRESHOLD && currentState.slidingBuffer.length > 4) {
    const originalLength = currentState.slidingBuffer.length;
    // Gradually reduce
    const newLength = Math.max(4, originalLength - 2);
    currentState.slidingBuffer = currentState.slidingBuffer.slice(-newLength);
    total = calculateTierTokens(currentState).total;
    logs.push(`- Đã tinh gọn Sliding Buffer từ ${originalLength} xuống ${newLength} lượt hội thoại.`);
  }

  if (total < MEMORY_CONFIG.SAFE_THRESHOLD) return { state: currentState, logs };

  // STAGE 2: Prune Hot Memory (Short-term context - previous chapters)
  // We want to keep more history if possible. Only trim if dangerously high.
  if (total > MEMORY_CONFIG.WARNING_THRESHOLD && currentState.hotMemory.length > 8) {
    const originalHotCount = currentState.hotMemory.length;
    const newHotCount = Math.max(8, originalHotCount - 3);
    currentState.hotMemory = currentState.hotMemory.slice(-newHotCount);
    total = calculateTierTokens(currentState).total;
    logs.push(`- Đã nén Hot Memory từ ${originalHotCount} xuống ${newHotCount} chương gần nhất.`);
  }

  if (total < MEMORY_CONFIG.SAFE_THRESHOLD) return { state: currentState, logs };

  // STAGE 3: Prune Long-Term Summaries (Disable oldest ones)
  let enabledSummaries = currentState.longTermSummaries.filter(s => s.enabled);
  if (total > MEMORY_CONFIG.SAFE_THRESHOLD && enabledSummaries.length > 3) {
    // Sort by chapters (oldest first)
    enabledSummaries.sort((a, b) => {
       const aStart = parseInt(a.chapters.split('-')[0]) || 0;
       const bStart = parseInt(b.chapters.split('-')[0]) || 0;
       return aStart - bStart;
    });

    for (const s of enabledSummaries) {
      if (total < MEMORY_CONFIG.SAFE_THRESHOLD) break;
      const tokens = (s.content.length / MEMORY_CONFIG.TOKEN_RATIO);
      s.enabled = false;
      total -= tokens;
      logs.push(`- Đã tạm ẩn bản tóm tắt chương [${s.chapters}] để tiết kiệm không gian.`);
    }
  }

  // STAGE 4: Final warning if still over threshold
  if (total > MEMORY_CONFIG.WARNING_THRESHOLD) {
     logs.push(`🔥 CẢNH BÁO: Ngữ cảnh vẫn ở mức ${Math.round(total)}. Vợ hãy cân nhắc tóm tắt bớt các chương cũ hoặc nén thủ công nha!`);
  }

  return { state: currentState, logs };
}
