#!/usr/bin/env node
/**
 * build-head.mjs
 *
 * Brings every root-level *.html page's <head> in line with the modern theme:
 *
 *   1. Replaces the Poppins + Raleway Google Fonts URL with Inter (variable
 *      font, single file — ~25x lighter than the previous bundle).
 *   2. Ensures css/theme.css is loaded immediately after css/style.css.
 *   3. Ensures js/reveal.js is loaded once before </body>.
 *
 * All changes are idempotent — safe to re-run any number of times. The font
 * swap matches both the old "all weights" form and the "subset weights" form
 * already in use on a few pages.
 *
 *     node tools/build-head.mjs
 */

import { readFile, writeFile, readdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SKIP = new Set(['index_1.html']);

const INTER_LINK =
  '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">';

const THEME_LINK = '<link rel="stylesheet" href="css/theme.css">';
const REVEAL_SCRIPT = '<script src="js/reveal.js" defer></script>';

// Font Awesome: load async via the print-media trick so it doesn't block render.
// (Browsers download print stylesheets at low priority, then we flip media to all
//  once it has loaded, so the icons get styled without holding up first paint.)
const FA_ASYNC_LINK =
  '<link rel="preload" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css" as="style" onload="this.onload=null;this.rel=\'stylesheet\'">' +
  '<noscript><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css"></noscript>';

// Match any existing Poppins/Raleway Google Fonts <link>.
const POPPINS_RALEWAY_RE =
  /<link[^>]*fonts\.googleapis\.com\/css2\?family=(?:Poppins|Raleway)[^"']*["'][^>]*>/i;

// Match the <link rel="stylesheet" href="css/style.css"> line.
const STYLE_CSS_RE = /<link[^>]*href=["']css\/style\.css["'][^>]*>/i;

// Match a *blocking* Font Awesome <link rel="stylesheet" …>.
const FA_BLOCKING_RE =
  /<link\s+href=["']https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/font-awesome\/[^"']+["']\s+rel=["']stylesheet["']\s*\/?>/i;

// Match closing </body>.
const BODY_END_RE = /<\/body>/i;

// Match Bootstrap bundle <script> (CDN).
const BOOTSTRAP_SCRIPT_RE =
  /<script\s+src=["']https:\/\/cdn\.jsdelivr\.net\/npm\/bootstrap@[^"']+["'](?!\s*[^>]*\bdefer\b)([^>]*)>\s*<\/script>/i;

// Match local <script src="js/aos.js"> (with or without defer). We intentionally
// load AOS *synchronously* because many pages have inline AOS.init({…}) calls
// immediately after the lib include — with defer, those inline scripts would
// run before AOS is defined and silently fail, leaving every [data-aos] element
// stuck at opacity:0 forever.
const AOS_LIB_SCRIPT_ANY_RE =
  /<script\s+src=["']js\/aos\.js["']([^>]*)>\s*<\/script>/i;

function ensureFontIsInter(html) {
  if (POPPINS_RALEWAY_RE.test(html)) {
    return html.replace(POPPINS_RALEWAY_RE, INTER_LINK);
  }
  // Already swapped, or font wasn't loaded this way. No-op.
  return html;
}

const CDN_PRECONNECTS = [
  '<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>',
  '<link rel="preconnect" href="https://cdnjs.cloudflare.com" crossorigin>',
];

function ensureCdnPreconnects(html) {
  let out = html;
  for (const link of CDN_PRECONNECTS) {
    const host = link.match(/href="([^"]+)"/)[1];
    if (out.includes(`preconnect" href="${host}"`)) continue;
    // Insert after the gstatic preconnect if present, else after viewport.
    if (/preconnect.*fonts\.gstatic\.com/.test(out)) {
      out = out.replace(
        /(<link\s+rel=["']preconnect["']\s+href=["']https:\/\/fonts\.gstatic\.com["'][^>]*>)/,
        `$1\n  ${link}`,
      );
    } else {
      out = out.replace(/(<meta\s+name=["']viewport["'][^>]*>)/i, `$1\n  ${link}`);
    }
  }
  return out;
}

function ensureThemeAfterStyle(html) {
  if (html.includes('css/theme.css')) return html; // idempotent
  if (STYLE_CSS_RE.test(html)) {
    return html.replace(STYLE_CSS_RE, (match) => `${match}\n  ${THEME_LINK}`);
  }
  return html;
}

function ensureRevealScript(html) {
  if (html.includes('js/reveal.js')) return html;
  if (BODY_END_RE.test(html)) {
    return html.replace(BODY_END_RE, `  ${REVEAL_SCRIPT}\n</body>`);
  }
  return html;
}

function ensureFontAwesomeAsync(html) {
  // Idempotent — once swapped, the line contains rel="preload" with "all.min.css".
  if (/rel=["']preload["'][^>]*font-awesome/i.test(html)) return html;
  if (FA_BLOCKING_RE.test(html)) {
    return html.replace(FA_BLOCKING_RE, FA_ASYNC_LINK);
  }
  return html;
}

function ensureDeferredScripts(html) {
  let out = html;
  // Add defer to Bootstrap bundle if missing.
  out = out.replace(BOOTSTRAP_SCRIPT_RE, (_m, rest) => {
    const cleaned = rest.replace(/\s*$/g, '');
    return `<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"${cleaned} defer></script>`;
  });
  // Force AOS to load SYNCHRONOUSLY — strip any defer/async/type=module attrs.
  // (See note on AOS_LIB_SCRIPT_ANY_RE for the bug this prevents.)
  out = out.replace(AOS_LIB_SCRIPT_ANY_RE, () =>
    `<script src="js/aos.js"></script>`,
  );
  return out;
}

const entries = await readdir(ROOT, { withFileTypes: true });
const htmlFiles = entries
  .filter((e) => e.isFile() && e.name.endsWith('.html') && !SKIP.has(e.name))
  .map((e) => e.name)
  .sort();

let updated = 0;
let unchanged = 0;

for (const file of htmlFiles) {
  const path = join(ROOT, file);
  const original = await readFile(path, 'utf8');
  let next = original;
  next = ensureFontIsInter(next);
  next = ensureCdnPreconnects(next);
  next = ensureThemeAfterStyle(next);
  next = ensureRevealScript(next);
  next = ensureFontAwesomeAsync(next);
  next = ensureDeferredScripts(next);

  if (next === original) {
    unchanged++;
  } else {
    await writeFile(path, next, 'utf8');
    updated++;
  }
}

console.log(`build-head: updated ${updated}, unchanged ${unchanged}, total ${htmlFiles.length}`);
