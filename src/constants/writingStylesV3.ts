export interface WritingStyle {
  id: string;
  title: string;
  description: string;
  details: string;
  tags: string[];
}

export const WRITING_STYLES: WritingStyle[] = [
  {
    id: 'lyrical',
    title: 'Văn xuôi trữ tình (Lyrical Prose)',
    description: 'Câu văn như một bài thơ kéo dài, giàu tính nhạc, ẩn dụ và nhịp điệu.',
    details: 'Văn xuôi trữ tình là phong cách viết mà câu văn vận hành như một bài thơ kéo dài. Mỗi câu được lựa chọn cẩn thận về âm thanh, nhịp điệu, hình ảnh và cảm xúc. Người viết không chỉ kể chuyện – họ ngâm ngợi câu chuyện. Ngôn ngữ giàu tính nhạc, sử dụng phép điệp, ẩn dụ và so sánh tinh tế. Cách viết chú trọng vào VẺ ĐẸP CỦA NGÔN TỪ hơn là tốc độ kể.',
    tags: ['Thơ mộng', 'Âm nhạc', 'Lãng mạn']
  },
  {
    id: 'minimalist',
    title: 'Tối giản (Minimalist)',
    description: 'Nghệ thuật viết ít nói nhiều, câu văn ngắn gọn, dứt khoát theo "lý thuyết tảng băng trôi".',
    details: 'Văn phong tối giản là nghệ thuật viết ít mà nói nhiều. Người viết loại bỏ mọi thứ không cần thiết – tính từ thừa, trạng từ rườm rà, mô tả dài dòng. Câu văn ngắn, gọn, dứt khoát. Cảm xúc được THỂ HIỆN qua hành động và đối thoại, không phải GIẢI THÍCH.',
    tags: ['Gãy gọn', 'Ẩn ý', 'Súc tích']
  },
  {
    id: 'dialogue',
    title: 'Đối thoại chủ đạo (Dialogue-Driven)',
    description: 'Câu chuyện vận hành chủ yếu qua lời thoại, hé lộ tâm lý và tình tiết qua lời nói.',
    details: 'Văn phong Dialogue-Driven là phong cách mà câu chuyện được vận hành chủ yếu qua lời thoại giữa các nhân vật. Tình tiết, tâm lý, mối quan hệ – tất cả được hé lộ qua những gì nhân vật NÓI. Mô tả cảnh và hành động được giữ tối thiểu, chỉ đủ để định vị không gian.',
    tags: ['Kịch tính', 'Sống động', 'Nhiều thoại']
  },
  {
    id: 'monologue',
    title: 'Độc thoại nội tâm (Inner Monologue)',
    description: 'Đi thẳng vào đầu nhân vật, bộc lộ mọi suy nghĩ, rung động và mâu thuẫn thầm kín.',
    details: 'Văn phong Inner Monologue đưa người đọc vào thẳng đầu nhân vật. Mỗi suy nghĩ, mỗi rung động, mỗi do dự đều được bộc lộ. Đây là phong cách của tâm lý học sâu, thường dùng cho nhân vật có nội tâm phong phú, suy tư nhiều.',
    tags: ['Nội tâm', 'Sâu sắc', 'Tâm lý']
  },
  {
    id: 'cinematic',
    title: 'Điện ảnh (Cinematic)',
    description: 'Viết như một đạo diễn đang quay phim, chú trọng góc máy, ánh sáng và hành động cụ thể.',
    details: 'Văn phong Cinematic biến trang sách thành một bộ phim. Người viết viết như đang chỉ đạo máy quay – có góc rộng, góc cận, góc trên cao, slow motion, cut nhanh. Mỗi cảnh được dàn dựng kỹ lưỡng về ánh sáng, không gian, vị trí nhân vật.',
    tags: ['Góc nhìn', 'Ánh sáng', 'Hồi hộp']
  },
  {
    id: 'sensory',
    title: 'Giàu giác quan (Sensory-Rich)',
    description: 'Kích hoạt cả 5 giác quan, biến văn bản thành trải nghiệm sống động như thật.',
    details: 'Sensory-Rich là phong cách viết mà mọi cảnh đều được kích hoạt qua 5 giác quan – thị giác, thính giác, khứu giác, vị giác, xúc giác. Người viết không chỉ tả "có một bữa ăn" mà tả mùi gia vị, tiếng dao chặt, sắc đỏ của tương ớt...',
    tags: ['Sống động', 'Thực tế', 'Chìm đắm']
  },
  {
    id: 'metaphorical',
    title: 'Ẩn dụ (Metaphorical)',
    description: 'Nghệ thuật nói A để chỉ B, nâng câu chuyện lên tầng triết lý và đa tầng nghĩa.',
    details: 'Văn phong Ẩn dụ là nghệ thuật nói A để chỉ B. Mọi sự vật, hiện tượng, hành động đều được liên tưởng đến một thứ khác mang ý nghĩa biểu tượng. Một cánh hoa rơi không chỉ là cánh hoa rơi – đó là tuổi xuân tan vỡ.',
    tags: ['Biểu tượng', 'Triết lý', 'Sâu sắc']
  }
];
