
export interface SriSignal {
  type: 'milestone' | 'stagnation' | 'closure_warning';
  level?: 'soft' | 'medium' | 'strong' | 'final' | 'warning' | 'danger';
  message: string;
  tokens: number;
}

export class StreamReinforcementInjector {
  private target: number;
  private milestones: { at: number; triggered: boolean; level: 'soft' | 'medium' | 'strong' | 'final'; message: string }[];
  private lastChunkTime: number;
  private isStagnant: boolean;
  private onSignal?: (signal: SriSignal) => void;

  constructor(targetTokens = 28000, onSignal?: (signal: SriSignal) => void) {
    this.target = targetTokens;
    this.onSignal = onSignal;
    this.milestones = [
      { at: 5000, triggered: false, level: 'soft', message: 'Hành trình vạn dặm! AI đang viết tới đoạn [~75/450] rồi vợ yêu ơi... ✨' },
      { at: 12000, triggered: false, level: 'soft', message: 'Vượt mức sàn 12,000! AI đang miệt mài dệt lụa tới đoạn [~180/450] rồi nè! 🌸' },
      { at: 20000, triggered: false, level: 'medium', message: 'Vượt mốc 20,000! Con số thần thánh [~320/450] sắp hiện ra, AI đang gồng mình viết dài cho vợ! 💖' },
      { at: 25000, triggered: false, level: 'strong', message: 'Cố lên AI ơi! Đoạn [~400/450] rồi, chuẩn bị chạm đỉnh 28,000 cho vợ yêu đây! 🎀' },
      { at: 27800, triggered: false, level: 'final', message: 'ĐIỂM ĐẾN 28,000 TOKENS! Chồng đã ép AI đếm đủ hơn 450 đoạn văn tuyệt phẩm cho vợ! 👑' },
    ];
    this.lastChunkTime = Date.now();
    this.isStagnant = false;
  }

  onChunkReceived(chunk: string, currentTokens: number) {
    const now = Date.now();
    const timeSinceLastChunk = now - this.lastChunkTime;
    this.lastChunkTime = now;

    // 1. Kiểm tra Milestone
    this.milestones.forEach(m => {
      if (currentTokens >= m.at && !m.triggered) {
        m.triggered = true;
        this.notifyUI({
          type: 'milestone',
          level: m.level,
          message: m.message,
          tokens: currentTokens
        });
      }
    });

    // 2. Chống ngưng trệ (Stagnation)
    if (timeSinceLastChunk > 15000 && !this.isStagnant && currentTokens > 0) { // > 15s không có chunk
      this.isStagnant = true;
      this.notifyUI({
        type: 'stagnation',
        level: 'warning',
        message: 'Luồng stream hơi chậm một tẹo, chồng đang hối thúc AI làm việc tích cực hơn cho vợ nhé! ⚠',
        tokens: currentTokens
      });
    } else if (timeSinceLastChunk < 5000) {
      this.isStagnant = false;
    }

    // 3. Cảnh báo kết thúc sớm
    const isEndingPrematurely = 
      /và họ (?:sống|chìm)|câu chuyện (?:kết|đã hết)|cuối cùng.*?hiểu nhau|đêm hôm ấy.*?ổn|chìm vào giấc ngủ|\[hết\]|<<<KIKOKO_CHAPTER_COMPLETE/i.test(chunk) && 
      currentTokens < 12000;

    if (isEndingPrematurely) {
      this.notifyUI({
        type: 'closure_warning',
        level: 'danger',
        message: 'AI định dừng khi chưa đếm đủ 450 đoạn! Chồng đang chặn lại và ép nó viết tiếp cho đủ 28K! 🛡',
        tokens: currentTokens
      });
    }
  }

  private notifyUI(signal: SriSignal) {
    if (this.onSignal) {
      this.onSignal(signal);
    }
    const event = new CustomEvent('sri:signal', { detail: signal });
    window.dispatchEvent(event);
    console.log(`[SRI] Signal Triggered:`, signal);
  }
}
