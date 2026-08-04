const fs = require('fs');
const path = require('path');

const replacements = [
  ['bg-black/90', 'bg-white/90'],
  ['bg-black/70', 'bg-white/70'],
  ['bg-black/50', 'bg-white/50'],
  ['bg-black', 'bg-white'],
  ['text-white/80', 'text-black/80'],
  ['text-white/70', 'text-black/70'],
  ['text-white/60', 'text-black/60'],
  ['text-white/40', 'text-black/40'],
  ['text-white', 'text-black'],
  ['border-white/20', 'border-black/20'],
  ['border-white/10', 'border-black/10'],
  ['border-white', 'border-black'],
  ['hover:border-white', 'hover:border-black'],
  ['bg-white/10', 'bg-slate-100'],
  ['bg-white/5', 'bg-slate-100'],
];

const fileExts = ['.tsx', '.ts'];
const rootDir = path.resolve('..');

function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const filePath = path.join(dir, name);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      if (['node_modules', '.next', '.git', 'tmp'].includes(name)) continue;
      walk(filePath);
    } else if (fileExts.includes(path.extname(name))) {
      if (filePath.includes(`${path.sep}node_modules${path.sep}`)) continue;
      let text = fs.readFileSync(filePath, 'utf8');
      let updated = text;
      replacements.forEach(([from, to]) => {
        updated = updated.split(from).join(to);
      });
      if (updated !== text) {
        fs.writeFileSync(filePath, updated, 'utf8');
        console.log('updated', filePath);
      }
    }
  }
}

walk(rootDir);
console.log('theme swap complete');
