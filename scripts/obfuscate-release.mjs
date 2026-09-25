import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import JavaScriptObfuscator from 'javascript-obfuscator';

const root = process.cwd();
const outputArg = process.argv.indexOf('--output');
const outputDir = path.resolve(
  outputArg >= 0 && process.argv[outputArg + 1]
    ? process.argv[outputArg + 1]
    : path.join(root, 'release-obfuscated')
);

const trackedFiles = execFileSync('git', ['ls-files', '-z'], { cwd: root })
  .toString('utf8')
  .split('\0')
  .filter(Boolean)
  .filter(file => !file.startsWith('.github/'))
  .filter(file => fs.existsSync(path.join(root, file)));

fs.rmSync(outputDir, { recursive: true, force: true });
fs.mkdirSync(outputDir, { recursive: true });

for (const relativeFile of trackedFiles) {
  const sourcePath = path.join(root, relativeFile);
  const targetPath = path.join(outputDir, relativeFile);
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.copyFileSync(sourcePath, targetPath);
}

const obfuscationOptions = {
  compact: true,
  target: 'node',
  sourceType: 'module',
  sourceMap: false,
  selfDefending: false,
  controlFlowFlattening: false,
  deadCodeInjection: false,
  debugProtection: false,
  disableConsoleOutput: false,
  stringArray: true,
  stringArrayEncoding: ['base64'],
  stringArrayRotate: true,
  stringArrayThreshold: 0.75,
  transformObjectKeys: false
};

let obfuscatedCount = 0;
for (const relativeFile of trackedFiles) {
  if (!/\.js$/i.test(relativeFile)) continue;
  if (relativeFile === 'scripts/obfuscate-release.mjs') continue;

  const targetPath = path.join(outputDir, relativeFile);
  const source = fs.readFileSync(targetPath, 'utf8');
  const result = JavaScriptObfuscator.obfuscate(source, obfuscationOptions);
  fs.writeFileSync(targetPath, result.getObfuscatedCode(), 'utf8');
  obfuscatedCount++;
}

console.log(`Prepared ${trackedFiles.length} tracked files; obfuscated ${obfuscatedCount} JavaScript files.`);
console.log(`Output: ${outputDir}`);
