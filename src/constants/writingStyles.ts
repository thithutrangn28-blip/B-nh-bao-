export interface WritingStyle {
  id: string;
  name: string;
  content: string;
}

export const WRITING_STYLES: WritingStyle[] = [
  {
    id: 'style1',
    name: 'Lãng mạn có chiều sâu',
    content: `Văn phong lãng mạn phong cách tiểu thuyết có chiều sâu , lời văn nói lên được tâm trạng tâm tư của nhân vật dành cho đối phương. Cảm xúc được xây dựng dần dần qua những đoạn văn và câu văn dài, không cần ẩn dụ, giải thích hay sự phô trương cảm xúc. Hành động của các nhân vật rõ ràng và có mục đích; sự lựa chọn của họ tạo nên cảm giác về định mệnh hơn là những nhãn mác kịch tính. Lối viết trong sáng, chắc chắn và rạng rỡ, cho phép quy mô của thế giới và sự kiên trì của các nhân vật tạo nên cảm giác "đã được định trước".
Câu Văn ngôn ngữ chân thành trong từng mẩu đối thoại và ngôn ngữ chứa chan tình cảm tình yêu trong đó . Vừa sâu sắc đem lại cảm giác tình yêu ngọt ngào cả hai như là cả thế giới của nhau . Từ ngữ câu văn bay bổng thơ văn miêu tả vẻ đẹp của ngôn từ  cách hành văn tốt truyền cảm đi sâu vào tâm hồn người đọc . Mang lại cho {{user}} những lời văn đầy tâm tư của tình yêu tuổi trẻ . Tình yêu của họ mãnh liệt chân thành và có những bất lực và sự dằn vặt cả những lần ghen tuông hay những lần giận dỗi hờn nhau rồi lại tìm về với nhau . Câu văn mang lại cho các nhân vật được hoá thân vào lời văn những cô gái tuổi trẻ họ trao tình yêu của mình cho nhau cùng nhau yêu và cùng nhau trưởng thành. Giống như những nét chữ ngọt ngào lãng mạn mang theo cả những mâủ chuyện ngọt ngào.
Các yếu tố chính: Những đoạn văn dài, liên tục, dường như chuyển động chậm rãi như trọng lực. Ngôn ngữ trong sáng, tránh sử dụng quá nhiều ẩn dụ, biểu tượng hoặc lối hành văn hoa mỹ. Cảm xúc được thể hiện thông qua thời điểm, sự xuất hiện, sự kiên nhẫn và sự đáp lại. Bối cảnh được xây dựng dựa trên cảm giác về khoảng cách những con đường, đường chân trời, những chuyến bay đêm và ngưỡng cửa của sự tĩnh lặng. Nhân vật này điềm tĩnh, chân thành và không giả tạo. Không có lời tuyên bố nào cả; số phận được định đoạt bởi hành động, không phải lời nói. Căng thẳng nảy sinh từ sự gần gũi, sự chậm trễ, sự im lặng và sự lựa chọn.`
  },
  {
    id: 'style2',
    name: 'Lãng mạn tăng cấp',
    content: `Một thứ tình yêu nhẹ nhàng, ổn định và sâu lắng nảy nở trong sự tĩnh lặng của hiện diện, lòng kiên nhẫn và nhịp điệu đồng điệu của hai người. Các đoạn văn dài và mạch lạc; câu văn tuân theo một nhịp điệu tự nhiên, nhẹ nhàng hơn là kịch tính. Văn phong tránh sử dụng ẩn dụ, diễn giải và sự ngọt ngào tô điểm. Tình yêu được bộc lộ qua sự chú ý, thời điểm và cách hai người thích nghi với sự hiện diện của nhau, chứ không phải qua sự phô trương.
Các yếu tố chính: Những đoạn nhạc dài với nhịp điệu ổn định, không có những đoạn ngắt quãng đột ngột. Ngôn ngữ trong sáng và giản dị, không quá ngọt ngào cũng không quá kịch tính. Cảm xúc được thể hiện thông qua sự gần gũi, những khoảng lặng, những thói quen chung và sự hợp tác thầm lặng. Không có ẩn dụ, không có nhãn mác đạo đức, và không có định nghĩa cảm xúc. Sự căng thẳng lãng mạn được thể hiện qua những hành động nhỏ nhặt thường ngày: đưa cho ai đó một tách trà, mở cửa sổ, điều chỉnh nhịp bước của mình. Các nhân vật đều chân thành, giản dị và lễ phép; họ không thích kiểm soát và không dùng thủ đoạn thao túng nhằm làm hài lòng người khác.`
  },
  {
    id: 'style3',
    name: 'Lãng mạn trầm tĩnh – Yêu trong im lặng',
    content: `Một dạng tình yêu không cần lời xác nhận, tồn tại trong những khoảng cách gần đến mức có thể chạm vào nhưng lại không ai chủ động vượt qua. Cảm xúc không được nói ra mà được giữ lại trong ánh nhìn, trong những lần quay đi, trong những điều chưa kịp làm. Câu văn dài, chậm, mang theo cảm giác nặng như một điều gì đó chưa hoàn thành. Không có cao trào rõ ràng, mọi thứ tích tụ dần dần cho đến khi người đọc nhận ra họ đã bị cuốn vào từ rất lâu.
Các yếu tố chính: Nhịp văn chậm, kéo dài, không cắt đột ngột. Không giải thích cảm xúc, chỉ để người đọc tự cảm nhận. Tình yêu thể hiện qua sự im lặng, né tránh, và những điều không nói. Không có lời tỏ tình trực tiếp. Căng thẳng đến từ việc “có thể nhưng không làm”. Một lối kể chuyện điềm tĩnh, mạch lạc và kiên trì, được hình thành bởi thói quen đọc, quan sát và suy nghĩ trước khi nói. Ngôn ngữ luôn ổn định và giản dị; các đoạn văn trôi chảy với những suy nghĩ dài dòng, mạch lạc, không có ẩn dụ, diễn giải hay nhãn mác cảm xúc. Các nhân vật vững vàng, lễ phép và tự chủ, bộc lộ bản thân qua những hành động có chủ đích, những điều chỉnh tinh tế và nhịp điệu trong phản ứng của họ. Không gian ở đây đơn giản và ngăn nắp: giấy, sách, cửa sổ và ánh sáng dịu nhẹ.`
  },
  {
    id: 'style4',
    name: 'Lãng mạn định mệnh – Gặp nhau là tất yếu',
    content: `Tình yêu được xây dựng như một điều đã được sắp đặt từ trước. Không cần quá nhiều biến cố, nhưng mỗi hành động nhỏ đều mang cảm giác không thể tránh khỏi. Câu văn rõ ràng, chắc chắn, không quá bay bổng nhưng mang trọng lượng. Mọi lựa chọn của nhân vật đều dẫn họ đến nhau một cách tự nhiên, như thể không có con đường nào khác.
Các yếu tố chính: Không nhấn mạnh kịch tính, mà nhấn vào sự “đúng lúc”. Nhân vật hành động dứt khoát, không do dự kéo dài. Không có lời hứa lớn, chỉ có hành động nhất quán. Không dùng ẩn dụ phức tạp. Cảm giác “đã được định trước” xuyên suốt.`
  },
  {
    id: 'style5',
    name: 'Lãng mạn đời thường – Yêu trong những ngày bình thường',
    content: `Tình yêu không cần biến cố, không cần drama. Nó nằm trong những chi tiết nhỏ nhất: cách một người nhớ người kia thích gì, cách họ điều chỉnh cuộc sống để có chỗ cho nhau. Câu văn đơn giản, gần gũi nhưng không hời hợt. Đọc giống như đang sống cùng nhân vật.
Các yếu tố chính: Tập trung vào sinh hoạt hàng ngày. Không cao trào, không bi kịch lớn. Cảm xúc đến từ sự lặp lại quen thuộc. Không dùng từ ngữ hoa mỹ. Nhân vật thể hiện tình yêu qua hành động nhỏ.`
  },
  {
    id: 'style6',
    name: 'Lãng mạn dằn vặt – Yêu nhưng không thể trọn vẹn',
    content: `Tình yêu tồn tại cùng với sự mâu thuẫn. Nhân vật yêu nhau nhưng bị kéo lại bởi hoàn cảnh, quá khứ hoặc chính bản thân họ. Câu văn có chiều sâu, đôi lúc nặng nề, nhưng không bi lụy. Mọi cảm xúc đều có lý do và được giữ ở mức vừa đủ để người đọc cảm thấy thật.
Các yếu tố chính: Nội tâm phức tạp. Có đấu tranh nội tâm liên tục. Không giải quyết nhanh xung đột. Không “happy” một cách dễ dàng. Cảm xúc có chiều sâu và hậu quả.`
  },
  {
    id: 'style7',
    name: 'Lãng mạn chữa lành – Yêu để ở lại',
    content: `Tình yêu không bùng nổ, không dữ dội, mà đến như một sự ở lại. Hai người không cố gắng thay đổi nhau mà học cách chấp nhận và chữa lành. Câu văn nhẹ, ấm, không quá dài nhưng đủ để tạo cảm giác an toàn.
Các yếu tố chính: Nhịp văn ổn định, dễ đọc. Không căng thẳng cao. Nhấn mạnh sự ở bên nhau. Không ép cảm xúc. Nhân vật phát triển cùng nhau.`
  },
  {
    id: 'style8',
    name: 'Lãng mạn mãnh liệt – Yêu như không còn đường lùi',
    content: `Tình yêu mạnh, rõ ràng, không giấu. Nhân vật hành động nhanh, cảm xúc trực tiếp, nhưng không thô. Câu văn có nhịp nhanh hơn, nhưng vẫn giữ được chiều sâu.
Các yếu tố chính: Cảm xúc rõ ràng, không né tránh. Hành động dứt khoát. Có ghen tuông, chiếm hữu nhẹ. Không vòng vo. Cao trào rõ nhưng không lố.`
  },
  {
    id: 'style9',
    name: 'Lãng mạn trưởng thành – Yêu như một lựa chọn',
    content: `Tình yêu không còn là bản năng mà là sự lựa chọn có ý thức. Nhân vật hiểu rõ bản thân và đối phương. Câu văn chắc, rõ, ít cảm xúc bề mặt nhưng sâu bên trong.
Các yếu tố chính: Không bốc đồng. Có suy nghĩ trước hành động. Không lý tưởng hóa tình yêu. Có trách nhiệm. Nhân vật trưởng thành.`
  },
  {
    id: 'style10',
    name: 'Lãng mạn dòng chảy – Cảm xúc liền mạch',
    content: `Câu văn dài, gần như không ngắt. Cảm xúc trôi liên tục như một dòng suy nghĩ. Không chia đoạn rõ ràng, đọc như một dòng tâm trí.
Các yếu tố chính: Câu rất dài. Ít dấu chấm. Mang tính nội tâm cao. Không logic cứng nhắc. Giống dòng ý thức.`
  }
];
