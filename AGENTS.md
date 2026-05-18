# 📜 HIẾN PHÁP API – QUY TẮC TỐI THƯỢNG CHO KIKOKO NOVEL

> **"Mạch nguồn API là trái tim của ứng dụng. Mọi tính năng tạo văn bản đều phải tuân thủ bộ luật này. Vi phạm = Code bị reject."**

## ⚖️ ĐIỀU 1: TRỤC NGUỒN DUY NHẤT (SINGLE SOURCE OF TRUTH)
- **TẤT CẢ** các tính năng (Viết truyện, Trí nhớ/Memory, Dating, Chat...) **MỌI** hành động gọi AI đều phải sử dụng chung một logic xử lý tại `src/utils/apiProxy.ts`.
- Cấm tuyệt đối việc tạo code gọi API riêng lẻ cho từng tính năng mới.

## ⚖️ ĐIỀU 2: ƯU TIÊN PROXY BÊN THỨ 3 (AGNOSTIC COMPATIBILITY)
- User sử dụng Proxy (OpenRouter, NanoGPT, Chutes, v.v.). Các Model có thể có tên tùy chỉnh (ví dụ: `gemini-3.1-pro-high`).
- **KHÔNG** được tự ý validate tên model theo hãng chính thức. Proxy gửi model gì, app gọi model đó.
- **KHÔNG** được dùng SDK của hãng (OpenAI SDK, Google Generative AI SDK, Anthropic SDK). Các SDK này thường hardcode endpoint của hãng và sẽ gây lỗi 404 khi user dùng Proxy.
- **CHỈ DÙNG** `fetch()` thuần túy đến Endpoint mà user đã thiết lập trong Settings.

## ⚖️ ĐIỀU 3: XỬ LÝ ENDPOINT & KEY LINH HOẠT
- Hỗ trợ endpoint có hoặc không có `/v1` ở cuối. Hệ thống phải tự nhận diện và nối path `/chat/completions` chính xác.
- Chấp nhận mọi định dạng Key (sk-, yL9w-, AIza-, JWT...). Không validate format key.
- Header mặc định: `Authorization: Bearer {apiKey}`.

## ⚖️ ĐIỀU 4: CHỐNG LỖI 503 & TRỐNG NỘI DUNG
- Phải có cơ chế **Retry** (thử lại) ít nhất 2 lần nếu gặp lỗi 503 (Service Unavailable) hoặc lỗi kết nối.
- Nếu API trả về nội dung rỗng (token = 0), phải báo lỗi rõ ràng và cung cấp nút "Thử lại".
- Đảm bảo dữ liệu được gửi đúng đến Proxy URL của user, không được gửi "nhầm" địa chỉ hãng.

## ⚖️ ĐIỀU 5: OUTPUT TOKEN LỚN & THÔNG SUỐT
- Luôn đặt `thinkingBudget: 0` (đối với các model có hỗ trợ) để tập trung vào output dài.
- Target Output: 12,000 - 19,000 tokens cho mỗi lần gọi (đối với viết truyện).
- Loading bar phải đồng bộ với token thực nhận, không được biến mất giữa chừng.

## ⚖️ ĐIỀU 6: KHÔNG HIỂN THỊ CODE RA UI
- Mọi dữ liệu JSON phải được parse an toàn (`try-catch`).
- Tuyệt đối không hiển thị mã code, thẻ băm, hay JSON raw cho người dùng. Chỉ hiển thị ngôn ngữ tự nhiên.

---
*Ký tên: Product Owner - Đường (Nguyễn Thị Thu Trang)*
