const fs = require('fs');

const inp = 'tmp-hebrew-word-contexts.txt';
const out = 'tmp-hebrew-word-contexts-clean.txt';
const t = fs.readFileSync(inp, 'utf8');
const clean = t.replace(/^WORD:\s*(.+)$/gm, (_m, w) => `WORD: ${w}`);

fs.writeFileSync(out, '\uFEFF' + clean, 'utf8');
console.log('Created', out);