import { MEMORY_CONFIG, MemoryState, MemoryZone } from './config';

export function countTokens(text: string): number {
  if (!text) return 0;
  // Estimate for Vietnamese as requested: 1 token ~ 3.8 chars
  return Math.ceil(text.length / 3.8);
}

export function calculateTierTokens(state: MemoryState) {
  const tiers = {
    eternalCore: countTokens(state.eternalCore),
    relationshipState: countTokens(state.relationshipState || ''),
    currentScene: countTokens(state.currentScene || ''),
    userProfileMemory: countTokens(state.userProfileMemory || ''),
    extendedMemory: countTokens(state.extendedMemory || ''),
    arcSummary: countTokens(state.arcSummary),
    eternalFacts: state.eternalFacts ? state.eternalFacts.reduce((sum, f) => sum + countTokens(f.content), 0) : 0,
    longTermSummaries: state.longTermSummaries
      ? state.longTermSummaries.filter(s => s.enabled).reduce((sum, s) => sum + countTokens(s.content), 0)
      : 0,
    hotMemory: state.hotMemory ? state.hotMemory.filter(ch => !ch.disabled).reduce((sum, ch) => sum + countTokens(ch.headSummary) + countTokens(ch.tailRaw), 0) : 0,
    slidingBuffer: state.slidingBuffer ? state.slidingBuffer.reduce((sum, m) => sum + countTokens(m.content), 0) : 0,
    systemPrompt: countTokens(state.systemPrompt),
    prompts: state.prompts ? state.prompts.filter(p => p.enabled).reduce((sum, p) => sum + countTokens(p.content), 0) : 0
  };

  const total = Object.values(tiers).reduce((a, b) => a + b, 0);
  
  return { tiers, total };
}

export function getMemoryZone(total: number): MemoryZone {
  if (total < MEMORY_CONFIG.SAFE_THRESHOLD) return 'SAFE';
  if (total < MEMORY_CONFIG.WARNING_THRESHOLD) return 'WARNING';
  if (total < MEMORY_CONFIG.DANGER_THRESHOLD) return 'DANGER';
  if (total < MEMORY_CONFIG.CRITICAL_BLOCK) return 'CRITICAL';
  return 'BLOCK';
}
