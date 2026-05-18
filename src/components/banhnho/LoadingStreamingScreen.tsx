import React, { useEffect, useMemo, useState } from "react";
import './LoadingStreamingScreen.css';

type LoadingMode = "waiting_first_token" | "streaming" | "completed" | "error";

type LoadingStreamingScreenProps = {
  targetTokens?: number;
  recommendedTokens?: number;
  startedAt?: number;
  receivedTokens?: number;
  mode?: LoadingMode;
  onCancel?: () => void;
};

function formatElapsed(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export default function LoadingStreamingScreen({
  targetTokens = 28000,
  recommendedTokens = 35000,
  startedAt = Date.now(),
  receivedTokens = 0,
  mode = "waiting_first_token",
  onCancel,
}: LoadingStreamingScreenProps) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const elapsedMs = now - startedAt;
  const elapsedLabel = formatElapsed(elapsedMs);

  const percent = Math.min(100, Math.round((receivedTokens / targetTokens) * 100));

  const speed = useMemo(() => {
    const seconds = Math.max(1, Math.floor(elapsedMs / 1000));
    return Math.round(receivedTokens / seconds);
  }, [elapsedMs, receivedTokens]);

  const eta = useMemo(() => {
    if (mode !== "streaming" || speed <= 0) return "--:--";
    const remaining = Math.max(0, targetTokens - receivedTokens);
    return formatElapsed((remaining / speed) * 1000);
  }, [mode, speed, targetTokens, receivedTokens]);

  const isStreaming = mode === "streaming";

  // Provide deterministic time for rendering logic
  const dateStr = new Date(startedAt).toLocaleTimeString('vi-VN', { hour12: false });

  return (
    <div className="loading-screen-wrapper">
      <div className="loading-screen">
        <header className="ls-mobile-header">
          <button className="ls-back-btn" type="button" onClick={onCancel}>
            ‹
          </button>

          <div>
            <h1>Đang tạo phản hồi</h1>
            <p>Roleplay đang được xử lý</p>
          </div>

          <button className="ls-shield-btn" type="button">
            ♡
          </button>
        </header>

        <section className="ls-stage-list">
          <div className="ls-stage-card done">
            <div className="ls-stage-number">1</div>
            <div>
              <h3>Đóng gói &amp; Sắp xếp</h3>
              <p>Hoàn tất</p>
            </div>
            <span className="icon">✓</span>
          </div>

          <div className="ls-stage-card active">
            <div className="ls-stage-number">2</div>
            <div>
              <h3>Kết nối &amp; Stream dữ liệu</h3>
              <p>
                {isStreaming
                  ? "Đang stream dữ liệu từ Model..."
                  : "Đang chờ phản hồi từ API Proxy"}
              </p>
            </div>
            {!isStreaming && <span className="ls-spinner" />}
            {isStreaming && <span className="icon" style={{color: 'var(--ls-green)', fontWeight: 900}}>✓</span>}
          </div>
        </section>

        <section className="ls-main-card">
          <h2>{isStreaming ? "Đang stream dữ liệu ♡" : "Vui lòng kiên nhẫn chờ ♡"}</h2>

          <p className="ls-desc">
            {isStreaming
              ? "Đã nhận token đầu tiên. Hệ thống đang stream phản hồi dài cho bạn."
              : "Model đang đọc ngữ cảnh, hiểu nhân vật, xử lý trí nhớ và chuẩn bị tạo phản hồi dài."}
          </p>

          <div
            className="ls-circle-progress"
            style={{
              background: `conic-gradient(var(--ls-pink) 0deg ${
                isStreaming ? Math.min(360, percent * 3.6) : 250
              }deg, #f8d8e7 ${isStreaming ? Math.min(360, percent * 3.6) : 250}deg 360deg)`,
            }}
          >
            <div className="ls-circle-inner">
              <span>{isStreaming ? "Đang tạo phản hồi" : "Đang chờ"}</span>
              <strong>{isStreaming ? receivedTokens.toLocaleString("vi-VN") : elapsedLabel}</strong>
              <small>{isStreaming ? `Mục tiêu tối thiểu: 18,000` : "Token đầu tiên"}</small>
            </div>
          </div>
        </section>

        {!isStreaming && (
          <section className="ls-commit-card">
            <h3>Hệ thống cam kết</h3>
            <p>
              Không báo lỗi 503 khi chưa có dữ liệu. Hệ thống sẽ kiên nhẫn chờ cho
              đến khi nhận được token đầu tiên từ Model.
            </p>
          </section>
        )}

        <section className="ls-policy-card">
          <h3>Chính sách kết nối ổn định</h3>
          <ul>
            <li>Giữ kết nối mở liên tục</li>
            <li>Không gửi yêu cầu trùng lặp</li>
            <li>Không báo lỗi 503 khi chờ lâu</li>
            <li>Ưu tiên stream ổn định</li>
            <li>Duy trì kết nối trong suốt quá trình</li>
            <li>Hoàn thành phản hồi dài ≥ 28.000 token</li>
          </ul>
        </section>

        <section className="ls-timeline-card">
          <h3>Quy trình đang thực hiện</h3>

          <TimelineItem label="Tiếp nhận yêu cầu" time={dateStr} state="done" />
          <TimelineItem label="Xác thực yêu cầu" time={dateStr} state="done" />
          <TimelineItem label="Gửi đến API Proxy" time={dateStr} state="done" />
          <TimelineItem
            label={isStreaming ? "Đã nhận token đầu tiên" : "Chờ token đầu tiên từ Model"}
            time={isStreaming ? "Đã xong" : "Đang chờ..."}
            state="active"
          />
          <TimelineItem
            label="Bắt đầu stream dữ liệu"
            time={isStreaming ? "Đang tiến hành..." : "Chưa bắt đầu"}
            state={isStreaming ? "active" : "pending"}
          />
        </section>

        <section className="ls-stats-card">
          <h3>{isStreaming ? "Thống kê Streaming" : "Thống kê kết nối"}</h3>

          <StatRow
            label="Trạng thái"
            value={isStreaming ? "Đang stream dữ liệu..." : "Đang chờ token đầu tiên..."}
          />
          <StatRow label="Tốc độ" value={`${speed} token/giây`} />
          <StatRow label="Token đã nhận" value={receivedTokens.toLocaleString("vi-VN")} />
          <StatRow label="Mục tiêu tối thiểu" value={`≥ ${targetTokens.toLocaleString("vi-VN")} token`} />
          <StatRow label="Mục tiêu khuyến nghị" value={`≥ ${recommendedTokens.toLocaleString("vi-VN")}+ token`} />
          <StatRow label="ETA" value={eta} />
        </section>

        <section className="ls-warning-card">
          Không đóng ứng dụng và không tắt màn hình để đảm bảo kết nối ổn định.
        </section>

        {onCancel && (
          <button className="ls-cancel-btn" type="button" onClick={onCancel}>
            Hủy
          </button>
        )}
      </div>
    </div>
  );
}

function TimelineItem({
  label,
  time,
  state,
}: {
  label: string;
  time: string;
  state: "done" | "active" | "pending";
}) {
  return (
    <div className={`ls-timeline-item ${state}`}>
      <span />
      <p>{label}</p>
      <small>{time}</small>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="ls-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
