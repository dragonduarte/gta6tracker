// Corre no Vercel antes de publicar: põe o endereço real do site nas meta tags (pré-visualização no LinkedIn).
import fs from 'node:fs';
const host = process.env.SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL && `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`) || (process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`) || '';
const f = 'public/index.html';
fs.writeFileSync(f, fs.readFileSync(f, 'utf8').replaceAll('__SITE_URL__', host.replace(/\/$/, '')));
console.log('SITE_URL =', host || '(relativo)');

// robots.txt e sitemap.xml com o endereço real (ajuda o Google a encontrar "GTA 6", "GTA VI", "Grand Theft Auto VI"...)
const base = host.replace(/\/$/, '');
if (base) {
  const today = new Date().toISOString().slice(0, 10);
  fs.writeFileSync('public/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <url><loc>${base}/</loc><lastmod>${today}</lastmod><changefreq>hourly</changefreq><priority>1.0</priority>
    <xhtml:link rel="alternate" hreflang="pt" href="${base}/?lang=pt"/><xhtml:link rel="alternate" hreflang="en" href="${base}/?lang=en"/></url>
  <url><loc>${base}/?lang=en</loc><lastmod>${today}</lastmod><changefreq>hourly</changefreq><priority>0.8</priority></url>
</urlset>
`);
  fs.writeFileSync('public/robots.txt', `User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: ${base}/sitemap.xml\n`);
}

