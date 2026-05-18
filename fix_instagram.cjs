const fs = require('fs');
let content = fs.readFileSync('src/components/KikokoInstagram.tsx', 'utf8');

// Also inject safeParseJson
const safeParseCode = `import { sendMessage } from '../utils/apiProxy';

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
  "import { saveKikokoInstagram, loadKikokoInstagram } from '../utils/db';",
  "import { saveKikokoInstagram, loadKikokoInstagram } from '../utils/db';\n" + safeParseCode
);

const nonStreamingRegex = /let apiUrl = apiSettings\.proxyEndpoint(?:[\s\S]*?)if \(!content\) throw new Error\("API không trả về nội dung\."\);/g;

content = content.replace(nonStreamingRegex, `const response = await sendMessage(apiSettings, [{ role: 'user', content: prompt }]);
      const content = extractTextFromResponse(response);
      
      if (!content) throw new Error("API không trả về nội dung.");`);

const streamingRegex = /let apiUrl = apiSettings\.proxyEndpoint[\s\S]*?if \(!apiUrl\.endsWith\('\/chat\/completions'\)\) apiUrl \+= '\/chat\/completions';[\s\S]*?const response = await fetch\(apiUrl, \{[\s\S]*?stream: true[\s\S]*?\}\);[\s\S]*?if \(reader\) \{[\s\S]*?while \(true\) \{[\s\S]*?\}[\s\S]*?\}[\s\S]*?\}/g;

content = content.replace(streamingRegex, `const response = await sendMessage(apiSettings, [{ role: 'user', content: prompt }]);
      const fullContent = extractTextFromResponse(response);`);

const robustParseRegex = /const robustParseJSON = \(content: string\) => \{[\s\S]*?console\.warn\("Robust parse failed, using raw content:", e\);\n      return \{ content: content \};\n    \}\n  \};/g;

content = content.replace(robustParseRegex, `const robustParseJSON = (content: string) => {
    const { isJson, json } = safeParseJson(content);
    if (isJson) return json;
    console.warn("Robust parse failed, using raw content");
    return { content: content };
  };`);

fs.writeFileSync('src/components/KikokoInstagram.tsx', content);
