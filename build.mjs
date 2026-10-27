// Generador del blog de Negocivex. Sin dependencias: `node build.mjs` escribe la web en dist/.
// Cada artículo es un fichero en posts/<slug>.md con una cabecera (titulo, descripcion, fecha, resumen…).
// Si un artículo está mal formado, el build falla a propósito: Vercel mantiene la versión anterior publicada.
import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, readdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const DIR = dirname(fileURLToPath(import.meta.url));
const OUT = join(DIR, "dist");
const sitio = JSON.parse(readFileSync(join(DIR, "data/sitio.json"), "utf8"));
const css = readFileSync(join(DIR, "src/styles.css"), "utf8");

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const fecha = (iso) => { const [y, m, d] = iso.split("-").map(Number); return `${d} de ${MESES[m - 1]} de ${y}`; };
const slug = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const plain = (s) => s.replace(/\*\*/g, "").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/\*/g, "");
const abs = (p = "") => `${sitio.url}/${p}`;
const hoy = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Madrid" }).format(new Date()); // AAAA-MM-DD
const errores = [];
const pages = []; // [ruta, lastmod]

// ---------- Markdown (subconjunto: ##, ###, párrafos, listas, citas, negrita, cursiva, enlaces) ----------
function inline(s) {
  let t = esc(s);
  t = t.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, txt, url) => {
    const ext = /^https?:\/\//.test(url) && !url.startsWith(sitio.url);
    return `<a href="${url}"${ext ? ' rel="noopener" target="_blank"' : ""}>${txt}</a>`;
  });
  t = t.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  t = t.replace(/(^|[^*\w])\*([^*\s][^*]*?)\*/g, "$1<em>$2</em>");
  return t;
}
function md(src) {
  const lines = src.replace(/\r/g, "").split("\n");
  const out = [], heads = [], faq = [], para = [], links = [];
  let i = 0, inFaq = false, q = null;
  const flush = () => { if (!para.length) return; const t = para.join(" "); out.push(`<p>${inline(t)}</p>`); if (q) q.a.push(plain(t)); para.length = 0; };
  for (const l of lines) for (const m of l.matchAll(/\]\((\/[^)\s]*)\)/g)) links.push(m[1]);
  while (i < lines.length) {
    const l = lines[i];
    let m;
    if (!l.trim()) { flush(); i++; continue; }
    if ((m = l.match(/^(#{2,3})\s+(.+)$/))) {
      flush();
      const lvl = m[1].length, text = m[2].trim(), id = slug(text);
      if (lvl === 2) { inFaq = /^preguntas frecuentes$/i.test(text); q = null; heads.push({ id, text }); }
      if (lvl === 3 && inFaq) { q = { q: plain(text), a: [] }; faq.push(q); }
      out.push(`<h${lvl} id="${id}">${inline(text)}</h${lvl}>`); i++; continue;
    }
    if (/^[-*]\s+/.test(l) || /^\d+\.\s+/.test(l)) {
      flush();
      const ord = /^\d+\.\s+/.test(l), re = ord ? /^\d+\.\s+/ : /^[-*]\s+/, items = [];
      while (i < lines.length && re.test(lines[i])) { items.push(lines[i].replace(re, "")); i++; }
      out.push(`<${ord ? "ol" : "ul"}>${items.map((x) => `<li>${inline(x)}</li>`).join("")}</${ord ? "ol" : "ul"}>`);
      if (q) q.a.push(items.map(plain).join(". "));
      continue;
    }
    if (/^>/.test(l)) {
      flush();
      const bloque = [];
      while (i < lines.length && /^>/.test(lines[i])) { bloque.push(lines[i].replace(/^>\s?/, "")); i++; }
      const parrafos = bloque.join("\n").split(/\n\s*\n/).map((p) => p.split("\n").join(" ").trim()).filter(Boolean);
      out.push(`<blockquote>${parrafos.map((p) => `<p>${inline(p)}</p>`).join("")}</blockquote>`);
      if (q) q.a.push(parrafos.map(plain).join(" "));
      continue;
    }
    para.push(l.trim()); i++;
  }
  flush();
  return { html: out.join("\n"), heads, faq, links };
}

// ---------- Artículos ----------
function leerPost(file) {
  const raw = readFileSync(join(DIR, "posts", file), "utf8").replace(/\r/g, "");
  const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) { errores.push(`${file}: falta la cabecera entre --- y ---`); return null; }
  const meta = {};
  for (const l of m[1].split("\n")) { const k = l.match(/^([a-z_]+):\s*(.*)$/); if (k) meta[k[1]] = k[2].trim(); }
  const p = { ...meta, slug: meta.slug || file.replace(/\.md$/, ""), body: m[2] };
  for (const k of ["titulo", "descripcion", "fecha", "resumen"]) if (!p[k]) errores.push(`${file}: falta "${k}"`);
  if (p.fecha && !/^\d{4}-\d{2}-\d{2}$/.test(p.fecha)) errores.push(`${file}: la fecha debe ser AAAA-MM-DD`);
  if (p.descripcion && p.descripcion.length > 160) errores.push(`${file}: la descripción pasa de 160 caracteres (${p.descripcion.length})`);
  if (p.titulo && p.titulo.length > 70) errores.push(`${file}: el título pasa de 70 caracteres (${p.titulo.length})`);
  if (!/^[a-z0-9-]+$/.test(p.slug)) errores.push(`${file}: el nombre del fichero solo puede llevar minúsculas, números y guiones`);
  p.publicado = !/^(no|false)$/i.test(p.publicado ?? "si");
  p.actualizado = p.actualizado || p.fecha;
  p.md = md(p.body);
  p.palabras = plain(p.body).split(/\s+/).filter(Boolean).length;
  p.minutos = Math.max(1, Math.round(p.palabras / 200));
  p.og = existsSync(join(DIR, "public/og", `${p.slug}.png`)) ? `og/${p.slug}.png` : "og.png";
  return p;
}
const todos = readdirSync(join(DIR, "posts")).filter((f) => f.endsWith(".md")).map(leerPost).filter(Boolean);
const posts = todos.filter((p) => p.publicado && p.fecha <= hoy).sort((a, b) => b.fecha.localeCompare(a.fecha) || a.titulo.localeCompare(b.titulo, "es"));
const rutas = new Set(["/", "/piloto/", "/sobre/", "/aviso-legal/", "/privacidad/", "/cookies/", ...posts.map((p) => `/${p.slug}/`)]);
for (const p of posts) for (const l of p.md.links) if (!rutas.has(l.split("#")[0])) errores.push(`${p.slug}.md: enlace interno roto ${l}`);
if (errores.length) { console.error("No se publica: hay errores en los artículos.\n- " + errores.join("\n- ")); process.exit(1); }

// ---------- Plantilla ----------
const ICONO = `<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M4 0h18a4 4 0 0 1 4 4v8a4 4 0 0 1-4 4H12l-8 6 2-6H4a4 4 0 0 1-4-4V4a4 4 0 0 1 4-4z" fill="#1B2A5E"/><circle cx="6" cy="8" r="2.2" fill="#fff"/><circle cx="14" cy="8" r="2.2" fill="#fff"/><circle cx="22" cy="8" r="2.2" fill="#fff"/><circle cx="22" cy="22" r="10" fill="#fff"/><circle cx="22" cy="22" r="8.2" fill="#5046E5"/><path d="M18 22l3 3 5.5-5.5" fill="none" stroke="#fff" stroke-width="4.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const piloto = sitio.piloto;
const hayPlazas = piloto.abierto && piloto.plazas_libres > 0;
const MAILTO = `mailto:${sitio.contacto}?subject=${encodeURIComponent(hayPlazas ? "Quiero una plaza en el piloto" : "Apúntame a la lista de espera del piloto")}&body=${encodeURIComponent("Hola, Ángel:\n\nMe interesa el piloto de Negocivex.\n\nNombre del negocio:\nTipo (bar, restaurante, cafetería…):\nCiudad y país:\nTeléfono (opcional):\n")}`;
const plazasTexto = hayPlazas ? `Quedan ${piloto.plazas_libres} de ${piloto.plazas_total} plazas` : "Plazas completas: lista de espera abierta";

const cta = () => `<aside class="cta">
<p class="cta-tag"><span class="dot"></span>Piloto gratuito · ${esc(piloto.duracion)}</p>
<h2>¿Quieres saber qué piensan de verdad tus clientes?</h2>
<p>Busco ${piloto.plazas_total} bares, restaurantes o cafeterías para probar Negocivex gratis durante ${esc(piloto.duracion)}. Da igual dónde estés: yo te guío paso a paso. ${esc(plazasTexto)}.</p>
<p><a class="btn" href="/piloto/">Ver el piloto</a></p>
</aside>`;

function layout({ path, title, desc, body, jsonld = [], noindex = false, og = "og.png", type = "website", fullTitle }) {
  const url = abs(path);
  const t = fullTitle ?? `${title} | ${sitio.marca}`;
  const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(t)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:type" content="${type}">
<meta property="og:url" content="${url}">
<meta property="og:locale" content="es_ES">
<meta property="og:site_name" content="${esc(sitio.nombre)}">
<meta property="og:image" content="${abs(og)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#1B2A5E">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="alternate" type="application/rss+xml" title="${esc(sitio.nombre)}" href="/rss.xml">
<link rel="preload" href="/fonts/dm-sans-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/styles.css">
${noindex ? '<meta name="robots" content="noindex">\n' : ""}${jsonld.map((j) => `<script type="application/ld+json">${JSON.stringify(j)}</script>`).join("\n")}
</head>
<body>
<header class="site-head"><div class="wrap">
<a class="brand" href="/">${ICONO}<span>negoci<b>vex</b></span><small>blog</small></a>
<nav aria-label="Principal"><a href="/">Artículos</a><a href="/piloto/" class="nav-piloto">Piloto gratis</a><a href="/sobre/">Sobre mí</a></nav>
</div></header>
<main>
${body}
</main>
<footer class="site-foot"><div class="wrap">
<p><a href="${sitio.web}">negocivex.com</a> · <a href="mailto:${sitio.contacto}">${sitio.contacto}</a> · <a href="${sitio.x}">X</a></p>
<p><a href="/aviso-legal/">Aviso legal</a> · <a href="/privacidad/">Privacidad</a> · <a href="/cookies/">Cookies</a> · <a href="/rss.xml">RSS</a></p>
</div></footer>
</body>
</html>
`;
  const file = join(OUT, path, path.endsWith(".html") ? "" : "index.html");
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, html);
}

const organizacion = { "@type": "Organization", name: sitio.marca, url: sitio.web, logo: { "@type": "ImageObject", url: abs("logo.png") }, email: sitio.contacto };
const persona = { "@type": "Person", name: sitio.autor.nombre, jobTitle: sitio.autor.rol, url: abs("sobre/") };
const migas = (items) => ({ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [["Inicio", ""], ...items].map(([name, p], i) => ({ "@type": "ListItem", position: i + 1, name, item: abs(p) })) });
const tarjeta = (p) => `<article class="card">
<p class="meta">${fecha(p.fecha)} · ${p.minutos} min de lectura</p>
<h3><a href="/${p.slug}/">${esc(p.titulo)}</a></h3>
<p>${esc(p.descripcion)}</p>
</article>`;

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
cpSync(join(DIR, "public"), OUT, { recursive: true });
writeFileSync(join(OUT, "styles.css"), css);

// ---------- Inicio ----------
layout({
  path: "",
  title: "Lo que tus clientes no te dicen",
  fullTitle: "Blog de Negocivex: reseñas, quejas y clientes que vuelven",
  desc: "Guías prácticas para bares, restaurantes y cafeterías: cómo responder reseñas, conseguir más opiniones en Google y saber por qué un cliente no vuelve.",
  jsonld: [{ "@context": "https://schema.org", "@type": "Blog", name: sitio.nombre, url: abs(), inLanguage: "es", publisher: organizacion, author: persona }],
  body: `<section class="hero"><div class="wrap narrow">
<p class="kicker">El blog de Negocivex</p>
<h1>Lo que tus clientes no te dicen</h1>
<p class="lead">Guías prácticas para bares, restaurantes y cafeterías: reseñas, quejas y cómo conseguir que tus clientes vuelvan. Sin tecnicismos.</p>
</div></section>
<section class="wrap narrow">
<h2 class="section-title">Últimos artículos</h2>
<div class="cards">${posts.map(tarjeta).join("\n") || "<p>Pronto habrá artículos aquí.</p>"}</div>
${cta()}
</section>`,
});
pages.push(["", posts[0]?.actualizado ?? hoy]);

// ---------- Artículos ----------
for (const p of posts) {
  const relacionados = posts.filter((o) => o.slug !== p.slug).slice(0, 3);
  const indice = p.md.heads.filter((h) => !/^fuentes$/i.test(h.text));
  const jsonld = [
    { "@context": "https://schema.org", "@type": "BlogPosting", headline: p.titulo, description: p.descripcion, datePublished: p.fecha, dateModified: p.actualizado, inLanguage: "es", mainEntityOfPage: abs(`${p.slug}/`), image: abs(p.og), wordCount: p.palabras, author: persona, publisher: organizacion },
    migas([[p.titulo, `${p.slug}/`]]),
  ];
  if (p.md.faq.length) jsonld.push({ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: p.md.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a.join(" ") } })) });
  layout({
    path: `${p.slug}/`, title: p.titulo, desc: p.descripcion, og: p.og, type: "article", jsonld,
    body: `<article class="post wrap narrow">
<nav class="crumbs" aria-label="Ruta"><a href="/">Inicio</a> / <span>${esc(p.titulo)}</span></nav>
<h1>${esc(p.titulo)}</h1>
<p class="meta">Por <a href="/sobre/">${esc(sitio.autor.nombre)}</a> · ${fecha(p.fecha)}${p.actualizado !== p.fecha ? ` · actualizado el ${fecha(p.actualizado)}` : ""} · ${p.minutos} min de lectura</p>
<div class="tldr"><p class="tldr-tag">En resumen</p><p>${inline(p.resumen)}</p></div>
${indice.length >= 3 ? `<nav class="toc" aria-label="Contenido"><p>Contenido</p><ol>${indice.map((h) => `<li><a href="#${h.id}">${esc(plain(h.text))}</a></li>`).join("")}</ol></nav>` : ""}
<div class="prose">
${p.md.html}
</div>
${cta()}
<aside class="author">${ICONO}<div><p class="author-name">${esc(sitio.autor.nombre)} · ${esc(sitio.autor.rol)}</p><p>${esc(sitio.autor.bio)}</p></div></aside>
${relacionados.length ? `<section class="related"><h2 class="section-title">Sigue leyendo</h2><div class="cards">${relacionados.map(tarjeta).join("\n")}</div></section>` : ""}
</article>`,
  });
  pages.push([`${p.slug}/`, p.actualizado]);
}

// ---------- Piloto ----------
layout({
  path: "piloto/", title: `Piloto gratuito de Negocivex: ${piloto.duracion} sin coste`,
  desc: `Busco ${piloto.plazas_total} bares, restaurantes o cafeterías para probar Negocivex gratis durante ${piloto.duracion}, estén donde estén. Sin tarjeta y sin compromiso.`,
  jsonld: [migas([["Piloto gratuito", "piloto/"]])],
  body: `<section class="hero"><div class="wrap narrow">
<p class="kicker"><span class="dot"></span>${esc(plazasTexto)}</p>
<h1>Prueba Negocivex gratis durante ${esc(piloto.duracion)}</h1>
<p class="lead">Busco ${piloto.plazas_total} bares, restaurantes o cafeterías que quieran saber qué piensan de verdad sus clientes y qué cambiar. Sin tarjeta y sin compromiso.</p>
<p><a class="btn btn-light" href="${MAILTO}">${hayPlazas ? "Quiero una plaza" : "Apuntarme a la lista de espera"}</a></p>
</div></section>
<section class="wrap narrow prose">
<h2>Qué vas a tener</h2>
<ul>
<li>Un QR para tus mesas o tu barra. Te mando el cartel listo para imprimir.</li>
<li>Tus clientes te cuentan desde el móvil qué tal les ha ido, sin descargar nada.</li>
<li>A los que salen contentos les llega tu enlace para dejarte una reseña en Google.</li>
<li>Las quejas te llegan a ti en privado y al momento, para que puedas arreglarlo.</li>
<li>Ves qué temas se repiten (la espera, el precio, el trato…) y cómo evolucionan.</li>
<li>Cada mes, un informe con lo importante y una propuesta concreta de qué mejorar.</li>
</ul>
<p>Durante el piloto usas Negocivex completo, con todas las funciones del plan ${esc(piloto.plan)}.</p>
<h2>Para quién es</h2>
<p>Para cualquier negocio de hostelería: bar, restaurante, cafetería, de barrio o de carta larga. No hace falta saber de tecnología. Da igual que tengas 25 años o 60: si sabes leer un correo, sabes usarlo.</p>
<h2>Dónde</h2>
<p>Estoy en Pamplona y allí puedo ir en persona. Si estás en otra ciudad u otro país, lo montamos por videollamada y correo: tus clientes solo necesitan su móvil. De momento todo funciona en español.</p>
<h2>Qué te pido a cambio</h2>
<ol>
<li>Poner el QR donde tus clientes lo vean.</li>
<li>Pegar en tu panel el enlace de reseñas de tu ficha de Google. Te explico cómo en dos minutos.</li>
<li>Contarme con sinceridad qué te sirve y qué no, para mejorarlo.</li>
</ol>
<h2>Y al terminar</h2>
<p>Decides tú. Si te ha sido útil, puedes seguir con un plan de pago; si no, lo dejas y ya está. No te pido tarjeta para el piloto, así que no se te cobra nada sin que lo decidas.</p>
<h2>Cómo apuntarte</h2>
<p>Escríbeme a <a href="${MAILTO}">${sitio.contacto}</a> con el nombre de tu negocio, el tipo de local y tu ciudad. Te respondo yo, Ángel, en menos de 48 horas laborables.</p>
</section>`,
});
pages.push(["piloto/", hoy]);

// ---------- Sobre mí ----------
layout({
  path: "sobre/", title: "Sobre mí", desc: `Quién escribe este blog: ${sitio.autor.nombre}, ${(sitio.autor.rol[0].toLowerCase() + sitio.autor.rol.slice(1))}, desde Pamplona.`,
  jsonld: [{ "@context": "https://schema.org", "@type": "ProfilePage", mainEntity: { ...persona, worksFor: organizacion, homeLocation: { "@type": "Place", name: "Pamplona, España" } } }, migas([["Sobre mí", "sobre/"]])],
  body: `<section class="wrap narrow prose about">
<h1>Sobre mí</h1>
<p>${esc(sitio.autor.bio)}</p>
<p>Negocivex nace de una idea sencilla: Google te dice qué nota tienes, pero no por qué. Muchos clientes que se van descontentos no dicen nada; simplemente no vuelven. Negocivex les da una forma rápida de contártelo con un QR, te ordena lo que dicen y te ayuda a decidir qué cambiar.</p>
<p>Lo llevo yo solo, y por eso en este blog hablo en primera persona. Escribo sobre lo que funciona y lo que no al gestionar opiniones de clientes en hostelería, con fuentes cuando cito normas o datos.</p>
<p>Si quieres escribirme: <a href="mailto:${sitio.contacto}">${sitio.contacto}</a>.</p>
</section>
<section class="wrap narrow">${cta()}</section>`,
});
pages.push(["sobre/", hoy]);

// ---------- Legal ----------
const legal = (p, titulo, html) => { layout({ path: `${p}/`, title: titulo, desc: `${titulo} del ${sitio.nombre}.`, noindex: true, body: `<section class="wrap narrow prose"><h1>${titulo}</h1>${html}</section>` }); };
legal("aviso-legal", "Aviso legal", `
<p>En cumplimiento del artículo 10 de la Ley 34/2002, de servicios de la sociedad de la información, se identifica al titular de este sitio web.</p>
<ul><li>Titular: ${esc(sitio.titular.nombre)}</li><li>NIF: ${esc(sitio.titular.nif)}</li><li>Domicilio: ${esc(sitio.titular.domicilio)}</li><li>Contacto: ${esc(sitio.contacto)}</li></ul>
<h2>Qué es este sitio</h2>
<p>${esc(sitio.nombre)} publica artículos informativos sobre la gestión de opiniones y reseñas en hostelería. Las normas de terceros que se citan, como las de Google, pueden cambiar: cada artículo enlaza a la fuente original para que puedas comprobar la versión vigente.</p>
<h2>Marcas</h2>
<p>Los nombres y marcas de terceros pertenecen a sus titulares y se citan solo para identificarlos.</p>`);
legal("privacidad", "Política de privacidad", `
<p>Este blog no tiene formularios, registro de usuarios ni herramientas de analítica o publicidad, y no recoge datos personales de quienes lo visitan.</p>
<p>El alojamiento lo presta Vercel Inc., que como cualquier servidor web procesa datos técnicos de conexión, como la dirección IP, para servir las páginas y mantener la seguridad del servicio.</p>
<p>Si escribes a ${esc(sitio.contacto)}, por ejemplo para pedir una plaza en el piloto, tu mensaje y tu dirección se usarán solo para responderte y gestionar tu solicitud.</p>
<p>Responsable: ${esc(sitio.titular.nombre)}. Puedes ejercer tus derechos de acceso, rectificación y supresión escribiendo a ${esc(sitio.contacto)}, y reclamar ante la Agencia Española de Protección de Datos.</p>
<p>El uso del servicio Negocivex se rige por su propia política de privacidad, publicada en <a href="${sitio.web}">negocivex.com</a>.</p>`);
legal("cookies", "Política de cookies", `
<p>Este blog no utiliza cookies propias ni de terceros. Las tipografías y los estilos se sirven desde el propio dominio, sin llamadas a servicios externos.</p>
<p>Los enlaces a otras webs llevan a sitios ajenos, que tienen sus propias políticas de cookies.</p>`);
layout({ path: "404.html", title: "Página no encontrada", desc: "Página no encontrada.", noindex: true, body: `<section class="hero"><div class="wrap narrow"><h1>Página no encontrada</h1><p class="lead">Esta dirección no existe o ha cambiado.</p><p><a class="btn btn-light" href="/">Volver al blog</a></p></div></section>` });

// ---------- robots, sitemap, RSS y llms.txt ----------
const rfc = (iso) => new Date(`${iso}T08:00:00Z`).toUTCString();
writeFileSync(join(OUT, "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${abs("sitemap.xml")}\n`);
writeFileSync(join(OUT, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.map(([p, d]) => `<url><loc>${abs(p)}</loc><lastmod>${d}</lastmod></url>`).join("\n")}\n</urlset>\n`);
writeFileSync(join(OUT, "rss.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel>\n<title>${esc(sitio.nombre)}</title>\n<link>${abs()}</link>\n<atom:link href="${abs("rss.xml")}" rel="self" type="application/rss+xml"/>\n<description>Guías prácticas para bares, restaurantes y cafeterías sobre reseñas, quejas y clientes.</description>\n<language>es</language>\n${posts.map((p) => `<item><title>${esc(p.titulo)}</title><link>${abs(`${p.slug}/`)}</link><guid>${abs(`${p.slug}/`)}</guid><pubDate>${rfc(p.fecha)}</pubDate><description>${esc(p.descripcion)}</description></item>`).join("\n")}\n</channel></rss>\n`);
writeFileSync(join(OUT, "llms.txt"), `# ${sitio.nombre}\n\n> Guías prácticas en español para bares, restaurantes y cafeterías sobre reseñas de Google, quejas de clientes y cómo conseguir que vuelvan. Lo escribe ${sitio.autor.nombre}, ${(sitio.autor.rol[0].toLowerCase() + sitio.autor.rol.slice(1))} (${sitio.web}).\n\n## Artículos\n\n${posts.map((p) => `- [${p.titulo}](${abs(`${p.slug}/`)}): ${p.descripcion}`).join("\n")}\n\n## Negocivex\n\n- [Piloto gratuito](${abs("piloto/")}): ${plazasTexto.toLowerCase()} para probar Negocivex gratis durante ${piloto.duracion}.\n- [Sobre el autor](${abs("sobre/")})\n`);

console.log(`Blog: ${posts.length} artículos publicados, ${todos.length - posts.length} pendientes (borrador o con fecha futura), ${pages.length} páginas en el sitemap.`);
