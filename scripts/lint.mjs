import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const targetExts = new Set(['.ts', '.tsx', '.js', '.jsx', '.md', '.css', '.json']);
const ignoredDirs = new Set(['.git', 'node_modules', 'dist', 'dist-server', 'coverage', 'data', '.obsidian']);
const forbidden = [/api[_-]?key\s*[:=]\s*['"][A-Za-z0-9_-]{20,}/i, /sk-[A-Za-z0-9_-]{20,}/];
let failed = false;

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (ignoredDirs.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(full);
      continue;
    }
    if (!targetExts.has(path.extname(entry.name))) continue;
    const text = await readFile(full, 'utf8');
    const rel = path.relative(root, full);
    if (/\t/.test(text)) {
      console.error(`[lint] 탭 문자를 공백으로 바꾸세요: ${rel}`);
      failed = true;
    }
    for (const pattern of forbidden) {
      if (pattern.test(text)) {
        console.error(`[lint] 비밀값처럼 보이는 문자열을 제거하세요: ${rel}`);
        failed = true;
      }
    }
  }
}

await walk(root);

if (failed) {
  process.exit(1);
}

console.log('[lint] 통과');

