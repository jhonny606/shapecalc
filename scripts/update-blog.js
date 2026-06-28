#!/usr/bin/env node
/**
 * ShapeCalc — update-blog.js
 *
 * Lê os HTMLs em /blog/, extrai metadados do <head> e atualiza:
 *   1. blog.html       — grade de artigos
 *   2. sitemap.xml     — entradas de blog (entre os marcadores)
 *   3. index.html      — seção "Últimos Artigos" (3 mais recentes)
 *
 * Uso:
 *   node scripts/update-blog.js
 *
 * Não toca no conteúdo dos artigos — apenas lê <title>, <meta description>
 * e a data que aparece no span de data dentro do artigo.
 *
 * Convenção de data nos artigos:
 *   O script procura por um <span> ou <time> com o padrão:
 *   "Blog · 25 de janeiro de 2026"  ou  "Blog · 2026-01-25"
 *   Se não encontrar, usa hoje como data.
 *
 * Para forçar a data de um artigo, adicione no <head>:
 *   <meta name="article:published_time" content="2026-01-25">
 */

const fs   = require('fs');
const path = require('path');

const ROOT     = path.join(__dirname, '..');
const BLOG_DIR = path.join(ROOT, 'blog');
const BLOG_PAGE  = path.join(ROOT, 'blog.html');
const INDEX_PAGE = path.join(ROOT, 'index.html');
const SITEMAP    = path.join(ROOT, 'sitemap.xml');
const BASE_URL   = 'https://www.shapecalc.com.br';

// ─── Marcadores ──────────────────────────────────────────────────────────────
const MARKERS = {
  blog:    { start: '<!-- BUILD:BLOG_START -->',        end: '<!-- BUILD:BLOG_END -->'        },
  sitemap: { start: '<!-- BUILD:BLOG_START -->',        end: '<!-- BUILD:BLOG_END -->'        },
  index:   { start: '<!-- BUILD:INDEX_BLOG_START -->', end: '<!-- BUILD:INDEX_BLOG_END -->' },
};

// ─── Meses em português → número ─────────────────────────────────────────────
const MESES = {
  janeiro:1, fevereiro:2, março:3, abril:4, maio:5, junho:6,
  julho:7, agosto:8, setembro:9, outubro:10, novembro:11, dezembro:12
};

function parseDatePT(str) {
  // "25 de janeiro de 2026"
  const m = str.match(/(\d{1,2})\s+de\s+(\w+)\s+de\s+(\d{4})/i);
  if (m) {
    const day   = m[1].padStart(2, '0');
    const month = String(MESES[m[2].toLowerCase()] || 1).padStart(2, '0');
    return `${m[3]}-${month}-${day}`;
  }
  // "2026-01-25"
  if (/\d{4}-\d{2}-\d{2}/.test(str)) return str.match(/\d{4}-\d{2}-\d{2}/)[0];
  return null;
}

function formatDateBR(isoDate) {
  const [y, m, d] = isoDate.split('-');
  const meses = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
  return `${parseInt(d)} ${meses[parseInt(m)-1]}. ${y}`;
}

// ─── Extrai metadados do HTML ─────────────────────────────────────────────────
function extractMeta(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');

  const titleM = content.match(/<title>(.*?)\s*\|\s*ShapeCalc<\/title>/i)
               || content.match(/<title>(.*?)<\/title>/i);
  const descM  = content.match(/<meta name="description" content="(.*?)"/i);
  const pubM   = content.match(/<meta name="article:published_time" content="(.*?)"/i);

  // Título limpo (sem "| ShapeCalc")
  const title = titleM ? titleM[1].trim() : null;
  const desc  = descM  ? descM[1].trim()  : '';

  // Data: tenta article:published_time primeiro, depois span de data no body
  let dateISO = pubM ? pubM[1].trim() : null;
  if (!dateISO) {
    const spanM = content.match(/Blog\s*·\s*([^<"]+)/i);
    if (spanM) dateISO = parseDatePT(spanM[1].trim());
  }
  if (!dateISO) dateISO = new Date().toISOString().split('T')[0];

  return { title, desc, dateISO };
}

// ─── Lê todos os artigos ─────────────────────────────────────────────────────
function readArticles() {
  const files = fs.readdirSync(BLOG_DIR)
    .filter(f => f.endsWith('.html') && !f.startsWith('_'));

  const articles = files.map(file => {
    const { title, desc, dateISO } = extractMeta(path.join(BLOG_DIR, file));
    if (!title) {
      console.warn(`⚠️  Sem título: blog/${file} — ignorado`);
      return null;
    }
    // Ignora artigos de template/rascunho (título padrão)
    if (title.toLowerCase().includes('título do artigo')) {
      console.warn(`⚠️  Artigo de rascunho ignorado: blog/${file}`);
      return null;
    }
    return { file, title, desc, dateISO };
  }).filter(Boolean);

  // Ordena por data decrescente
  return articles.sort((a, b) => b.dateISO.localeCompare(a.dateISO));
}

// ─── Substitui entre marcadores ───────────────────────────────────────────────
function replaceBetweenMarkers(content, startMarker, endMarker, newContent) {
  const si = content.indexOf(startMarker);
  const ei = content.indexOf(endMarker);
  if (si === -1 || ei === -1) return null;
  return content.slice(0, si + startMarker.length) + '\n' + newContent + '\n' + content.slice(ei);
}

// ─── 1. Atualiza blog.html ────────────────────────────────────────────────────
function updateBlogPage(articles) {
  let page = fs.readFileSync(BLOG_PAGE, 'utf8');
  const { start, end } = MARKERS.blog;

  const cards = articles.map(a => {
    const dateFmt = formatDateBR(a.dateISO);
    return `            <a href="blog/${a.file}" class="tool-card">
                <div class="card">
                    <h4>${a.title}</h4>
                    <p>${a.desc}</p>
                    <p style="font-size:0.72rem;color:var(--text-muted);margin-top:12px;font-family:'Barlow Condensed',sans-serif;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;">${dateFmt}</p>
                </div>
            </a>`;
  }).join('\n');

  const updated = replaceBetweenMarkers(page, start, end, cards);
  if (!updated) {
    console.error(`❌  blog.html: marcadores não encontrados (${start})`);
    return;
  }
  fs.writeFileSync(BLOG_PAGE, updated, 'utf8');
  console.log(`✅  blog.html atualizado — ${articles.length} artigos`);
}

// ─── 2. Atualiza sitemap.xml ──────────────────────────────────────────────────
function updateSitemap(articles) {
  let sitemap = fs.readFileSync(SITEMAP, 'utf8');
  const { start, end } = MARKERS.sitemap;

  const entries = articles.map(a =>
    `  <url><loc>${BASE_URL}/blog/${a.file}</loc><lastmod>${a.dateISO}</lastmod><changefreq>monthly</changefreq><priority>0.8</priority></url>`
  ).join('\n');

  const updated = replaceBetweenMarkers(sitemap, start, end, entries);
  if (!updated) {
    console.error(`❌  sitemap.xml: marcadores não encontrados`);
    return;
  }
  fs.writeFileSync(SITEMAP, updated, 'utf8');
  console.log(`✅  sitemap.xml atualizado — ${articles.length} entradas`);
}

// ─── 3. Atualiza index.html (3 mais recentes) ─────────────────────────────────
function updateIndex(articles) {
  let page = fs.readFileSync(INDEX_PAGE, 'utf8');
  const { start, end } = MARKERS.index;

  const top3 = articles.slice(0, 3);
  const cards = top3.map(a => {
    const dateFmt = formatDateBR(a.dateISO);
    const descShort = a.desc.length > 100 ? a.desc.slice(0, 97) + '...' : a.desc;
    return `            <a href="blog/${a.file}" class="tool-card">
                <div class="card">
                    <h4>${a.title}</h4>
                    <p>${descShort}</p>
                    <p style="font-size:0.72rem;color:var(--text-muted);margin-top:12px;font-family:'Barlow Condensed',sans-serif;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;">${dateFmt}</p>
                </div>
            </a>`;
  }).join('\n');

  const updated = replaceBetweenMarkers(page, start, end, cards);
  if (!updated) {
    console.error(`❌  index.html: marcadores não encontrados (${start})`);
    return;
  }
  fs.writeFileSync(INDEX_PAGE, updated, 'utf8');
  console.log(`✅  index.html atualizado — ${top3.length} artigos recentes`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────
(function main() {
  console.log('\n📰  ShapeCalc — update-blog\n');
  const articles = readArticles();
  if (articles.length === 0) {
    console.warn('Nenhum artigo encontrado em /blog/');
    return;
  }
  articles.forEach(a => console.log(`   · ${a.file} (${a.dateISO})`));
  console.log('');
  updateBlogPage(articles);
  updateSitemap(articles);
  updateIndex(articles);
  console.log(`\n🚀  Concluído — ${articles.length} artigo(s)\n`);
})();
