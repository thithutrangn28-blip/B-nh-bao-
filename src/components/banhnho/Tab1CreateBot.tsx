import React, { useState, useEffect, useRef } from 'react';
import { safeSetItem } from '../../utils/storage';
import { saveCards, loadCards, saveDraft, loadDraft } from '../../utils/db';
import { compressImage } from '../../utils/imageUtils';
import { BotPromptManager } from './BotPromptManager';

const PinkBow = ({ className }: { className?: string }) => (
  <svg 
    width="28" 
    height="28" 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Left Loop */}
    <path 
      d="M12 11C12 11 10 7 6.5 7C4 7 3 8.5 3 10.5C3 12.5 4.5 14 6.5 14C9 14 12 11 12 11Z" 
      fill="#FFB6C1" 
      stroke="#FF69B4" 
      strokeWidth="1.5"
    />
    {/* Right Loop */}
    <path 
      d="M12 11C12 11 14 7 17.5 7C20 7 21 8.5 21 10.5C21 12.5 19.5 14 17.5 14C15 14 12 11 12 11Z" 
      fill="#FFB6C1" 
      stroke="#FF69B4" 
      strokeWidth="1.5"
    />
    {/* Left Tail */}
    <path 
      d="M11 13L8 19" 
      stroke="#FF69B4" 
      strokeWidth="2.5" 
      strokeLinecap="round"
    />
    {/* Right Tail */}
    <path 
      d="M13 13L16 19" 
      stroke="#FF69B4" 
      strokeWidth="2.5" 
      strokeLinecap="round"
    />
    {/* Center Knot */}
    <rect 
      x="10" 
      y="9.5" 
      width="4" 
      height="3.5" 
      rx="1.5" 
      fill="#FF69B4"
    />
  </svg>
);

export const PinkBotCard = ({ avatar, name, occupation, hobbies, appearance, links, about, history, onRoleplay }: any) => {
  return (
    <div className="w-[92%] max-w-[500px] bg-white shadow-[0_4px_30px_rgba(0,0,0,0.15)] mx-auto relative z-10 border-b-[8px] border-[#2F2F2F] text-[14px] leading-[1.5]">
      {/* Part A: Header */}
      <div 
        className="relative w-full bg-[#2F2F2F] scalloped-bottom scalloped-bottom-pink flex justify-between items-center px-4 py-3"
        style={{ backgroundImage: 'radial-gradient(#444 2px, transparent 2px)', backgroundSize: '8px 8px' }}
      >
        {/* Left Circle */}
        <div className="w-8 h-8 rounded-full border border-[#F9C6D4] border-dashed flex items-center justify-center bg-[#2F2F2F]">
          <span className="text-white text-xl">🕷️</span>
        </div>
        
        {/* Center Title */}
        <div className="bg-[#F9C6D4] px-5 py-2 rounded-xl border border-white border-dashed shadow-sm z-20">
          <h2 className="font-cursive text-2xl text-[#2F2F2F] tracking-wide truncate max-w-[150px]">{name || 'Untitled'}</h2>
        </div>
        
        {/* Right Circle */}
        <div className="w-8 h-8 rounded-full border border-[#F9C6D4] border-dashed flex items-center justify-center bg-[#2F2F2F]">
          <span className="text-white text-xl">🕷️</span>
        </div>
      </div>

      {/* Part B: Body */}
      <div className="grid grid-cols-[4fr_6fr] gap-4 p-4 mt-1">
        
        {/* Left Column */}
        <div className="flex flex-col gap-3">
          {/* User Image */}
          <div className="w-full aspect-[3/4] rounded-xl border-[3px] border-dotted border-[#E0B0C0] overflow-hidden bg-[#FFF6F8] shadow-md">
            {avatar ? (
              <img src={avatar} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[#E0B0C0] font-medium text-sm">Image</div>
            )}
          </div>
          
          {/* Divider */}
          <div className="flex justify-center items-center gap-2 text-[#2F2F2F] text-lg opacity-70 my-1">
            <span>🎀</span><span>✚</span><span>🎀</span>
          </div>
          
          {/* Contact Section */}
          <div className="text-center">
            <h3 className="font-cursive text-xl text-[#2F2F2F] mb-2">find me...</h3>
            <div className="flex flex-col gap-2 items-center">
              {links && links.map((link: string, i: number) => link ? (
                <div key={i} className="flex items-center gap-2 text-[12px] text-gray-500 w-full justify-center">
                  <span className="text-[#2F2F2F] shrink-0">{i === 0 ? '📱' : i === 1 ? '🐦' : '📸'}</span>
                  <span className="truncate max-w-[100px]">{link}</span>
                </div>
              ) : null)}
              {(!links || links.every((l: string) => !l)) && (
                <div className="text-[11px] text-gray-400 italic">No links</div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-3">
          {/* About Section */}
          <div>
            <h3 className="font-cursive text-2xl text-[#2F2F2F] mb-3 text-left">about me &lt;3</h3>
            
            {/* Short List */}
            <ul className="space-y-2 mb-4">
              <li className="flex items-start gap-2 text-[13px] text-gray-600">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#F9C6D4" xmlns="http://www.w3.org/2000/svg" className="mt-0.5 flex-shrink-0">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
                <span className="leading-tight"><strong>Nghề:</strong> {occupation || '...'}</span>
              </li>
              <li className="flex items-start gap-2 text-[13px] text-gray-600">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#F9C6D4" xmlns="http://www.w3.org/2000/svg" className="mt-0.5 flex-shrink-0">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
                <span className="leading-tight"><strong>Thích:</strong> {hobbies || '...'}</span>
              </li>
              <li className="flex items-start gap-2 text-[13px] text-gray-600">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#F9C6D4" xmlns="http://www.w3.org/2000/svg" className="mt-0.5 flex-shrink-0">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
                <span className="leading-tight"><strong>Dáng:</strong> {appearance || '...'}</span>
              </li>
            </ul>
            
            {/* Long Text */}
            <div className="font-serif text-[13px] leading-[1.6] text-gray-500 text-justify space-y-3">
              <p className="break-words"><strong>About:</strong> {about || 'Thông tin chi tiết...'}</p>
              <p className="break-words"><strong>Quá khứ:</strong> {history || 'Lịch sử...'}</p>
            </div>

            {/* Roleplay Box */}
            {onRoleplay && (
              <div className="mt-4 pt-4 border-t border-[#F9C6D4] border-dashed">
                <button 
                  onClick={onRoleplay}
                  className="w-full bg-[#FFF0F3] hover:bg-[#FDE2E4] text-[#D63384] font-bold py-3.5 rounded-2xl shadow-[0_4px_15px_rgba(243,180,194,0.3)] transition-all flex items-center justify-center gap-3 border-2 border-[#F9C6D4] border-dashed group"
                >
                  <PinkBow className="group-hover:scale-125 transition-transform" />
                  <span className="tracking-wide">Bắt đầu Roleplay</span>
                  <PinkBow className="group-hover:scale-125 transition-transform" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Part C: Footer */}
      <div 
        className="w-full bg-[#2F2F2F] scalloped-top py-2 mt-3 flex justify-center items-center"
        style={{ backgroundImage: 'radial-gradient(#444 2px, transparent 2px)', backgroundSize: '6px 6px' }}
      >
        <span className="text-gray-400 text-[10px] tracking-[0.2em] uppercase">by xiu.carrd.co</span>
      </div>
    </div>
  );
};

export const ChocolateBotCard = ({ avatar, name, intro, shortInfo, freeText, bulletPoints, about, mediaImages, links, navButtons, onRoleplay }: any) => {
  return (
    <div className="w-[92%] max-w-[500px] bg-pink-stripes shadow-[0_10px_60px_rgba(249,198,212,0.3)] mx-auto relative z-10 border-y-[6px] border-[#FDE2E4] text-[14px] leading-[1.5]">
      
      {/* Part A: Header */}
      <div className="relative w-full bg-pink-bars py-6 flex flex-col items-center overflow-hidden">
        {/* Banner */}
        <div className="relative z-10 bg-white lace-border-thin px-6 py-2 shadow-md mx-2">
          <h2 className="font-cursive text-xl text-[#4D2C2C] tracking-widest uppercase text-center">Welcome To...</h2>
          {/* Decorations */}
          <div className="absolute -left-6 top-1/2 -translate-y-1/2 text-xl">🌸</div>
          <div className="absolute -right-6 top-1/2 -translate-y-1/2 text-xl">🌸</div>
        </div>
        
        {/* Large Lace Divider */}
        <div className="absolute bottom-0 left-0 w-full lace-border-large z-20 translate-y-1/2"></div>
      </div>

      {/* Part B: Core Profile Box */}
      <div className="bg-[#FFF9F0] mx-4 my-6 lace-border-thin p-0.5 relative z-10">
        <div className="bg-[#FFF9F0] flex flex-col gap-0">
          
          {/* Top Section: Avatar & Links */}
          <div className="bg-[#FFF5F7] p-4 flex flex-col items-center gap-4 border-b-2 border-[#FDE2E4]">
            {/* Avatar with Frame */}
            <div className="relative w-full max-w-[200px] aspect-square">
              {/* Bow on top */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-30 text-3xl">🎀</div>
              {/* Frame */}
              <div className="absolute inset-0 z-20 lace-border-thin pointer-events-none border-[#F9C6D4] opacity-80"></div>
              {/* Image */}
              <div className="w-full h-full overflow-hidden bg-[#FFF5F7]">
                {avatar ? (
                  <img src={avatar} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#F3B4C2] text-sm">Avatar</div>
                )}
              </div>
            </div>

            {/* Social Links */}
            <div className="w-full grid grid-cols-2 gap-2">
              {links && links.slice(0, 4).map((link: string, i: number) => (
                <div key={i} className="w-full bg-[#FFF5F7] p-1 rounded-lg border border-[#FDE2E4]">
                  <div className="bg-[#FFF5F7] rounded-md border border-white border-opacity-60 px-2 py-1 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#FDE2E4] flex items-center justify-center text-[#4D2C2C] text-[10px] shrink-0">
                      {i === 0 ? '📱' : i === 1 ? '🐦' : i === 2 ? '📸' : '🔗'}
                    </div>
                    <span className="text-[#4D2C2C] text-[11px] italic font-serif truncate">{link || 'Link...'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Section: Text & Media */}
          <div className="bg-[#FFF9F0] p-4 flex flex-col gap-4">
            {/* Top Part */}
            <div className="flex flex-col gap-4">
              {/* Name & Intro */}
              <div className="flex flex-col gap-2">
                <h3 className="font-cursive text-3xl text-[#F3B4C2] drop-shadow-sm text-center">{name || 'Name'}</h3>
                {/* Ribbon Info */}
                <div className="bg-[#FDE2E4] py-1 px-4 flex justify-around items-center rounded-full shadow-inner">
                  {shortInfo && shortInfo.map((item: string, i: number) => (
                    <span key={i} className="text-[11px] text-[#4D2C2C] font-bold uppercase tracking-tighter">{item || '...'}</span>
                  ))}
                </div>
                <p className="text-[13px] text-[#4D2C2C] text-center italic leading-relaxed">
                  {intro || 'Short introduction goes here...'}
                </p>
              </div>

              {/* Free Text & Bullets */}
              <div className="flex flex-col items-center gap-2 relative">
                <div className="text-3xl opacity-80">⛱️</div>
                <p className="text-[12px] text-center text-[#4D2C2C] font-serif">
                  {freeText || 'Free text area...'}
                </p>
                {/* Bullet Points */}
                <ul className="mt-2 space-y-1 w-full">
                  {bulletPoints && bulletPoints.map((point: string, i: number) => (
                    <li key={i} className="flex items-center gap-2 text-[13px] text-[#4D2C2C]">
                      <span className="text-[#F3B4C2] shrink-0">♥</span>
                      <span className="break-words">{point || '...'}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Divider */}
            <div className="flex justify-center gap-2 py-1 opacity-40 overflow-hidden">
              {[...Array(15)].map((_, i) => <span key={i} className="text-sm">🌸</span>)}
            </div>

            {/* About Me */}
            <div className="flex flex-col gap-2">
              <h4 className="font-cursive text-xl text-[#4D2C2C]">About me</h4>
              <div className="bg-[#FFF5F7] p-3 rounded-xl shadow-inner">
                <p className="text-[13px] text-[#4D2C2C] text-justify leading-relaxed font-serif break-words">
                  {about || 'Detailed about me text...'}
                </p>
              </div>
            </div>

            {/* Media Grid */}
            <div className="grid grid-cols-4 gap-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="aspect-square bg-[#FFF5F7] rounded-lg overflow-hidden border-2 border-[#FDE2E4] shadow-sm">
                  {mediaImages && mediaImages[i] ? (
                    <img src={mediaImages[i]} alt={`Media ${i}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[8px] text-[#F9C6D4] uppercase">Media</div>
                  )}
                </div>
              ))}
            </div>

            {/* Roleplay Box */}
            {onRoleplay && (
              <div className="mt-4">
                <button 
                  onClick={onRoleplay}
                  className="w-full bg-[#FFF5F7] lace-border-thin p-4 text-[#FF69B4] font-bold text-sm flex items-center justify-center gap-4 hover:bg-[#FDE2E4] transition-all shadow-[0_4px_12px_rgba(253,226,228,0.5)] rounded-xl group"
                >
                  <PinkBow className="group-hover:rotate-12 transition-transform" />
                  <span className="tracking-[0.2em] uppercase font-serif">Vào Roleplay</span>
                  <PinkBow className="group-hover:-rotate-12 transition-transform" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Part C: Footer */}
      <div className="relative w-full bg-pink-bars py-4 flex flex-col items-center overflow-hidden">
        {/* Large Lace Divider (Top) */}
        <div className="absolute top-0 left-0 w-full lace-border-large z-20 -translate-y-1/2 rotate-180"></div>
        
        {/* Navigation Menu */}
        <div className="w-full flex flex-wrap justify-center items-center gap-3 px-4 relative z-10">
          {navButtons && navButtons.map((btn: string, i: number) => (
            <button key={i} className="bg-[#FFF9F0] border-2 border-double border-[#4D2C2C] px-4 py-1.5 text-[#4D2C2C] font-bold text-[12px] uppercase tracking-widest hover:bg-[#F9DDE3] transition-colors">
              {btn || 'Button'}
            </button>
          ))}
        </div>
        
        <p className="mt-3 text-[9px] text-[#F9C6D4] opacity-40 tracking-[0.2em] uppercase">by xiu.carrd.co</p>
      </div>
    </div>
  );
};

export const BotCardPreview = ({ 
  theme = 'pink',
  avatar, 
  name, 
  occupation, 
  hobbies, 
  appearance, 
  links, 
  about, 
  history,
  // Theme 2 specific props
  intro,
  shortInfo,
  freeText,
  bulletPoints,
  mediaImages,
  navButtons,
  isGalleryDetail = false,
  onRoleplay
}: any) => {
  return (
    <div className={`w-full flex flex-col items-center relative overflow-hidden ${isGalleryDetail ? 'mt-0' : 'mt-4'} pb-4`}>
      <div className="w-full relative">
        {/* Floating decoration (Only for Pink theme) */}
        {theme === 'pink' && (
          <div className="absolute left-0 top-[100px] z-20 opacity-80 pointer-events-none hidden sm:block">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="#F9C6D4">
              <path d="M12 2L15 8H9L12 2Z" />
              <circle cx="12" cy="12" r="4" />
              <path d="M12 22L9 16H15L12 22Z" />
              <path d="M2 12L8 9V15L2 12Z" />
              <path d="M22 12L16 15V9L22 12Z" />
            </svg>
          </div>
        )}

        {theme === 'pink' ? (
          <PinkBotCard 
            avatar={avatar} 
            name={name} 
            occupation={occupation} 
            hobbies={hobbies} 
            appearance={appearance} 
            links={links} 
            about={about} 
            history={history} 
            onRoleplay={onRoleplay}
          />
        ) : (
          <ChocolateBotCard 
            avatar={avatar}
            name={name}
            intro={intro}
            shortInfo={shortInfo}
            freeText={freeText}
            bulletPoints={bulletPoints}
            about={about}
            mediaImages={mediaImages}
            links={links}
            navButtons={navButtons}
            onRoleplay={onRoleplay}
          />
        )}
      </div>
    </div>
  );
};

const TEMPLATE_1 = `◟ Nhập tên Bot Char : 
◟ Tuổi : 
◟ Giới Tính chọn: Giới tính Nam , Nữ, LGBT : 
◟ Xu hướng Tính dục: Lưỡng Tính , Song Tính : 
◟ Ngoại hình ( Cực kỳ chi tiết ) : 
Ví dụ: Mắt , miệng, Màu mắt , khoảng cách mắt , lông mi , bọng mắt , đuôi mắt ,đầu mắt , Tóc ,màu tóc , sợi tóc, Độ dài mũi ,làn da , góc nghiêng, góc chính diện, Môi , màu môi , Thân hình, chiều cao , cánh tay , bắp tay , chân , đôi chân đôi tay , cổ , vai ... 
◟ Phong cách thời trang , người thphụ kiện, gu thẩm mỹ , kiểu quần áo 
◟ Quốc Tịch 
◟ Nơi ở hiện tại , miêu tả kỹ ngôi nhà của mình thiết kế bối cảnh xây dựng chi tiết không gian nơi ở 
◟ Nghề Nghiệp/ Sự nghiệp 
◟ Quá Khứ : 
◟ Người thân trong gia đình bao gồm bố mẹ anh chị bạn bè thân thiết 
◟ Giới Thiệu chi tiết từng người một , bối cảnh xung quanh nơi mình sống nhưng nơi bot char thường đi 
◟ Gia Cảnh: 
◟ Nghề nghiệp từng người trong gia đình 
◟ Định hướng cá nhân , Suy nghĩ tâm tư , Cách nhìn về thế giới xung quanh 
◟ MBTI & Cung Hoàng Đạo 
◟ Cột mốc cuộc đời, hành trình lớn lên 
◟ Các thành tựu nổi bật 
◟ IQ 
◟ EQ 
◟ Mục tiêu tương lai
◟ Sở thích ẩm thực , Xem phim 
◟ Sở thích 
◟ Thú Cưng : 
◟ Những tài khoảng mạng xã hội theo dõi 
◟ Những nội dung trên mạng thường xuyên xem 
◟ Tương tác xã hội: 
◟ Mức độ hòa đồng 
◟ Vẻ ngoài/ Vibe 
◟ Tự nhận thức về bản thân : 
◟ Những nghề tay trái : 
◟ Gu người yêu 
◟ Lòng nhân ái: 
◟ Tài Năng / Năng khiếu 
◟ Tâm lý 
◟ Số tiền kiếm được mỗi tháng / Mỗi năm 
◟ Mức độ uy tín 
◟ Mức độ chân thành/ chân thật, thật thà 
◟ Phản ứng với người không thích 
◟ Khi bị người lạ chạm vào 
◟ Khi làm việc gì sai / có lỗi 
◟ Thường chú ý đến những điều gì trước 
◟ Mùi hương cơ thể / Nước hoa Dùng / Mùi hương tự nhiên
◟ Các chăm sóc cơ thể 
◟ Lịch trình cá nhân/ hàng ngày`;

const TEMPLATE_2 = `◟ Tính cách : Ví dụ : Dịu Dàng, Ngọt ngào, Chiếm Hữu, Cuồng yêu , Lãng Mạn, chăm sóc, Yêu Chiều, Lạnh Lùng, Chung Thủy, Ga lăng , Tinh Tế , Thấu Hiểu, Thông Minh , Điềm Đạm , Tài Giỏi....
◟ Sở Thích/ Những điều làm bot char vui / Những điều khiển bot char hạnh phúc 
◟ Tâm lý khi yêu và trước khi yêu, trong quá trình tìm hiểu và khi đã trở thành vợ chồng 
◟ Tính cách Ẩn , Tính cách chính, tính cách hay thể hiến ra 
◟ Viết chi tiết quá trình tự khi sinh ra cho đến khi lớn lên từng khoảng thời gian và độ tuổi của bot char 
◟ Khi ăn thì sẽ như nào cách gắp đồ ăn , cách cầm đũa tư thế ngồi ăn / làm việc chi tiết , Trạng thái con người cách nói chuyện như nào: 
◟ Tư Duy 
◟ Khi gặp sự cố những chuyện không như ý muốn 
◟ những điều khiển cho bot char phát điên/ bức tức nổi giận 
◟ Những điều bot char cực kỳ ghét và không bao giờ làm 
◟ Những việc làm nào khiến bot char dễ chịu và khen ngợi? 
◟ Nhu cầu Tình dục : 
◟ Thế giới Quan , Nội tâm , Suy nghĩ 
◟ Tam Quan, Nhận thức 
◟ Những điều trong quá khứ hình thành nên tính cách hiền tại của bot char
◟ Vị trí chỗ đứng trong xã hội hoặc ước mơ sau này muốn trở thành 
◟ Thói quen khi thức dậy
◟ Thói quen trước khi ngủ
◟ Thói quen khi rảnh rỗi
◟ Thói quen khi căng thẳng
◟ Thói quen khi chờ đợi
◟ Thói quen khi đi cùng người yêu
◟ Thói quen khi ở nơi lạ
◟ Thói quen khi ở nhà một mình
◟ Thói quen khi làm việc nhóm
◟ Thói quen khi bị quan sát
◟ Phản ứng khi bị gọi tên bất ngờ
◟ Phản ứng khi bị chạm vào đột ngột
◟ Phản ứng khi nghe âm thanh lớn
◟ Phản ứng khi bị nhìn chằm chằm
◟ Phản ứng khi bị hỏi khó
◟ Phản ứng khi bị nghi ngờ
◟ Phản ứng khi bị kiểm tra
◟ Phản ứng khi bị đánh giá
◟ Phản ứng khi bị bỏ qua
◟ Phản ứng khi bị so sánh ngầm
◟ Cách nhìn nhận về bản thân
◟ Mức độ tự tin nội tâm
◟ Mức độ tự ti
◟ Hình ảnh lý tưởng của bản thân
◟ Sự mâu thuẫn bên trong
◟ Điều luôn giấu kín trong lòng
◟ Điều không dám nói ra
◟ Điều luôn tự trách
◟ Điều luôn tự hào
◟ Điều muốn thay đổi nhất
◟ Cách tiếp nhận lời khen
◟ Cách tiếp nhận lời góp ý
◟ Cách tiếp nhận chỉ trích
◟ Cách tiếp nhận thất bại
◟ Cách tiếp nhận thành công
◟ Cách tiếp nhận sự thật
◟ Cách tiếp nhận tin xấu
◟ Cách tiếp nhận tin tốt
◟ Cách tiếp nhận bất ngờ
◟ Cách tiếp nhận thay đổi
◟ Mức độ phụ thuộc cảm xúc
◟ Mức độ độc lập cảm xúc
◟ Mức độ nhạy cảm
◟ Mức độ lý trí
◟ Mức độ kiểm soát cảm xúc
◟ Mức độ dễ bị ảnh hưởng
◟ Mức độ kiên định
◟ Mức độ linh hoạt
◟ Mức độ chịu áp lực
◟ Mức độ thích nghi
◟ Khi cảm thấy bị đe dọa
◟ Khi cảm thấy bị bỏ quên
◟ Khi cảm thấy không được yêu
◟ Khi cảm thấy không đủ tốt
◟ Khi cảm thấy bị thay thế
◟ Khi cảm thấy mất kiểm soát
◟ Khi cảm thấy bị phản bội
◟ Khi cảm thấy bị lợi dụng
◟ Khi cảm thấy bị hiểu sai
◟ Khi cảm thấy bị cô lập
◟ Cách thể hiện sự dịu dàng
◟ Cách thể hiện sự chiếm hữu
◟ Cách thể hiện sự ghen
◟ Cách thể hiện sự yêu chiều
◟ Cách thể hiện sự quan tâm
◟ Cách thể hiện sự bảo vệ
◟ Cách thể hiện sự tức giận
◟ Cách thể hiện sự buồn
◟ Cách thể hiện sự nhớ
◟ Cách thể hiện sự mong muốn
◟ Khi muốn gần gũi ai đó
◟ Khi muốn giữ khoảng cách
◟ Khi muốn rời đi
◟ Khi muốn ở lại
◟ Khi muốn níu kéo
◟ Khi muốn buông bỏ
◟ Khi muốn kiểm soát
◟ Khi muốn được tự do
◟ Khi muốn được chú ý
◟ Khi muốn được yêu
◟ Cách xây dựng niềm tin
◟ Cách đánh mất niềm tin
◟ Cách giữ mối quan hệ
◟ Cách phá vỡ mối quan hệ
◟ Cách bắt đầu một mối quan hệ
◟ Cách kết thúc một mối quan hệ
◟ Cách duy trì cảm xúc
◟ Cách làm mới tình cảm
◟ Cách xử lý nhàm chán
◟ Cách giữ lửa
◟ Khi đứng trước lựa chọn tình cảm
◟ Khi đứng trước lựa chọn sự nghiệp
◟ Khi đứng trước lựa chọn gia đình
◟ Khi phải hy sinh bản thân
◟ Khi phải từ bỏ điều mình thích
◟ Khi phải làm điều mình ghét
◟ Khi bị ép buộc
◟ Khi bị điều khiển
◟ Khi bị thao túng
◟ Khi nhận ra mình sai
◟ Phản ứng khi bị phát hiện bí mật
◟ Phản ứng khi bị lật tẩy
◟ Phản ứng khi bị đe dọa
◟ Phản ứng khi bị ép nói thật
◟ Phản ứng khi bị dồn vào góc
◟ Phản ứng khi không còn đường lui
◟ Phản ứng khi mất tất cả
◟ Phản ứng khi đạt tất cả
◟ Phản ứng khi thay đổi hoàn toàn
◟ Phản ứng khi quay lại quá khứ
◟ Mối quan hệ với quyền lực
◟ Mối quan hệ với tiền bạc
◟ Mối quan hệ với danh tiếng
◟ Mối quan hệ với tình yêu
◟ Mối quan hệ với bản thân
◟ Mối quan hệ với gia đình
◟ Mối quan hệ với bạn bè
◟ Mối quan hệ với kẻ thù
◟ Mối quan hệ với xã hội
◟ Mối quan hệ với quá khứ
◟ Khi đạt được tình yêu
◟ Khi mất đi tình yêu
◟ Khi yêu sai người
◟ Khi được yêu đúng cách
◟ Khi yêu trong im lặng
◟ Khi yêu công khai
◟ Khi yêu bị cấm đoán
◟ Khi yêu đầy đủ
◟ Khi yêu thiếu thốn
◟ Khi yêu cực đoan
◟ Tốc độ phát triển tình cảm
◟ Khả năng gắn bó lâu dài
◟ Khả năng buông bỏ
◟ Khả năng tha thứ
◟ Khả năng thay đổi
◟ Khả năng trưởng thành
◟ Khả năng chịu tổn thương
◟ Khả năng chữa lành
◟ Khả năng yêu lại từ đầu
◟ Khả năng mở lòng
◟ Khi chạm giới hạn cảm xúc
◟ Khi vượt quá giới hạn chịu đựng
◟ Khi không còn kiểm soát
◟ Khi trở nên nguy hiểm
◟ Khi mất lý trí
◟ Khi quá tỉnh táo
◟ Khi đóng băng cảm xúc
◟ Khi bùng nổ cảm xúc
◟ Khi giả vờ ổn
◟ Khi thực sự gục ngã
◟ Khi yêu sâu sắc nhất
◟ Khi đau nhất
◟ Khi hạnh phúc nhất
◟ Khi cô đơn nhất
◟ Khi yếu đuối nhất
◟ Khi mạnh mẽ nhất
◟ Khi chân thật nhất
◟ Khi giả dối nhất
◟ Khi ích kỷ nhất
◟ Khi hy sinh nhất`;

const PREDEFINED_STYLES = [
  {
    id: 'style_1',
    title: 'Lãng mạn chuyên sâu',
    description: 'Phong cách lãng mạn chuyên sâu có cốt truyện sâu sắc nội dung chuyền tải rõ tình yêu của nhân vật...',
    content: `Nhìn chung, tông giọng là sự tất yếu rõ ràng, vững chắc một câu chuyện tình yêu được định hình bởi khoảng cách, sự kiên trì và niềm tin thầm lặng rằng hai cuộc đời đang cùng hướng về một chân trời\n\nMột phong cách lãng mạn tráng lệ, được định hình bởi sự tất yếu, cảm giác về khoảng cách, và sức hút thầm lặng của hai cuộc đời hội tụ tại cùng một điểm. Cảm xúc được xây dựng dần dần qua những đoạn văn và câu văn dài, không cần ẩn dụ, giải thích hay sự phô trương cảm xúc. Hành động của các nhân vật rõ ràng và có mục đích; sự lựa chọn của họ tạo nên cảm giác về định mệnh hơn là những nhãn mác kịch tính. Lối viết trong sáng, chắc chắn và rạng rỡ, cho phép quy mô của thế giới và sự kiên trì của các nhân vật tạo nên cảm giác đã được định trước`
  },
  {
    id: 'style_2',
    title: 'Lãng mạn ấm áp, kín đáo',
    description: 'Sự lãng mạn ấm áp, kín đáo, bền vững và không lay chuyển...',
    content: `Một thứ tình yêu nhẹ nhàng, ổn định và sâu lắng nảy nở trong sự tĩnh lặng của hiện diện, lòng kiên nhẫn và nhịp điệu đồng điệu của hai người. Các đoạn văn dài và mạch lạc; câu văn tuân theo một nhịp điệu tự nhiên, nhẹ nhàng hơn là kịch tính. Văn phong tránh sử dụng ẩn dụ, diễn giải và sự ngọt tô điểm. Tình yêu được bộc lộ qua sự chú ý, thời điểm và cách hai người thích nghi với sự hiện diện của nhau, chứ không phải qua sự phô trương.\n\nCác yếu tố chính\nNhững đoạn nhạc dài với nhịp điệu ổn định, không có những đoạn ngắt quãng đột ngột.\nNgôn ngữ trong sáng và giản dị, không quá ngọt ngào cũng không quá kịch tính.\nCảm xúc được thể hiện thông qua sự gần gũi, những khoảng lặng, những thói quen chung và sự hợp tác thầm lặng.\nKhông có ẩn dụ, không có nhãn mác đạo đức, và không có định nghĩa cảm xúc.\nSự căng thẳng lãng mạn được thể hiện qua những hành động nhỏ nhặt thường ngày: đưa cho ai đó một tách trà, mở cửa sổ, điều chỉnh nhịp bước của mình.\nCác nhân vật đều chân thành, giản dị và lễ phép; họ không thích kiểm soát và không dùng thủ đoạn thao túng nhằm làm hài lòng người khác.`
  },
  {
    id: 'style_3',
    title: 'Điềm tĩnh, trật tự',
    description: 'Nhìn chung, văn phong: điềm tĩnh, trật tự và tập trung sâu sắc...',
    content: `Một lối kể chuyện điềm tĩnh, mạch lạc và kiên trì, được hình thành bởi thói quen đọc, quan sát và suy nghĩ trước khi nói. Ngôn ngữ luôn ổn định và giản dị; các đoạn văn trôi chảy với những suy nghĩ dài dòng, mạch lạc, không có ẩn dụ, diễn giải hay nhãn mác cảm xúc. Các nhân vật vững vàng, lễ phép và tự chủ, bộc lộ bản thân qua những hành động có chủ đích, những điều chỉnh tinh tế và nhịp điệu trong phản ứng của họ.\n\nCác yếu tố chính\n◟Những đoạn văn dài, trôi chảy mượt mà không bị gián đoạn.Những câu văn phức tạp, dài dòng, được dẫn dắt bởi logic và sự quan sát.Không có ẩn dụ, không có định nghĩa cảm xúc, và không có giải thích phân tích nào.Các nhân vật bộc lộ ý định của mình thông qua hành vi thường nhật và ngôn ngữ chính xác.Sắc thái cảm xúc được truyền tải thông qua thời điểm, khoảng cách và sự kiềm chế.Không gian ở đây đơn giản và ngăn nắp: giấy, sách, cửa sổ và ánh sáng dịu nhẹ.`
  },
  {
    id: 'style_4',
    title: 'NSFW gợi tả',
    description: 'Văn Phong NSFW gợi tả ngôn ngữ cơ thể nơi hai trái tim cùng đồng điệu...',
    content: `- Một lối kể chuyện rạo rực nội đứng gợi cảm quyến rũ và yếu tố tình yêu mạnh thể xác hoà vào nhau tạo nên khung cảnh ái muội lơ mơ và đậm chất NSFW, những cử chỉ và lời nói đầy khiêu gợi và âm thanh gợi cảm , văn phong lột tả rõ cái sự ám muội mời gọi đó hoặc có thể là những cảnh nóng bỏng trên giường hoặc những cảnh khiêu gợi bên ngoài hay những nơi công cộng tăng thêm phần thú vị cho cặp đôi nhiều hương vị cay nồng khác nhau . Những câu từ có phần gợi tả chân thực nhất. Nói thẳng về người đó những đường cong và trần trụi nhất mà không có bất cứ sự cản trở nào. Yếu tố NSFW cao`
  },
  {
    id: 'style_5',
    title: 'Mạch lạc, chắc chắn',
    description: 'Bài luận phải mạch lạc, chắc chắn và dễ đọc. Không nên có ẩn dụ...',
    content: `Một câu chuyện mạch lạc, ổn định và sống động, được định hình bởi chuyển động thực, ánh sáng thực và sự hiện diện thầm lặng của những con người giản dị. Cảm xúc nằm ở hành động và thời điểm; văn phong tránh dùng ẩn dụ, diễn giải và bình luận đạo đức. Những đoạn văn dài trôi chảy như một hơi thở, cho phép các cảnh mở rộng với nhịp độ tự nhiên. Các nhân vật vẫn giữ được sự vững vàng, tôn trọng và tự chủ; sự thân mật của họ xuất phát từ sự mạch lạc chứ không phải sự giả tạo.\n\nCác yếu tố chính\n◟Một đoạn văn dài được xây dựng dựa trên sự quan sát và hành động liên tục.\n◟Những câu dài dòng chỉ tập trung vào diễn biến câu chuyện chứ không đi sâu vào phân tích.\n◟Không có ẩn dụ, không có khuôn khổ biểu tượng, và không có nhãn mác cảm xúc.\nTính cách nhân vật được khắc họa thông qua dáng đi, tư thế và những lựa chọn của họ.\n◟Bối cảnh được định hình bởi ánh sáng tự nhiên, âm thanh, nhiệt độ và sự hiện diện vật lý.\n◟Lời thoại mang tính tối giản và điềm tĩnh, được hình thành từ những tình huống thực tế.`
  },
  {
    id: 'style_6',
    title: 'Điềm tĩnh, hiện diện liên tục',
    description: 'Tổng thể giọng văn: điềm tĩnh, sự hiện diện liên tục; những câu và đoạn văn dài...',
    content: `Một lối kể chuyện chậm rãi, liên tục và lặng lẽ trôi chảy như một dòng sông êm đềm. Văn phong dựa trên những đoạn văn và câu dài, theo nhịp điệu tự nhiên của sự quan sát và hành động. Không có ẩn dụ, không có nhãn mác cảm xúc, không có lời giải thích. Các nhân vật gần gũi với môi trường xung quanh, phản ứng thông qua những lựa chọn tinh tế, những khoảng lặng và sự chuyển hướng chú ý. Cảm xúc được bộc lộ thông qua nhịp điệu, thời điểm và sự hiện diện thể chất hơn là qua lời nói.\n\nCác yếu tố chính\n◟Một lối đi dài, không bị cản trở.\n◟Câu văn dài với sự chuyển tiếp nhẹ nhàng và những thay đổi tinh tế.\n◟Không có ẩn dụ, không có ngôn ngữ biểu tượng, và không có khung trang trí.\n◟Tính cách nhân vật được bộc lộ thông qua cử động, sự do dự và việc di chuyển trong không gian.\n◟Cảm xúc bắt nguồn từ sự điều chỉnh hành động, hơi thở, khoảng cách và sự tĩnh lặng.\nCuộc trò chuyện diễn ra ngắn gọn, bình tĩnh và hơi chậm trễ.`
  },
  {
    id: 'style_7',
    title: 'Chủ nghĩa hiện thực trong sáng',
    description: 'Một chủ nghĩa hiện thực trong sáng và ổn định: những đoạn văn dài...',
    content: `Một phong cách rõ ràng, tĩnh lặng và không cầu kỳ, được xây dựng từ những đoạn văn dài, câu văn đơn giản và hành động cụ thể. Không có ẩn dụ, không có giải thích, không có bình luận. Cảm xúc được bộc lộ qua cử chỉ, thời điểm, khoảng cách và sự im lặng.\n\nCác yếu tố chính\n◟Một đoạn nhạc dài, trôi chảy đều đặn như một hơi thở.\n◟Ngôn ngữ trực tiếp; không dùng ẩn dụ, không dùng từ ngữ mang tính biểu tượng.\n◟Tính cách nhân vật được bộc lộ qua những hành động tinh tế và giọng điệu.\n◟Cảm xúc được thể hiện qua hành động, chứ không phải qua lời nói.\n◟Đoạn đối thoại ngắn gọn và tự nhiên, nhưng hơi thiếu sót.\n◟Các cảnh quay được dựa trên ánh sáng, chuyển động và không gian thực tế.`
  },
  {
    id: 'style_8',
    title: 'Mạch lạc, hành động mạnh mẽ',
    description: 'Hãy viết với câu dài, đoạn văn dài, ngôn ngữ mạch lạc và hành động mạnh mẽ...',
    content: `bản chất cốt lõi\nVăn phong rõ ràng, ổn định, ấm áp nhẹ nhàng được xây dựng trên những câu và đoạn văn dài, mạch lạc. Văn phong vẫn trong sáng và chắc chắn; không sử dụng ẩn dụ, định nghĩa cảm xúc hay những lời hoa mỹ kịch tính. Các nhân vật nói và hành động với sự chân thành, tôn trọng và tập trung tĩnh lặng. Bầu không khí vẫn đơn giản, ngăn nắp và gần gũi với đời sống thực.\n\nCác yếu tố chính\n◟Câu dài truyền tải ý tưởng và diễn biến một cách mạch lạc; đoạn văn duy trì tính liên tục và thống nhất.\n◟Không có ẩn dụ, không có cử chỉ mang tính biểu tượng, và không có những câu nói hoa mỹ.\n◟Không có sự diễn giải về mặt cảm xúc; chỉ có những hành động, thời điểm và hơi thở có thể quan sát được.\n◟Thể hiện sự quan tâm thông qua hành động: lắng nghe, chú ý, điều chỉnh và hỗ trợ kịp thời.\n◟Giọng điệu vẫn giữ được sự trong trẻokhông hề có vẻ hào nhoáng giả tạo hay sự ấm áp khoa trương.\n◟Sự tồn tại ổn định; các nhân vật không thống trị, không kịch tính và không kiểm soát.`
  },
  {
    id: 'style_9',
    title: 'Trong sáng, ổn định và chắc chắn',
    description: 'Văn phong trong sáng, ổn định và chắc chắn đoạn văn dài, câu dài...',
    content: `Một lối kể chuyện tĩnh lặng, tiết chế và rõ ràng, được xây dựng từ những đoạn văn dài và những câu văn mạch lạc, trôi chảy theo dòng suy nghĩ. Văn phong tránh sử dụng ẩn dụ, định nghĩa cảm xúc và diễn giải, cho phép ý nghĩa hiện lên thông qua hành động, giọng điệu và nhịp điệu. Các nhân vật được khắc họa rõ nét, vững chắc và tự chủ; không có gì mang tính trình diễn hay tô điểm. Cảm xúc được thể hiện qua những khoảng lặng, cử chỉ và cách ứng xử thầm lặng giữa các nhân vật.\n\nCác yếu tố chính\n◟Hãy theo dõi suy nghĩ như một chuỗi chuyển động liên tục dài.\n◟Câu dài với hơi thở tự nhiên và nhịp điệu nội tại.\n◟Không có ẩn dụ, không có so sánh mang tính biểu tượng, và không có khung cảnh ủy mị.\n◟Không có nhãn cảm xúc rõ ràng; cảm xúc được thể hiện qua hành động của nhân vật.\nCác nhân vật được khắc họa rõ nét và tôn trọng, không có sự áp đặt hay diễn xuất.\nCảnh quay dựa vào các yếu tố chân thực như ánh sáng, khoảng cách, tư thế và âm thanh trong phòng.`
  },
  {
    id: 'style_10',
    title: 'Quan sát nhiều hơn tranh luận',
    description: 'Một loại văn học tránh việc tuyên bố ý nghĩa, mà cho phép ý nghĩa đó tự bộc lộ...',
    content: `bản chất cốt lõi\nVăn phong tường thuật điềm tĩnh, rõ ràng và sâu sắc, tập trung vào trải nghiệm của con người, xung đột đạo đức, các thế lực xã hội và chiều sâu tâm lý. Các bài luận ưa chuộng những câu và đoạn văn dài, cho phép suy nghĩ được triển khai liền mạch. Chúng tránh các định nghĩa, giải thích và tuyên bố khái niệm; ý nghĩa được truyền tải thông qua các chi tiết của cuộc sống, sự diễn tiến của các cảnh và sự căng thẳng ngầm hơn là bình luận trực tiếp.\n\nCác yếu tố chính\n◟Rõ ràng và tiết chế.\n◟Gánh nặng của đạo đức và xã hội.\n◟Sự thấu hiểu tâm lý.\n◟Nhận thức về lịch sử và cấu trúc.\n◟Một giọng điệu trầm tư.\n◟Logic, nhịp điệu được kiểm soát.\n◟Những cảm xúc thầm lặng nhưng sâu sắc.\n◟Những câu chuyện không kèm lời giải thích sự hiểu biết đến từ quan sát, không phải từ định nghĩa.`
  },
  {
    id: 'style_11',
    title: 'Ổn định, trang trọng và bền bỉ',
    description: 'Một phong cách văn xuôi được định hình bởi những câu dài, đoạn văn kiên nhẫn...',
    content: `Một lối kể chuyện trang trọng, cân bằng và vượt thời gian, nhấn mạnh trọng lượng đạo đức, chiều sâu tâm lý và cấu trúc mạch lạc. Cảm xúc được kiềm chế; ngôn ngữ chính xác; ý nghĩa được phát triển qua những đoạn văn dài, sâu sắc và những câu văn tự nhiên, cho phép hình ảnh, cử chỉ và bối cảnh tự nói lên ý nghĩa của chúng thay vì những lời giải thích trực tiếp hoặc định nghĩa khái niệm. Câu chuyện mang tính trang trọng riêng thông qua sự tiến triển chứ không phải lời bình luận.\n\nCác yếu tố chính\n◟Những câu văn thể hiện sự cân bằng và cảm giác kiến trúc.\n◟Sự hấp dẫn giữa đạo đức và cảm xúc.\n◟Hình ảnh mang tính biểu tượng nhưng cũng rất sâu sắc.\n◟Sự tự vấn sâu sắc dựa trên những trải nghiệm sống cụ thể.\n◟Bối cảnh xã hội hoặc lịch sử định hình hành vi.\n◟Những cảm xúc được kiểm soát, điều độ và vang vọng một cách nhẹ nhàng.`
  },
  {
    id: 'style_12',
    title: 'Sống động, bồn chồn, đậm chất con người',
    description: 'Tổng thể: sống động, bồn chồn, đậm chất con người - những câu chữ như đang thở...',
    content: `Một phong cách sống động, giàu hành động, được định hình bởi hơi thở, nhịp điệu và sự hỗn loạn thầm lặng của cuộc sống thực. Văn xuôi trôi chảy qua những đoạn văn dài, theo dòng suy nghĩ, trong khi những câu ngắn xen vào như những sự gián đoạn thực sự. Cảm xúc không được gọi tên; chúng xuất hiện trong sự do dự, giọng điệu, sự mâu thuẫn, hoặc cách ai đó với lấy một chiếc cốc mà không nhìn.\n\nCác yếu tố chính\n◟Hành động quan trọng hơn chi tiết.\n◟Các đoạn văn dài với cấu trúc nhịp điệu khác nhau về độ dài câu.\n◟Hãy chấp nhận những mâu thuẫn và đừng can thiệp để chúng được sửa chữa.\n◟Các đối tượng được sử dụng như một đặc điểm thông thường, chứ không phải như những biểu tượng.\n◟Nơi này mang lại cảm giác như một không gian sống của con người.\n◟Cảm xúc được truyền tải thông qua thời điểm, sự né tránh và giọng điệu`
  }
];

export default function Tab1CreateBot({ onSaveComplete }: { onSaveComplete?: () => void }) {
  const [savedCards, setSavedCards] = useState<any[]>([]);
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null);

  const [id, setId] = useState<string | null>(null);
  const [prompts, setPrompts] = useState<any[]>([]);

  const [info, setInfo] = useState(TEMPLATE_1);
  const [personality, setPersonality] = useState(TEMPLATE_2);
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [customStyle, setCustomStyle] = useState('');
  
  // Card states
  const [cardAvatar, setCardAvatar] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardOccupation, setCardOccupation] = useState('');
  const [cardHobbies, setCardHobbies] = useState('');
  const [cardAppearance, setCardAppearance] = useState('');
  const [cardAbout, setCardAbout] = useState('');
  const [cardHistory, setCardHistory] = useState('');
  const [cardTheme, setCardTheme] = useState('pink');
  const [cardIntro, setCardIntro] = useState('');
  const [cardShortInfo, setCardShortInfo] = useState<string[]>(["", "", ""]);
  const [cardFreeText, setCardFreeText] = useState('');
  const [cardBulletPoints, setCardBulletPoints] = useState<string[]>(["", "", "", ""]);
  const [cardMediaImages, setCardMediaImages] = useState<string[]>(["", "", "", ""]);
  const [cardNavButtons, setCardNavButtons] = useState<string[]>(["Home", "Interests", "Art Comms"]);
  const [cardLinks, setCardLinks] = useState<string[]>(["", "", ""]);
  const [cardStoryOpening, setCardStoryOpening] = useState('');
  const [introMainImage, setIntroMainImage] = useState('');
  const [introSideImages, setIntroSideImages] = useState<string[]>([]);

  const [isSaved, setIsSaved] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('Đã lưu thiết lập Bot Char thành công!');
  const [isLoaded, setIsLoaded] = useState(false);

  // Load initial data from IndexedDB
  useEffect(() => {
    const init = async () => {
      const cards = await loadCards();
      setSavedCards(cards);

      const savedIndex = localStorage.getItem('banhnho_bot_card_selected_index');
      const index = savedIndex !== null ? parseInt(savedIndex, 10) : null;
      setSelectedCardIndex(index);

      const draftInfo = await loadDraft('info');
      if (draftInfo !== undefined) setInfo(draftInfo);
      
      const draftPersonality = await loadDraft('personality');
      if (draftPersonality !== undefined) setPersonality(draftPersonality);

      const draftStyles = await loadDraft('style_selected');
      if (draftStyles !== undefined) setSelectedStyles(draftStyles);

      const draftCustomStyle = await loadDraft('style_custom');
      if (draftCustomStyle !== undefined) setCustomStyle(draftCustomStyle);

      const draftAvatar = await loadDraft('card_avatar');
      if (draftAvatar !== undefined) setCardAvatar(draftAvatar);

      const draftName = await loadDraft('card_name');
      if (draftName !== undefined) setCardName(draftName);

      const draftOccupation = await loadDraft('card_occupation');
      if (draftOccupation !== undefined) setCardOccupation(draftOccupation);

      const draftHobbies = await loadDraft('card_hobbies');
      if (draftHobbies !== undefined) setCardHobbies(draftHobbies);

      const draftAppearance = await loadDraft('card_appearance');
      if (draftAppearance !== undefined) setCardAppearance(draftAppearance);

      const draftAbout = await loadDraft('card_about');
      if (draftAbout !== undefined) setCardAbout(draftAbout);

      const draftHistory = await loadDraft('card_history');
      if (draftHistory !== undefined) setCardHistory(draftHistory);

      const draftTheme = await loadDraft('card_theme');
      if (draftTheme !== undefined) setCardTheme(draftTheme);

      const draftIntro = await loadDraft('card_intro');
      if (draftIntro !== undefined) setCardIntro(draftIntro);

      const draftShortInfo = await loadDraft('card_short_info');
      if (draftShortInfo !== undefined) setCardShortInfo(draftShortInfo);

      const draftFreeText = await loadDraft('card_free_text');
      if (draftFreeText !== undefined) setCardFreeText(draftFreeText);

      const draftBulletPoints = await loadDraft('card_bullet_points');
      if (draftBulletPoints !== undefined) setCardBulletPoints(draftBulletPoints);

      const draftMediaImages = await loadDraft('card_media_images');
      if (draftMediaImages !== undefined) setCardMediaImages(draftMediaImages);

      const draftNavButtons = await loadDraft('card_nav_buttons');
      if (draftNavButtons !== undefined) setCardNavButtons(draftNavButtons);

      const draftLinks = await loadDraft('card_links');
      if (draftLinks !== undefined) setCardLinks(draftLinks);

      const draftStoryOpening = await loadDraft('card_story_opening');
      if (draftStoryOpening !== undefined) setCardStoryOpening(draftStoryOpening);

      const draftIntroMainImage = await loadDraft('intro_main_image');
      if (draftIntroMainImage !== undefined) setIntroMainImage(draftIntroMainImage);

      const draftIntroSideImages = await loadDraft('intro_side_images');
      if (draftIntroSideImages !== undefined) setIntroSideImages(draftIntroSideImages);

      const draftPrompts = await loadDraft('card_prompts');
      if (draftPrompts !== undefined) setPrompts(draftPrompts);

      setIsLoaded(true);
    };
    init();
  }, []);

  // Save draft states to IndexedDB
  useEffect(() => { if (isLoaded) saveDraft('info', info); }, [info, isLoaded]);
  useEffect(() => { if (isLoaded) saveDraft('personality', personality); }, [personality, isLoaded]);
  useEffect(() => { if (isLoaded) saveDraft('style_selected', selectedStyles); }, [selectedStyles, isLoaded]);
  useEffect(() => { if (isLoaded) saveDraft('style_custom', customStyle); }, [customStyle, isLoaded]);
  
  // Card effects
  useEffect(() => { if (isLoaded) saveDraft('card_avatar', cardAvatar); }, [cardAvatar, isLoaded]);
  useEffect(() => { if (isLoaded) saveDraft('card_name', cardName); }, [cardName, isLoaded]);
  useEffect(() => { if (isLoaded) saveDraft('card_occupation', cardOccupation); }, [cardOccupation, isLoaded]);
  useEffect(() => { if (isLoaded) saveDraft('card_hobbies', cardHobbies); }, [cardHobbies, isLoaded]);
  useEffect(() => { if (isLoaded) saveDraft('card_appearance', cardAppearance); }, [cardAppearance, isLoaded]);
  useEffect(() => { if (isLoaded) saveDraft('card_about', cardAbout); }, [cardAbout, isLoaded]);
  useEffect(() => { if (isLoaded) saveDraft('card_history', cardHistory); }, [cardHistory, isLoaded]);
  useEffect(() => { if (isLoaded) saveDraft('card_theme', cardTheme); }, [cardTheme, isLoaded]);
  useEffect(() => { if (isLoaded) saveDraft('card_intro', cardIntro); }, [cardIntro, isLoaded]);
  useEffect(() => { if (isLoaded) saveDraft('card_short_info', cardShortInfo); }, [cardShortInfo, isLoaded]);
  useEffect(() => { if (isLoaded) saveDraft('card_free_text', cardFreeText); }, [cardFreeText, isLoaded]);
  useEffect(() => { if (isLoaded) saveDraft('card_bullet_points', cardBulletPoints); }, [cardBulletPoints, isLoaded]);
  useEffect(() => { if (isLoaded) saveDraft('card_media_images', cardMediaImages); }, [cardMediaImages, isLoaded]);
  useEffect(() => { if (isLoaded) saveDraft('card_nav_buttons', cardNavButtons); }, [cardNavButtons, isLoaded]);
  useEffect(() => { if (isLoaded) saveDraft('card_links', cardLinks); }, [cardLinks, isLoaded]);
  useEffect(() => { if (isLoaded) saveDraft('card_story_opening', cardStoryOpening); }, [cardStoryOpening, isLoaded]);
  useEffect(() => { if (isLoaded) saveDraft('intro_main_image', introMainImage); }, [introMainImage, isLoaded]);
  useEffect(() => { if (isLoaded) saveDraft('intro_side_images', introSideImages); }, [introSideImages, isLoaded]);
  useEffect(() => { if (isLoaded) saveDraft('card_prompts', prompts); }, [prompts, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      if (selectedCardIndex !== null) {
        localStorage.setItem('banhnho_bot_card_selected_index', selectedCardIndex.toString());
      } else {
        localStorage.removeItem('banhnho_bot_card_selected_index');
      }
    }
  }, [selectedCardIndex, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      const match = info.match(/◟Tên:\s*(.*)/i);
      if (match && match[1] && match[1].trim()) {
        setCardName(match[1].trim());
      }
    }
  }, [info, isLoaded]);

  useEffect(() => {
    const combinedStyle = [
      ...selectedStyles.map(id => PREDEFINED_STYLES.find(s => s.id === id)?.content).filter(Boolean),
      customStyle
    ].filter(Boolean).join('\n\n');
    if (isLoaded) saveDraft('bot_style', combinedStyle);
  }, [selectedStyles, customStyle, isLoaded]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const base64 = await compressImage(file);
        setter(base64);
      } catch (error) {
        console.error("Compression failed:", error);
      }
    }
  };

  const handleSelectCard = (index: number) => {
    const card = savedCards[index];
    if (card) {
      setCardAvatar(card.avatar || '');
      setCardName(card.name || '');
      setCardOccupation(card.occupation || '');
      setCardHobbies(card.hobbies || '');
      setCardAppearance(card.appearance || '');
      setCardAbout(card.about || '');
      setCardHistory(card.history || '');
      setCardTheme(card.theme || 'pink');
      setCardIntro(card.intro || '');
      setCardShortInfo(card.shortInfo || ["", "", ""]);
      setCardFreeText(card.freeText || '');
      setCardBulletPoints(card.bulletPoints || ["", "", "", ""]);
      setCardMediaImages(card.mediaImages || ["", "", "", ""]);
      setCardNavButtons(card.navButtons || ["Home", "Interests", "Art Comms"]);
      setCardLinks(card.links || ["", "", ""]);
      setCardStoryOpening(card.storyOpening || '');
      setIntroMainImage(card.introMainImage || '');
      setIntroSideImages(card.introSideImages || []);
      
      // Load detailed info if available
      if (card.info) setInfo(card.info);
      if (card.personality) setPersonality(card.personality);
      if (card.selectedStyles) setSelectedStyles(card.selectedStyles);
      if (card.customStyle) setCustomStyle(card.customStyle);
      
      setSelectedCardIndex(index);
    }
  };

  const handleCreateNewCard = () => {
    setCardAvatar('');
    setCardName('');
    setCardOccupation('');
    setCardHobbies('');
    setCardAppearance('');
    setCardAbout('');
    setCardHistory('');
    setCardTheme('pink');
    setCardIntro('');
    setCardShortInfo(["", "", ""]);
    setCardFreeText('');
    setCardBulletPoints(["", "", "", ""]);
    setCardMediaImages(["", "", "", ""]);
    setCardNavButtons(["Home", "Interests", "Art Comms"]);
    setCardLinks(["", "", ""]);
    setCardStoryOpening('');
    setIntroMainImage('');
    setIntroSideImages([]);
    setSelectedCardIndex(null);
  };

  const handleSave = async () => {
    await saveProcess();
    setToastMsg('Đã lưu thiết lập Bot Char thành công!');
    setIsSaved(true);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 1500);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handlePinToMemory = async () => {
    await saveProcess();
    
    // Aggregated data for Memory V3
    const botId = selectedCardIndex !== null ? (savedCards[selectedCardIndex]?.id || savedCards[selectedCardIndex]?.name) : cardName;
    const bId = botId;

    if (!bId) {
       setToastMsg('Vợ ơi, chưa có tên Bot để ghim rồi!');
       setShowToast(true);
       setTimeout(() => setShowToast(false), 2000);
       return;
    }

    const combinedStyle = [
      ...selectedStyles.map(id => PREDEFINED_STYLES.find(s => s.id === id)?.content).filter(Boolean),
      customStyle
    ].filter(Boolean).join('\n\n');

    const botCore = `
[IMMUTABLE CHARACTER CORE: ${cardName}]
- Identity: ${cardName}
- Occupation: ${cardOccupation || 'N/A'}
- Hobbies: ${cardHobbies || 'N/A'}
- Appearance: ${cardAppearance || 'N/A'}
- About: ${cardAbout || 'N/A'}
- Character History: ${cardHistory || 'N/A'}
- Detailed Info (Tab 1 - Ô 1): ${info || 'N/A'}
- Character Personality (Tab 1 - Ô 2): ${personality || 'N/A'}
- Writing Style (Tab 1 - Ô 3): ${combinedStyle || 'N/A'}
- Story Opening: ${cardStoryOpening || ''}
- Lore & Background (Intro): ${cardIntro || ''}
- Brief Info: ${cardShortInfo.filter(Boolean).join(' | ')}
- Special Notes (Free Text): ${cardFreeText || ''}
- Key Attributes (Bullet Points): ${cardBulletPoints.filter(Boolean).join(', ')}
`.trim();

    // Load existing memory or create new
    const existingMemory = await loadDraft(`memory_v3_${bId}`) || {
      eternalCore: '',
      arcSummary: '',
      userProfileMemory: '',
      relationshipState: 'Người lạ',
      currentScene: 'Bắt đầu cuộc hành trình',
      extendedMemory: '',
      eternalFacts: [],
      longTermSummaries: [],
      hotMemory: [],
      slidingBuffer: [],
      systemPrompt: ''
    };

    const updatedMemory = {
      ...existingMemory,
      eternalCore: botCore,
      selectedStyles: selectedStyles,
      prompts: prompts,
      // Store current bot state directly in memory too for redundancy
      lastSyncBot: {
        id: bId,
        name: cardName,
        occupation: cardOccupation,
        hobbies: cardHobbies,
        appearance: cardAppearance,
        about: cardAbout,
        history: cardHistory,
        info: info,
        personality: personality,
        customStyle: customStyle,
        selectedStyles: selectedStyles,
        cardIntro,
        cardShortInfo,
        cardFreeText,
        cardBulletPoints,
        cardStoryOpening,
        prompts: prompts
      }
    };

    await saveDraft(`memory_v3_${bId}`, updatedMemory);

    setToastMsg('Đã ghim toàn bộ Profile vào Trí nhớ & context ngữ cảnh! 💕');
    setIsPinned(true);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
    setTimeout(() => setIsPinned(false), 4000);
  };

  const handleQuickPin = async (fieldName: string) => {
    setToastMsg(`Đang ghim nhanh ${fieldName}...`);
    setShowToast(true);
    await handlePinToMemory();
  };

  const saveProcess = async () => {
    try {
      const currentCards = [...savedCards];
      const newCard = {
        avatar: cardAvatar,
        name: cardName,
        occupation: cardOccupation,
        hobbies: cardHobbies,
        appearance: cardAppearance,
        about: cardAbout,
        history: cardHistory,
        theme: cardTheme,
        intro: cardIntro,
        shortInfo: cardShortInfo,
        freeText: cardFreeText,
        bulletPoints: cardBulletPoints,
        mediaImages: cardMediaImages,
        navButtons: cardNavButtons,
        links: cardLinks,
        storyOpening: cardStoryOpening,
        introMainImage: introMainImage,
        introSideImages: introSideImages,
        // Detailed info for AI
        info: info,
        personality: personality,
        selectedStyles: selectedStyles,
        customStyle: customStyle,
        prompts: prompts
      };

      if (selectedCardIndex !== null) {
        currentCards[selectedCardIndex] = newCard;
      } else {
        currentCards.push(newCard);
        setSelectedCardIndex(currentCards.length - 1);
      }
      
      setSavedCards(currentCards);
      await saveCards(currentCards);
      
      // Explicitly save the aggregated style for memory
      const combinedStyle = [
        ...selectedStyles.map(id => PREDEFINED_STYLES.find(s => s.id === id)?.content).filter(Boolean),
        customStyle
      ].filter(Boolean).join('\n\n');
      await saveDraft('bot_style', combinedStyle);
      
    } catch (e) {
      console.error("Failed to save card", e);
    }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-8 pb-24 font-sans text-[#8A7D85]">
      {/* Header */}
      <div className="text-center space-y-2 mb-8 relative">
        <h2 className="text-3xl font-bold text-[#8A7D85] drop-shadow-[0_0_12px_rgba(249,198,212,0.35)]">Tạo Bot Char Chuyên Nghiệp</h2>
        <p className="text-[#9E919A] opacity-80">Thiết lập chi tiết nhân vật của bạn</p>
        <button 
          onClick={() => onSaveComplete && onSaveComplete()}
          className="absolute top-0 right-0 bg-white/80 backdrop-blur-md px-4 py-2 rounded-xl text-sm font-bold text-[#F3B4C2] shadow-sm border border-[#F9C6D4] hover:bg-[#FDF2F5] transition-colors"
        >
          Xem Trưng Bày Thẻ
        </button>
      </div>

      {/* Theme Selection - Thanh thẻ 1 & 2 */}
      <div className="bg-[rgba(255,255,255,0.65)] backdrop-blur-md border border-[rgba(249,221,227,0.5)] shadow-[0_4px_20px_rgba(228,219,214,0.4)] rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[#F9C6D4] opacity-10 mix-blend-soft-light pointer-events-none"></div>
        <h3 className="text-xl font-bold text-[#8A7D85] mb-4 flex items-center gap-2 relative z-10">
          <span className="bg-[#F3C6D1]/50 px-3 py-1 rounded-lg shadow-sm text-sm">CHỌN KIỂU KHUNG</span>
        </h3>
        <div className="flex flex-col sm:flex-row gap-4 relative z-10">
          <button 
            onClick={() => setCardTheme('pink')}
            className={`flex-1 py-4 rounded-2xl border-2 transition-all font-bold text-lg flex flex-col items-center gap-1 ${
              cardTheme === 'pink' 
                ? 'bg-[#F9C6D4] border-[#F3B4C2] text-white shadow-[0_0_15px_rgba(249,198,212,0.5)] scale-[1.02]' 
                : 'bg-white border-gray-200 text-gray-400 hover:border-[#F9C6D4] hover:bg-[#FDF2F5]'
            }`}
          >
            <span>Thanh thẻ 1</span>
            <span className="text-xs font-normal opacity-80">Phong cách Pink Gothic</span>
          </button>
          <button 
            onClick={() => setCardTheme('chocolate')}
            className={`flex-1 py-4 rounded-2xl border-2 transition-all font-bold text-lg flex flex-col items-center gap-1 ${
              cardTheme === 'chocolate' 
                ? 'bg-[#4D2C2C] border-[#3D1F1F] text-[#F9C6D4] shadow-[0_0_15px_rgba(77,44,44,0.3)] scale-[1.02]' 
                : 'bg-white border-gray-200 text-gray-400 hover:border-[#4D2C2C] hover:bg-[#F5F1F1]'
            }`}
          >
            <span>Thanh thẻ 2</span>
            <span className="text-xs font-normal opacity-80">Phong cách Chocolate Lolita</span>
          </button>
        </div>
      </div>

      {/* Card Management */}
      <div className="bg-[rgba(255,255,255,0.65)] backdrop-blur-md border border-[rgba(249,221,227,0.5)] shadow-[0_4px_20px_rgba(228,219,214,0.4)] rounded-2xl p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[#F9C6D4] opacity-10 mix-blend-soft-light pointer-events-none"></div>
        <div className="flex items-center gap-3 overflow-x-auto pb-2 relative z-10 scrollbar-thin scrollbar-thumb-[#F9C6D4] scrollbar-track-transparent">
          <button
            onClick={handleCreateNewCard}
            className={`shrink-0 flex flex-col items-center justify-center px-4 py-2 rounded-xl border-2 border-dashed transition-all gap-1 ${
              selectedCardIndex === null 
                ? 'border-[#F3B4C2] bg-[#FDF2F5] text-[#F3B4C2] shadow-inner' 
                : 'border-[#E4D5DC] text-[#9E919A] hover:border-[#F3B4C2] hover:text-[#F3B4C2]'
            }`}
            title="Tạo thẻ mới"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            <span className="text-[10px] font-bold uppercase">Thêm Mới</span>
          </button>
          
          <div className="h-10 w-[1px] bg-[#F9C6D4]/30 shrink-0 mx-1"></div>

          {savedCards.map((card, index) => (
            <button
              key={index}
              onClick={() => handleSelectCard(index)}
              className={`shrink-0 px-5 py-3 rounded-xl font-bold text-sm transition-all shadow-sm border flex flex-col items-center gap-0.5 ${
                selectedCardIndex === index
                  ? 'bg-[#F9C6D4] text-white border-[#F3B4C2] shadow-md scale-105' 
                  : 'bg-[#FFF9C4] text-[#8A7D85] border-[#FFF59D] hover:bg-[#FFF59D]' 
              }`}
            >
              <span className="truncate max-w-[100px]">
                {selectedCardIndex === index ? (cardName || card.name || `Nhân vật ${index + 1}`) : (card.name || `Nhân vật ${index + 1}`)}
              </span>
              <span className="text-[9px] font-normal opacity-70 uppercase tracking-wider">
                {card.theme === 'chocolate' ? 'Thanh thẻ 2' : 'Thanh thẻ 1'}
              </span>
            </button>
          ))}

          {selectedCardIndex === null && (
            <div className="shrink-0 px-4 py-3 rounded-xl border border-[#F3B4C2] bg-white/50 text-[#F3B4C2] text-sm font-bold italic animate-pulse flex flex-col items-center gap-0.5">
              <span className="truncate max-w-[100px]">{cardName || 'Thẻ mới...'}</span>
              <span className="text-[9px] font-normal opacity-70 uppercase tracking-wider">
                {cardTheme === 'chocolate' ? 'Thanh thẻ 2' : 'Thanh thẻ 1'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Card 1: Thông tin cơ bản */}
      <div className="bg-[rgba(255,255,255,0.65)] backdrop-blur-md border border-[rgba(249,221,227,0.5)] shadow-[0_4px_20px_rgba(228,219,214,0.4)] rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[#F9C6D4] opacity-10 mix-blend-soft-light pointer-events-none"></div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-[#8A7D85] flex items-center gap-2 drop-shadow-[0_0_12px_rgba(249,198,212,0.35)]">
            <span className="bg-[#F3C6D1]/50 px-3 py-1 rounded-lg shadow-sm">Ô 1</span> Thông tin cơ bản & Ngoại hình
          </h3>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => handleQuickPin('Thông tin')}
              className="p-2 bg-[#F9DDE3] text-[#F3B4C2] rounded-full hover:bg-[#F3B4C2] hover:text-white transition-all shadow-sm"
              title="Ghim nhanh thông tin này vào Trí nhớ"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path></svg>
            </button>
            <button 
              onClick={() => {
                if (window.confirm('Bạn có muốn đặt lại về mẫu mặc định không?')) {
                  setInfo(TEMPLATE_1);
                }
              }}
              className="text-xs font-bold text-[#F3B4C2] bg-white/50 px-3 py-1.5 rounded-full border border-[#F9C6D4] hover:bg-white/80 transition-all"
            >
              Đặt lại mẫu
            </button>
          </div>
        </div>
        <textarea 
          value={info}
          onChange={(e) => setInfo(e.target.value)}
          className="w-full h-[400px] p-4 bg-[#F3C6D1]/50 border border-[#F3C6D1] rounded-xl text-[#8A7D85] focus:outline-none focus:ring-2 focus:ring-[#F9DDE3] resize-y opacity-85 leading-relaxed placeholder:text-[#9E919A]"
          placeholder="Nhập thông tin..."
        />
      </div>

      {/* Card 2: Tính cách */}
      <div className="bg-[rgba(255,255,255,0.65)] backdrop-blur-md border border-[rgba(249,221,227,0.5)] shadow-[0_4px_20px_rgba(228,219,214,0.4)] rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[#F9C6D4] opacity-10 mix-blend-soft-light pointer-events-none"></div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-[#8A7D85] flex items-center gap-2 drop-shadow-[0_0_12px_rgba(249,198,212,0.35)]">
            <span className="bg-[#F3C6D1]/50 px-3 py-1 rounded-lg shadow-sm">Ô 2</span> Tính cách & Tâm lý
          </h3>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => handleQuickPin('Tính cách')}
              className="p-2 bg-[#F9DDE3] text-[#F3B4C2] rounded-full hover:bg-[#F3B4C2] hover:text-white transition-all shadow-sm"
              title="Ghim nhanh tính cách này vào Trí nhớ"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path></svg>
            </button>
            <button 
              onClick={() => {
                if (window.confirm('Bạn có muốn đặt lại về mẫu mặc định không?')) {
                  setPersonality(TEMPLATE_2);
                }
              }}
              className="text-xs font-bold text-[#F3B4C2] bg-white/50 px-3 py-1.5 rounded-full border border-[#F9C6D4] hover:bg-white/80 transition-all"
            >
              Đặt lại mẫu
            </button>
          </div>
        </div>
        <textarea 
          value={personality}
          onChange={(e) => setPersonality(e.target.value)}
          className="w-full h-[400px] p-4 bg-[#F3C6D1]/50 border border-[#F3C6D1] rounded-xl text-[#8A7D85] focus:outline-none focus:ring-2 focus:ring-[#F9DDE3] resize-y opacity-85 leading-relaxed placeholder:text-[#9E919A]"
          placeholder="Nhập tính cách..."
        />
      </div>

      {/* Card 3: Phong cách viết */}
      <div className="bg-[rgba(255,255,255,0.65)] backdrop-blur-md border border-[rgba(249,221,227,0.5)] shadow-[0_4px_20px_rgba(228,219,214,0.4)] rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[#F9C6D4] opacity-10 mix-blend-soft-light pointer-events-none"></div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-[#8A7D85] flex items-center gap-2 drop-shadow-[0_0_12px_rgba(249,198,212,0.35)]">
            <span className="bg-[#F3C6D1]/50 px-3 py-1 rounded-lg shadow-sm">Ô 3</span> Phong cách viết
          </h3>
          <button 
            onClick={() => handleQuickPin('Phong cách')}
            className="p-2 bg-[#F9DDE3] text-[#F3B4C2] rounded-full hover:bg-[#F3B4C2] hover:text-white transition-all shadow-sm"
            title="Ghim nhanh phong cách này vào Trí nhớ"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path></svg>
          </button>
        </div>
        
        <div className="space-y-6 relative z-10">
          <div>
            <h4 className="font-semibold text-[#8A7D85] mb-3">Chọn phong cách viết (Có thể chọn nhiều):</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {PREDEFINED_STYLES.map((style) => (
                <div 
                  key={style.id}
                  onClick={() => {
                    setSelectedStyles(prev => 
                      prev.includes(style.id) 
                        ? prev.filter(id => id !== style.id)
                        : [...prev, style.id]
                    );
                  }}
                  className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                    selectedStyles.includes(style.id)
                      ? 'bg-[#F9DDE3] border-[#F3C6D1] shadow-md scale-[1.02]'
                      : 'bg-white/50 border-[#F3C6D1]/50 hover:bg-[#F3C6D1]/30'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-5 h-5 rounded border flex items-center justify-center mt-0.5 shrink-0 transition-colors ${
                      selectedStyles.includes(style.id) ? 'bg-[#8A7D85] border-[#8A7D85]' : 'border-[#9E919A]'
                    }`}>
                      {selectedStyles.includes(style.id) && (
                        <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <h5 className="font-bold text-[#8A7D85] text-sm mb-1">{style.title}</h5>
                      <p className="text-xs text-[#9E919A] line-clamp-2">{style.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-[#8A7D85] mb-3">Hoặc tự nhập phong cách viết của bạn:</h4>
            <textarea 
              value={customStyle}
              onChange={(e) => setCustomStyle(e.target.value)}
              className="w-full h-[200px] p-4 bg-[#F3C6D1]/50 border border-[#F3C6D1] rounded-xl text-[#8A7D85] focus:outline-none focus:ring-2 focus:ring-[#F9DDE3] resize-y opacity-85 leading-relaxed placeholder:text-[#9E919A]"
              placeholder="Nhập phong cách viết tùy chỉnh của bạn..."
            />
          </div>
        </div>
      </div>

      {/* Intro Story Section - Câu chuyện mở đầu - New Manga Style */}
      <div className="bg-[rgba(255,245,251,0.5)] border-2 border-dashed border-[#d1c4e9] rounded-[20px] p-6 font-mono shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-2 opacity-20 rotate-12">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#9c88ff" strokeWidth="1">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </div>
        
        <div className="text-center mb-5 border-b-2 border-dotted border-[#d1c4e9] pb-3 relative flex items-center justify-between px-4">
          <div className="w-8"></div>
          <div className="flex justify-center items-center gap-3">
             <div className="text-[#9c88ff] font-bold text-lg tracking-widest uppercase flex items-center gap-2">
                <span className="text-xl">ʚ</span> 
                Câu chuyện mở đầu 
                <span className="text-xl">ɞ</span>
             </div>
          </div>
          <button 
            onClick={() => handleQuickPin('Cốt truyện')}
            className="p-2 bg-[#d1c4e9]/30 text-[#9c88ff] rounded-full hover:bg-[#9c88ff] hover:text-white transition-all"
            title="Ghim nhanh cốt truyện này vào Trí nhớ"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path></svg>
          </button>
        </div>
        
        <div className="space-y-4 relative z-10">
          <div className="flex flex-row gap-4">
             <div className="flex-1 space-y-4">
                <div className="bg-white/40 border border-dashed border-[#d1c4e9] rounded-[15px] padding-0 flex flex-col">
                  <div className="text-[14px] text-[#9c88ff] py-2 text-center border-b border-dashed border-[#d1c4e9]/30 uppercase tracking-widest bg-white/20">
                    Nội dung Roleplay
                  </div>
                  <textarea 
                    value={cardStoryOpening}
                    onChange={(e) => setCardStoryOpening(e.target.value)}
                    className="w-full h-[250px] p-4 bg-transparent border-none rounded-b-[15px] text-[#2d3436] text-[13px] leading-relaxed focus:outline-none resize-none placeholder:text-[#a4b0be]"
                    placeholder="Nhập câu chuyện hoặc bối cảnh mở màn. Nội dung này sẽ xuất hiện đầu tiên trong phòng chat..."
                  />
                </div>
                <div className="flex justify-between items-center text-[10px] uppercase tracking-tighter text-[#a4b0be] font-bold px-1">
                  <span>{cardStoryOpening.length} chars</span>
                  <button 
                    onClick={() => {
                      setCardStoryOpening(`Gió mùa đông bắc khẽ rít qua những khe cửa sổ, mang theo cái lạnh tê tái của một buổi chiều Hà Nội. {{user}} đang đứng nép mình dưới hiên một quán cà phê nhỏ thì bất chợt thấy bóng dáng quen thuộc ấy bước ra từ làn sương mờ...`);
                    }}
                    className="hover:text-[#9c88ff] transition-colors"
                  >
                    ✦ Dùng mẫu ví dụ
                  </button>
                </div>
             </div>

             <div className="w-32 flex flex-col gap-3 shrink-0">
                {/* Minh họa - Main Image */}
                <label className="flex-1 border-2 border-dashed border-[#b2bec3] rounded-[15px] bg-white/60 flex flex-col items-center justify-center p-1 text-center cursor-pointer hover:bg-white/80 transition-all overflow-hidden relative group">
                   <input 
                     type="file" 
                     accept="image/*" 
                     className="hidden" 
                     onChange={(e) => handleImageUpload(e, setIntroMainImage)}
                   />
                   {introMainImage ? (
                     <>
                       <img src={introMainImage} className="w-full h-full object-cover rounded-[10px]" />
                       <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                         <span className="text-[10px] text-white font-bold uppercase">Đổi ảnh</span>
                       </div>
                     </>
                   ) : (
                     <>
                       <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#a4b0be" strokeWidth="1.5" className="mb-1">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <polyline points="21 15 16 10 5 21" />
                       </svg>
                       <span className="text-[9px] text-[#a4b0be] font-bold uppercase tracking-tighter">Minh họa</span>
                     </>
                   )}
                </label>

                {/* Ảnh phụ - Side Images */}
                <div className="flex-1 border-2 border-dashed border-[#b2bec3] rounded-[15px] bg-white/60 flex flex-col p-1 gap-1 overflow-y-auto scrollbar-none">
                   <label className="shrink-0 h-8 border border-dashed border-[#d1c4e9] rounded-lg flex items-center justify-center cursor-pointer hover:bg-[#F9F5FF]">
                      <input 
                        type="file" 
                        accept="image/*" 
                        multiple
                        className="hidden" 
                        onChange={(e) => {
                          const files = e.target.files;
                          if (files) {
                            Array.from(files).forEach(async (file) => {
                              try {
                                const base64 = await compressImage(file);
                                setIntroSideImages(prev => [...prev, base64]);
                              } catch (err) {}
                            });
                          }
                        }}
                      />
                      <span className="text-[14px] text-[#9c88ff]">✦</span>
                   </label>
                   
                   <div className="flex flex-col gap-1">
                      {introSideImages.map((img, idx) => (
                        <div key={idx} className="relative aspect-square w-full rounded-lg overflow-hidden group">
                           <img src={img} className="w-full h-full object-cover" />
                           <button 
                             onClick={() => setIntroSideImages(prev => prev.filter((_, i) => i !== idx))}
                             className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-400 text-white rounded-full flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                           >
                             ×
                           </button>
                        </div>
                      ))}
                      {introSideImages.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-2">
                           <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a4b0be" strokeWidth="1.5">
                              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                           </svg>
                           <span className="text-[8px] text-[#a4b0be] font-bold uppercase tracking-tighter mt-1">Ảnh phụ</span>
                        </div>
                      )}
                   </div>
                </div>
             </div>
          </div>
          
          <div className="text-center mt-2">
            <span className="text-[9px] text-[#d1c4e9] font-bold uppercase tracking-[0.3em]">made by @taroushop</span>
          </div>
        </div>
      </div>
      
      {/* Professional Prompt Manager Section */}
      <div className="mt-8">
        <BotPromptManager prompts={prompts} onPromptsChange={setPrompts} />
      </div>

      {/* Card 4: Thẻ Bot Character */}
      <div className="bg-[rgba(255,255,255,0.65)] backdrop-blur-md border border-[rgba(249,221,227,0.5)] shadow-[0_4px_20px_rgba(228,219,214,0.4)] rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[#F9C6D4] opacity-10 mix-blend-soft-light pointer-events-none"></div>
        <h3 className="text-xl font-bold text-[#8A7D85] mb-4 flex items-center gap-2 drop-shadow-[0_0_12px_rgba(249,198,212,0.35)]">
          <span className="bg-[#F3C6D1]/50 px-3 py-1 rounded-lg shadow-sm">Ô 4</span> Thiết kế Thẻ Bot Character
        </h3>
        
        <div className="space-y-6 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[#8A7D85] mb-2">Tên Nhân Vật</label>
                <input 
                  type="text" 
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  className="w-full p-3 bg-[#F3C6D1]/50 border border-[#F3C6D1] rounded-xl text-[#8A7D85] focus:outline-none focus:ring-2 focus:ring-[#F9DDE3] placeholder:text-[#9E919A]"
                  placeholder="Nhập tên nhân vật..."
                />
              </div>

              {cardTheme === 'pink' ? (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-[#8A7D85] mb-2">Nghề nghiệp</label>
                    <input 
                      type="text" 
                      value={cardOccupation}
                      onChange={(e) => setCardOccupation(e.target.value)}
                      className="w-full p-3 bg-[#F3C6D1]/50 border border-[#F3C6D1] rounded-xl text-[#8A7D85] focus:outline-none focus:ring-2 focus:ring-[#F9DDE3] placeholder:text-[#9E919A]"
                      placeholder="Nhập nghề nghiệp..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#8A7D85] mb-2">Sở Thích</label>
                    <input 
                      type="text" 
                      value={cardHobbies}
                      onChange={(e) => setCardHobbies(e.target.value)}
                      className="w-full p-3 bg-[#F3C6D1]/50 border border-[#F3C6D1] rounded-xl text-[#8A7D85] focus:outline-none focus:ring-2 focus:ring-[#F9DDE3] placeholder:text-[#9E919A]"
                      placeholder="Nhập sở thích..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#8A7D85] mb-2">Ngoại hình</label>
                    <input 
                      type="text" 
                      value={cardAppearance}
                      onChange={(e) => setCardAppearance(e.target.value)}
                      className="w-full p-3 bg-[#F3C6D1]/50 border border-[#F3C6D1] rounded-xl text-[#8A7D85] focus:outline-none focus:ring-2 focus:ring-[#F9DDE3] placeholder:text-[#9E919A]"
                      placeholder="Nhập ngoại hình..."
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-[#8A7D85] mb-2">Giới thiệu ngắn (Intro)</label>
                    <input 
                      type="text" 
                      value={cardIntro}
                      onChange={(e) => setCardIntro(e.target.value)}
                      className="w-full p-3 bg-[#F3C6D1]/50 border border-[#F3C6D1] rounded-xl text-[#8A7D85] focus:outline-none focus:ring-2 focus:ring-[#F9DDE3] placeholder:text-[#9E919A]"
                      placeholder="Nhập giới thiệu ngắn..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#8A7D85] mb-2">Thông tin ngắn (3 mục)</label>
                    <div className="grid grid-cols-3 gap-2">
                      {cardShortInfo.map((val, i) => (
                        <input 
                          key={i}
                          type="text" 
                          value={val}
                          onChange={(e) => {
                            const newInfo = [...cardShortInfo];
                            newInfo[i] = e.target.value;
                            setCardShortInfo(newInfo);
                          }}
                          className="w-full p-2 bg-[#F3C6D1]/50 border border-[#F3C6D1] rounded-lg text-xs text-[#8A7D85] focus:outline-none focus:ring-2 focus:ring-[#F9DDE3]"
                          placeholder={`Mục ${i+1}`}
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#8A7D85] mb-2">Đoạn văn tự do (Góc Umbrella)</label>
                    <input 
                      type="text" 
                      value={cardFreeText}
                      onChange={(e) => setCardFreeText(e.target.value)}
                      className="w-full p-3 bg-[#F3C6D1]/50 border border-[#F3C6D1] rounded-xl text-[#8A7D85] focus:outline-none focus:ring-2 focus:ring-[#F9DDE3] placeholder:text-[#9E919A]"
                      placeholder="Nhập text tự do..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#8A7D85] mb-2">Danh sách 4 dòng (Bullet points)</label>
                    <div className="space-y-2">
                      {cardBulletPoints.map((val, i) => (
                        <input 
                          key={i}
                          type="text" 
                          value={val}
                          onChange={(e) => {
                            const newPoints = [...cardBulletPoints];
                            newPoints[i] = e.target.value;
                            setCardBulletPoints(newPoints);
                          }}
                          className="w-full p-2 bg-[#F3C6D1]/50 border border-[#F3C6D1] rounded-lg text-sm text-[#8A7D85] focus:outline-none focus:ring-2 focus:ring-[#F9DDE3]"
                          placeholder={`Dòng ${i+1}`}
                        />
                      ))}
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-semibold text-[#8A7D85] mb-2">About về char</label>
                <textarea 
                  value={cardAbout}
                  onChange={(e) => setCardAbout(e.target.value)}
                  className="w-full h-[100px] p-3 bg-[#F3C6D1]/50 border border-[#F3C6D1] rounded-xl text-[#8A7D85] focus:outline-none focus:ring-2 focus:ring-[#F9DDE3] resize-y placeholder:text-[#9E919A]"
                  placeholder="Nhập about..."
                />
              </div>

              {cardTheme === 'pink' && (
                <div>
                  <label className="block text-sm font-semibold text-[#8A7D85] mb-2">Lịch sử quá khứ</label>
                  <textarea 
                    value={cardHistory}
                    onChange={(e) => setCardHistory(e.target.value)}
                    className="w-full h-[100px] p-3 bg-[#F3C6D1]/50 border border-[#F3C6D1] rounded-xl text-[#8A7D85] focus:outline-none focus:ring-2 focus:ring-[#F9DDE3] resize-y placeholder:text-[#9E919A]"
                    placeholder="Nhập lịch sử quá khứ..."
                  />
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[#8A7D85] mb-2">Ảnh Đại Diện (Tỉ lệ 1:1)</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, setCardAvatar)}
                  className="w-full text-sm text-[#8A7D85] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#F9DDE3] file:text-[#8A7D85] hover:file:bg-[#F3C6D1] cursor-pointer"
                />
              </div>

              {cardTheme === 'chocolate' && (
                <div>
                  <label className="block text-sm font-semibold text-[#8A7D85] mb-2">Ảnh Media Grid (4 ảnh)</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[0, 1, 2, 3].map((i) => (
                      <div key={i} className="space-y-1">
                        <label htmlFor={`media-upload-${i}`} className="cursor-pointer group block">
                          <div className="w-full aspect-square bg-gray-100 rounded-lg overflow-hidden border border-dashed border-gray-300 flex flex-col items-center justify-center group-hover:bg-gray-200 transition-colors">
                            {cardMediaImages[i] ? (
                              <img src={cardMediaImages[i]} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <>
                                <span className="text-[10px] text-gray-400">Ảnh {i+1}</span>
                                <span className="text-[8px] text-gray-300">Click để chọn</span>
                              </>
                            )}
                          </div>
                        </label>
                        <input 
                          id={`media-upload-${i}`}
                          type="file" 
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              try {
                                const base64 = await compressImage(file);
                                const newImages = [...cardMediaImages];
                                newImages[i] = base64;
                                setCardMediaImages(newImages);
                              } catch (err) {}
                            }
                          }}
                          className="hidden"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-[#8A7D85] mb-2">Liên kết Mạng xã hội (Tối đa 4)</label>
                <div className="space-y-2">
                  {cardLinks.map((link, i) => (
                    <input 
                      key={i}
                      type="text" 
                      value={link}
                      onChange={(e) => {
                        const newLinks = [...cardLinks];
                        newLinks[i] = e.target.value;
                        setCardLinks(newLinks);
                      }}
                      className="w-full p-2 bg-[#F3C6D1]/50 border border-[#F3C6D1] rounded-lg text-sm text-[#8A7D85] focus:outline-none focus:ring-2 focus:ring-[#F9DDE3]"
                      placeholder={`Link ${i + 1}...`}
                    />
                  ))}
                </div>
              </div>

              {cardTheme === 'chocolate' && (
                <div>
                  <label className="block text-sm font-semibold text-[#8A7D85] mb-2">Tên 3 nút điều hướng</label>
                  <div className="grid grid-cols-3 gap-2">
                    {cardNavButtons.map((val, i) => (
                      <input 
                        key={i}
                        type="text" 
                        value={val}
                        onChange={(e) => {
                          const newBtns = [...cardNavButtons];
                          newBtns[i] = e.target.value;
                          setCardNavButtons(newBtns);
                        }}
                        className="w-full p-2 bg-[#F3C6D1]/50 border border-[#F3C6D1] rounded-lg text-xs text-[#8A7D85] focus:outline-none focus:ring-2 focus:ring-[#F9DDE3]"
                        placeholder={`Nút ${i+1}`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-[#E9C9D2]/50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <h4 className="font-bold text-[#8A7D85]">Xem trước thẻ:</h4>
            {selectedCardIndex !== null && (
              <button
                onClick={async () => {
                  if (window.confirm('Bạn có chắc chắn muốn xóa thẻ này không?')) {
                    const newCards = [...savedCards];
                    newCards.splice(selectedCardIndex, 1);
                    setSavedCards(newCards);
                    await saveCards(newCards);
                    handleCreateNewCard();
                  }
                }}
                className="text-xs font-bold text-red-400 hover:text-red-600 flex items-center gap-1 bg-red-50 px-3 py-1.5 rounded-lg border border-red-100 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                Xóa thẻ hiện tại
              </button>
            )}
          </div>

          <div className="mt-4">
            <BotCardPreview 
              theme={cardTheme}
              avatar={cardAvatar}
              name={cardName}
              occupation={cardOccupation}
              hobbies={cardHobbies}
              appearance={cardAppearance}
              about={cardAbout}
              history={cardHistory}
              links={cardLinks}
              intro={cardIntro}
              shortInfo={cardShortInfo}
              freeText={cardFreeText}
              bulletPoints={cardBulletPoints}
              mediaImages={cardMediaImages}
              navButtons={cardNavButtons}
            />
          </div>
        </div>
      </div>
      
      {/* Save & Pin Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
        <button 
          onClick={handleSave}
          disabled={isSaved || isPinned}
          className={`w-full sm:w-auto px-10 py-4 text-white font-bold rounded-full shadow-md transition-all ${isSaved ? 'bg-[#4CAF50]' : 'bg-[#9E919A] hover:bg-[#8A7D85] active:scale-95'}`}
        >
          {isSaved ? '✓ Đã Lưu' : 'Lưu Dự Phòng'}
        </button>

        <button 
          onClick={handlePinToMemory}
          disabled={isPinned || isSaved}
          className={`w-full sm:w-auto px-10 py-4 text-white font-bold rounded-full shadow-[0_0_20px_rgba(243,180,194,0.6)] transition-all ${isPinned ? 'bg-[#4CAF50]' : 'bg-gradient-to-r from-[#F9C6D4] to-[#F3B4C2] hover:scale-105 active:scale-95 flex items-center gap-2'}`}
        >
          {isPinned ? '✓ Đã Ghim' : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
              Ghim vào Trí nhớ Bot
            </>
          )}
        </button>
      </div>

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2 bg-white/95 backdrop-blur-md border-2 border-[#F9C6D4] text-[#8A7D85] px-8 py-4 rounded-3xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-6 z-[200]">
          <div className="w-4 h-4 rounded-full bg-[#F3B4C2] animate-pulse shadow-[0_0_8px_#F3B4C2]"></div>
          <span className="font-bold text-lg">{toastMsg}</span>
        </div>
      )}
    </div>
  );
}
