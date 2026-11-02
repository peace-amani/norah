'use strict';
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ── Fix 0: gifted-btns baileys shims ────────────────────────────────────────
// gifted-btns uses `await import()` internally to load baileys internals.
// This project uses 'wolfsocket' (a baileys fork), so we create ESM shim
// packages for every name gifted-btns tries to import from.
const BAILEYS_SHIMS = [
  'baileys',
  'gifted-baileys',
  path.join('@whiskeysockets', 'baileys'),
  path.join('@adiwajshing', 'baileys'),
];
const SHIM_PKG  = '{"name":"__baileys-shim__","version":"1.0.0","type":"module","main":"index.js"}\n';
const SHIM_CODE = "export * from 'wolfsocket';\nexport { default } from 'wolfsocket';\n";
for (const pkg of BAILEYS_SHIMS) {
  const dir = path.join(root, 'node_modules', pkg);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'package.json'), SHIM_PKG);
  fs.writeFileSync(path.join(dir, 'index.js'),     SHIM_CODE);
}


const root = path.join(__dirname, '..');

// ── Fix 1: dotenv index.js shim ─────────────────────────────────────────────
const dotenvDir = path.join(root, 'node_modules', 'dotenv');
if (fs.existsSync(dotenvDir)) {
  const idx = path.join(dotenvDir, 'index.js');
  const main = path.join(dotenvDir, 'lib', 'main.js');
  if (!fs.existsSync(idx) && fs.existsSync(main)) {
    fs.writeFileSync(idx, "'use strict';\nmodule.exports = require('./lib/main.js');\n");
  }
}

// ── Fix 2: ensure ffmpeg-static binary is downloaded ────────────────────────
// ffmpeg-static downloads its pre-compiled binary during `npm install` via its
// own `install` hook.  That hook can be silently skipped when:
//   • npm is invoked with --ignore-scripts
//   • the package-level install script fails / times out
//   • the host has npm cache but the binary was never fetched
//
// We re-run it here so the binary is guaranteed to exist on Heroku, Pterodactyl,
// Railway, Fly.io, Render, Koyeb, and any other platform that lacks system ffmpeg.
const ffmpegStaticDir = path.join(root, 'node_modules', 'ffmpeg-static');
if (fs.existsSync(ffmpegStaticDir)) {
  const binaryPath  = path.join(ffmpegStaticDir, 'ffmpeg');
  const binaryPathW = path.join(ffmpegStaticDir, 'ffmpeg.exe');
  const hasBinary   = fs.existsSync(binaryPath) || fs.existsSync(binaryPathW);
  if (!hasBinary) {
    try {
      console.log('[patch-modules] ffmpeg-static binary missing — downloading…');
      execSync('node install.js', {
        cwd:     ffmpegStaticDir,
        stdio:   'inherit',
        timeout: 120000,
      });
      console.log('[patch-modules] ffmpeg-static binary downloaded ✓');
    } catch (e) {
      // Non-fatal — the bot will fall back to system ffmpeg or `which ffmpeg`
      console.warn('[patch-modules] ffmpeg-static download failed (non-fatal):', e.message);
    }
  }
}
