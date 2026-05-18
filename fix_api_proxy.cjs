const fs = require('fs');
let content = fs.readFileSync('src/utils/apiProxy.ts', 'utf8');

// Patch sendMessage
content = content.replace(
  /let fetchUrl = settings\.endpoint\.replace/g,
  `const resolvedEndpoint = settings.endpoint || (settings as any).proxyEndpoint || '';\n  let fetchUrl = resolvedEndpoint.replace`
);
content = content.replace(
  /fetchUrl = settings\.endpoint;/g,
  `fetchUrl = resolvedEndpoint;`
);

// Patch sendMessageStream
content = content.replace(
  /let fetchUrl = settings\.endpoint\.trim\(\)\.replace/g,
  `const resolvedEndpoint = settings.endpoint || (settings as any).proxyEndpoint || '';\n  let fetchUrl = resolvedEndpoint.trim().replace`
);

fs.writeFileSync('src/utils/apiProxy.ts', content);
console.log('Fixed');
