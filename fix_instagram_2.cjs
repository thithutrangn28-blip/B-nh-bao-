const fs = require('fs');

let content = fs.readFileSync('src/components/KikokoInstagram.tsx', 'utf8');

const regexToReplace = /\/\/ Try to parse JSON from content[\s\S]*?setIsGeneratingProfile\(false\);\n    \}\n  \};/g;

const replacementCode = `// Try to parse JSON from content
      let newComments;
      try {
        newComments = robustParseJSON(content);
        if (!Array.isArray(newComments)) {
          // fallback string match
          const matches = content.match(/"([^"\\\\]|\\\\.)*"/g);
          if (matches) {
            newComments = matches.map(m => m.slice(1, -1).replace(/\\\\"/g, '"'));
          } else {
            throw new Error('Not an array');
          }
        }
      } catch (e) {
        throw new Error('Không thể phân tích dữ liệu bình luận từ API');
      }

      const commentObjects = newComments.slice(0, count).map((text: string, i: number) => ({
        id: Date.now().toString() + i,
        text
      }));

      const newPosts = activeProfile.posts.map(p => 
        p.id === postId ? { ...p, npcComments: commentObjects } : p
      );
      updateActiveProfile({ posts: newPosts });
      setGeneratingCommentsFor(null);
    } catch (e: any) {
      console.error(e);
      alert('Lỗi khi tạo bình luận NPC: ' + e.message);
      const resetPosts = activeProfile.posts.map(p => p.id === postId ? { ...p, npcComments: [] } : p);
      updateActiveProfile({ posts: resetPosts });
      setGeneratingCommentsFor(null);
    } finally {
      clearTimeout(timeoutId);
    }
  };

  const generateNPCProfile = async (npcName: string) => {
    if (!apiSettings?.apiKey) {
      alert('Vui lòng cài đặt API Key trong phần Cài đặt hệ thống');
      return;
    }
    
    setIsGeneratingProfile(true);
    
    try {
      const prompt = \`Hãy tạo dữ liệu hồ sơ Instagram giả lập cực kỳ chi tiết cho một nhân vật tên là "\${npcName}".
      YÊU CẦU DỮ LIỆU:
      1. bio: Tiểu sử cực kỳ chi tiết, thú vị, thể hiện cá tính riêng (dài khoảng 300-500 từ).
      2. followersCount: Số lượng người theo dõi (ví dụ: "10.5K", "2M", "450").
      3. followingCount: Số lượng đang theo dõi.
      4. likesCount: Tổng số lượt thích.
      5. followingList: Mảng 5-10 ID Instagram ảo mà nhân vật này đang theo dõi.
      6. posts: Mảng chứa 5-10 bài đăng ngắn gọn của nhân vật này.
      
      ĐÂY PHẢI ĐƯỢC ĐỊNH DẠNG DƯỚI DẠNG JSON OBJECT:
      {
        "bio": "...",
        "followersCount": "...",
        "followingCount": "...",
        "likesCount": "...",
        "followingList": ["...", "..."],
        "posts": ["...", "..."]
      }
      KHÔNG ĐƯỢC chứa markdown. CHỈ TRẢ VỀ JSON HỢP LỆ.\`;

      const response = await sendMessage(apiSettings, [{ role: 'user', content: prompt }]);
      const content = extractTextFromResponse(response);
      
      if (!content) throw new Error("API không trả về nội dung.");
      
      // Try to parse JSON from content
      let npcData;
      try {
        npcData = robustParseJSON(content);
      } catch (e) {
        throw new Error('Không thể phân tích dữ liệu NPC từ API');
      }

      const newProfile: Profile = {
        id: 'npc_' + Date.now(),
        name: npcName,
        avatar: \`https://api.dicebear.com/7.x/avataaars/svg?seed=\${npcName}\`,
        coverImage: '',
        bio: npcData.bio || '',
        followersCount: npcData.followersCount || '0',
        followingCount: npcData.followingCount || '0',
        likesCount: npcData.likesCount || '0',
        followingList: npcData.followingList || [],
        highlights: [],
        posts: (npcData.posts || []).map((p: string, i: number) => ({
          id: Date.now().toString() + i,
          content: p,
          bgImage: ''
        })),
        type: 'npc'
      };

      setProfiles(prev => [...prev, newProfile]);
      setActiveProfileId(newProfile.id);
      setShowAddNPC(false);
      setNewNPCName('');
    } catch (e: any) {
      console.error(e);
      alert('Lỗi khi tạo hồ sơ NPC: ' + e.message);
    } finally {
      setIsGeneratingProfile(false);
    }
  };`;

content = content.replace(regexToReplace, replacementCode);

// I noticed the `isGeneratingProfile`, `showAddNPC`, `newNPCName` declarations might already exist in the file but I just added them.
// Let's remove duplicates if they exist initially.
// Actually, I can just not redeclare them and use the existing ones if I'm not sure.
// Wait! Let's check `isGeneratingProfile` via grep!
fs.writeFileSync('src/components/KikokoInstagram.tsx', content);
