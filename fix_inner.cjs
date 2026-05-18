const fs = require('fs');

let content = fs.readFileSync('src/components/KikokoInnerThoughts.tsx', 'utf8');

const safeParseCode = `import { sendMessage, sendMessageStream } from '../utils/apiProxy';

const safeParseJson = (text: string) => {
  try {
    let jsonStr = text.replace(/\`\`\`json\\s*|\\s*\`\`\`/g, '').trim();
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
      return { isJson: true, json: JSON.parse(jsonStr) };
    } catch {
      const fixedStr = jsonStr.replace(/,\\s*([}\\]])/g, '$1');
      return { isJson: true, json: JSON.parse(fixedStr) };
    }
  } catch (e) {
    return { isJson: false, json: null };
  }
};

const extractTextFromResponse = (response: any) => {
  if (typeof response === 'string') return response;
  if (!response) return '';
  return (
    response?.choices?.[0]?.message?.content ||
    response?.content?.[0]?.text ||
    response?.candidates?.[0]?.content?.parts?.[0]?.text ||
    response?.text ||
    response?.content ||
    response?.message ||
    ''
  );
};
`;

content = content.replace(
  "import { loadKikokoInstagram } from '../utils/db';",
  "import { loadKikokoInstagram } from '../utils/db';\n" + safeParseCode
);

const robustParseRegex = /const robustParseJSON = \(content: string\) => \{[\s\S]*?console\.warn\("Robust parse failed, using raw content:", e\);\n      return \{ content: content \};\n    \}\n  \};/g;

content = content.replace(robustParseRegex, `const robustParseJSON = (content: string) => {
    const { isJson, json } = safeParseJson(content);
    if (isJson) return json;
    console.warn("Robust parse failed, using raw content");
    return { content: content };
  };`);

// Replace first fetch
const nonStreamingRegex = /let apiUrl = apiToUse\.proxyEndpoint[\s\S]*?if \(!text\) throw new Error\("API không trả về nội dung\."\);/g;

content = content.replace(nonStreamingRegex, `const response = await sendMessage(apiToUse, [{ role: 'user', content: prompt }]);
      const text = extractTextFromResponse(response);
      if (!text) throw new Error("API không trả về nội dung.");`);

// Replace second fetch
const streamingRegex = /let apiUrl = apiToUse\.proxyEndpoint[\s\S]*?if \(!apiUrl\.startsWith\('http'\)\) apiUrl = 'https:\/\/' \+ apiUrl;[\s\S]*?const response = await fetch\(completionUrl[\s\S]*?signal: abortControllerRef\.current\.signal[\s\S]*?\}\);[\s\S]*?const reader = response\.body\?\.getReader\(\);[\s\S]*?if \(reader\) \{[\s\S]*?try \{[\s\S]*?while \(true\) \{[\s\S]*?reader\.releaseLock\(\);\n        \}\n      \}/g;

content = content.replace(streamingRegex, `
      let fullText = '';
      const messages = [systemMessage, { role: 'user' as const, content: initialPrompt }];
      for await (const chunk of sendMessageStream(apiToUse, messages, undefined, abortControllerRef.current.signal)) {
        if (chunk) {
          fullText += chunk;
          
          let displayContent = fullText;
          const contentMatch = fullText.match(/"content"\\s*:\\s*"([\\s\\S]*?)$/);
          if (contentMatch && contentMatch[1]) {
            displayContent = contentMatch[1].replace(/\\\\n/g, '\\n').replace(/\\\\"/g, '"');
          }
          setStreamingContent(displayContent);
          
          const textToEstimate = contentMatch ? contentMatch[1] : fullText;
          const currentTokenCount = Math.floor(textToEstimate.length / 3.0);
          setGenerationProgress(currentTokenCount > 10000 ? 10000 : currentTokenCount);
        }
      }
`);

fs.writeFileSync('src/components/KikokoInnerThoughts.tsx', content);
