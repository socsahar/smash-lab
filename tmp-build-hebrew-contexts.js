const fs = require('fs');
const path = require('path');

const root = process.cwd();
const wordsPath = path.join(root, 'tmp-hebrew-unique-words.txt');
const outPath = path.join(root, 'tmp-hebrew-word-contexts.txt');
const words = fs.readFileSync(wordsPath, 'utf8').split(/\r?\n/).map((s) => s.trim()).filter(Boolean);

const skipDirs = new Set(['node_modules', '.git', 'backup', 'development', 'e2e', 'nl-files']);

function walk(dir, res) {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, ent.name);
        if (ent.isDirectory()) {
            if (skipDirs.has(ent.name)) continue;
            walk(p, res);
        } else if (ent.name.toLowerCase().endsWith('.html')) {
            res.push(p);
        }
    }
}

function cleanHtml(html) {
    return html
        .replace(/<script[\s\S]*?<\/script>/gi, ' ')
        .replace(/<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&#39;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/\s+/g, ' ')
        .trim();
}

function splitSentences(text) {
    return text
        .split(/(?<=[.!?])\s+|\s*[\r\n]+\s*/)
        .map((s) => s.trim())
        .filter(Boolean);
}

function escapeRegExp(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const files = [];
walk(root, files);

const corpus = files.map((f) => {
    const raw = fs.readFileSync(f, 'utf8');
    const text = cleanHtml(raw);
    const sentences = splitSentences(text);
    return {
        file: path.relative(root, f).replace(/\\/g, '/'),
        raw,
        sentences
    };
});

const lines = [];
for (const w of words) {
    const rx = new RegExp('(^|[^\\u0590-\\u05FF])' + escapeRegExp(w) + '([^\\u0590-\\u05FF]|$)');
    let found = null;

    for (const doc of corpus) {
        for (const s of doc.sentences) {
            if (rx.test(s)) {
                found = { file: doc.file, sentence: s };
                break;
            }
        }
        if (found) break;
    }

    if (!found) {
        for (const doc of corpus) {
            const i = doc.raw.indexOf(w);
            if (i >= 0) {
                const start = Math.max(0, i - 120);
                const end = Math.min(doc.raw.length, i + w.length + 120);
                const snippet = doc.raw.slice(start, end).replace(/\s+/g, ' ');
                found = { file: doc.file, sentence: '[snippet] ' + snippet };
                break;
            }
        }
    }

    if (!found) {
        found = { file: '-', sentence: '[not found in scanned html text]' };
    }

    lines.push('WORD: ' + w);
    lines.push('FILE: ' + found.file);
    lines.push('SENTENCE: ' + found.sentence);
    lines.push('---');
}

fs.writeFileSync(outPath, lines.join('\n'), 'utf8');
console.log('Created tmp-hebrew-word-contexts.txt with', words.length, 'entries.');