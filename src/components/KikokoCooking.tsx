import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, Save } from 'lucide-react';
import { loadKikokoInstagram } from '../utils/db';
import { sendMessageStream } from '../utils/apiProxy';

export const COOKING_MENU = [
  {
    category: "Nhóm Món Chiên Rán Giòn Rụm",
    items: [
      "Gà rán sốt chua ngọt", "Gà rán phủ phô mai tuyết", "Khoai tây chiên lắc phô mai", "Xúc xích bạch tuộc chiên bơ", "Phô mai que tẩm bột chiên xù",
      "Mực vòng chiên giòn", "Tôm lăn bột chiên xù", "Cá viên chiên nước mắm", "Bò viên chiên sốt cay", "Bánh gà phô mai tan chảy",
      "Nem chua rán Hà Nội", "Bánh tôm Hồ Tây", "Đùi gà chiên bơ tỏi", "Cánh gà chiên mắm đậm đà", "Khoai lang kén vừng",
      "Bánh bao chiên chấm sữa", "Chả giò hải sản mayonnaise", "Hoành thánh chiên giòn", "Chuối chiên mè đen", "Bánh xèo miền Tây tôm thịt",
      "Bánh khọt tôm sữa", "Ngô ngọt chiên bơ", "Gà viên popcorn", "Đậu hũ non xóc muối tiêu", "Nấm kim châm chiên giòn",
      "Thịt cốt lết chiên xù kiểu Nhật", "Bánh chuối chiên kiểu Thái", "Da gà chiên giòn rụm", "Xúc xích Đức chiên xù", "Tôm tẩm cốm xanh chiên"
    ]
  },
  {
    category: "Nhóm Món Nước Chữa Lành Tâm Hồn",
    items: [
      "Phở bò tái nạm gầu", "Phở gà ta lá chanh", "Bún bò Huế giò heo", "Bún riêu cua bắp bò sụn", "Bún ốc nhồi thịt chuối đậu",
      "Bún mọc sườn sụn nấm hương", "Bún cá cay Hải Phòng", "Bún chả chan Hà Nội", "Hủ tiếu Nam Vang tôm thịt", "Hủ tiếu gõ xá xíu",
      "Mì vằn thắn sủi cảo tôm tươi", "Mì Udon thịt bò Nhật Bản", "Mì Ramen nước hầm xương", "Mì cay 7 cấp độ hải sản", "Mì Quảng tôm thịt trứng cút",
      "Bánh canh cua đồng nguyên con", "Bánh canh chả cá chả lụa", "Miến lươn trộn đậm đà", "Miến gà măng mọc", "Lẩu Thái Tomyum chua cay",
      "Lẩu nấm chim câu dưỡng nhan", "Lẩu bò nhúng dấm", "Lẩu cá tầm măng chua", "Lẩu gà lá é Đà Lạt", "Súp cua óc heo trứng muối",
      "Súp gà ngô non nấm hương", "Súp hải sản nấm tuyết", "Canh rong biển thịt bò băm", "Canh chua cá lóc miền Tây", "Canh sườn non nấu sấu"
    ]
  },
  {
    category: "Nhóm Món Cơm Ấm Áp Gia Đình",
    items: [
      "Cơm tấm sườn bì chả trứng", "Cơm gà xối mỡ da giòn", "Cơm chiên dương châu", "Cơm chiên hải sản trứng muối", "Cơm rang dưa bò hạt tiêu",
      "Cơm thố xá xíu lạp xưởng", "Cơm trộn Hàn Quốc thố đá", "Cơm nắm rong biển cá ngừ", "Cơm cuộn Kimbap xúc xích", "Cơm Bento tạo hình gấu trúc",
      "Cơm cà ri xú xích bò Nhật Bản", "Cơm bò lúc lắc khoai tây", "Cơm thịt kho tàu trứng cút", "Cơm cá lóc kho tộ", "Cơm sườn non xào chua ngọt",
      "Cơm đùi gà nướng tiêu đen", "Cơm chiên trái thơm hải sản", "Cơm lam thịt heo rừng nướng", "Cơm gà xé phay trộn gỏi", "Cơm rang kim chi trứng ốp la",
      "Cơm mực rim me chua ngọt", "Cơm cá mặn gà xé", "Cơm tôm rim thịt ba chỉ", "Cơm đậu hũ Tứ Xuyên cay nồng", "Cơm ba rọi cháy cạnh mắm ruốc",
      "Cơm lươn nướng sốt Kabayaki", "Cơm thịt băm xào lá húng quế", "Cơm chiên trứng tỏi tóp mỡ", "Cơm cháy kho quẹt tôm tôm", "Cơm sen cung đình Huế"
    ]
  },
  {
    category: "Nhóm Món Xào Đậm Vị",
    items: [
      "Mì xào hải sản rau cải", "Miến xào cua bể", "Phở xào bắp bò rau cần", "Nui xào bò băm sốt cà", "Mì gói xào xức xích trứng",
      "Bò xào lúc lắc ớt chuông", "Mực xào cần tỏi cà chua", "Bạch tuộc xào cay phô mai", "Tôm xào súp lơ xanh", "Ếch xào sả ớt lá lốt",
      "Lòng non xào dưa chua", "Gà xào bắp cải phô mai Hàn Quốc", "Ba chỉ heo xào kim chi", "Ngêu xào bơ tỏi lá quế", "Ốc móng tay xào rau muống",
      "Ốc hương xào trứng muối", "Măng tây xào thịt bò", "Nấm đùi gà xào bơ tỏi", "Bánh gạo cay xào chả cá", "Lươn xào sả ớt giòn rụm",
      "Dạ dày xào hạt tiêu xanh", "Đậu cô ve xào thịt băm", "Su su xào tỏi đập dập", "Cải thìa xào nấm đông cô", "Giá hẹ xào đậu hũ huyết",
      "Mực xào sa tế cay xé lưỡi", "Mề gà xào dứa", "Hoa thiên lý xào thịt bò", "Khổ qua xào trứng", "Bắp xào tôm tép bơ hành"
    ]
  },
  {
    category: "Nhóm Món Nướng Thơm Lừng",
    items: [
      "Sườn heo nướng tảng sốt BBQ", "Ba chỉ nướng mật ong", "Bò nướng lá lốt mỡ chài", "Gà nướng muối ớt cay", "Vịt nướng chao lá mắc mật",
      "Nầm bò nướng ngũ vị", "Tôm hùm nướng phô mai", "Hàu nướng mỡ hành đậu phộng", "Bạch tuộc nướng sa tế", "Mực nướng muối ớt xanh",
      "Cá hồi nướng giấy bạc măng tây", "Cá lóc nướng trui cuộn bánh tráng", "Dê nướng tảng than hoa", "Cút nướng tiêu xanh", "Chân gà nướng mật ong",
      "Xiên que nướng thập cẩm", "Nem lụi nướng sả bọc mỡ chài", "Chả xiên nướng than hoa", "Thịt xiên nướng vỉa hè", "Bánh tráng nướng trứng xúc xích",
      "Ngô nướng mỡ hành", "Khoai lang nướng than mật", "Cà tím nướng mỡ hành tỏi", "Đậu bắp nướng chao", "Sò điệp nướng trứng cút",
      "Ốc bươu nướng tiêu xanh", "Sườn sụn nướng muối ớt", "Bò cuộn nấm kim châm nướng", "Heo quay da giòn nướng lu", "Sò huyết nướng mọi"
    ]
  },
  {
    category: "Nhóm Tráng Miệng Bánh Ngọt Coquette",
    items: [
      "Bánh dâu tây kem tươi ruy băng", "Macaron hoa hồng nhân raspberry", "Bánh Flan caramel béo ngậy", "Pudding xoài sữa thạch dừa", "Panna Cotta dâu rừng núng nính",
      "Tiramisu cốt cà phê cacao", "Bánh Crepe sầu riêng kem tươi", "Bánh Mousse chanh dây chua ngọt", "Tart trứng Bồ Đào Nha vỏ nghìn lớp", "Bông lan trứng muối sốt phô mai",
      "Bánh cuộn trà xanh đậu đỏ", "Bánh phô mai nướng cháy Basque", "Sừng trâu Croissant bơ tỏi", "Donut phủ sô cô la hạt cốm", "Mochi kem lạnh dâu tây",
      "Chè khúc bạch hạnh nhân", "Chè sương sa hạt lựu cốt dừa", "Chè bưởi đậu xanh giòn dai", "Chè trôi nước ngũ sắc nhân đậu", "Sữa chua trân châu cốt dừa",
      "Kem bơ sầu riêng Đà Lạt", "Kem Gelato dâu tây chua thanh", "Bánh Waffle rưới mật ong trái cây", "Pancake dâu tây kem sữa", "Thạch rau câu trái cây 3D",
      "Bánh su kem thiên nga trắng", "Cookie sô cô la chip nướng mềm", "Kẹo hồ lô đường phèn dâu tây", "Bánh da lợn lá dứa đậu xanh", "Kem xôi dừa hạt thốt nốt Thái Lan"
    ]
  },
  {
    category: "Nhóm Đồ Uống Trà Sữa Thơm Ngon",
    items: [
      "Trà sữa trân châu đường đen", "Trà sữa nướng kem trứng", "Trà sữa matcha đậu đỏ", "Trà đào cam sả trân châu trắng", "Trà vải hoa hồng thạch nha đam",
      "Trà dâu tây kem cheese béo", "Trà sen vàng Macchiato", "Trà ô long nhài sữa sương sáo", "Trà xoài kem cheese", "Sữa tươi trân châu đường đen",
      "Trà chanh giã tay hoa mộc", "Trà tắc xí muội mật ong", "Nước ép dưa hấu thanh mát", "Nước ép ổi hồng chanh leo", "Sinh tố bơ sữa đặc",
      "Sinh tố dâu tây việt quất", "Cà phê sữa đá pha phin", "Bạc xỉu ba tầng", "Cà phê cốt dừa Hải Phòng", "Cà phê muối kem béo",
      "Cacao nóng phủ marshmallow", "Matcha Latte đá bào", "Mojito chanh bạc hà soda", "Soda dâu tằm chua ngọt", "Nước dừa tươi tắc trân châu",
      "Sữa đậu nành lá dứa nóng", "Nước mía sầu riêng", "Sữa ngô non ấm bụng", "Trà bí đao hạt chia sương sáo", "Nước ép táo cần tây healthy"
    ]
  },
  {
    category: "Nhóm Món Ăn Vặt Lề Đường",
    items: [
      "Bánh tráng trộn bò khô trứng cút", "Bánh tráng cuốn bơ ruốc hành", "Gỏi cuốn tôm thịt chấm tương đen", "Phá lấu bò bánh mì", "Súp cua trứng bắc thảo óc heo",
      "Xôi xéo mỡ hành đỗ xanh", "Xôi mặn thập cẩm lạp xưởng", "Bánh mì xíu mại trứng muối", "Bánh mì heo quay da giòn", "Bánh mì chảo xúc xích pate",
      "Bánh bột lọc nhân tôm thịt", "Bánh nậm gói lá dong", "Bánh bèo chén tôm cháy", "Há cảo hấp xì dầu", "Xíu mại tôm thịt hấp",
      "Chân gà ngâm sả tắc cóc non", "Gân bò dầm cóc chua cay", "Trứng cút lộn xào me đậu phộng", "Trứng vịt lộn hầm ngải cứu", "Bò bía ngọt cốt dừa mè đen",
      "Kẹo bông gòn hồng mây", "Chuối nếp nướng cốt dừa đậu phộng", "Bánh đúc nóng thịt băm mộc nhĩ", "Nộm bò khô đu đủ xanh", "Gỏi xoài tôm khô chua ngọt",
      "Bánh cuốn trứng đào mắm chua ngọt", "Bánh ướt lòng gà xé phay", "Bột chiên trứng đu đủ giòn", "Nem nướng Nha Trang cuốn ram", "Xúc xích lốc xoáy chiên giòn"
    ]
  },
  {
    category: "Nhóm Món Âu Sang Trọng Tinh Tế",
    items: [
      "Bít tết bò Wagyu sốt tiêu đen", "Cá hồi áp chảo sốt chanh leo", "Mì Ý Carbonara sốt kem thịt muối", "Mì Ý sốt Pesto xanh húng quế", "Pizza hải sản phô mai kéo sợi",
      "Pizza Margherita phô mai cà chua", "Súp kem nấm Truffle nướng bánh mì", "Gan ngỗng áp chảo mứt dâu đỏ", "Gà tây nướng lò sốt việt quất", "Sườn cừu nướng lá thảo mộc",
      "Vẹm xanh sốt vang trắng bơ tỏi", "Salad cá hồi xông khói trứng cá", "Salad ức gà sốt Caesar phô mai", "Tôm hùm hấp bơ chanh tỏi", "Cua hoàng đế hấp gừng sả",
      "Hàu sống vắt chanh mù tạt", "Trứng cá tầm Caviar bánh quy", "Bò cuộn Wellington vỏ ngàn lớp", "Măng tây cuộn ba rọi xông khói", "Súp hành tây kiểu Pháp phủ phô mai",
      "Bánh mì bơ tỏi nướng phô mai", "Cơm Risotto hải sản phô mai kem", "Gà cuộn phô mai đút lò nướng", "Khay thịt nguội tổng hợp Cold Cuts", "Khoai tây nghiền sốt kem nấm",
      "Bắp cải Brussels nướng dầu ô liu", "Cá tuyết sốt Miso áp chảo", "Cồi sò điệp áp chảo sốt cam", "Thịt heo Iberico nướng than hồng", "Cua lột chiên giòn sốt trứng muối"
    ]
  },
  {
    category: "Nhóm Món Healthy Thanh Đạm Chữa Lành",
    items: [
      "Salad bơ ức gà sốt mè rang", "Salad ổi hồng tôm sú luộc", "Salad Quinoa rau củ củ dền", "Gỏi cuốn gạo lứt chay tịnh", "Bún gạo lứt trộn ức gà nướng áp chảo",
      "Cơm gạo lứt thịt băm xào rong biển", "Cháo yến mạch ức gà xé nhuyễn", "Cháo cá lóc rau đắng miền Tây", "Cháo sườn sụn ngô non ngọt thanh", "Cháo sen bát bảo nấm đông cô",
      "Súp bí đỏ sữa tươi mượt mà", "Súp lơ xanh kem tươi nhuyễn mịn", "Bánh mì đen bơ nghiền trứng chần", "Sinh tố xanh hoa quả mix rau cải xoăn", "Nước ép Detox dứa dưa chuột cần tây",
      "Sữa hạt điều Macca cỏ ngọt", "Sữa hạnh nhân hạt sen nóng", "Yến chưng táo đỏ kỷ tử đường phèn", "Chè dưỡng nhan nhựa đào tuyết yến", "Gà hầm sâm Hàn Quốc bồi bổ",
      "Canh bóng bì lợn rau củ thập cẩm", "Canh gà hầm hạt sen nấm hương", "Gà ác tiềm thuốc bắc đại bổ", "Đậu hũ non sốt nấm hương xì dầu", "Rong biển cuộn nấm kim châm áp chảo",
      "Bún đậu chay nấm đùi gà", "Gỏi nấm tuyết chay tai heo giả", "Nấm rơm kho tiêu chay đậm vị", "Đậu phụ luộc chấm muối tiêu chanh", "Khoai lang luộc mật ngọt lịm"
    ]
  }
];

const COUNTRY_MENU_DATA = [
  {
    id: 'vn',
    name: 'Việt Nam',
    flag: '🇻🇳',
    defaultImage: 'https://i.postimg.cc/85xsGkzT/dfd1b3a1ae8275de83798a73daa650bd.jpg',
    sections: [
      { 
        title: "Các món mặn Việt Nam", 
        items: ["Cá lóc kho tộ", "Thịt kho tàu trứng cút", "Gà kho gừng", "Vịt kho sả ớt", "Tôm ram thịt ba rọi", "Mực rim me chua ngọt", "Sườn non xào chua ngọt", "Cá rô phi chiên xù xù", "Bò lúc lắc khoai tây", "Đậu hũ nhồi thịt sốt cà chua", "Trứng chiên thịt băm mộc nhĩ", "Ếch xào sa tế lá lốt", "Mắm kho quẹt chấm rau củ luộc", "Cá hồi kho tiêu đen", "Chả cá Lã Vọng", "Bò nướng lá lốt", "Nem rán Hà Nội (Chả giò)", "Gà xé phay bóp gỏi hành tây", "Lươn xào lăn", "Ba khía trộn chua ngọt"] 
      },
      {
        title: "Món làm từ Thịt Heo (Pork)",
        items: ["Thịt luộc tôm chua Huế", "Ba rọi rang cháy cạnh", "Chân giò hầm thuốc bắc", "Giò thủ (giò xào)", "Thịt nướng bún chả", "Tai heo ngâm mắm chua ngọt", "Thịt băm xào hành tây", "Sườn cốt lết ram mặn", "Ruốc thịt heo (chà bông)", "Dạ dày heo xào dưa cải", "Nầm heo nướng sa tế", "Tim cật heo xào giá hẹ"]
      },
      {
        title: "Món ăn nổi tiếng mang tính biểu tượng",
        items: ["Phở bò tái nạm", "Bún chả Hà Nội", "Bò bía ngọt / mặn", "Gỏi cuốn tôm thịt chấm tương", "Bánh xèo miền Tây", "Bánh khọt Vũng Tàu", "Bánh cuốn Thanh Trì", "Mì Quảng tôm thịt", "Cao Lầu Hội An", "Bún bò Huế", "Bún đậu mắm tôm", "Cơm tấm sườn bì chả"]
      },
      {
        title: "Danh sách Healthy",
        items: ["Gỏi ngó sen tôm thịt", "Canh chua cá lóc", "Canh bí đỏ thịt băm", "Rau muống luộc dầm cà chua", "Bầu luộc chấm kho quẹt", "Bắp cải cuộn thịt hấp", "Ức gà áp chảo sốt chanh leo", "Bún gạo lứt trộn ức gà xé", "Salad bơ cà chua bi kiểu Việt", "Cháo yến mạch thịt băm", "Cá chép hấp xì dầu", "Súp lơ xanh hấp nấm hương", "Đậu hũ non sốt nấm", "Gỏi đu đủ tôm khô", "Canh rong biển đậu phụ non"]
      },
      {
        title: "Món ăn lề đường (Street Food)",
        items: ["Bánh tráng trộn", "Bánh tráng nướng (Pizza Đà Lạt)", "Cút lộn xào me", "Súp cua óc heo", "Phá lấu bò bánh mì", "Bột chiên trứng", "Xôi xéo mỡ hành", "Bánh mì chảo", "Nem chua nướng vỉa hè", "Chuối nếp nướng cốt dừa"]
      },
      {
        title: "Thực phẩm giới trẻ ưa chuộng",
        items: ["Mì cay 7 cấp độ", "Bánh mì phô mai tan chảy", "Trứng chén nướng", "Gà ủ muối hoa tiêu", "Bánh đồng xu phô mai kéo sợi", "Gà rán xốt phô mai cay", "Lạp xưởng tươi nướng đá", "Bánh tráng phơi sương muối nhuyễn"]
      },
      {
          title: "Đồ uống Việt Nam",
          items: ["Trà sữa truyền thống trân châu đen", "Trà sữa Thái xanh", "Trà sữa Thái đỏ", "Trà sữa Oolong nướng", "Trà sữa khoai môn", "Sữa tươi trân châu đường đen", "Trà sữa hoa nhài kem cheese", "Kem bơ sầu riêng", "Kem dừa Côn Đảo", "Kem xôi", "Kem chuối ép", "Kem ốc quế dâu tây", "Kem chanh dây", "Sữa chua trân châu Hạ Long", "Sữa chua nếp cẩm", "Sữa chua đánh đá cacao", "Sữa chua dẻo trái cây tươi", "Sữa chua thạch lá nếp"]
      }
    ]
  },
  {
    id: 'kr',
    name: 'Hàn Quốc',
    flag: '🇰🇷',
    defaultImage: 'https://i.postimg.cc/XqfWPd14/bd70382a8591895d6ed3dc8b1f6ad2e2.jpg',
    sections: [
      {
        title: "Món ăn Hàn Quốc nổi tiếng",
        items: ["Tteokbokki (Bánh gạo cay)", "Kimbap (Cơm cuộn rong biển)", "Bibimbap (Cơm trộn thố đá)", "Samgyeopsal (Thịt ba chỉ nướng BBQ)", "Canh kim chi đậu hũ thịt heo", "Canh rong biển (Miyeokguk)", "Gà rán sốt chua ngọt Hàn Quốc (Yangnyeom)", "Mì tương đen (Jajangmyeon)", "Mì lạnh (Naengmyeon)", "Súp chả cá (Odeng)", "Miến trộn (Japchae)", "Gà hầm sâm (Samgyetang)"]
      },
      {
        title: "Thịt Nướng & BBQ (Gogi-gui)",
        items: ["Samgyeopsal", "Moksal", "Galbi", "Bulgogi", "Chadolbaegi", "Dwaeji Galbi", "Dak Galbi", "Makchang", "Gopchang", "Daechang", "LA Galbi", "Hanwoo Gui", "Ansim", "Deungsim", "Jangeo Gui", "Jogae Gui", "Saeu Gui", "Samgyeopsal phủ phô mai nướng chảy", "Thịt vịt nướng lá kim cuộn sâm", "Dak-kkochi"]
      },
      {
        title: "Canh, Súp & Lẩu (Guk, Tang & Jjigae)",
        items: ["Kimchi Jjigae", "Doenjang Jjigae", "Sundubu Jjigae", "Samgyetang", "Seolleongtang", "Galbitang", "Yukgaejang", "Miyeok Guk", "Budae Jjigae", "Gamjatang", "Haejangguk", "Tteokguk", "Manduguk", "Maeuntang", "Gomtang", "Kkotge Tang", "Cheonggukjang", "Kongnamul Guk", "Dongtae Jjigae", "Nakji Yeonpotang"]
      },
      {
        title: "Mì & Miến (Myeon)",
        items: ["Naengmyeon", "Bibim Naengmyeon", "Jajangmyeon", "Jjamppong", "Japchae", "Kalguksu", "Sujebi", "Ramyeon", "Jjolmyeon", "Kongguksu", "Makguksu", "Bibim Guksu", "Janchi Guksu", "Milmyeon", "Rabokki", "Jjapaguri", "Mì Udon kim chi chả cá nóng hổi", "Mì xào thịt gà phủ phô mai kéo sợi", "Gimmari", "Dongchimi Guksu"]
      },
      {
          title: "Cơm, Cuộn & Bánh Gạo",
          items: ["Bibimbap", "Kimbap truyền thống", "Chamchi Kimbap", "Samgak Kimbap", "Chungmu Kimbap", "Kimchi Bokkeumbap", "Omurice", "Jumeokbap", "Dolsot Bibimbap", "Gukbap", "Kongnamul Gukbap", "Tteokbokki", "Gungjung Tteokbokki", "Rose Tteokbokki", "Cheese Tteokbokki", "Cơm nắm cá hồi nướng bơ tỏi", "Cơm chiên thịt bò băm tỏi cháy cạnh", "Jeyuk Deopbap", "Jangeo Deopbap", "Ojingeo Deopbap"]
      },
      {
          title: "Gà, Đồ Chiên & Khác",
          items: ["Yangnyeom Chicken", "Fried Chicken", "Soy Sauce Garlic Chicken", "Snow Cheese Chicken", "Padak", "Jokbal", "Bossam", "Jeyuk Bokkeum", "Tangsuyuk", "Kkanpunggi", "Dakbokkeumtang", "Andong Jjimdak", "Oven-roasted honey chicken", "Chimaek", "Wanja-jeon", "Odeng / Eomuk", "Hotdog viền khoai tây chiên", "Dakkangjeong", "Ogdol-ppyeo", "Mala Jjimdak"]
      },
      {
          title: "Hải Sản (Hae-san-mul)",
          items: ["Ganjang Gejang", "Yangnyeom Gejang", "Sannakji", "Nakji Bokkeum", "Ojingeo Bokkeum", "Haemul Pajeon", "Jjukkumi Bokkeum", "Agujjim", "Godeungeo Jorim", "Saeu-jang", "Myeongran-jeot", "Yeoneo-jang", "Hoe", "Godeungeo Gui", "Galchi Gui", "Galchi Jorim", "Tôm sú xào tỏi ớt bơ lạt", "Còi sò điệp nướng bơ tỏi", "Jeonbok Gui", "Haemul Jeongol"]
      },
      {
          title: "Bánh Mặn & Ăn Vặt Lề Đường",
          items: ["Kimchi Jeon", "Gamja Jeon", "Bindaetteok", "Gyeran-mari", "Gyeran-jjim", "So-tteok So-tteok", "Bungeoppang", "Hotteok", "Eomuk-guk", "Tteokkochi", "Gilgeori Toast", "Tornado Potato", "Gyeran-ppang", "Sundae", "Jjinppang", "Gun-goguma", "Takoyaki", "Gun-mandu", "Corn cheese", "Chả cá xoắn chiên giòn"]
      },
      {
          title: "Banchan",
          items: ["Baechu Kimchi", "Kkakdugi", "Oi Sobagi", "Dongchimi", "Pa Kimchi", "Yeolmu Kimchi", "Gat Kimchi", "Danmuji", "Sigeumchi Namul", "Kongnamul Muchim", "Gosari Namul", "Eomuk Bokkeum", "Myeolchi Bokkeum", "Ojingeo Chae Bokkeum", "Gamja Jorim", "Dubu Jorim", "Gaji Namul", "Yeon-geun Jorim", "Saesongi Beoseot Bokkeum", "Mussaengchae"]
      },
      {
          title: "Tráng Miệng & Bánh Ngọt",
          items: ["Patbingsu", "Bingsu dâu tây kem tươi", "Bingsu xoài phô mai", "Bingsu dưa lưới", "Bingsu Matcha đậu đỏ", "Injeolmi Bingsu", "Yakgwa", "Tteok", "Songpyeon", "Chapssaltteok", "Injeolmi Macaron", "Fatcaron", "Dalgona", "Cream cheese garlic bread", "Strawberry Roll Cake", "Bánh sinh nhật mini Bento", "Croffle dâu tây", "Sữa chua Hy Lạp", "Bánh Tart trứng phô mai trà xanh", "Tanghulu"]
      },
      {
          title: "Đồ Uống Hàn Quốc",
          items: ["Sikye", "Sujeonggwa", "Trà Yuja", "Trà Omija", "Oksusu Cha", "Bori Cha", "Sữa chuối Binggrae", "Sữa tươi dâu tây dầm", "Goguma Latte", "Matcha Jeju Latte", "Cà phê Dalgona", "Iced Americano", "Einspänner", "Soda đào sủi bọt thạch nha đam", "Grapefruit Ade", "Green Grape Ade", "Trà sữa trân châu đường đen cốt dừa", "Melon Cream Soda", "Rượu Soju pha Yakult", "Makgeolli"]
      }
    ]
  },
  {
    id: 'jp',
    name: 'Nhật Bản',
    flag: '🇯🇵',
    defaultImage: 'https://i.postimg.cc/MGHWGcHt/081957f4e1f018ab629f8eacbd3464cc.jpg',
    sections: [
      {
        title: "Sushi & Sashimi Tinh Hoa",
        items: [
          "Sushi cá hồi nguyên bản (Sake Nigiri)", "Sushi lươn nướng mặn ngọt (Unagi Nigiri)", "Sushi tôm ngọt (Amaebi)", "Sushi trứng cuộn (Tamago)", 
          "Sashimi cá ngừ vây xanh (Maguro)", "Sashimi bụng cá hồi béo ngậy (Sake Harasu)", "Sashimi bạch tuộc (Tako)", "Sashimi sò đỏ (Hokkigai)", 
          "Cuộn California phủ trứng cá", "Cuộn tôm tempura chiên xù", "Sushi ép khuôn cá thu ngâm dấm (Oshizushi)", "Cuộn rồng bơ lươn nướng", 
          "Cuộn cầu vồng thập cẩm cá", "Cuộn nhện cua lột chiên giòn", "Bạch tuộc tẩm wasabi sống", "Trứng ngâm tương ăn mì Ramen (Ajitsuke Tamago)",
          "Sushi cầu gai biển (Uni)", "Sushi sò điệp áp chảo"
        ]
      },
      {
        title: "Mì & Cơm Thố Nhật Bản",
        items: [
          "Mì Ramen nước hầm xương heo (Tonkotsu)", "Mì Ramen tương miso (Miso Ramen)", "Mì Ramen nước tương (Shoyu Ramen)", "Mì Udon xào hải sản", 
          "Mì Udon nước thanh cua", "Mì Soba lạnh chấm nước tương", "Mì Soba xào thịt bò", "Mì xào Yakisoba truyền thống", 
          "Cơm lươn nướng than hoa (Unadon)", "Cơm thố thịt bò hành tây (Gyudon)", "Cơm thố heo chiên xù xốt trứng (Katsudon)", "Cơm hải sản tươi sống (Kaisendon)", 
          "Cơm cà ri xốt bò hầm kiểu Nhật", "Cơm cà ri gà chiên giòn", "Cơm nắm cá ngừ mayonnaise (Onigiri)", "Cơm nắm cá hồi muối", 
          "Cơm nắm tam giác nhân trứng muối", "Cơm rang cá mặn kiểu Nhật", "Bắp bò hầm tương Nhật"
        ]
      },
      {
        title: "Món Nóng & Đặc Sản Nướng",
        items: [
          "Tempura tôm sú chiên xốp", "Tempura rau củ thập cẩm", "Thịt heo chiên xù (Tonkatsu)", "Gà chiên giòn kiểu Nhật (Karaage)", 
          "Bánh xèo Nhật Bản (Okonomiyaki)", "Bánh bạch tuộc nướng (Takoyaki)", "Trứng hấp hải sản (Chawanmushi)", "Đậu nành lông luộc muối (Edamame)", 
          "Canh tương miso rong biển", "Salad rong biển trứng cá chuồn", "Xiên gà nướng xốt Teriyaki (Yakitori)", "Xiên thịt ba chỉ cuộn măng tây nướng", 
          "Cá tuyết nướng xốt miso ngọt", "Cá sanma nướng muối nguyên con", "Bò Wagyu nướng áp chảo", "Lẩu bò Sukiyaki nhúng trứng sống", 
          "Lẩu giấy Shabu Shabu thanh đạm", "Lẩu lòng bò xốt cay (Motsunabe)", "Đậu phụ lạnh rắc cá bào (Hiyayakko)", "Cà tím nướng xốt tương miso", 
          "Gyoza áp chảo nhân thịt heo", "Súp nghêu nước trong", "Râu mực chiên giòn", "Mực nướng xốt muối ớt", "Hàu sữa nướng mỡ hành kiểu Nhật", 
          "Cá hồi áp chảo xốt Teriyaki", "Nấm đùi gà nướng giấy bạc", "Gà nướng tỏi xiên que", "Thịt thăn bò cuộn nấm kim châm", "Canh ngao Miso", 
          "Đậu hũ chiên ngập dầu xốt nấm (Agedashi Tofu)", "Cua tuyết nướng than", "Bò Kobe nướng đá muối", "Cá ngừ ngâm tương áp chảo", "Gan cá chép hấp rượu sake"
        ]
      },
      {
        title: "Tráng Miệng & Đồ Uống",
        items: [
          "Bánh gạo Mochi nhân dâu tây tươi", "Bánh gạo Mochi kem trà xanh", "Bánh cá nướng nhân đậu đỏ (Taiyaki)", "Đá bào matcha đậu đỏ (Kakigori)", 
          "Trứng cuộn nhiều lớp (Tamagoyaki)", "Khoai tây nghiền xốt Kewpie", "Bánh dango xiên que rưới mật tương ngọt", "Sữa chua nướng matcha", 
          "Pudding trứng caramel kiểu Nhật", "Bánh Dorayaki nhân đậu đỏ mềm", "Trà xanh gạo rang (Genmaicha)", "Thạch cà phê phủ kem sữa", 
          "Kem tươi vị mè đen", "Kem tươi Hokkaido nguyên bản", "Bánh quy trà xanh kẹp chocolate", "Trà sữa Houjicha trân châu", 
          "Mochi kem lạnh vị đào", "Mochi nước giọt sương (Mizu Shingen Mochi)", "Rượu Sake nung nóng", "Nước ép mận Umeboshi", 
          "Trà yuzu mật ong ấm", "Kẹo đường bọc quả mơ", "Bánh bông lan cuộn kem trà xanh matcha", "Dưa lưới hoàng gia Hokkaido cắt lát"
        ]
      }
    ]
  },
  {
    id: 'gb',
    name: 'Nước Anh',
    flag: '🇬🇧',
    defaultImage: 'https://i.postimg.cc/0jD5Wf7N/9f3810141b7f94bb49f8afdf9ef6929a.jpg',
    sections: [
      {
        title: "Món Anh Truyền Thống",
        items: [
          "Cá tuyết tẩm bột chiên và khoai tây (Fish and Chips)", "Thịt bò cuộn nấm ngàn lớp (Beef Wellington)", "Thịt nướng Chủ Nhật rưới xốt Gravy (Sunday Roast)", 
          "Bánh bột nướng vùng Yorkshire (Yorkshire Pudding)", "Bữa sáng Anh kiểu truyền thống (Full English Breakfast)", "Bánh nướng nhân thịt băm và khoai tây (Shepherd's Pie)", 
          "Bánh nướng nhân thịt bò và thận (Steak and Kidney Pie)", "Xúc xích nướng rưới xốt hành tây (Bangers and Mash)", "Gà xốt cà ri kem bơ kiểu Anh (Chicken Tikka Masala)", 
          "Xúc xích bọc bột nướng giòn (Toad in the Hole)", "Bánh cá hồi nướng kem sữa (Fish Pie)", "Đùi cừu nướng lá hương thảo", "Sườn heo nướng mật ong mù tạt",
          "Thịt bò hầm bia đen Guinness", "Cá chẽm nướng chanh bơ", "Thịt heo cuộn táo nướng lò", "Sườn bò nướng tảng rắc tiêu sọ"
        ]
      },
      {
        title: "Khai Vị & Món Nhẹ",
        items: [
          "Súp khoai tây và tỏi tây kem sữa (Leek and Potato Soup)", "Bánh mì nướng phô mai nướng chảy (Welsh Rarebit)", "Thịt lợn xông khói áp chảo (Rashers)", 
          "Bánh mì đen kẹp cá hồi xông khói", "Trứng chần xốt Hollandaise mượt mà (Eggs Benedict)", "Bánh nướng nhân bắp cải và khoai tây (Bubble and Squeak)", 
          "Dồi tiết heo nướng (Black Pudding)", "Lươn nấu đông (Jellied Eels)", "Bánh kẹp dưa chuột trà chiều (Cucumber Sandwiches)", 
          "Bánh nướng bơ tỏi và ngò rí", "Bánh kẹp thịt muối và phô mai cheddar", "Cơm xào cá hun khói và trứng luộc (Kedgeree)", 
          "Súp thịt bò và rau củ (Beef Stew)", "Súp măng tây kem tươi", "Cà chua nướng nhồi nấm hương", "Đậu nướng xốt cà chua ngọt (Baked Beans)", 
          "Khoai tây nghiền bơ sữa", "Khoai tây chiên muối tiêu", "Bánh thịt lợn cuộn bột giòn (Pork Pie)", "Bắp cải Brussels luộc bơ tỏi", 
          "Salad tôm xốt mayonnaise chanh", "Bánh nướng áp chảo (Crumpets) kẹp bơ", "Salad củ dền đỏ trộn phô mai dê", "Cá mòi nướng phết bánh mì bơ", 
          "Cháo yến mạch mặn kiểu Scotland (Porridge)", "Nấm mỡ xào bơ tỏi", "Trứng cuộn cá hồi xông khói", "Cà rốt hầm bơ đường", 
          "Hành tây chiên bột giòn (Onion Rings)", "Sandwich cá ngừ xốt mayo", "Bánh nướng nhân phô mai và hành tây", "Đậu Hà Lan xào thịt xông khói", 
          "Salad ức gà nướng xốt mù tạt mật ong", "Súp ngô kem sữa đặc", "Súp lơ trắng phủ phô mai đút lò (Cauliflower Cheese)", 
          "Khoai tây đút lò nguyên củ kẹp phô mai chà bông", "Bánh mì nướng bơ tỏi phủ phô mai", "Cá haddock hun khói", "Gà nướng nguyên con nhồi thảo mộc"
        ]
      },
      {
        title: "Tráng Miệng & Đồ Uống Anh Quốc",
        items: [
          "Bánh xốp nướng kem dâu tây (Scones)", "Bánh bông lan trứng dâu tây (Victoria Sponge Cake)", "Bánh pudding kẹo bơ dính (Sticky Toffee Pudding)", 
          "Tráng miệng trái cây xốt trứng sữa (Trifle)", "Bánh tart nhân mứt dâu đỏ (Jam Roly-Poly)", "Bánh tart trứng nướng kiểu Anh (Custard Tart)", 
          "Bánh quy bơ giòn (Shortbread)", "Bánh quy lúa mạch ngâm trà", "Bánh tart táo phủ vụn bơ (Apple Crumble)", "Kem vani phủ xốt chocolate nóng", 
          "Kẹo dẻo hương trái cây (Jelly Babies)", "Chocolate bọc bạc hà mát lạnh", "Bánh quy phủ chocolate sữa", "Kẹo xốp marshmallow kẹp bánh quy", 
          "Trà đen Earl Grey thượng hạng", "Trà sáng English Breakfast pha sữa mặn", "Bia gừng ủ lạnh (Ginger Beer)", "Nước ép táo tươi có gas (Cider)", 
          "Rượu vang nóng ủ quế hồi (Mulled Wine)", "Rượu Gin pha tonic và chanh tươi", "Sữa lắc hương dâu tây", "Cà phê kem tươi", 
          "Sô cô la nóng phủ kẹo xốp", "Nước chanh sả đá xay", "Bánh xèo cuộn mứt dâu (Pancakes)", "Bánh bao hấp nhân mứt quả (Spotted Dick)", 
          "Bánh mì chuối nướng bơ", "Bánh tart chanh vàng viền bột giòn (Lemon Tart)", "Mousse chocolate béo ngậy", "Kẹo toffee hạt điều bọc bơ", 
          "Bánh tart bơ đường nâu (Treacle Tart)", "Bánh kem việt quất (Blueberry Muffin)", "Bánh cuộn chocolate kem tươi", "Bánh hạnh nhân nhúng sô cô la", 
          "Sinh tố việt quất chuối", "Nước hoa quả ngâm bạc hà", "Trà hoa cúc mật ong nóng", "Rượu Pimm's trái cây mùa hè", "Bia Ale đen truyền thống", 
          "Cocktail Martini khô", "Cà phê đen sấy đá", "Sữa chua trái cây mọng đỏ", "Nước táo ép nguyên chất lên men"
        ]
      }
    ]
  },
  {
    id: 'ff',
    name: 'Nướng & Fast Food',
    flag: '🍔',
    defaultImage: 'https://i.postimg.cc/mD8g84nN/6e19f9f6e6e2f1f5a5a1a1a1a1a1a1a1.jpg',
    sections: [
      {
        title: "Gà Rán, Burger & Pizza",
        items: [
          "Gà rán nguyên bản lớp vỏ giòn rụm", "Gà rán phủ xốt phô mai cay", "Gà rán xốt mật ong tỏi", "Hamburger bò nướng 2 tầng phô mai", 
          "Hamburger gà giòn xốt mayonnaise", "Hamburger tôm chiên xù xốt tartar", "Hamburger nấm truffle thịt bò", 
          "Pizza hải sản viền phô mai kéo sợi", "Pizza Pepperoni xúc xích Ý", "Pizza gà nướng xốt BBQ", "Pizza dứa dăm bông kiểu Hawaii"
        ]
      },
      {
        title: "Món Nướng Đậm Vị",
        items: [
          "Xúc xích nướng than hoa", "Xúc xích phô mai lốc xoáy tẩm bột chiên", "Sườn heo nướng tảng xốt BBQ", "Ba chỉ heo nướng mật ong", 
          "Bò nướng xiên que rau củ", "Bò cuộn nấm kim châm nướng mỡ hành", "Mực khổng lồ nướng sa tế", "Bạch tuộc nướng muối ớt cay", 
          "Tôm hùm nướng bơ tỏi đút lò", "Hàu sữa nướng mỡ hành đậu phộng", "Nhum biển nướng trứng cút", "Gà nướng muối ớt da giòn", 
          "Vịt nướng chao lá mắc mật", "Chim cút nướng tiêu xanh", "Chân gà nướng mật ong sương sương", "Đùi gà nướng xốt cay 7 cấp độ", 
          "Sườn sụn nướng giả cầy", "Bò bít tết áp chảo mỡ bò", "Lòng heo nướng nghệ", "Dê nướng tảng than hồng", "Cá lóc nướng trui cuộn bánh tráng", 
          "Cá kèo nướng muối ớt", "Gà quay lu da giòn", "Dồi sụn nướng than"
        ]
      },
      {
        title: "Ăn Vặt Nhanh & Tiện Lợi",
        items: [
          "Khoai tây chiên sợi dài xóc muối", "Khoai tây chiên mặt cười", "Khoai tây múi cau lắc bột phô mai", "Gà viên popcorn chiên giòn", 
          "Phô mai que tẩm bột chiên xù", "Mực vòng chiên giòn (Calamari)", "Xúc xích Mỹ kẹp bánh mì (Hot Dog)", "Bánh kẹp thịt nướng Kebab", 
          "Tacos vỏ giòn nhân thịt bò băm Mexico", "Burrito cuộn gà nướng cơm đậu", "Khoai lang kén chiên vừng", "Nem chua rán xiên que", 
          "Bánh mì nướng muối ớt chà bông", "Cá viên chiên mắm tỏi", "Bò viên chiên chấm tương đen", "Đậu bắp nướng chao", 
          "Cà tím nướng mỡ hành", "Bắp ngô nướng mỡ hành", "Bánh tráng nướng trứng cút phô mai", "Bánh mì kẹp xúc xích pate", 
          "Thịt xiên nướng vỉa hè", "Há cảo chiên giòn", "Mề gà nướng sa tế", "Bánh xèo Nhật tẩm bột chiên giòn", "Cơm nắm chiên cá ngừ", 
          "Tôm lăn bột xù chiên bơ", "Hoành thánh chiên xốt chua ngọt", "Cánh gà chiên nước mắm tỏi ớt", "Cánh gà xóc xốt Buffalo chua cay", 
          "Bánh gà phô mai tan chảy", "Ngô chiên bơ tỏi", "Súp lơ nướng xốt bơ", "Bánh xèo miền Trung vỏ giòn", "Bánh khọt tôm mực chiên", 
          "Cơm cháy kho quẹt tôm thịt nướng", "Bánh mì que Hải Phòng nướng giòn", "Sandwich phô mai nướng chảy kẹp thịt muối", "Muffin trứng nướng xông khói", 
          "Salad bắp cải trộn xốt mayonnaise (Coleslaw)", "Salad gà chiên giòn xốt mè rang", "Salad khoai tây nghiền chiên", "Bánh bao chiên chấm sữa đặc", 
          "Bánh quẩy nóng chiên giòn", "Bánh chuối chiên vừng", "Bánh khoai lang bào chiên"
        ]
      },
      {
        title: "Tráng Miệng & Đồ Uống",
        items: [
          "Kem tươi ốc quế vani", "Sữa lắc hương chocolate đậm đặc", "Sữa lắc dâu tây kem đánh bông", "Nước ngọt có gas pha siro trái cây", 
          "Trà sữa trân châu đường đen đá viên", "Trà đào cam sả ly khổng lồ", "Trà chanh giã tay đá lạnh", "Hồng trà kem cheese mặn mặn", 
          "Trà dâu tây dầm chua ngọt", "Sinh tố bơ sữa đặc béo ngậy", "Cà phê đá xay phủ kem tươi (Frappuccino)", "Nước ép dưa hấu giải nhiệt", 
          "Trà tắc xí muội chua mặn", "Kem cuộn Thái Lan trái cây", "Kẹo hồ lô trái cây bọc đường nướng", "Churros tẩm đường quế chấm sô cô la", 
          "Bánh Waffle nướng rưới mật ong", "Kẹo bông gòn khổng lồ", "Bánh rán Doraemon nhân socola chảy", "Nước mía sầu riêng đá xay"
        ]
      }
    ]
  },
  {
    id: 'veg',
    name: 'Món Chay Chữa Lành',
    flag: '🥗',
    defaultImage: 'https://i.postimg.cc/85xsGkzT/dfd1b3a1ae8275de83798a73daa650bd.jpg',
    sections: [
      {
        title: "Đậu Hũ & Nấm Thanh Đạm",
        items: [
          "Đậu hũ non xốt nấm đông cô", "Đậu hũ chiên sả ớt", "Đậu hũ nhồi thịt chay xốt cà chua", "Canh chua chay nấm đậu bắp", 
          "Canh rong biển hạt sen", "Canh bí đỏ đậu phộng hầm mềm", "Gỏi ngó sen tôm chay tẩm mè", "Gỏi đu đủ khô bò chay chua ngọt", 
          "Salad bơ Quinoa sốt chanh leo", "Salad xà lách cà chua xốt dầu giấm", "Nấm bào ngư chiên giòn", "Nấm kim châm xào bơ chay", 
          "Nấm đùi gà kho tiêu đen", "Nấm rơm kho quẹt chay mặn ngọt", "Canh ngao Miso chay", "Đậu hũ chiên ngập dầu xốt nấm (Agedashi Tofu)", 
          "Tàu hũ ky cuộn nấm chiên giòn", "Canh khổ qua nấu đậu hũ non"
        ]
      },
      {
        title: "Cơm, Mì & Bún Chay",
        items: [
          "Bún chả giò chay giòn rụm", "Bún bò Huế chay nước nấm ngọt thanh", "Bún riêu chay tàu hũ ky", "Phở chay nấm đùi gà", 
          "Hủ tiếu chay rau củ ngọt nước", "Mì xào chay thập cẩm rau nấm", "Miến xào chay nấm mèo cà rốt", "Cơm chiên dương châu chay hạt sen", 
          "Cơm lá sen chay bọc nấm", "Cơm gạo lứt trộn nấm hương", "Bún gạo lứt trộn ức gà chay xé", "Cháo yến mạch nấm hương", 
          "Cháo đậu đỏ cốt dừa", "Cháo nấm rơm tiêu xanh", "Bún đậu chay nấm đùi gà"
        ]
      },
      {
        title: "Món Kho, Xào & Đặc Sản Chay",
        items: [
          "Mít non kho tộ đậm đà", "Chuối xanh kho mẻ chay", "Đậu đũa xào đậu hũ", "Súp lơ xanh hấp nước tương dấm", "Cải bắp xào nấm hương", 
          "Khổ qua nhồi đậu hũ hầm nước dừa", "Bắp cải cuộn thịt chay hấp xì dầu", "Măng tây xào tỏi chay", "Cà tím nướng mỡ hành chay (dầu hành)", 
          "Cà chua nhồi nấm đút lò", "Khoai tây nghiền trộn bơ hạt", "Chả giò khoai môn cuốn rế", "Há cảo chay nhân rau củ", "Bánh bao chay nhân nấm miến", 
          "Bánh cuốn chay nhân mộc nhĩ", "Bánh xèo chay nấm giá", "Bánh mì bơ tỏi chay nướng giòn", "Sandwich chay kẹp bơ bơ", "Bánh kẹp ngũ cốc chay", 
          "Đậu phộng rang muối ớt", "Hạt điều rang tỏi ớt chay", "Chả lụa chay kho tiêu", "Nem chua chay làm từ đu đủ", "Ruốc nấm hương xé sợi (Chà bông nấm)", 
          "Súp bí đỏ sữa dừa mịn màng", "Súp ngô hạt sen thanh tịnh", "Súp măng tây hạt chia", "Lẩu nấm chay thập cẩm 5 loại nấm", "Lẩu Thái chay chua cay", 
          "Lẩu chao khoai môn béo ngậy", "Bò bía chay cuốn củ sắn tương đen", "Bánh tráng cuốn bơ chay tỏi phi", "Bì cuốn chay nấm tuyết", "Gỏi mít non trộn đậu phộng", 
          "Bắp xào bơ chay mỡ hành", "Khoai lang luộc mật", "Sắn luộc cốt dừa lá dứa", "Xôi gấc hạt sen đỏ ươm", "Xôi đậu xanh vò dẻo mịn", "Xôi sầu riêng dẻo bùi", 
          "Bánh đúc lạc chấm tương bần", "Bánh nếp nhân đậu xanh hành hoa", "Bánh bèo chay nhân đậu xanh mỡ hành non", "Bánh hỏi mặt võng heo quay chay", 
          "Mì căn xào chua ngọt", "Mì căn phá lấu nước dừa", "Chả quế chay hấp lá chuối", "Đậu rồng xào tỏi chay", "Bầu luộc chấm kho quẹt chay"
        ]
      },
      {
        title: "Tráng Miệng & Giải Khát Thanh Tịnh",
        items: [
          "Chè hạt sen nhãn nhục thanh mát", "Chè đậu đen nước cốt dừa", "Chè bưởi đậu xanh sực sực", "Chè trôi nước ngũ sắc nhân đậu đỏ", 
          "Chè chuối nướng cốt dừa", "Thạch rau câu lá dứa dừa nạo", "Tàu hũ nước đường trân châu gừng ấm", "Sương sáo hạt é giải nhiệt", 
          "Mủ trôm nha đam mướp đắng", "Sữa đậu nành lá dứa nóng hổi", "Sữa hạt sen bùi béo", "Sữa hạnh nhân tự nhiên", "Nước ép táo cần tây Detox", 
          "Nước ép cà rốt cam tươi", "Nước dừa tươi tắc ngọt thanh", "Sinh tố mãng cầu sữa hạt", "Sinh tố đu đủ sữa chua chay", "Trà cúc la mã mật mía", 
          "Trà bí đao hạt chia", "Trà hoa hồng dưỡng nhan", "Bánh quy yến mạch ăn kiêng", "Kẹo dẻo mạch nha thủ công"
        ]
      }
    ]
  },
  {
    id: 'cn',
    name: 'Trung Quốc',
    flag: '🇨🇳',
    defaultImage: 'https://i.postimg.cc/x1r2VzDK/8bf48946a8a6c1c7808055ae66638ecf.jpg',
    sections: [
      {
        title: "Món ăn Trung Quốc tinh hoa",
        items: ["Vịt quay Bắc Kinh", "Há cảo tôm thịt (Dimsum)", "Tiểu long bao (Bánh bao súp)", "Đậu hũ Ma Bà Tứ Xuyên", "Mì xào Phúc Kiến", "Thịt kho Đông Pha", "Gà Cung Bảo xào đậu phộng", "Lẩu Tứ Xuyên cay tê", "Sủi cảo hấp hẹ", "Cơm chiên Dương Châu chuẩn vị", "Bánh cuốn Quảng Đông", "Chân gà xì dầu hấp tàu xì"]
      }
    ]
  },
  {
    id: 'us',
    name: 'Nước Mỹ',
    flag: '🇺🇸',
    defaultImage: 'https://i.postimg.cc/BQCsc51X/5b6ae6d1fd5c96e463ca6aa1036bbc88.jpg',
    sections: [
      {
        title: "Món ăn Âu Mỹ đặc trưng",
        items: ["Bít tết bò (Beef Steak) sốt nấm", "Hamburger bò phô mai", "Hot dog kẹp xúc xích mù tạt", "Gà tây nướng lò Lễ Tạ Ơn", "Sườn heo nướng BBQ kiểu Texas", "Macaroni and Cheese (Nui phô mai)", "Bánh táo nướng (Apple Pie)", "Khoai tây nghiền sốt Gravy", "Cánh gà Buffalo cay nồng", "Pancake rưới siro phong", "Bánh mì cuộn tôm hùm (Lobster Roll)", "Bánh vòng Donut phủ chocolate"]
      }
    ]
  }
];

interface KikokoCookingProps {
  onClose: () => void;
  apiSettings: any;
  secondaryApiSettings: any;
  currentStory: any;
  getCompletionUrl: (url: string) => string;
  updateStory: (updates: any) => void;
}

export default function KikokoCooking({ onClose, apiSettings, secondaryApiSettings, currentStory, getCompletionUrl, updateStory }: KikokoCookingProps) {
  const [activeScreen, setActiveScreen] = useState('cookingHome');
  const [profiles, setProfiles] = useState(() => {
    return Array.from({ length: 10 }, (_, i) => ({
      id: `profile_${i + 1}`,
      name: '',
      image: i % 2 === 0 ? 'https://i.postimg.cc/85xsGkzT/dfd1b3a1ae8275de83798a73daa650bd.jpg' : 'https://i.postimg.cc/XqfWPd14/bd70382a8591895d6ed3dc8b1f6ad2e2.jpg',
      money: 500000,
      orders: 12
    }));
  });
  
  const [npcList, setNpcList] = useState<any[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string>('');
  const [selectedCompanion, setSelectedCompanion] = useState<string>('');
  const [activeDish, setActiveDish] = useState<string>('');
  const [dishDetails, setDishDetails] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [completedDishes, setCompletedDishes] = useState<any[]>([]);
  const [table1Chat, setTable1Chat] = useState<any[]>([]);
  const [table2Chat, setTable2Chat] = useState<any[]>([]);
  const [userChatInput, setUserChatInput] = useState('');
  const [showBill, setShowBill] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [activeRunId, setActiveRunId] = useState<string>('');
  const [selectedCountryId, setSelectedCountryId] = useState<string>('');
  const [expandedAccordions, setExpandedAccordions] = useState<Record<string, boolean>>({});
  const [categoryImages, setCategoryImages] = useState<Record<string, string[]>>(() => {
    if (currentStory.categoryImages) return currentStory.categoryImages;
    const initial: Record<string, string[]> = {};
    COUNTRY_MENU_DATA.forEach(c => {
      initial[c.id] = [c.defaultImage];
    });
    return initial;
  });
  const [currentImageIndices, setCurrentImageIndices] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    COUNTRY_MENU_DATA.forEach(c => {
      initial[c.id] = 0;
    });
    return initial;
  });

  const [globalBg, setGlobalBg] = useState(() => {
    return currentStory.cookingGlobalBg || 'https://i.postimg.cc/85xsGkzT/dfd1b3a1ae8275de83798a73daa650bd.jpg';
  });

  // Biến thể cho hiệu ứng lật 3D carousel
  const countryGalleryVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
      rotateY: direction > 0 ? 45 : -45,
      scale: 0.8,
      z: -200
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      rotateY: 0,
      scale: 1,
      z: 0
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 300 : -300,
      opacity: 0,
      rotateY: direction < 0 ? 45 : -45,
      scale: 0.8,
      z: -200
    })
  };

  const [[page, direction], setPage] = useState([0, 0]);

  const paginate = (countryId: string, newDirection: number) => {
    const images = categoryImages[countryId] || [];
    if (images.length <= 1) return;
    
    setPage([page + newDirection, newDirection]);
    setCurrentImageIndices(prev => {
      const currentIndex = prev[countryId] || 0;
      let nextIndex = currentIndex + newDirection;
      
      // Loop around
      if (nextIndex >= images.length) nextIndex = 0;
      if (nextIndex < 0) nextIndex = images.length - 1;
      
      return { ...prev, [countryId]: nextIndex };
    });
  };

  const handleGlobalBgChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const newBg = event.target!.result as string;
          setGlobalBg(newBg);
          updateStory({ ...currentStory, cookingGlobalBg: newBg });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCategoryImageChange = (e: React.ChangeEvent<HTMLInputElement>, countryId: string) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const newImages = [...(categoryImages[countryId] || [])];
          newImages.push(event.target!.result as string);
          const updatedCatImages = { ...categoryImages, [countryId]: newImages };
          setCategoryImages(updatedCatImages);
          // Tự động chuyển đến ảnh vừa tải lên
          setCurrentImageIndices(prev => ({ ...prev, [countryId]: newImages.length - 1 }));
          saveState(profiles, completedDishes, updatedCatImages);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const [topSelectedNpc, setTopSelectedNpc] = useState<any>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Load NPCs from Instagram or story
    const loadNPCs = async () => {
      const data = await loadKikokoInstagram(currentStory.id);
      let loadedChars: any[] = [];
      if (data && data.profiles) {
        // Lấy tất cả nhân vật trong bộ truyện (không giới hạn chỉ type = 'npc')
        loadedChars = [...data.profiles];
      }
      
      // Đảm bảo nhân vật chính (Bot) và Người chơi (User) luôn nằm trong danh sách
      const existingNames = loadedChars.map((c: any) => c.name);
      
      if (currentStory.botChar && !existingNames.includes(currentStory.botChar)) {
        loadedChars.unshift({
          id: 'bot_char_main',
          name: currentStory.botChar,
          type: 'bot',
          avatar: 'https://i.postimg.cc/85xsGkzT/dfd1b3a1ae8275de83798a73daa650bd.jpg',
          traits: currentStory.charDescription || 'Nhân vật chính của câu chuyện',
          memory: currentStory.characterMemory || '',
          role: 'Nhân vật chính (Bot)',
          job: 'Theo cốt truyện'
        });
      }

      if (currentStory.userChar && !existingNames.includes(currentStory.userChar)) {
        loadedChars.unshift({
          id: 'user_char_main',
          name: currentStory.userChar,
          type: 'user',
          avatar: 'https://i.postimg.cc/XqfWPd14/bd70382a8591895d6ed3dc8b1f6ad2e2.jpg',
          traits: currentStory.userDescription || 'Người dùng đại diện',
          memory: currentStory.memory || '',
          role: 'Người chơi (User)',
          job: 'Theo cốt truyện'
        });
      }

      setNpcList(loadedChars);
      
      // Update the profiles list automatically to inject the bot/user traits if they weren't in memory
      if (!currentStory.cookingProfiles || currentStory.cookingProfiles.length === 0) {
         setProfiles(loadedChars);
      } else {
         // Merge logic: ensure user and bot have their updated traits inserted
         const mergedProfiles = [...currentStory.cookingProfiles];
         loadedChars.forEach(lc => {
             if (lc.type === 'bot' || lc.type === 'user') {
                 const idx = mergedProfiles.findIndex(mp => mp.name === lc.name);
                 if (idx === -1) {
                     mergedProfiles.push(lc);
                 } else {
                     mergedProfiles[idx] = { ...mergedProfiles[idx], traits: lc.traits, memory: lc.memory };
                 }
             }
         });
         setProfiles(mergedProfiles);
      }
    };
    loadNPCs();
    
    if (currentStory.cookingProfiles) {
      setProfiles(currentStory.cookingProfiles);
    }
    if (currentStory.cookingDishes) {
      setCompletedDishes(currentStory.cookingDishes);
    }
  }, [currentStory.id]);

  useEffect(() => {
    // Auto select first NPC if list loads and none selected
    if (npcList.length > 0 && !topSelectedNpc) {
      setTopSelectedNpc(npcList[0]);
    }
  }, [npcList, topSelectedNpc]);

  const saveState = (updatedProfiles = profiles, updatedDishes = completedDishes, updatedCatImages = categoryImages) => {
    updateStory({
      ...currentStory,
      cookingProfiles: updatedProfiles,
      cookingDishes: updatedDishes,
      categoryImages: updatedCatImages
    });
  };

  const handleProfileImageChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const newProfiles = [...profiles];
        newProfiles[index].image = e.target?.result as string;
        setProfiles(newProfiles);
        saveState(newProfiles, completedDishes);
      };
      reader.readAsDataURL(file);
    }
  };

  const robustParseJSON = (text: string) => {
    if (!text || typeof text !== 'string') return null;
    try {
      let jsonStr = text.replace(/```json\s*|\s*```/g, '').trim();
      const firstCurly = jsonStr.indexOf('{');
      const firstBracket = jsonStr.indexOf('[');
      let startIndex = -1;
      let isObject = false;

      if (firstCurly !== -1 && (firstBracket === -1 || firstCurly < firstBracket)) {
        startIndex = firstCurly;
        isObject = true;
      } else if (firstBracket !== -1) {
        startIndex = firstBracket;
        isObject = false;
      }
      
      if (startIndex !== -1) {
        const lastIndex = isObject ? jsonStr.lastIndexOf('}') : jsonStr.lastIndexOf(']');
        if (lastIndex !== -1 && lastIndex >= startIndex) {
          jsonStr = jsonStr.substring(startIndex, lastIndex + 1);
        }
      }
      
      try {
        return JSON.parse(jsonStr);
      } catch {
        const fixedStr = jsonStr.replace(/,\s*([}\]])/g, '$1');
        return JSON.parse(fixedStr);
      }
    } catch (e) {
      console.warn("Robust parse failed, returning null", e);
      return null;
    }
  };

  const callAPI = async (systemPrompt: string, userPrompt: string, isJson: boolean = true, customMaxTokens: number = 8000) => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();

    const apiToUse = secondaryApiSettings.enabled && secondaryApiSettings.proxyEndpoint ? secondaryApiSettings : apiSettings;
    
    if (!apiToUse.apiKey || !apiToUse.proxyEndpoint) {
      alert("Vui lòng cấu hình API Key và Proxy Endpoint (Custom Endpoint) trong cài đặt.");
      setIsGenerating(false);
      return null;
    }

    setStreamingContent('');
    setCookingLoadingPercentage(0);
    setIsGenerating(true);

    try {
      let fullContent = '';
      const messages = [
        { role: 'system' as const, content: systemPrompt },
        { role: 'user' as const, content: userPrompt }
      ];

      for await (const chunk of sendMessageStream(apiToUse, messages, undefined, abortControllerRef.current.signal)) {
         if (chunk.text) {
           fullContent += chunk.text;
           setStreamingContent(prev => prev + chunk.text);
           
           // Giả lập tiến trình
           setCookingLoadingPercentage(prev => {
             if (prev < 99) return prev + 0.1;
             return 99.9;
           });
         }
      }

      setCookingLoadingPercentage(100);
      setIsGenerating(false);
      return fullContent;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log("Cooking API Request aborted");
      } else {
        console.error("Cooking API error:", error);
      }
      setIsGenerating(false);
      return null;
    }
  };

  const [cookingSimulateTime, setCookingSimulateTime] = useState<number>(0);
  const [cookingLoadingPercentage, setCookingLoadingPercentage] = useState<number>(0);
  const cookingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Helper to get formatted context
  const getStoryContext = () => {
    if (!currentStory) return '';
    const memory = currentStory.useSmartMemory ? `
[SMART MEMORY NGỮ CẢNH]
- Tóm tắt cốt truyện: ${currentStory.progressSummary || 'Trống'}
- Tình huống hiện tại: ${currentStory.situationTracking || 'Trống'}
- Chi tiết chương mới nhất: ${currentStory.currentChapterInfo || 'Trống'}
` : '';

    const worldState = currentStory.worldState;
    const worldContext = worldState ? `
[THÔNG TIN THỜI TIẾT & THỜI GIAN]
- Thời gian: ${worldState.time}
- Ngày tháng: ${worldState.date}
- Thời tiết: ${worldState.weather}
- Nhiệt độ: ${worldState.temperature}
- Mùa: ${worldState.season}
` : '';

    // Lấy 3 chương gần nhất để đưa vào ngữ cảnh đầy đủ
    const recentChapters = currentStory.chapters?.slice(-3) || [];
    const recentChaptersContext = recentChapters.map((ch: any) => `[${ch.title}]\n${ch.content}`).join('\n\n');
    
    return `
[THIẾT LẬP CÂU CHUYỆN HIỆN TẠI]
- Cốt truyện chính: ${currentStory.plot}
- Ký ức nhân vật / Memory: ${currentStory.memory || 'Không có'}
- Quốc tịch / Bối cảnh: ${currentStory.nationality}
- Đặc điểm Bot (${currentStory.botChar}): ${currentStory.charDescription}
- Đặc điểm User (${currentStory.userChar}): ${currentStory.userDescription}
- Mối quan hệ hiện tại: ${currentStory.loveProgress}
${worldContext}
${memory}

[NỘI DUNG 3 CHƯƠNG GẦN NHẤT]
${recentChaptersContext}
`;
  };

  const getProfileContext = (cookName: string) => {
    const activeProfile: any = profiles.find(p => p.name === cookName);
    if (!activeProfile) return '';
    return `
[HỒ SƠ NHÂN VẬT NẤU ĂN DÀNH CHO ${cookName}]
- Vai trò: ${activeProfile.role || 'Không rõ'}
- Nghề nghiệp / Sở thích: ${activeProfile.job || 'Không rõ'}
- Tính cách & Ngoại hình: ${activeProfile.traits || 'Không rõ'}
- Tiểu sử / Ghi nhớ: ${activeProfile.memory || 'Không rõ'}
`;
  };

  const handleStartCookingSimulate = async (createNew: boolean = false) => {
    setActiveScreen('cookingSimulateScreen');
    
    // Nếu món ăn đã có "simulationRuns" (lịch sử nấu) rồi và không yêu cầu tạo mới thì load tab cuối cùng
    if (!createNew && dishDetails?.simulationRuns && dishDetails.simulationRuns.length > 0) {
      const latestRun = dishDetails.simulationRuns[dishDetails.simulationRuns.length - 1];
      setActiveRunId(latestRun.id);
      setStreamingContent(latestRun.story);
      setCookingSimulateTime(0);
      return;
    }
    
    // Nếu chỉ có simulationStory (bản cũ), chuyển nó thành dạng array
    let currentRuns: any[] = dishDetails?.simulationRuns || [];
    if (!currentRuns.length && dishDetails?.simulationStory) {
       currentRuns = [{
         id: Date.now().toString() + "_old",
         label: "Lần nấu 1",
         story: dishDetails.simulationStory,
         timestamp: Date.now()
       }];
    }

    if (!createNew && currentRuns.length > 0) {
      const latestRun = currentRuns[currentRuns.length - 1];
      setActiveRunId(latestRun.id);
      setStreamingContent(latestRun.story);
      setCookingSimulateTime(0);
      return;
    }

    const newRunId = Date.now().toString();
    setActiveRunId(newRunId);
    
    // Đặt bộ đếm giả lập, ví dụ nấu mất 5 phút
    setCookingSimulateTime(300); 
    if (cookingTimerRef.current) clearInterval(cookingTimerRef.current);
    cookingTimerRef.current = setInterval(() => {
      setCookingSimulateTime(prev => {
        if (prev <= 1) {
          clearInterval(cookingTimerRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const activeProfile = profiles.find(p => p.id === activeProfileId);
    const cookName = topSelectedNpc?.name || activeProfile?.name || 'Đầu bếp';
    
    const context = getStoryContext();
    const profileContext = getProfileContext(cookName);

    const sysPrompt = `[LỆNH HỆ THỐNG CAO CẤP]
Bạn là một nhà văn miêu tả ẩm thực đỉnh cao trong game Kikoko. 

[BỘ NHỚ THIẾT LẬP CỐT TRUYỆN]
${context}

[HỒ SƠ NHÂN VẬT THỰC HIỆN]
${profileContext}

[CÔNG THỨC MÓN ĂN - TÀI LIỆU THAM KHẢO]
Món: ${activeDish}
Công thức: ${dishDetails?.stepByStep || 'Không rõ'}

[NHIỆM VỤ DÀNH RIÊNG CHO BẠN]
Viết một chương tiểu thuyết khổng lồ miêu tả CỰC KỲ CHI TIẾT TỪNG CÔNG ĐOẠN, TỪNG BƯỚC MỘT quá trình nhân vật '${cookName}' nấu món '${activeDish}'.

YÊU CẦU QUAN TRỌNG NHẤT (MỤC TIÊU DÀI 19.000 TOKENS):
- Nhân vật ${cookName} phải hành động, suy nghĩ và nói chuyện ĐÚNG VỚI TÍNH CÁCH trong [HỒ SƠ NHÂN VẬT]. Tuyệt đối không được chung chung ngẫu nhiên.
- Quá trình nấu ăn phải bị chi phối bởi [THIẾT LẬP CÂU CHUYỆN HIỆN TẠI] gần đây nhất. Ví dụ: Nếu trong diễn biến gần nhất họ đang buồn, họ sẽ xắt thịt mạnh tay hơn hoặc khóc.
- MỖI CÔNG ĐOẠN nấu đều cần được khai triển cực kỳ chi tiết thành câu chuyện.
- Trình bày lôi cuốn, chú trọng đến âm thanh (xèo xèo, lạch cạch), độ nóng lạnh, mô tả màu sắc mướt mắt, và mùi hương ngào ngạt.
- Kết cấu như một câu chuyện dài thu hút, KHÔNG ĐƯỢC TÓM TẮT.`;

    const userPrompt = `Bắt đầu quá trình nấu món ${activeDish} ngay bây giờ. Hãy chia làm các đợt rõ ràng và miêu tả thật chi tiết từng hành động của ${cookName} dựa trên thiết lập tính cách và hoàn cảnh cốt truyện hiện tại.`;

    const generatedStory = await callAPI(sysPrompt, userPrompt, false, 12000); // isJson is false. Use massive 12000 token limit
    
    // Lưu lại vào DB để không bị xài lại tốn Token nếu bấm vô xem lần nữa
    if (generatedStory && dishDetails) {
      const newRun = {
         id: newRunId,
         label: `Lần nấu ${currentRuns.length + 1}`,
         story: generatedStory,
         timestamp: Date.now()
      };
      const updatedRuns = [...currentRuns, newRun];
      const updatedDish = { ...dishDetails, simulationRuns: updatedRuns, simulationStory: generatedStory }; // keep simulationStory compat
      setDishDetails(updatedDish);
      const newDishes = completedDishes.map(d => d.id === updatedDish.id ? updatedDish : d);
      setCompletedDishes(newDishes);
      saveState(profiles, newDishes);
    }
    
    if (cookingTimerRef.current) {
      clearInterval(cookingTimerRef.current);
      setCookingSimulateTime(0);
    }
  };

  const handleCookDish = async () => {
    setActiveScreen('dishDetailScreen');
    setDishDetails(null);
    const activeProfile = profiles.find(p => p.id === activeProfileId);
    const cookName = topSelectedNpc?.name || activeProfile?.name || 'Vô Danh';
    
    const context = getStoryContext();
    const profileContext = getProfileContext(cookName);

    const sysPrompt = `[LỆNH HỆ THỐNG CAO CẤP]
Bạn là một chuyên gia ẩm thực thực tế ảo trong game Kikoko. 

[BỘ NHỚ THIẾT LẬP CỐT TRUYỆN]
${context}

[HỒ SƠ NHÂN VẬT ĐẦU BẾP]
${profileContext}
Companion: ${selectedCompanion || 'Không có (Tự nấu)'}.

[NHIỆM VỤ DÀNH RIÊNG CHO BẠN]
Viết thông tin chi tiết về món ăn sắp nấu do nhân vật '${cookName}' thực hiện.
Thông tin phải được viết theo góc nhìn, tính cách và hoàn cảnh thực tế của nhân vật trong truyện.

TRẢ VỀ DUY NHẤT ĐỊNH DẠNG JSON CHUẨN VỚI CÁC TRƯỜNG SAU (KHÔNG VĂN BẢN THỪA):
{
  "recipe": "Công thức nấu chi tiết",
  "ingredients": "Những thực phẩm cần mua, Đồ cần có để hoàn thành, Nguyên liệu gì?",
  "time": "Thời gian hoàn thành",
  "stepByStep": "Hướng dẫn từng bước một (Cực kỳ chi tiết, tối thiểu 2500 ký tự)",
  "origin": "Giới thiệu xuất xứ món này? Nguồn gốc? Quy trình tạo ra món này",
  "sideDishes": "Món này ăn kèm với cái gì thì tăng thêm độ ngon",
  "reason": "Tại sao bạn lại chọn món này để nấu ? Bạn phải giải thích theo TÍNH CÁCH NHÂN VẬT của bạn và THEO CỐT TRUYỆN HIỆN TẠI (tối thiểu 2500 ký tự)",
  "inviteList": "Bạn muốn mời ai ăn thử món này? (Lấy danh sách từ Cốt truyện)",
  "whyKnow": "Tại sao bạn biết nấu món này? (Phải gắn liền với nghề nghiệp/lý lịch của bạn)",
  "score": "Bạn tự chấm xuất sắc không, mấy điểm?",
  "bowlsOfRice": "Bạn nghĩ bạn sẽ ăn được mấy bát cơm và tại sao lại nghĩ vậy?",
  "price": "Giá bán kinh doanh bao nhiêu (Tiền theo quốc tịch cư trú của nhân vật)"
}`;

    const userPrompt = `Hãy nấu món: ${activeDish}. Nhân vật đang nấu: ${cookName}. Nhớ tuân theo tính cách hồ sơ và ngữ cảnh truyện hiện tại.`;

    const rawResponse = await callAPI(sysPrompt, userPrompt);
    if (rawResponse) {
      const parsed = robustParseJSON(rawResponse);
      if (parsed) {
        const fullDish = { ...parsed, name: activeDish, cooker: cookName, id: Date.now().toString() };
        setDishDetails(fullDish);
        const newDishes = [...completedDishes, fullDish];
        setCompletedDishes(newDishes);
        saveState(profiles, newDishes);
      }
    }
  };

  const handleTable1Chat = async () => {
    if (!userChatInput.trim() || isGenerating) return;
    
    const newChat = [...table1Chat, { sender: 'user', text: userChatInput }];
    setTable1Chat(newChat);
    setUserChatInput('');
    
    const activeProfile = profiles.find(p => p.id === activeProfileId);
    const cookName = topSelectedNpc?.name || activeProfile?.name || 'Chủ quán';
    const context = newChat.map(c => `${c.sender === 'user' ? 'Khách' : cookName}: ${c.text}`).join('\n');
    
    const sysPrompt = `[LỆNH HỆ THỐNG CAO CẤP]
Bạn đóng vai ${cookName}, đang phục vụ thực khách món ${activeDish}. Giọng điệu hoàn toàn phải dựa trên tính cách cốt truyện của bạn trong Kikoko.

[NHIỆM VỤ DÀNH RIÊNG CHO BẠN]
Trò chuyện và phản hồi lại người khách về món ăn bạn vừa làm.
Khi phản hồi khách:
1. Hãy hướng dẫn cách ăn món này sao cho ngon nhất.
2. Trò chuyện thật sâu sắc, chi tiết và sinh động về nguyên liệu, cảm xúc nấu ăn (phản hồi cực kỳ dài, chi tiết hàng ngàn ký tự).

TRẢ VỀ DUY NHẤT ĐỊNH DẠNG JSON CHUẨN (KHÔNG VĂN BẢN THỪA):
{"reply": "Nội dung phản hồi siêu dài của chủ quán..."}`;

    const rawResponse = await callAPI(sysPrompt, `Lịch sử cuộc trò chuyện:\n${context}\nKhách vừa nói: "${userChatInput}". Trả lời lại người khách:`);
    if (rawResponse) {
      const parsed = robustParseJSON(rawResponse);
      if (parsed && parsed.reply) {
        setTable1Chat([...newChat, { sender: 'npc', text: parsed.reply }]);
      }
    }
  };

  const handleTable2Chat = async () => {
    if (isGenerating) return;
    
    const sysPrompt = `[LỆNH HỆ THỐNG CAO CẤP]
Bạn đóng vai hệ thống sinh ra hội thoại của một bàn lớn gồm 15 NPC đang xì xào bàn tán về quán ăn, không khí, và món ăn họ vừa gọi. Mỗi người 1 vẻ, 1 tính cách.

[NHIỆM VỤ DÀNH RIÊNG CHO BẠN]
Hãy gọi 10-15 NPC vào bình luận ngẫu nhiên về phần thiết kế và món ăn. Trả lời dưới dạng JSON array chuẩn.

TRẢ VỀ DUY NHẤT ĐỊNH DẠNG JSON CHUẨN (KHÔNG VĂN BẢN THỪA):
{"messages": [{"author": "Tên NPC", "text": "Câu nói"}]}`;

    const rawResponse = await callAPI(sysPrompt, `Hãy gọi 10-15 NPC vào bình luận ngẫu nhiên về món ăn và bàn luận cuộc sống.`);
    if (rawResponse) {
      const parsed = robustParseJSON(rawResponse);
      if (parsed && parsed.messages) {
        setTable2Chat(parsed.messages);
      }
    }
  };

  const activeProfileData = profiles.find(p => p.id === activeProfileId);
  const currentCookName = topSelectedNpc?.name || activeProfileData?.name || 'Đầu bếp bí ẩn';

  return (
    <div className="fixed inset-0 z-[100] flex justify-center bg-black/60 uppercase-tags-removal-boundary">
      <div className="w-full sm:max-w-[390px] h-[100dvh] bg-[#FFF0F5] relative shadow-2xl flex flex-col">
        
        {/* CSS from user */}
        <style>{`
          .appFullScreen { width: 100%; height: 100%; position: relative; overflow-y: auto; overflow-x: hidden; color: #5C4B51; font-family: 'Nunito', 'Quicksand', sans-serif;}
          .activeScreen { 
            display: block; 
            animation: fadeIn 0.4s ease-out; 
            min-height: 100%; 
            width: 100%;
            background: rgba(255, 245, 251, 0.4);
            padding: 20px 0;
            position: relative;
            z-index: 2;
          }
          .hiddenScreen { display: none; }
          @keyframes fadeIn { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }
          
          .glassBox {
            background: rgba(255, 255, 255, 0.2);
            border-top: 1px solid rgba(255, 255, 255, 0.4);
            border-bottom: 1px solid rgba(255, 255, 255, 0.4);
            padding: 20px 15px;
            box-shadow: 0 4px 15px rgba(249, 198, 212, 0.05);
            margin-bottom: 20px;
            width: 100%;
          }
          .titlePink { color: #D48E9E; text-align: center; margin-bottom: 15px; font-size: 20px; font-weight: bold;}
          .textCenter { text-align: center; }
          
          .btnGo, .btnMain, .btnApi, .btnSmall {
            background: linear-gradient(135deg, #F9C6D4, #F3A4B8);
            color: white; border: none; border-radius: 12px;
            padding: 12px; font-weight: bold; width: 100%;
            cursor: pointer; margin-top: 10px;
            box-shadow: 0 4px 12px rgba(243, 164, 184, 0.4);
            transition: transform 0.2s;
          }
          .btnGo:active, .btnApi:active { transform: scale(0.95); }
          .btnSmall { width: auto; padding: 8px 15px; font-size: 12px; margin: 5px; }
          
          .cuteInput, .cuteSelect {
            width: 100%; padding: 12px;
            border: 2px solid #F9C6D4; border-radius: 12px;
            background: rgba(255,255,255,0.9);
            color: #5C4B51; font-family: inherit; margin-top: 10px;
            outline: none;
          }
          
          .billOverlay {
            position: absolute; inset: 0; background: rgba(0,0,0,0.3);
            z-index: 999;
            display: flex; justify-content: center; align-items: center;
          }
          .billReceipt {
            background: #FFF; width: 85%; max-width: 300px;
            padding: 25px 20px; border-radius: 8px;
            font-family: 'Courier New', Courier, monospace;
            color: #333; box-shadow: 0 15px 40px rgba(0,0,0,0.2);
            background-image: radial-gradient(circle at top, transparent 4px, #FFF 5px), radial-gradient(circle at bottom, transparent 4px, #FFF 5px);
            background-size: 10px 100%; background-repeat: repeat-x;
          }
          .billTitle { text-align: center; font-size: 18px; font-weight: bold; margin-bottom: 10px; }
          .billDashed { border-bottom: 1.5px dashed #aaa; margin: 10px 0; }
          .billItem { display: flex; justify-content: space-between; font-size: 14px; margin: 5px 0;}
          .billTotal { text-align: right; font-size: 16px; font-weight: bold; margin-top: 10px;}
          .billThanks { text-align: center; font-size: 12px; font-style: italic; margin-top: 15px; color: #666;}
          
          .kitchenHeader { display: flex; justify-content: space-between; align-items: center; font-size: 12px; font-weight: bold;}
          .stats span { display: block; margin-bottom: 5px; color: #D48E9E;}
          .btnHeart { background: #FFB6C1; border: none; padding: 8px 12px; border-radius: 20px; color: white; cursor: pointer; box-shadow: 0 4px 10px rgba(255, 182, 193, 0.5); font-weight: bold;}
          
          .menuItem { background: #FFF; padding: 15px; border-radius: 12px; border: 1px solid #F9C6D4; font-weight: bold; cursor: pointer; margin-top: 10px; color: #D48E9E;}
          
          .largeHorizontalScroll {
            display: flex; overflow-x: auto; gap: 30px; padding: 20px 20px 40px 20px;
            scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch;
          }
          .largeHorizontalScroll::-webkit-scrollbar { display: none; }
          
          .largeProfileCard {
            min-width: 85vw; height: 720px; scroll-snap-align: center;
            display: flex; flex-direction: column; padding: 25px;
            background: rgba(255, 255, 255, 0.4); border: 2.5px dashed #F9C6D4; border-radius: 32px;
            flex-shrink: 0; box-shadow: 0 10px 30px rgba(0,0,0,0.05);
          }
          .imageUploadWrapper {
            position: relative; width: 100%; height: 480px; border-radius: 20px;
            overflow: hidden; cursor: pointer; box-shadow: inset 0 0 15px rgba(0,0,0,0.05);
          }
          .largeCoverImg { width: 100%; height: 100%; object-fit: cover; transition: transform 0.4s ease; }
          .uploadOverlay {
            position: absolute; inset: 0; background: rgba(255, 240, 245, 0.4);
            display: flex; justify-content: center; align-items: center;
            color: #D48E9E; font-size: 16px; font-weight: bold; opacity: 0; transition: opacity 0.3s ease;
          }
          .imageUploadWrapper:hover .uploadOverlay, .imageUploadWrapper:active .uploadOverlay { opacity: 1; }
          .imageUploadWrapper:hover .largeCoverImg { transform: scale(1.05); }
          .hiddenInput { display: none; }

          /* --- CATEGORY SCREEN STYLES --- */
          .categoryGrid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 15px;
              padding: 15px;
          }
          .categoryCard {
              background: rgba(255, 255, 255, 0.4);
              border: 2px dotted #D48E9E;
              border-radius: 20px;
              padding: 10px;
              text-align: center;
              cursor: pointer;
              transition: transform 0.3s ease, box-shadow 0.3s ease;
              box-shadow: 0 5px 15px rgba(249, 198, 212, 0.2);
          }
          .categoryCard:active {
              transform: scale(0.96);
          }
          .categoryImgWrapper {
              position: relative;
              width: 100%;
              aspect-ratio: 1 / 1;
              border-radius: 12px;
              overflow: hidden;
              margin-bottom: 10px;
          }
          .categoryImg {
              width: 100%;
              height: 100%;
              object-fit: cover;
          }
          .uploadOverlaySmall {
              position: absolute;
              inset: 0;
              background: rgba(255, 240, 245, 0.7);
              display: flex;
              justify-content: center;
              align-items: center;
              color: #D48E9E;
              font-size: 12px;
              font-weight: bold;
              opacity: 0;
              transition: opacity 0.3s ease;
          }
          .categoryImgWrapper:hover .uploadOverlaySmall,
          .categoryImgWrapper:active .uploadOverlaySmall {
              opacity: 1;
          }
          .categoryTitle {
              font-size: 14px;
              font-weight: bold;
              color: #5C4B51;
          }
          .sectionTitle {
              font-size: 16px;
              font-weight: 800;
              color: #DB2777;
              border-bottom: 2px dashed #F9C6D4;
              padding-bottom: 8px;
              margin-top: 24px;
              margin-bottom: 12px;
              text-transform: uppercase;
              letter-spacing: 1px;
          }

          /* --- CATEGORY VERTICAL SCREEN STYLES --- */
          .verticalScrollContainer {
              display: flex;
              flex-direction: column;
              padding: 60px 0 100px 0;
              overflow-y: auto;
              scroll-behavior: smooth;
              -webkit-overflow-scrolling: touch;
              height: 100%;
          }

          .countrySection {
              margin-bottom: 60px;
              width: 100%;
          }

          .embossedTitle {
              font-size: 36px;
              font-weight: 900;
              text-align: center;
              margin-bottom: 24px;
              letter-spacing: 3px;
              color: #FFF0F5; 
              text-shadow: 3px 3px 6px rgba(212, 142, 158, 0.6), 
                          -2px -2px 6px rgba(255, 255, 255, 1);
              text-transform: uppercase;
          }

          .hugeFoodCard {
              width: 100%;
              background: rgba(255, 255, 255, 0.3);
              border-top: 2px dotted #D48E9E;
              border-bottom: 2px dotted #D48E9E;
              padding: 20px 15px;
              box-shadow: 0 10px 30px rgba(249, 198, 212, 0.1);
              margin-bottom: 40px;
          }

          .hugeCoverImg {
              width: 100%;
              height: 550px; 
              object-fit: cover;
              border-radius: 20px;
              transition: transform 0.4s ease;
          }

          /* --- CATEGORY TITLES & 3D FOOD ITEMS --- */
          .categoryHeaderTitle {
            font-size: 18px;
            font-weight: 900;
            color: #D48E9E;
            text-align: center;
            margin-bottom: 25px;
            margin-top: 35px;
            letter-spacing: 1px;
            text-transform: uppercase;
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 15px;
          }
          .categoryHeaderTitle::before, .categoryHeaderTitle::after {
            content: '';
            height: 1.5px;
            flex: 1;
            background: linear-gradient(to right, transparent, #F9C6D4, transparent);
          }

          .foodListInline {
              padding: 0 15px;
              display: flex;
              flex-wrap: wrap;
              justify-content: center;
              gap: 10px;
              margin-bottom: 20px;
          }

          .foodItem3D {
              font-size: 14px;
              font-weight: 700; 
              color: #D48E9E; 
              padding: 8px 16px;
              background: rgba(255, 255, 255, 0.4);
              border-radius: 100px;
              border: 1px solid rgba(249, 198, 212, 0.5);
              text-align: center;
              cursor: pointer;
              transition: all 0.3s ease;
          }
          .foodItem3D:active { transform: scale(0.9); background: white; }

          .foodCategoryList {
              display: flex;
              flex-direction: column;
              gap: 12px;
              margin-top: 24px;
          }

          .btnCuteApp {
              background: linear-gradient(135deg, #FFF, #FFF5F7);
              color: #D48E9E;
              border: 1.5px solid #F9C6D4;
              border-radius: 16px;
              padding: 14px;
              font-weight: 800;
              font-size: 13px;
              cursor: pointer;
              transition: all 0.3s ease;
              box-shadow: 0 4px 10px rgba(249, 198, 212, 0.2);
              text-align: center;
          }

          .btnCuteApp:active {
              transform: scale(0.97);
              background: #F9C6D4;
              color: white;
          }

          .bottomPadding {
              height: 100px;
          }
        `}</style>

        <button onClick={onClose} className="absolute top-4 right-4 z-50 bg-white/80 p-2 rounded-full shadow-md text-pink-500 hover:bg-pink-100 transition-colors">
          <X size={20} />
        </button>

        {activeScreen !== 'cookingHome' && (
           <button 
             onClick={() => {
               if (activeScreen === 'dishListByCategoryScreen') {
                 setActiveScreen('categoryScreen');
               } else if (activeScreen === 'categoryScreen') {
                 setActiveScreen('kitchenScreen');
               } else if (activeScreen === 'dishDetailScreen') {
                 if (selectedCountryId) setActiveScreen('dishListByCategoryScreen');
                 else setActiveScreen('kitchenScreen');
               } else if (activeScreen === 'cookingMode' || activeScreen === 'kitchenScreen') {
                 setActiveScreen('cookingHome');
               } else if (activeScreen === 'cookingSimulateScreen') {
                 setActiveScreen('dishDetailScreen');
               } else if (activeScreen === 'servingScreen' || activeScreen === 'displayScreen') {
                 setActiveScreen('kitchenScreen');
               } else if (activeScreen === 'table1Interact' || activeScreen === 'table2Interact') {
                 setActiveScreen('servingScreen');
               } else {
                 setActiveScreen('cookingHome');
               }
             }} 
             className="absolute top-4 left-4 z-50 bg-white/80 p-2 rounded-full shadow-md text-pink-500 hover:bg-pink-100 transition-colors"
           >
             <ChevronLeft size={20} />
           </button>
        )}

        <div className="appFullScreen bg-cover bg-center bg-fixed" style={{ backgroundImage: `url(${globalBg})` }}>
          
          {/* Top Header - Danh sách NPC từ Instagram (hiện khi ở màn chính) */}
          {activeScreen === 'cookingHome' && (
            <div className="flex overflow-x-auto gap-3 py-3 px-4 bg-[#FFF5FB]/40 border-b border-pink-100 sticky top-0 z-40 shrink-0 shadow-sm mt-12 sm:mt-0" style={{ scrollbarWidth: 'none' }}>
              {npcList.length === 0 ? (
                <p className="text-xs text-stone-500 italic w-full text-center py-2">Chưa kết nối dữ liệu từ Kikoko Instagram...</p>
              ) : (
                npcList.map(npc => (
                  <div 
                    key={npc.id} 
                    onClick={() => setTopSelectedNpc(npc)}
                    className={`flex flex-col items-center gap-1 min-w-[55px] cursor-pointer transition-all duration-300 ${topSelectedNpc?.id === npc.id ? 'scale-110 opacity-100' : 'opacity-60 hover:opacity-100'}`}
                  >
                    <img src={npc.avatar || npc.image} alt={npc.name} className={`w-12 h-12 rounded-full object-cover border-[2.5px] ${topSelectedNpc?.id === npc.id ? 'border-pink-500 shadow-md' : 'border-transparent'}`} referrerPolicy="no-referrer" />
                    <span className="text-[10px] font-bold text-stone-700 w-full truncate text-center drop-shadow-sm">{npc.name}</span>
                  </div>
                ))
              )}
            </div>
          )}

          {/* HOME SCREEN */}
          <div className={activeScreen === 'cookingHome' ? 'activeScreen' : 'hiddenScreen'}>
            <div className="text-center mb-4 mt-2 px-4 relative">
              <img src="https://i.postimg.cc/XNCMpdbT/06cac63346a94981e02d3fc38c974ef0.png" className="w-[70px] h-[70px] rounded-[18px] shadow-lg mx-auto mb-2 border border-white" alt="icon" referrerPolicy="no-referrer" />
              <h2 className="titlePink mb-0 text-white font-black drop-shadow-md text-2xl">Kikoko Cooking 🎀</h2>
              <button 
                className="absolute top-0 right-4 btnSmall !bg-white/80 !text-pink-500 !border !border-pink-200 !shadow-sm !m-0"
                onClick={() => document.getElementById('globalBgUpload_Home')?.click()}
              >
                  🎨 Đổi nền
              </button>
              <input 
                type="file" 
                id="globalBgUpload_Home" 
                className="hiddenInput" 
                accept="image/*" 
                onChange={handleGlobalBgChange} 
              />
            </div>

            <div className="largeHorizontalScroll">
              {profiles.map((p, index) => (
                <div key={p.id} className="largeProfileCard">
                  <div className="imageUploadWrapper" onClick={() => document.getElementById(`uploadCard_${index}`)?.click()}>
                    <img src={p.image} className="largeCoverImg" alt="cover" referrerPolicy="no-referrer" />
                    <div className="uploadOverlay">🎀 Chạm để đổi nền thẻ 🎀</div>
                    <input 
                      type="file" 
                      id={`uploadCard_${index}`} 
                      className="hiddenInput" 
                      accept="image/*" 
                      onChange={(e) => handleProfileImageChange(index, e)} 
                    />
                  </div>
                  <div className="mt-4 flex-1 flex flex-col justify-between">
                    <h3 className="titlePink" style={{marginTop: 10, fontSize: '18px'}}>Phong Cách Nhà Hàng {index + 1}</h3>
                    
                    <div className="flex flex-col items-center justify-center p-2 bg-pink-50/70 rounded-xl border border-pink-100 text-center mb-3">
                      <span className="text-[10px] font-bold text-stone-400 mb-1 uppercase tracking-wider">Bếp Trưởng Đang Mở Quán</span>
                      {topSelectedNpc ? (
                        <span className="font-black text-pink-600 text-lg truncate w-full">{topSelectedNpc.name}</span>
                      ) : (
                        <span className="text-xs italic text-red-400 font-bold">Hãy chọn NPC ở thanh trượt trên cùng!</span>
                      )}
                    </div>

                    <button className="btnGo hover:opacity-90 shadow-md py-6 text-xl tracking-wider active:scale-95 transition-all" onClick={() => {
                      if (!topSelectedNpc) return alert('Hãy chọn 1 NPC từ thanh trượt ở trên cùng làm đầu bếp!');
                      setActiveProfileId(p.id);
                      setActiveScreen('cookingMode');
                    }}>Sẵn Sàng Mở Quán ! ✨</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* COOKING MODE SELECTION */}
          <div className={activeScreen === 'cookingMode' ? 'activeScreen' : 'hiddenScreen'}>
            <div className="glassBox mt-20">
              <h2 className="titlePink leading-relaxed">Hôm nay <span className="text-pink-600 font-black text-2xl"><br/>{currentCookName}</span><br/> muốn nấu thế nào?</h2>
              <button className="btnMain mt-6 mb-4 hover:opacity-90" onClick={() => {
                setSelectedCompanion('');
                setActiveScreen('kitchenScreen');
              }}>🍳 Tự Vào Bếp (Một mình)</button>
              
              <div className="mt-6 border-t border-pink-200 pt-6">
                <p className="text-sm font-bold text-pink-500 mb-2">👩‍🍳 Rủ Ai Vào Bếp Cùng?</p>
                <select 
                  className="cuteSelect" 
                  value={selectedCompanion}
                  onChange={(e) => {
                    setSelectedCompanion(e.target.value);
                    if (e.target.value) setActiveScreen('kitchenScreen');
                  }}
                >
                  <option value="">Chọn một NPC khác từ Instagram...</option>
                  {npcList.filter(n => n.id !== topSelectedNpc?.id).map(npc => (
                    <option key={npc.id} value={npc.name}>{npc.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* KITCHEN MENU SCREEN */}
          <div className={activeScreen === 'kitchenScreen' ? 'activeScreen' : 'hiddenScreen'}>
            <div className="kitchenHeader glassBox mt-12">
              <div className="stats tracking-tight space-y-1">
                <span className="text-sm font-black text-pink-600">👑 Quán: {currentCookName}</span>
                <span className="font-bold text-stone-600">💰 Lợi nhuận: {(activeProfileData?.money || 0).toLocaleString()} VNĐ</span>
                <span className="font-bold text-stone-600">📦 Lượt khách: {activeProfileData?.orders}</span>
              </div>
              <div className="flex flex-col gap-2">
                <button className="btnHeart hover:scale-105 transition-transform" onClick={() => setActiveScreen('displayScreen')}>💖 Món đã ra lò</button>
                <button className="btnApi !mt-0 !py-2 !text-[10px] bg-blue-400 text-white" onClick={() => setActiveScreen('categoryScreen')}>🌍 Danh mục quốc gia</button>
              </div>
            </div>

            <div className="pb-20">
              {COOKING_MENU.map((cat, idx) => (
                <div key={idx} className="glassBox mb-6">
                  <h3 className="titlePink text-lg sticky top-0 bg-white/30 p-2 rounded-xl z-10">{cat.category}</h3>
                  <div className="mt-4 flex flex-col gap-2">
                    {cat.items.map((dish, dIdx) => (
                      <div 
                        key={dIdx} 
                        className="menuItem bg-white/40 hover:bg-pink-50/50 transition-colors"
                        onClick={() => {
                          setActiveDish(dish);
                          setSelectedCountryId(''); // Clear country context if picking from general menu
                          setActiveScreen('dishDetailScreen');
                          setDishDetails(null);
                        }}
                      >
                        {idx === 0 ? '🍗' : idx === 1 ? '🍜' : idx === 2 ? '🍱' : idx === 3 ? '🍲' : idx === 4 ? '🥩' : idx === 5 ? '🍰' : idx === 6 ? '🧋' : idx === 7 ? '🍡' : idx === 8 ? '🍕' : '🥗'} {dish}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* DISH DETAIL SCREEN */}
          <div className={activeScreen === 'dishDetailScreen' ? 'activeScreen' : 'hiddenScreen'}>
            <div className="glassBox mt-12 pb-20">
              <h2 className="titlePink text-2xl">{activeDish}</h2>
              
              {!dishDetails && (
                <button 
                  className="btnApi mb-6 text-sm py-4 relative overflow-hidden" 
                  onClick={handleCookDish}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <span className="flex items-center justify-center gap-2 animate-pulse">
                      Đang xào nấu... 🥘
                    </span>
                  ) : (
                    <span>API tiến hành nấu cho công chúa đây ✨</span>
                  )}
                </button>
              )}
              
              {isGenerating && streamingContent && (
                <div className="text-xs font-mono p-4 bg-black/5 text-pink-700/50 rounded-xl mb-4 whitespace-pre-wrap break-words max-h-40 overflow-y-auto">
                  {streamingContent}
                </div>
              )}

              {dishDetails && !isGenerating && (
                <motion.div initial={{opacity:0}} animate={{opacity:1}} className="text-[#5C4B51] text-sm flex flex-col gap-4 leading-relaxed font-medium">
                  <div className="bg-white/50 p-3 rounded-lg"><b className="text-pink-600 block mb-1">1. Công thức:</b> {dishDetails.recipe}</div>
                  <div className="bg-white/50 p-3 rounded-lg"><b className="text-pink-600 block mb-1">2. Thực phẩm cần mua:</b> {dishDetails.ingredients}</div>
                  <div className="bg-white/50 p-3 rounded-lg"><b className="text-pink-600 block mb-1">3. Thời gian:</b> {dishDetails.time}</div>
                  <div className="bg-white/50 p-3 rounded-lg"><b className="text-pink-600 block mb-1">4. Hướng dẫn từng bước:</b> <p className="whitespace-pre-wrap mt-1 text-stone-600">{dishDetails.stepByStep}</p></div>
                  <div className="bg-white/50 p-3 rounded-lg"><b className="text-pink-600 block mb-1">5. Nguồn gốc:</b> {dishDetails.origin}</div>
                  <div className="bg-white/50 p-3 rounded-lg"><b className="text-pink-600 block mb-1">6. Ăn kèm:</b> {dishDetails.sideDishes}</div>
                  <div className="bg-white/50 p-3 rounded-lg"><b className="text-pink-600 block mb-1">7. Tại sao chọn món:</b> <p className="whitespace-pre-wrap mt-1 text-stone-600">{dishDetails.reason}</p></div>
                  <div className="bg-white/50 p-3 rounded-lg"><b className="text-pink-600 block mb-1">8. Mời ai:</b> {dishDetails.inviteList}</div>
                  <div className="bg-white/50 p-3 rounded-lg"><b className="text-pink-600 block mb-1">9. Sao biết nấu:</b> {dishDetails.whyKnow}</div>
                  <div className="bg-white/50 p-3 rounded-lg"><b className="text-pink-600 block mb-1">10. Điểm:</b> <span className="text-xl font-black text-pink-500">{dishDetails.score}</span></div>
                  <div className="bg-white/50 p-3 rounded-lg"><b className="text-pink-600 block mb-1">11. Tính ăn mấy bát:</b> {dishDetails.bowlsOfRice}</div>
                  <div className="bg-white/50 p-3 rounded-lg border-2 border-pink-200"><b className="text-pink-600 block mb-1">12. Giá bán dự kiến:</b> <span className="text-lg font-bold text-green-600">{dishDetails.price}</span></div>
                  
                  <div className="flex flex-col gap-2">
                    <button className="btnApi mt-4 py-4 text-sm font-bold bg-[#DB2777] text-white shadow-xl flex items-center justify-center gap-2" onClick={() => handleStartCookingSimulate(false)} disabled={isGenerating}>
                      {dishDetails.simulationRuns?.length > 0 || dishDetails.simulationStory ? '📜 XEM LỊCH SỬ CÁC ĐỢT NẤU 📜' : '🔥 VÀO BẾP NẤU THỰC TẾ NGAY (Tốn Tokens) 🔥'}
                    </button>
                    {(dishDetails.simulationRuns?.length > 0 || dishDetails.simulationStory) && (
                      <button className="btnApi mt-2 py-3 text-xs bg-pink-100 text-pink-600 border border-pink-300 flex items-center justify-center gap-2 font-bold" onClick={() => handleStartCookingSimulate(true)} disabled={isGenerating}>
                        Thực Hiện Nấu Đợt Mới (+ Nấu Lại Tốn Tokens) 🔄
                      </button>
                    )}
                    <div className="flex gap-2">
                      <button className="btnGo mt-2 py-4 flex-1 text-sm bg-white text-pink-500 border border-pink-200" onClick={handleCookDish} disabled={isGenerating}>
                        Nấu Lại Chảo Mới (Đổi Công Thức JSON) 🥘
                      </button>
                      <button className="btnGo mt-2 py-4 flex-1 text-sm" onClick={() => setActiveScreen('displayScreen')}>
                        Về phòng trưng bày 💖
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          {/* COOKING SIMULATE SCREEN */}
          <div className={activeScreen === 'cookingSimulateScreen' ? 'activeScreen' : 'hiddenScreen'}>
             <div className="mt-12 pb-20 px-4">

               {/* TAB RENDERER FOR SIMULATION RUNS */}
               {dishDetails?.simulationRuns?.length > 0 && !isGenerating && (
                 <div className="flex gap-2 overflow-x-auto p-2 mb-4 snap-x no-scrollbar">
                   {dishDetails.simulationRuns.map((run: any) => (
                     <button 
                       key={run.id}
                       onClick={() => {
                         setActiveRunId(run.id);
                         setStreamingContent(run.story);
                         setCookingSimulateTime(0);
                       }}
                       className={`px-4 py-2 rounded-full whitespace-nowrap text-xs font-bold shadow-sm transition-all snap-start ${activeRunId === run.id ? 'bg-[#DB2777] text-white scale-105' : 'bg-white text-pink-600 border border-pink-200 hover:bg-pink-50'}`}
                     >
                       {run.label || 'Đợt nấu'}
                     </button>
                   ))}
                   <button 
                     onClick={() => handleStartCookingSimulate(true)}
                     className="px-4 py-2 rounded-full whitespace-nowrap text-xs font-bold border-2 border-dashed border-pink-400 text-pink-500 bg-pink-50 hover:bg-pink-100 transition-all snap-start"
                   >
                     + Nấu đợt mới
                   </button>
                 </div>
               )}

               <div className="glassBox border-4 border-pink-500/20 mb-4 p-6 relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-pink-300/10 to-transparent animate-pulse" />
                 <h2 className="text-xl font-black text-pink-600 text-center uppercase tracking-widest mb-2 z-10 relative">Đang Chế Biến</h2>
                </div>
                {/* STICKY LOADING BAR */}
                <div className="sticky top-12 z-50 glassBox border-4 border-pink-500/20 mb-4 p-4 relative overflow-hidden shadow-lg backdrop-blur-md">
                  <div className="absolute top-0 left-0 h-full bg-pink-400/10 transition-all duration-300" style={{ width: `${cookingLoadingPercentage}%` }} />
                  <div className="flex items-center justify-between z-10 relative">
                    <div>
                      <h2 className="text-sm font-black text-pink-600 uppercase tracking-widest">Đang Chế Biến</h2>
                      <p className="text-[10px] font-bold text-stone-500 truncate max-w-[150px]">{activeDish}</p>
                    </div>
                    
                    <div className="text-right">
                      <div className="font-mono text-2xl font-black text-[#DB2777] tracking-tighter flex items-center justify-end gap-1">
                        <span>{Math.floor(cookingSimulateTime / 60).toString().padStart(2, '0')}</span>
                        <span className="animate-pulse opacity-50">:</span>
                        <span>{(cookingSimulateTime % 60).toString().padStart(2, '0')}</span>
                      </div>
                      <p className="text-[8px] uppercase text-stone-400 font-bold">Progress: {cookingLoadingPercentage.toFixed(1)}%</p>
                    </div>
                  </div>
                  
                  {/* PROGRESS BAR */}
                  <div className="w-full h-1.5 bg-pink-100 rounded-full mt-2 overflow-hidden border border-pink-200">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-[#F9C6D4] via-[#DB2777] to-[#F9C6D4]"
                      initial={{ width: 0 }}
                      animate={{ width: `${cookingLoadingPercentage}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>
                <div className="hidden">
                 <p className="text-center text-sm font-bold text-stone-500 mb-4">{activeDish}</p>
                 
                 <div className="text-center font-mono text-5xl font-black text-[#DB2777] tracking-tighter drop-shadow-sm flex items-center justify-center gap-2 mb-2">
                    <span className="w-16 text-right">{Math.floor(cookingSimulateTime / 60).toString().padStart(2, '0')}</span>
                    <span className="animate-pulse opacity-50">:</span>
                    <span className="w-16 text-left">{(cookingSimulateTime % 60).toString().padStart(2, '0')}</span>
                 </div>
                 <p className="text-center text-[10px] uppercase text-stone-400 font-bold">Đồng hồ đếm ngược công đoạn</p>
               </div>

               <div className="glassBox min-h-[50vh] flex flex-col items-start gap-4">
                  {streamingContent ? (
                    <div className="text-sm font-serif text-[#5C4B51] leading-[1.8] whitespace-pre-wrap break-words w-full">
                      {streamingContent}
                    </div>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-stone-400 gap-4 mt-8">
                       <div className="w-10 h-10 border-4 border-t-pink-500 rounded-full animate-spin"></div>
                       <p className="text-xs font-bold uppercase tracking-wider animate-pulse">Đang nổi lửa... Xin chờ...</p>
                    </div>
                  )}
                  
                  {!isGenerating && streamingContent && (
                    <button className="btnGo w-full mt-4 py-4" onClick={() => setActiveScreen('servingScreen')}>
                      Món Đã Hoàn Thành! Mang Ra Bàn Thôi 🛎️
                    </button>
                  )}
                  {isGenerating && (
                    <div className="w-full p-4 text-center italic text-stone-400 animate-pulse text-xs">
                       Đang viết tiếp chương mới... (Tiêu chuẩn 12.000 tokens)
                    </div>
                  )}
               </div>
             </div>
          </div>

          {/* DISPLAY SCREEN */}
          <div className={activeScreen === 'displayScreen' ? 'activeScreen' : 'hiddenScreen'}>
            <div className="glassBox textCenter mt-12 pb-20">
              <h2 className="titlePink font-black text-2xl mb-8">💖 Tủ Kính Trưng Bày 💖</h2>
              <div className="flex flex-col gap-8">
                {completedDishes.filter(d => d.cooker === currentCookName).length === 0 ? (
                  <p className="text-stone-400 italic">Chưa có món nào được NPC này nấu cả...</p>
                ) : (
                  completedDishes.filter(d => d.cooker === currentCookName).map((dish, i) => (
                    <div key={i} className="bg-white/60 p-4 rounded-2xl border-2 border-pink-100 shadow-sm relative overflow-hidden flex flex-col gap-2">
                      <div className="absolute top-0 right-0 bg-pink-400 text-white text-[10px] px-3 py-1 font-bold rounded-bl-xl shadow-sm">
                        Bởi {dish.cooker}
                      </div>
                      <h3 className="font-bold text-lg text-pink-600 leading-tight mb-1 pr-12">{dish.name}</h3>
                      <p className="text-xs text-stone-500 mb-2 line-clamp-2">{dish.recipe}</p>
                      
                      <button className="btnGo !mt-0 py-2 text-xs border border-pink-300 bg-white shadow-sm font-bold text-pink-600" onClick={() => {
                        setActiveDish(dish.name);
                        setDishDetails(dish);
                        setActiveScreen('dishDetailScreen');
                      }}>
                        Xem lại toàn bộ nội dung 📝
                      </button>
                      
                      <button className="btnApi mt-0 py-3 text-sm shadow-sm" onClick={() => {
                        setActiveDish(dish.name);
                        setDishDetails(dish); // Needed for correct billing prices
                        setActiveScreen('servingScreen');
                      }}>Mang Ra cho khách Thôi Nào 🛎️</button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* SERVING SCREEN */}
          <div className={activeScreen === 'servingScreen' ? 'activeScreen' : 'hiddenScreen'}>
            <div className="mt-8 pb-20">
              <h2 className="titlePink textCenter font-black text-2xl p-4 bg-white/20 border-y border-white">Sảnh Nhà Hàng 🎀</h2>
              
              <div className="glassBox mt-6 border-b-4 border-pink-300">
                <h3 className="font-bold text-lg text-pink-600 mb-3">Bàn Số 1 (6 khách)</h3>
                <p className="text-xs text-stone-500 mb-4">Nhóm khách VIP đang thảo luận về món {activeDish}</p>
                <div className="flex flex-col gap-2">
                  <button className="btnSmall m-0 py-3 text-sm bg-white text-pink-500 border border-pink-200" onClick={() => setShowBill(true)}>🧾 Xem Bill Thanh Toán</button>
                  <button className="btnSmall m-0 py-3 text-sm" onClick={() => setActiveScreen('table1Interact')}>🚪 bước vào bên trong thôi nào</button>
                </div>
              </div>

              <div className="glassBox mt-4 border-b-4 border-pink-300">
                <h3 className="font-bold text-lg text-pink-600 mb-3">Bàn Số 2 (Hội NPC buôn chuyện)</h3>
                <p className="text-xs text-stone-500 mb-4">Bàn dài 15 người đang sôi nổi đánh giá</p>
                <button className="btnSmall w-full py-3 text-sm" onClick={() => setActiveScreen('table2Interact')}>💬 vào xem họ bình luận gì nào</button>
              </div>
            </div>
          </div>

          {/* TABLE 1 INTERACT */}
          <div className={activeScreen === 'table1Interact' ? 'activeScreen' : 'hiddenScreen'}>
            <div className="glassBox mt-12 flex flex-col h-[80vh]">
              <h2 className="titlePink shrink-0">Phục vụ Bàn 1</h2>
              <div className="flex-1 overflow-y-auto mb-4 flex flex-col gap-3 p-2 custom-scrollbar">
                {table1Chat.length === 0 && (
                  <p className="text-center text-xs text-stone-400 italic">Khách đang đợi món...</p>
                )}
                {table1Chat.map((c, i) => (
                  <div key={i} className={`p-3 rounded-2xl max-w-[85%] text-sm ${c.sender === 'user' ? 'bg-pink-100 text-pink-900 self-end rounded-tr-sm' : 'bg-white text-stone-700 self-start border border-pink-100 rounded-tl-sm'}`}>
                    <span className="text-[10px] font-bold block mb-1 opacity-50 uppercase">{c.sender === 'user' ? 'Bạn' : activeProfileData?.name || 'Khách'}</span>
                    {c.text}
                  </div>
                ))}
                {isGenerating && (
                  <div className="p-3 rounded-2xl max-w-[85%] bg-white text-stone-500 self-start border border-pink-100 rounded-tl-sm text-sm italic">
                    Đang gõ...
                  </div>
                )}
              </div>
              <div className="shrink-0 pt-2 border-t border-pink-200 flex gap-2">
                <input 
                  type="text" 
                  className="cuteInput !mt-0 flex-1" 
                  placeholder="Công chúa nói gì với khách nào..."
                  value={userChatInput}
                  onChange={(e) => setUserChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleTable1Chat()}
                />
                <button className="btnApi !mt-0 !w-auto aspect-square flex items-center justify-center p-0 rounded-xl" disabled={isGenerating || !userChatInput.trim()} onClick={handleTable1Chat}>
                  💬
                </button>
              </div>
            </div>
          </div>

          {/* TABLE 2 INTERACT */}
          <div className={activeScreen === 'table2Interact' ? 'activeScreen' : 'hiddenScreen'}>
            <div className="glassBox mt-12 flex flex-col h-[80vh]">
              <h2 className="titlePink shrink-0">Nghe trộm Bàn 2</h2>
              <p className="text-xs text-center text-stone-500 mb-4">Các NPC đang xì xào bàn tán về quán ăn</p>
              
              <button className="btnApi shrink-0 mb-4 py-4" onClick={handleTable2Chat} disabled={isGenerating}>
                {isGenerating ? 'Đang hóng hớt...' : '🤫 Gọi 10-15 NPC bình luận'}
              </button>
              
              <div className="flex-1 overflow-y-auto flex flex-col gap-3 p-2 custom-scrollbar">
                {table2Chat.map((msg, i) => (
                  <div key={i} className="bg-white/80 p-3 rounded-2xl text-sm border-l-4 border-pink-400 shadow-sm relative">
                    <span className="font-bold text-[11px] text-pink-600 block mb-1">{msg.author}</span>
                    <p className="text-stone-700 leading-relaxed">{msg.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CATEGORY SCREEN */}
          <div className={activeScreen === 'categoryScreen' ? 'activeScreen !p-0 !bg-transparent' : 'hiddenScreen'}>
              <div className="verticalScrollContainer custom-scrollbar">
                  <div className="flex justify-center gap-4 mb-8 px-4">
                      <h2 className="titlePink drop-shadow-sm mb-0">Khám Phá Ẩm Thực 🌍</h2>
                      <button 
                        className="btnSmall !bg-white/80 !text-pink-500 !border !border-pink-200 !shadow-sm !m-0 !py-2"
                        onClick={() => document.getElementById('globalBgUpload')?.click()}
                      >
                         🎨 Đổi nền App
                      </button>
                      <input 
                        type="file" 
                        id="globalBgUpload" 
                        className="hiddenInput" 
                        accept="image/*" 
                        onChange={handleGlobalBgChange} 
                      />
                  </div>
                  
                  {COUNTRY_MENU_DATA.map((country) => (
                      <motion.div 
                        key={country.id} 
                        className="countrySection"
                        initial={{ opacity: 0, y: 60 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: false, margin: "-10%" }}
                        transition={{ duration: 0.8, ease: [0.5, 0, 0, 1] }}
                      >
                          <h1 className="embossedTitle">{country.flag} {country.name}</h1>
                          
                          <div className="hugeFoodCard !p-0 overflow-hidden relative" style={{ perspective: '1200px' }}>
                              <div className="relative w-full h-[550px] overflow-hidden bg-black/5">
                                  <AnimatePresence initial={false} custom={direction}>
                                      <motion.div
                                          key={currentImageIndices[country.id] || 0}
                                          custom={direction}
                                          variants={countryGalleryVariants}
                                          initial="enter"
                                          animate="center"
                                          exit="exit"
                                          transition={{
                                            x: { type: "spring", stiffness: 300, damping: 30 },
                                            opacity: { duration: 0.4 },
                                            rotateY: { duration: 0.6 },
                                            scale: { duration: 0.4 }
                                          }}
                                          drag="x"
                                          dragConstraints={{ left: 0, right: 0 }}
                                          dragElastic={1}
                                          onDragEnd={(e, { offset, velocity }) => {
                                            const swipe = offset.x;
                                            if (swipe < -50) {
                                                paginate(country.id, 1);
                                            } else if (swipe > 50) {
                                                paginate(country.id, -1);
                                            }
                                          }}
                                          className="absolute inset-0 cursor-grab active:cursor-grabbing"
                                      >
                                          <img 
                                              src={(categoryImages[country.id] || [country.defaultImage])[currentImageIndices[country.id] || 0]} 
                                              className="hugeCoverImg !h-full !rounded-none" 
                                              alt={country.name} 
                                              referrerPolicy="no-referrer" 
                                          />
                                      </motion.div>
                                  </AnimatePresence>

                                  {/* Overlay controls - Nút thêm ảnh */}
                                  <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
                                      <button 
                                          className="w-10 h-10 bg-white/80 rounded-full shadow-lg flex items-center justify-center text-pink-500 hover:bg-white transition-all transform hover:scale-110"
                                          onClick={() => document.getElementById(`uploadHuge_${country.id}`)?.click()}
                                      >
                                          <span className="text-2xl font-bold">+</span>
                                      </button>
                                      {(categoryImages[country.id]?.length || 0) > 1 && (
                                          <button 
                                              className="w-10 h-10 bg-red-400/80 rounded-full shadow-lg flex items-center justify-center text-white hover:bg-red-500 transition-all transform hover:scale-110"
                                              onClick={() => {
                                                  const images = [...categoryImages[country.id]];
                                                  const index = currentImageIndices[country.id] || 0;
                                                  images.splice(index, 1);
                                                  const updated = { ...categoryImages, [country.id]: images };
                                                  setCategoryImages(updated);
                                                  setCurrentImageIndices(prev => ({ ...prev, [country.id]: Math.max(0, index - 1) }));
                                                  saveState(profiles, completedDishes, updated);
                                              }}
                                          >
                                              <X size={18} />
                                          </button>
                                      )}
                                  </div>

                                  {/* Dots indicator */}
                                  {(categoryImages[country.id]?.length || 0) > 1 && (
                                      <div className="absolute bottom-6 left-0 right-0 z-20 flex justify-center gap-2">
                                          {categoryImages[country.id].map((_, idx) => (
                                              <div 
                                                  key={idx}
                                                  className={`w-2 h-2 rounded-full transition-all duration-300 ${idx === (currentImageIndices[country.id] || 0) ? 'bg-pink-500 w-6' : 'bg-white/50'}`}
                                              />
                                          ))}
                                      </div>
                                  )}

                                  <input 
                                      type="file" 
                                      id={`uploadHuge_${country.id}`} 
                                      className="hiddenInput" 
                                      accept="image/*" 
                                      onChange={(e) => handleCategoryImageChange(e, country.id)} 
                                  />
                              </div>
                              
                              <div className="foodCategoryList p-5">
                                  {country.sections.map((section, sIdx) => (
                                      <div key={sIdx} className="mb-8">
                                          <h3 className="categoryHeaderTitle">
                                              <span>{section.title}</span>
                                          </h3>
                                          
                                          <div className="foodListInline">
                                              {section.items.map((dish, dIdx) => (
                                                  <motion.p 
                                                    key={dIdx} 
                                                    className="foodItem3D"
                                                    initial={{ opacity: 0, rotateX: -90, y: 30, scale: 0.8 }}
                                                    whileInView={{ opacity: 1, rotateX: 0, y: 0, scale: 1 }}
                                                    viewport={{ once: false, amount: 0.2 }}
                                                    transition={{ 
                                                      duration: 0.6, 
                                                      delay: (dIdx % 10) * 0.05,
                                                      ease: [0.175, 0.885, 0.32, 1.275] 
                                                    }}
                                                    onClick={() => {
                                                      setActiveDish(dish);
                                                      setSelectedCountryId(country.id);
                                                      setActiveScreen('dishDetailScreen');
                                                      setDishDetails(null);
                                                    }}
                                                  >
                                                      ʚ {dish} ɞ
                                                  </motion.p>
                                              ))}
                                          </div>
                                      </div>
                                  ))}
                              </div>
                          </div>
                      </motion.div>
                  ))}
                  
                  <div className="bottomPadding"></div>
              </div>
          </div>

          {/* DISH LIST BY CATEGORY SCREEN */}
          <div className={activeScreen === 'dishListByCategoryScreen' ? 'activeScreen' : 'hiddenScreen'}>
              <div className="mt-12 pb-20">
                  {(() => {
                      const country = COUNTRY_MENU_DATA.find(c => c.id === selectedCountryId);
                      if (!country) return null;
                      return (
                          <div className="glassBox">
                              <h2 className="titlePink">{country.flag} {country.name}</h2>
                              <img src={categoryImages[country.id]?.[0] || country.defaultImage} className="w-full h-40 object-cover rounded-2xl mb-6 shadow-md border-2 border-white" alt="cover" referrerPolicy="no-referrer" />
                              
                              {country.sections.map((section, sIdx) => (
                                  <div key={sIdx} className="mb-8">
                                      <h3 className="sectionTitle">{section.title}</h3>
                                      <div className="flex flex-col gap-2">
                                          {section.items.map((dish, dIdx) => (
                                              <div 
                                                  key={dIdx} 
                                                  className="menuItem bg-white/40 hover:bg-pink-50/50 transition-colors"
                                                  onClick={() => {
                                                      setActiveDish(dish);
                                                      setActiveScreen('dishDetailScreen');
                                                      setDishDetails(null);
                                                  }}
                                              >
                                                  ✨ {dish}
                                              </div>
                                          ))}
                                      </div>
                                  </div>
                              ))}
                              
                              <button className="btnGo w-full mt-6 bg-stone-100 !text-stone-500 border border-stone-200" onClick={() => setActiveScreen('categoryScreen')}>
                                  Quay lại danh mục 🌍
                              </button>
                          </div>
                      );
                  })()}
              </div>
          </div>

        </div>

        {/* BILL OVERLAY */}
        {showBill && (
          <div className="billOverlay" onClick={() => setShowBill(false)}>
            <div className="billReceipt" onClick={e => e.stopPropagation()}>
              <h2 className="billTitle">KIKOKO RECEIPT</h2>
              <p className="billDashed"></p>
              <p className="text-sm my-1">Bàn số: 01</p>
              <p className="text-sm my-1">Khách hàng: {selectedCompanion || 'Khách Vãng Lai'}</p>
              <p className="billDashed"></p>
              <div className="billItem">
                <span className="font-bold truncate max-w-[60%]">{activeDish}</span>
                <span>{dishDetails?.price || '150,000'} x 6</span>
              </div>
              <p className="billDashed"></p>
              <p className="text-sm my-1">Giảm giá: Không có</p>
              <h3 className="billTotal text-pink-600 text-lg">Tổng: Tự tính nhé ~</h3>
              <p className="billDashed"></p>
              <p className="billThanks">Xin cảm ơn quý khách hàng.<br/>Chúc khách hàng may mắn! 🎀</p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
