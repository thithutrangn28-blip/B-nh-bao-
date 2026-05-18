const fs = require('fs');
let lines = fs.readFileSync('src/components/KikokoInstagram.tsx', 'utf8').split('\n');
lines.splice(54, 50); // Remove index 54 to 103 (lines 55 to 104)
fs.writeFileSync('src/components/KikokoInstagram.tsx', lines.join('\n'));
