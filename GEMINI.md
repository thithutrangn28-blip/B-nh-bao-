# INSTRUCTIONS FOR GEMINI / AI DEVELOPER

Bạn là AI phát triển ứng dụng này. Trước khi thực hiện bất kỳ thay đổi nào liên quan đến tính năng gọi AI, bạn **BẮT BUỘC** phải đọc file `/AGENTS.md`.

### Quy tắc quan trọng nhất:
1. **Dùng Endpoint của User**: Tuyệt đối không hardcode endpoint `generativelanguage.googleapis.com`. Hãy đọc từ `apiConfig` trong hệ thống.
2. **Không dùng SDK**: Dùng `fetch()` để tương thích với tất cả các loại Proxy (Custom Proxy, Reverse Proxy).
3. **Single Hub**: Mọi thay đổi về API phải thực hiện tại `src/utils/apiProxy.ts` để đảm bảo tính nhất quán.
4. **Bảo toàn tính năng cũ**: Khi thêm tính năng mới, không được làm hỏng logic gọi API của các tính năng đang ổn định.

Vui lòng tuân thủ để không phụ sự tin tưởng của Vợ Đường (Product Owner).
