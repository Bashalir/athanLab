/**
 * Post-build script: inline all CSS and JS into a single HTML file.
 * Replaces vite-plugin-singlefile for compatibility with @vitejs/plugin-legacy.
 */
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { resolve, dirname, basename } from 'path';

const distDir = resolve(dirname(new URL(import.meta.url).pathname), '../dist');
const htmlPath = resolve(distDir, 'index.html');

let html = readFileSync(htmlPath, 'utf-8');

// Inline <link rel="stylesheet" href="..."> → <style>...</style>
html = html.replace(
  /<link\s+rel="stylesheet"[^>]*href="([^"]+)"[^>]*\/?>/gi,
  (match, href) => {
    const cssPath = resolve(distDir, href.replace(/^\//, ''));
    try {
      const css = readFileSync(cssPath, 'utf-8');
      return `<style>${css}</style>`;
    } catch {
      console.warn(`  ⚠ Could not inline CSS: ${href}`);
      return match;
    }
  }
);

// Inline <script ... src="..."> → <script>...</script>
html = html.replace(
  /<script([^>]*)\ssrc="([^"]+)"([^>]*)><\/script>/gi,
  (match, before, src, after) => {
    const jsPath = resolve(distDir, src.replace(/^\//, ''));
    try {
      const js = readFileSync(jsPath, 'utf-8');
      // Remove type="module", crossorigin, and nomodule attributes for inline
      const attrs = (before + after)
        .replace(/\s*type="module"\s*/g, ' ')
        .replace(/\s*crossorigin\s*/g, ' ')
        .replace(/\s*nomodule\s*/g, ' ')
        .trim();
      return `<script${attrs ? ' ' + attrs : ''}>${js}</script>`;
    } catch {
      console.warn(`  ⚠ Could not inline JS: ${src}`);
      return match;
    }
  }
);

// Handle legacy plugin's data-src pattern:
// <script id="vite-legacy-entry" data-src="/assets/index-legacy-XXX.js">...</script>
// The legacy plugin loads data-src dynamically via SystemJS. We inline the file
// and execute it directly instead.
html = html.replace(
  /<script([^>]*)\sdata-src="([^"]+)"([^>]*)>([\s\S]*?)<\/script>/gi,
  (match, before, dataSrc, after, body) => {
    const jsPath = resolve(distDir, dataSrc.replace(/^\//, ''));
    try {
      const js = readFileSync(jsPath, 'utf-8');
      // Remove data-src, crossorigin, nomodule attrs; keep id
      const attrs = (before + after)
        .replace(/\s*crossorigin\s*/g, ' ')
        .replace(/\s*nomodule\s*/g, ' ')
        .trim();
      // The polyfill loader in the body uses SystemJS.import(data-src).
      // Since we inline directly, we replace with the actual JS content.
      return `<script${attrs ? ' ' + attrs : ''}>${js}</script>`;
    } catch {
      console.warn(`  ⚠ Could not inline data-src JS: ${dataSrc}`);
      return match;
    }
  }
);

// Handle inline <script type="module">import"./path.js"</script> patterns
html = html.replace(
  /<script\s+type="module"[^>]*>(.*?)<\/script>/gi,
  (match, content) => {
    const importMatch = content.match(/import\s*"\.\/([^"]+)"/);
    if (!importMatch) return match;
    const fileName = importMatch[1];
    // Try to find the file in dist or dist/assets
    const candidates = [
      resolve(distDir, fileName),
      resolve(distDir, 'assets', fileName),
    ];
    // Also search for files matching the basename pattern
    try {
      const assetsDir = resolve(distDir, 'assets');
      const files = readdirSync(assetsDir);
      const base = basename(fileName, '.js');
      for (const f of files) {
        if (f.startsWith(base) || f.includes(base)) {
          candidates.push(resolve(assetsDir, f));
        }
      }
    } catch {}

    for (const candidate of candidates) {
      try {
        const js = readFileSync(candidate, 'utf-8');
        return `<script>${js}</script>`;
      } catch {}
    }
    console.warn(`  ⚠ Could not resolve inline import: ${fileName}`);
    return match;
  }
);

writeFileSync(htmlPath, html);

const sizeKB = (Buffer.byteLength(html) / 1024).toFixed(1);
console.log(`✓ Single-file output: dist/index.html (${sizeKB} KB)`);
