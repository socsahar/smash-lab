const fs = require('fs');

const sourcePath = 'tmp-hebrew-word-contexts.txt';
const outPath = 'tmp-hebrew-approval.csv';

const text = fs.readFileSync(sourcePath, 'utf8');
const blocks = text.split('\n---\n').map((b) => b.trim()).filter(Boolean);

const rows = ['word,file,sentence,decision,fix_to'];

for (const block of blocks) {
    const word = (block.match(/^WORD: (.*)$/m) || [])[1] || '';
    const file = (block.match(/^FILE: (.*)$/m) || [])[1] || '';
    const sentence = (block.match(/^SENTENCE: ([\s\S]*)$/m) || [])[1] || '';

    const esc = (v) => `"${String(v).replace(/"/g, '""')}"`;
    rows.push([word, file, sentence, '', ''].map(esc).join(','));
}

fs.writeFileSync(outPath, rows.join('\n'), 'utf8');
console.log(`created ${outPath} rows ${blocks.length}`);