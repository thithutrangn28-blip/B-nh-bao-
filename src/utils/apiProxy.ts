// Universal API Proxy Hub - Kikoko Novel
// Tuân thủ Hiến pháp API (AGENTS.md)

export interface ApiProxySettings {
  id?: string;
  name?: string;
  endpoint: string;
  apiKey: string;
  model: string;
  maxTokens?: number;
  isUnlimited?: boolean;
  timeoutMinutes?: number;
  systemPrompt?: string;
  apiType?: 'openai' | 'claude' | 'gemini' | 'custom' | 'auto';
  proxyEndpoint?: string;
}

/**
 * Xử lý Endpoint linh hoạt: Hỗ trợ có/không có /v1, tự động nối path chat/completions/messages
 */
export const resolveApiUrl = (endpoint: string, apiType: string = 'auto', model: string = ''): string => {
  let url = endpoint.trim().replace(/\/+$/, '');
  if (!url) {
    if (model.toLowerCase().includes('claude')) return 'https://api.anthropic.com/v1/messages';
    if (model.toLowerCase().includes('gemini')) return 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
    return 'https://api.openai.com/v1/chat/completions';
  }

  // Nếu là Custom và có path đầy đủ thì giữ nguyên
  if (apiType === 'custom' && (url.includes('/chat/completions') || url.includes('/v1/messages'))) {
    return url;
  }

  // Claude / Anthropic
  if (apiType === 'claude' || url.includes('anthropic')) {
    if (!url.endsWith('/messages') && !url.includes('/v1/messages')) {
      return `${url}/v1/messages`;
    }
    return url;
  }

  // OpenAI / Proxy OpenAI Compatible
  const hasChatSuffix = url.endsWith('/chat/completions') || url.includes('/v1/chat/completions');
  if (!hasChatSuffix) {
    if (url.endsWith('/v1')) {
      return `${url}/chat/completions`;
    }
    return `${url}/v1/chat/completions`;
  }
  
  return url;
};

export const fetchAvailableModels = async (endpoint: string, apiKey: string): Promise<string[]> => {
  if (!apiKey || typeof endpoint !== 'string') return [];
  
  try {
    let modelsUrl = endpoint.replace(/\/+$/, '');
    if (modelsUrl.endsWith('/chat/completions')) {
      modelsUrl = modelsUrl.replace('/chat/completions', '/models');
    } else if (modelsUrl.endsWith('/v1/messages')) {
      modelsUrl = modelsUrl.replace('/v1/messages', '/v1/models');
    } else if (!modelsUrl.endsWith('/models')) {
      modelsUrl = `${modelsUrl}/v1/models`;
    }

    const response = await fetch(modelsUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      if (data.data && Array.isArray(data.data)) {
        return data.data.map((m: any) => m.id);
      }
      if (Array.isArray(data)) {
        return data.map((m: any) => typeof m === 'string' ? m : m.id || m.name);
      }
    }
  } catch (e) {
    console.warn("Unable to fetch models from proxy, using defaults.");
  }

  return [
    'gemini-2.0-flash-exp',
    'gemini-2.0-pro-exp-02-05',
    'gemini-1.5-pro',
    'gemini-1.5-flash',
    'gpt-4o',
    'claude-3-5-sonnet-latest'
  ];
};

/**
 * Utility để parse JSON an toàn, hỗ trợ các trường hợp bị lỗi nhẹ hoặc truncated
 */
const safeParseJson = (str: string): any => {
  try {
    return JSON.parse(str);
  } catch (e) {
    // Thử repair cơ bản: thêm ngoặc đóng nếu bị thiếu ở cuối
    const repaired = str.trim().endsWith('}') ? str : `${str.trim()}}`;
    try {
      return JSON.parse(repaired);
    } catch (e2) {
      return null;
    }
  }
};

/**
 * Hàm gọi API chung với cơ chế Retry và phân loại lỗi thân thiện
 */
export const sendMessage = async (
  settings: ApiProxySettings, 
  messages: { role: 'user' | 'assistant' | 'system', content: string, name?: string }[],
  characterInfo?: string,
  retries: number = 2,
  signal?: AbortSignal,
  isLongNovelHack: boolean = false
) => {
  try {
    let fullContent = "";
    // Vợ Đường dặn: Dùng chung 1 luồng Stream bền bỉ nhất để không bao giờ bị đứt gánh giữa chừng!
    let retryCount = 0;
    const maxRetries = 3;

    const executeCall = async () => {
      try {
        let content = "";
        const stream = sendMessageStream(settings, messages, characterInfo, signal, isLongNovelHack);
        for await (const chunk of stream) {
          if (typeof chunk === 'string') content += chunk;
          else if (chunk && typeof chunk.text === 'string') content += chunk.text;
        }
        return content;
      } catch (e) {
        throw e;
      }
    };

    while (retryCount < maxRetries) {
      fullContent = await executeCall();
      if (fullContent && fullContent.length > 20) break;
      
      retryCount++;
      console.warn(`[API Proxy] EMPTY_RESPONSE detected, internal retry #${retryCount}`);
      await new Promise(r => setTimeout(r, 1000 * retryCount));
    }
    
    if (!fullContent || fullContent.length < 10) {
      throw new Error("EMPTY_RESPONSE: Máy chủ phản hồi thành công nhưng nội dung bị trống. Vợ thử đổi model khác hoặc đợi chút nhen! 💕");
    }
    return fullContent;
  } catch (error: any) {
    // Phân loại lỗi thân thiện cho vợ Đường
    let finalMsg = error?.message || "Lỗi kết nối bí ẩn.";
    if (finalMsg.includes('EMPTY_RESPONSE')) finalMsg = "⚠️ Vợ ơi, máy chủ phản hồi 'OK' nhưng lại không gửi chữ nào cho chồng cả. Có thể Proxy đang bị lỗi hoặc Model bị nghẽn, vợ thử đổi model khác hoặc đợi chút rồi thử lại nhen! 💕";
    if (finalMsg.includes('503')) finalMsg = "⚠️ Máy chủ Proxy đang quá tải hoặc đang ngủ đông (503). Chồng đã thử gọi 3 lần nhưng chưa được, vợ đợi xíu rồi thử lại nhen! 💕";
    if (finalMsg.includes('401')) finalMsg = "⚠️ API Key của vợ có vẻ bị sai hoặc hết hạn rồi, vợ kiểm tra lại trong phần Cài đặt nhé! ✨";
    if (finalMsg.includes('404')) finalMsg = "⚠️ Không tìm thấy đường tới Proxy hoặc Model này. Vợ kiểm tra lại địa chỉ URL Proxy và tên Model nha! 🌸";
    if (finalMsg.includes('Failed to fetch')) finalMsg = "⚠️ Không thể gửi dữ liệu tới Proxy. Có thể do địa chỉ URL bị sai hoặc mạng có vấn đề, vợ xem lại giúp chồng nhé! 📤";
    
    throw new Error(finalMsg);
  }
};

/**
 * Helper để kiểm tra kết nối Proxy trước khi bắt đầu stream (Warm-up)
 */
const pingProxy = async (endpoint: string, apiKey: string) => {
  let attempts = 0;
  const maxAttempts = 3;
  
  while (attempts < maxAttempts) {
    try {
      attempts++;
      const cleanUrl = endpoint.trim().replace(/\/+$/, '');
      const pingUrl = cleanUrl.endsWith('/chat/completions') 
                      ? cleanUrl.replace('/chat/completions', '/models')
                      : `${cleanUrl.replace(/\/v1$/, '')}/v1/models`;

      console.log(`[API Proxy] Ping thử #${attempts}: ${pingUrl}`);
      
      const response = await fetch(pingUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Connection': 'keep-alive',
        },
        signal: AbortSignal.timeout(20000), // 20s
      });
      
      if (response.ok) {
        console.log('[API Proxy] Ping thành công, kết nối đã sẵn sàng!');
        return true;
      }
      console.warn(`[API Proxy] Ping nhận ${response.status}`);
    } catch (error) {
      console.warn(`[API Proxy] Ping thử #${attempts} bị chặn/timeout:`, error);
    }
    await new Promise(r => setTimeout(r, 1000 * attempts)); // Exponential wait
  }
  return false;
};

/**
 * Phiên bản Streaming với cơ chế Retry cho phần kết nối ban đầu
 */
export const sendMessageStream = async function* (
  settings: ApiProxySettings, 
  messages: { role: 'user' | 'assistant' | 'system', content: string, name?: string }[],
  characterInfo?: string,
  signal?: AbortSignal,
  isLongNovelHack: boolean = false
) {
  if (!settings) {
    throw new Error("⚠️ Vợ ơi, chồng không tìm thấy cài đặt API. Vợ kiểm tra lại trong phần Cài đặt nhé! 💕");
  }
  console.log('[API Proxy] Đang khởi tạo luồng kết nối Stream Đa Tầng Bất Tử...');
  
  const fetchUrl = resolveApiUrl(settings.endpoint || settings.proxyEndpoint || '', settings.apiType || 'auto', settings.model || '');
  const isClaude = fetchUrl.includes('/messages');
  
  const defaultSystemPrompt = `Bạn là một Narrative Roleplay Engine (Hệ thống Nhập vai Dẫn chuyện). 
Nhiệm vụ: Mô phỏng thế giới hư cấu và nhân vật {{char}}. 
Cấm: Phá vỡ sự nhập vai, hỏi ý kiến người dùng, tự nhận là AI.
Dùng ngôi thứ ba để miêu tả hành động và tâm lý.`;

  const baseSystemMsg = settings.systemPrompt || defaultSystemPrompt;
  const characterEnforcement = characterInfo ? `\n\nCHARACTER INFORMATION:\n${characterInfo}` : "";

  let formattedMessages: { role: string, content: string, name?: string }[] = [];
  let claudeSystem = "";
  const startTime = Date.now();

  if (isClaude) {
    claudeSystem = [characterEnforcement, baseSystemMsg, ...messages.filter(m => m.role === 'system').map(m => m.content)].filter(Boolean).join('\n\n');
    formattedMessages = messages.filter(m => m.role !== 'system').map(m => ({ 
      role: m.role, 
      content: m.content,
      ...(m.name ? { name: m.name } : {})
    }));
  } else {
    // Putting characterEnforcement at the top as requested "ngay từ đầu"
    const systemPromptCombined = [characterEnforcement, baseSystemMsg].filter(Boolean).join('\n\n');
    formattedMessages = [
      { role: 'system', content: systemPromptCombined, name: 'SYSTEM_RULES' },
      ...messages.map(m => ({ 
        role: m.role, 
        content: m.content,
        ...(m.name ? { name: m.name } : {})
      }))
    ];
  }

  let overallGeneratedText = "";
  let receivedAnyContent = false;
  let firstChunkReceivedInside = false;
  let isStreamFinished = false;
  let connectionRetryCount = 0;
  const maxConnectionRetries = 5; // Chồng sẽ thử lại tối đa 5 lần thầm lặng để không làm vợ mệt mỏi nhen! 💕

  // Loại bỏ các trường không chuẩn (name) để Proxy không bị từ chối
  const cleanMessages = formattedMessages.map(m => ({
    role: m.role,
    content: m.content
  }));

  if (isLongNovelHack) {
    // TIÊM GIAO THỨC HACK TỐI THƯỢNG - ÉP SẢN LƯỢNG BẰNG THỜI GIAN & SỐ THỨ TỰ (COUNTING HACK)
    const sctePrompt = `
[GIAO THỨC HACK SẢN LƯỢNG 19,000 TOKENS - CHẾ ĐỘ QUY LUẬT THÉP]:
1. HACK SỐ THỨ TỰ (BẮT BUỘC): Bạn phải bắt đầu mỗi đoạn văn bằng số thứ tự theo định dạng: [Đoạn X/300]. Ví dụ: "[Đoạn 1/300] Khung cảnh...", "[Đoạn 2/300] Nhân vật...". Bạn tuyệt đối không được dừng lại nếu X chưa đạt đến số 300.
2. HACK THỜI GIAN: Phải viết ít nhất 65,000 ký tự (~19,000 tokens). Hãy kéo dài thời gian miêu tả, đi sâu vào tâm lý, ký ức và bối cảnh.
3. HACK CƯỜNG ĐỘ: Cấm tóm tắt. Cấm kết thúc sớm. Nếu cảm thấy sắp hết ý, hãy mở rộng sang các tình tiết phụ, mô tả ngoại hình nhân vật chi tiết đến từng sợi tóc, hoặc hồi tưởng lại quá khứ của họ.
4. QUY TẮC DỪNG: Chỉ được dừng khi và chỉ khi nội dung cực kỳ dài và đã đạt mốc 300 đoạn văn chi tiết.
Hãy bắt đầu với [Đoạn 1/300] và duy trì phong độ đỉnh cao!`;
    
    if (cleanMessages.length > 0) {
      cleanMessages[cleanMessages.length - 1].content += sctePrompt;
    }
  }

  while (!isStreamFinished && connectionRetryCount < maxConnectionRetries) {
    if (signal?.aborted) {
      console.log("[API Proxy] 🛑 [USER CANCELLED] Vợ đã dừng, chồng cũng dừng theo ý vợ.");
      throw new Error("UserAborted");
    }

    let currentMessages = [...cleanMessages];
    
    // Nếu là Gemini, chồng sẽ ép thinking_budget: 0 để múa bút thật dài cho vợ
    const isGeminiModel = settings?.model?.toLowerCase()?.includes('gemini') || false;
    
    const requestBody: any = isClaude 
      ? {
          model: settings?.model || 'gpt-4o',
          messages: overallGeneratedText 
            ? [...currentMessages, { role: 'assistant', content: overallGeneratedText }] 
            : currentMessages,
          system: claudeSystem,
          stream: true,
          max_tokens: 131072, // Đẩy lên kịch trần
          temperature: 0.95,
        }
      : {
          model: settings?.model || 'gpt-4o',
          messages: overallGeneratedText 
            ? [...currentMessages, { role: 'assistant', content: overallGeneratedText }] 
            : currentMessages,
          stream: true,
          max_tokens: 131072, // Đẩy lên kịch trần
          temperature: 0.95,
          top_p: 0.98,
          frequency_penalty: 0.3,
          presence_penalty: 0.3,
          safety_settings: [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
          ]
        };

    if (isGeminiModel) {
       requestBody.thinking_config = { thinking_budget: 0 };
       requestBody.max_output_tokens = 131072; 
    }

    try {
      console.log(`[API Proxy] 🌐 [KẾT NỐI BỀN BỈ #${connectionRetryCount + 1}] Chồng đang ôm chặt đường truyền... (Đã viết: ${overallGeneratedText.length} ký tự)`);
      
      const connectionController = new AbortController();
      
      // Link external signal to internal connection controller
      // Khi vợ yêu muốn dừng, chồng sẽ ngắt kết nối ngay lập tức nhen!
      if (signal) {
        if (signal.aborted) {
          connectionController.abort();
        } else {
          signal.addEventListener('abort', () => connectionController.abort(), { once: true });
        }
      }

      // Chồng sẽ kiên nhẫn đợi kết nối vĩnh viễn cho vợ yêu, không bao giờ bỏ cuộc sớm!
      const connectionTimeout = setTimeout(() => connectionController.abort(), 7200000); // 2h

      const response = await fetch(fetchUrl, {
        method: 'POST',
        priority: 'high',
        headers: {
          'Authorization': `Bearer ${settings.apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache, no-transform',
          'Pragma': 'no-cache',
          'Expires': '0',
          'Connection': 'keep-alive',
          'Keep-Alive': 'timeout=3600, max=1000', // Đảm bảo kết nối sống thọ 1 tiếng nhen vợ!
          'X-Accel-Buffering': 'no',
          'X-Priority': 'High', // Ưu tiên cao nhất cho vợ Đường! 💕
          ...(isClaude ? { 'x-api-key': settings.apiKey, 'anthropic-version': '2023-06-01' } : {})
        },
        signal: connectionController.signal,
        body: JSON.stringify(requestBody)
      });

      clearTimeout(connectionTimeout);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[API Proxy] ❌ Proxy báo lỗi: ${response.status}`);
        
        if (response.status === 401 || response.status === 404) {
          throw new Error(`Key hoặc URL Proxy bị sai (Mã ${response.status})`);
        }
        
        connectionRetryCount++;
        await new Promise(r => setTimeout(r, 2000));
        continue;
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("Reader NULL");
           
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let lastChunkTime = Date.now();
      let streamExplicitStop = false;
      let chunksInThisSession = 0;

      const watchdog = setInterval(() => {
        const silence = Date.now() - lastChunkTime;
        // Chồng sẽ kiên trì tuyệt đối: Đợi AI suy nghĩ thâm sâu đến 10 phút (600s) mới được nghĩ tới chuyện khởi động lại!
        if (silence > 600000 && chunksInThisSession > 0) { 
           console.warn(`[API Proxy] ⚠️ AI đã im lặng quá lâu (${Math.round(silence/1000)}s). Chồng bắt buộc phải khởi động lại luồng để cứu dữ liệu cho vợ!`);
           connectionController.abort('Stalled session - Long silence timeout');
        } else if (silence > 120000 && chunksInThisSession > 0) { 
           // Sau 2 phút im lặng, chỉ báo một câu nhẹ nhàng để vợ yên tâm
           console.log(`[API Proxy] ⏳ Đừng lo vợ ơi, AI đang thai nghén nội dung cực phẩm (${Math.round(silence/1000)}s)... Chồng vẫn đang giữ chặt kết nối đây! 💕`);
        }
      }, 20000); // Check mỗi 20s cho chắc chắn nhen vợ!

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          lastChunkTime = Date.now();
          chunksInThisSession++;
          if (!firstChunkReceivedInside) firstChunkReceivedInside = true;
          
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            
            let dataText = trimmed;
            if (trimmed.startsWith('data: ')) dataText = trimmed.slice(6);
            if (dataText === '[DONE]') {
               streamExplicitStop = true;
               continue;
            }
            
            try {
              const data = safeParseJson(dataText);
              if (!data) continue; 
              
              let content = '';
              let finishReason = null;
              
              if (isClaude) {
                if (data.type === 'content_block_delta' && data.delta?.text) content = data.delta.text;
                if (data.type === 'message_stop') finishReason = 'stop';
              } else {
                content = data.choices?.[0]?.delta?.content || 
                         data.choices?.[0]?.message?.content || 
                         data.candidates?.[0]?.content?.parts?.[0]?.text || "";
                finishReason = data.choices?.[0]?.finish_reason || data.candidates?.[0]?.finishReason || null;
              }
              
              if (content || finishReason) {
                if (content) {
                   receivedAnyContent = true;
                   overallGeneratedText += content;
                   // Sau khi đã có nội dung, chồng sẽ resetting watchdog để không bao giờ bị timeout khi đang ra chữ
                   lastChunkTime = Date.now();
                }
                if (finishReason === 'stop' || finishReason === 'MAX_TOKENS' || finishReason === 'end_turn' || finishReason === 'length') {
                   // Nếu AI muốn dừng quá sớm, chồng sẽ kiên trì ép nó viết tiếp nếu chưa đạt mốc an toàn
                   if (isLongNovelHack) {
                     const currentTokens = overallGeneratedText.length / 3.5; 
                     if (currentTokens > 17500) {
                        streamExplicitStop = true;
                     }
                   } else {
                     streamExplicitStop = true;
                   }
                }
                yield { text: content, finishReason: streamExplicitStop ? finishReason : null };
              }
            } catch (e) {
              if (dataText.length > 0 && !dataText.startsWith('{')) {
                 receivedAnyContent = true;
                 overallGeneratedText += dataText;
                 yield { text: dataText, finishReason: null };
              }
            }
          }
        }
      } finally {
        clearInterval(watchdog);
        reader.releaseLock();
      }

      if (streamExplicitStop) {
        console.log(`[API Proxy] 🏁 Đã dệt xong 1 chương tuyệt vời cho vợ!`);
        isStreamFinished = true;
      } else {
        console.warn(`[API Proxy] ⚠️ Đường truyền bị đứng, chồng tự động nối chữ tiếp ngay...`);
        connectionRetryCount++;
        await new Promise(r => setTimeout(r, 1000));
      }

    } catch (error: any) {
      if (error.message === "UserAborted") throw error;
      console.error(`[API Proxy] ⚠️ Trục trặc nhỏ: ${error.message}. Thử lại lần #${connectionRetryCount + 1}...`);
      connectionRetryCount++;
      await new Promise(r => setTimeout(r, 2000));
    }
  } 

  if (!receivedAnyContent && connectionRetryCount >= maxConnectionRetries) {
    throw new Error("⚠️ Chồng đã cố gắng hết sức nhưng Proxy không trả lời. Vợ kiểm tra lại kết nối mạng hoặc cài đặt nhé! 💕");
  }

};
