#!/usr/bin/env node
/**
 * ShapeCalc — Build de Blog
 * 
 * O que esse script faz:
 *   1. Lê todos os arquivos .md em /content/blog/
 *   2. Gera um HTML em /blog/ para cada artigo usando o template
 *   3. Atualiza a listagem de artigos em /blog.html
 *   4. Atualiza as entradas de blog no /sitemap.xml
 * 
 * Uso:
 *   npm run build
 */

const fs   = require('fs');
const path = require('path');
const { marked }  = require('marked');
const matter = require('gray-matter');

// ─── Caminhos ───────────────────────────────────────────────────────────────
const ROOT         = path.join(__dirname, '..');
const CONTENT_DIR  = path.join(ROOT, 'content', 'blog');
const OUTPUT_DIR   = path.join(ROOT, 'blog');
const BLOG_PAGE    = path.join(ROOT, 'blog.html');
const SITEMAP      = path.join(ROOT, 'sitemap.xml');
const TEMPLATE     = path.join(__dirname, 'blog-template.html');

// ─── Configuração marked ────────────────────────────────────────────────────
marked.setOptions({ gfm: true, breaks: false });

// ─── Utilitários ────────────────────────────────────────────────────────────
function formatDateBR(dateInput) {
  // gray-matter pode retornar Date object ou string
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput + 'T12:00:00');
  return d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' });
}

function dateToISO(dateInput) {
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput + 'T12:00:00');
  return d.toISOString().split('T')[0];
}

function slugify(str) {
  return str
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

// ─── Leitura dos artigos ────────────────────────────────────────────────────
function readArticles() {
  if (!fs.existsSync(CONTENT_DIR)) {
    console.error(`❌  Pasta não encontrada: ${CONTENT_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(CONTENT_DIR)
    .filter(f => f.endsWith('.md') && !f.startsWith('_'));

  if (files.length === 0) {
    console.warn('⚠️  Nenhum artigo .md encontrado em content/blog/');
    return [];
  }

  const articles = files.map(file => {
    const raw  = fs.readFileSync(path.join(CONTENT_DIR, file), 'utf8');
    const { data, content } = matter(raw);

    // Validações obrigatórias
    const required = ['title', 'description', 'date', 'slug'];
    const missing  = required.filter(k => !data[k]);
    if (missing.length) {
      console.error(`❌  ${file}: campos obrigatórios faltando: ${missing.join(', ')}`);
      process.exit(1);
    }

    return {
      file,
      title:       data.title,
      description: data.description,
      date:        data.date,
      slug:        data.slug,
      category:    data.category || 'Blog',
      // campos opcionais
      canonical:   data.canonical || `https://www.shapecalc.com.br/blog/${data.slug}.html`,
      noindex:     data.noindex   || false,
      content,
    };
  });

  // Ordena por data decrescente (mais novo primeiro)
  return articles.sort((a, b) => new Date(b.date) - new Date(a.date));
}

// ─── Geração dos HTMLs dos artigos ──────────────────────────────────────────
function buildArticles(articles) {
  const template = fs.readFileSync(TEMPLATE, 'utf8');

  articles.forEach(article => {
    const html = marked.parse(article.content);
    const dateFmt = formatDateBR(article.date);
    const robots = article.noindex ? '<meta name="robots" content="noindex">' : '';

    const output = template
      .replace(/{{TITLE}}/g,       article.title)
      .replace(/{{DESCRIPTION}}/g, article.description)
      .replace(/{{CANONICAL}}/g,   article.canonical)
      .replace(/{{CATEGORY}}/g,    article.category)
      .replace(/{{DATE_BR}}/g,     dateFmt)
      .replace(/{{CONTENT}}/g,     html)
      .replace(/{{ROBOTS}}/g,      robots);

    const outFile = path.join(OUTPUT_DIR, `${article.slug}.html`);
    fs.writeFileSync(outFile, output, 'utf8');
    console.log(`✅  Gerado: blog/${article.slug}.html`);
  });
}

// ─── Atualização de blog.html ────────────────────────────────────────────────
function updateBlogListing(articles) {
  let page = fs.readFileSync(BLOG_PAGE, 'utf8');

  const cards = articles.map(a => {
    const dateFmt = formatDateBR(a.date);
    return `
            <a href="blog/${a.slug}.html" class="tool-card">
                <div class="card">
                    <h4>${a.title}</h4>
                    <p>${a.description}</p>
                    <p style="font-size:0.72rem;color:var(--text-muted);margin-top:12px;font-family:'Barlow Condensed',sans-serif;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;">${dateFmt}</p>
                </div>
            </a>`;
  }).join('\n');

  // Substitui o bloco entre os marcadores
  const start = '<!-- BUILD:BLOG_START -->';
  const end   = '<!-- BUILD:BLOG_END -->';

  if (!page.includes(start) || !page.includes(end)) {
    console.error(`❌  blog.html não contém os marcadores ${start} ... ${end}`);
    console.error('    Adicione-os manualmente ao redor do bloco de cards de artigos.');
    process.exit(1);
  }

  const before = page.slice(0, page.indexOf(start) + start.length);
  const after  = page.slice(page.indexOf(end));
  const updated = `${before}\n${cards}\n            ${after}`;

  fs.writeFileSync(BLOG_PAGE, updated, 'utf8');
  console.log(`✅  blog.html atualizado (${articles.length} artigos)`);
}

// ─── Atualização do sitemap.xml ─────────────────────────────────────────────
function updateSitemap(articles) {
  let sitemap = fs.readFileSync(SITEMAP, 'utf8');

  const start = '<!-- BUILD:BLOG_START -->';
  const end   = '<!-- BUILD:BLOG_END -->';

  if (!sitemap.includes(start) || !sitemap.includes(end)) {
    console.error(`❌  sitemap.xml não contém os marcadores ${start} ... ${end}`);
    process.exit(1);
  }

  const entries = articles.map(a => {
    const dateISO = dateToISO(a.date);
    return `  <url><loc>https://www.shapecalc.com.br/blog/${a.slug}.html</loc><lastmod>${dateISO}</lastmod><changefreq>monthly</changefreq><priority>0.8</priority></url>`;
  }).join('\n');

  const before  = sitemap.slice(0, sitemap.indexOf(start) + start.length);
  const after   = sitemap.slice(sitemap.indexOf(end));
  const updated = `${before}\n${entries}\n${after}`;

  fs.writeFileSync(SITEMAP, updated, 'utf8');
  console.log(`✅  sitemap.xml atualizado (${articles.length} entradas de blog)`);
}

// ─── Main ────────────────────────────────────────────────────────────────────
(function main() {
  console.log('\n🔨  ShapeCalc — Build Blog\n');

  const articles = readArticles();
  if (articles.length === 0) return;

  buildArticles(articles);
  updateBlogListing(articles);
  updateSitemap(articles);

  console.log(`\n🚀  Build concluído — ${articles.length} artigo(s) processado(s)\n`);
})();
