const fs = require('fs');

let content = fs.readFileSync('src/utils/apiProxy.ts', 'utf8');

// fix interface
content = content.replace(
  "apiType?: 'openai' | 'claude' | 'gemini' | 'custom' | 'auto';",
  "apiType?: 'openai' | 'claude' | 'gemini' | 'custom' | 'auto';\n  proxyEndpoint?: string;"
);

// fix fetchAvailableModels
content = content.replace(
  "let modelsUrl = endpoint.replace(/\\/+\\$/, '');",
  "const actualEndpoint = endpoint || '';\n    let modelsUrl = actualEndpoint.replace(/\\/+\\$/, '');"
);

// fix sendMessage
content = content.replace(
  "let fetchUrl = settings.endpoint.replace(/\\/+\\$/, '');",
  "const actualEndpoint = settings.endpoint || settings.proxyEndpoint || '';\n  let fetchUrl = actualEndpoint.replace(/\\/+\\$/, '');"
);

// fix sendMessageStream
content = content.replace(
  "let fetchUrl = settings.endpoint.trim().replace(/\\/+\\$/, '');",
  "const actualEndpoint = settings.endpoint || settings.proxyEndpoint || '';\n  let fetchUrl = actualEndpoint.trim().replace(/\\/+\\$/, '');"
);

fs.writeFileSync('src/utils/apiProxy.ts', content);
console.log('Fixed api proxy');
