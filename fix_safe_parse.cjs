const fs = require('fs');

const files = [
  'src/components/KikokoInnerThoughts.tsx',
  'src/components/KikokoInstagram.tsx',
  'src/components/KikokoNPCFuture.tsx',
  'src/components/KikokoNPCSchedule.tsx',
  'src/components/KikokoNPCYouTube.tsx',
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(
    /const safeParseJson = \(text: string\) => \{\\n  if \(!text \|\| typeof text !== 'string'\) return \{ isJson: false, json: null \};\\n  try \{\\n    let jsonStr = text\.replace/g,
    `const safeParseJson = (text: string) => {
  if (!text || typeof text !== 'string') return { isJson: false, json: null };
  try {
    let jsonStr = text.replace`
  );
  fs.writeFileSync(file, content);
}

let cooking = fs.readFileSync('src/components/KikokoCooking.tsx', 'utf8');
cooking = cooking.replace(
    /const robustParseJSON = \(text: string\) => \{\\n    if \(!text \|\| typeof text !== 'string'\) return null;\\n    try \{\\n      let jsonStr = text\.replace/g,
    `const robustParseJSON = (text: string) => {
    if (!text || typeof text !== 'string') return null;
    try {
      let jsonStr = text.replace`
);
fs.writeFileSync('src/components/KikokoCooking.tsx', cooking);

console.log('Fixed');
