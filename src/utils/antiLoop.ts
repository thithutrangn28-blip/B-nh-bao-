export interface AntiLoopResult {
  isLooping: boolean;
  loopScore: number;
  qualityTokens: number;
}

export class AntiLoopGuard {
  private historyNGrams: Set<string>;
  private n: number = 5;

  constructor(historyText: string, nStr: number = 5) {
    this.n = nStr;
    this.historyNGrams = new Set();
    this.addNGrams(historyText, this.historyNGrams);
  }

  private getWords(text: string): string[] {
    return text.toLowerCase().replace(/[^\w\s\u00C0-\u024F\u1E00-\u1EFF]/g, '').split(/\s+/).filter(Boolean);
  }

  private addNGrams(text: string, targetSet: Set<string>) {
    const words = this.getWords(text);
    for (let i = 0; i <= words.length - this.n; i++) {
      targetSet.add(words.slice(i, i + this.n).join(' '));
    }
  }

  /**
   * Tính toán số lượng token thực sự chất lượng (không bị lặp)
   */
  public evaluate(fullText: string, rawTokens: number): AntiLoopResult {
    const newWords = this.getWords(fullText);
    if (newWords.length < this.n) {
      return { isLooping: false, loopScore: 0, qualityTokens: rawTokens };
    }

    let hits = 0;
    const total = newWords.length - this.n + 1;
    const seenInSelf = new Set<string>();

    for (let i = 0; i < total; i++) {
      const gram = newWords.slice(i, i + this.n).join(' ');
      // Kiểm tra xem đoạn n-gram này đã xuất hiện trong lịch sử chưa,
      // HOẶC đã xuất hiện ở phần trước của chính đoạn text này chưa (self-loop).
      if (this.historyNGrams.has(gram) || seenInSelf.has(gram)) {
        hits++;
      } else {
        seenInSelf.add(gram);
      }
    }

    const similarity = hits / total;
    const isLooping = similarity > 0.35; // Lặp trên 35% thì báo động

    // Những token bị lặp sẽ không được tính (trừ đi)
    const validRatio = Math.max(0, 1 - similarity);
    const qualityTokens = Math.floor(rawTokens * validRatio);

    return {
      isLooping,
      loopScore: similarity,
      qualityTokens
    };
  }
}
