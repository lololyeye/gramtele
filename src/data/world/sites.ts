import { getLanguage, Language, lineKey, tr, T, Tn } from '../../i18n';
import { localizeDocument } from '../../i18n/documents';
import { html, staticSite, StaticPage, text } from '../../game/virtual-network/net';
import type { SiteEnv, VRequest, VResponse, VSite } from '../../game/virtual-network/types';
import './en';
import { ALDRIC_PHOTO, BRASK_REPORT, HALDEN_REPORT, NEWSLETTER_2021, NX417_PRESS, RIDGE_PHOTO } from './documents';

/**
 * Every fictional website. Each one has its own look because each one is a different organization.
 * This file holds layout, addresses and server behaviour. The words are in en.ts and fr.ts.
 */

const w = (key: string) => lineKey(`pages.${key}`);

const page = (title: string, css: string, body: string): StaticPage => ({
  body: `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${title}</title><style>${css}</style></head><body>${body}</body></html>\n`,
});

const PDF = 'application/pdf';
const JPG = 'image/jpeg';

/** A page whose title and body come from the world's text, placed inside the site's layout. */
const pg = (id: string, css: string, layout: (body: string) => string = (b) => b): StaticPage => page(w(`${id}.title`), css, layout(w(`${id}.body`)));
const forbidden = (detail?: string) => `<!doctype html><html><head><title>${w('forbidden')}</title></head><body><h1>${w('forbidden')}</h1>${detail ? `<p>${w(detail)}</p>` : ''}</body></html>\n`;

// ---------- Gramtele ----------

const GT_CSS = `body{margin:0;background:#0f1211;color:#c9ccc5;font:16px/1.6 Georgia,serif}main{max-width:620px;margin:0 auto;padding:56px 24px}h1{font-weight:normal;font-size:28px;color:#e8eae4}a{color:#a7b8a4}nav{font:13px monospace;margin-bottom:40px}nav a{margin-right:16px}small{color:#7a7f78}`;
const gtNav = `<nav><a href="/">gramtele</a><a href="/about">${w('gramtele.nav.about')}</a><a href="/transparency">${w('gramtele.nav.transparency')}</a><a href="/standing">${w('gramtele.nav.standing')}</a></nav>`;
const gtLayout = (b: string) => `<main>${gtNav}${b}</main>`;
const gramtele = staticSite(
  'gramtele.test',
  {
    '/': pg('gramtele.home', GT_CSS, gtLayout),
    '/about': pg('gramtele.about', GT_CSS, gtLayout),
    '/transparency': pg('gramtele.transparency', GT_CSS, gtLayout),
    '/standing': pg('gramtele.standing', GT_CSS, gtLayout),
  },
  { headers: [['Server', 'gt-edge'], ['X-Content-Type-Options', 'nosniff'], ['Strict-Transport-Security', 'max-age=63072000']], cert: { subject: 'CN=gramtele.test', issuer: 'O=Orion Security, CN=Orion Security Internal CA', notAfter: 'Feb 02 2027 GMT' } },
);

// ---------- Lindgate ----------

const LG_CSS = `body{margin:0;background:#f4f2ec;color:#2b2b28;font:16px/1.6 "Times New Roman",serif}header{background:#20302b;color:#efe9d8;padding:24px 40px;font-size:22px;letter-spacing:.04em}main{max-width:680px;margin:32px auto;padding:0 24px}a{color:#20503f}footer{margin:48px auto;max-width:680px;padding:0 24px;font-size:13px;color:#7a776c}`;
const lgLayout = (footer: string) => (b: string) => `<header>Lindgate Advisory</header><main>${b}</main><footer>${w(footer)}</footer>`;
const lindgate = staticSite(
  'lindgate.test',
  {
    '/': pg('lindgate.home', LG_CSS, lgLayout('lindgate.footer_home')),
    '/team': pg('lindgate.team', LG_CSS, lgLayout('lindgate.footer')),
    '/contact': pg('lindgate.contact', LG_CSS, lgLayout('lindgate.footer')),
  },
  { headers: [['Server', 'nginx/1.24.0'], ['X-Served-By', 'orion-edge-3']] },
);

// ---------- Blackwell ----------

const BW_CSS = `body{margin:0;background:#101317;color:#d6d8da;font:15px/1.65 Helvetica,Arial,sans-serif}header{padding:28px 48px;border-bottom:1px solid #2a2f35;letter-spacing:.32em;font-size:13px}nav{padding:12px 48px;font-size:13px}nav a{color:#9aa3ab;margin-right:20px;text-decoration:none}main{max-width:720px;padding:48px}h1{font-weight:300;font-size:34px;color:#fff;margin-top:0}footer{padding:48px;color:#646b72;font-size:12px}a{color:#b6c0c9}`;
const bwNav = `<header>BLACKWELL</header><nav><a href="/">${w('blackwell.nav.home')}</a><a href="/services">${w('blackwell.nav.services')}</a><a href="/leadership">${w('blackwell.nav.leadership')}</a><a href="/careers">${w('blackwell.nav.careers')}</a></nav>`;
const bwLayout = (footer: string) => (b: string) => `${bwNav}<main>${b}</main><footer>${w(footer)}</footer>`;
const blackwell = staticSite(
  'blackwell.test',
  {
    '/': pg('blackwell.home', BW_CSS, bwLayout('blackwell.footer_home')),
    '/services': pg('blackwell.services', BW_CSS, bwLayout('blackwell.footer')),
    '/leadership': pg('blackwell.leadership', BW_CSS, bwLayout('blackwell.footer')),
    '/careers': pg('blackwell.careers', BW_CSS, bwLayout('blackwell.footer')),
    '/robots.txt': { body: `User-agent: *\nDisallow: /special-engagements/\nDisallow: /contractor-intake/\n`, type: 'text/plain' },
    '/special-engagements/': { status: 403, body: forbidden('forbidden_logged') },
    '/contractor-intake/': { status: 403, body: forbidden() },
  },
  { headers: [['Server', 'nginx/1.24.0'], ['X-Served-By', 'orion-edge-1'], ['Strict-Transport-Security', 'max-age=31536000']], cert: { subject: 'CN=blackwell.test', issuer: 'O=Orion Security, CN=Orion Security Internal CA', notAfter: 'Mar 15 2027 GMT' } },
);

const portalSite: VSite = {
  host: 'portal.nexus-labs.test',
  headers: [['Server', 'Werkzeug/2.0.1 Python/3.8.10'], ['X-Served-By', 'orion-edge-2']],
  handle(req) {
    if (req.method === 'POST') return text(403, `${T('staff_network_only')}\n`);
    return html(localizeDocument(`<!doctype html><html><head><title>${w('portal.title')}</title></head><body><h1>${w('portal.heading')}</h1><p>${w('portal.restricted')}</p></body></html>\n`));
  },
};

const relay: VSite = {
  host: 'relay.blackwell.test',
  headers: [['Server', 'gt-relayd/3.4'], ['X-Served-By', 'orion-edge-1']],
  cert: { subject: 'CN=relay.blackwell.test', issuer: 'O=Orion Security, CN=Orion Security Internal CA', notAfter: 'Jan 09 2027 GMT' },
  handle: () => text(403, 'relay: client certificate required\n'),
};

// ---------- Orion ----------

const OR_CSS = `body{margin:0;background:#fbfbfa;color:#1f2328;font:16px/1.65 Verdana,sans-serif}header{padding:20px 32px;border-bottom:3px solid #1b3a57;font-weight:bold;color:#1b3a57}main{max-width:700px;margin:0 auto;padding:32px}nav a{margin-right:18px;color:#1b3a57}h1{font-size:26px}blockquote{border-left:3px solid #c5ced6;margin:16px 0;padding-left:16px;color:#4c5660}small{color:#6b7480}`;
const orNav = `<header>ORION SECURITY</header><main><nav><a href="/">${w('orion.nav.home')}</a><a href="/about">${w('orion.nav.about')}</a><a href="/blog">${w('orion.nav.blog')}</a><a href="/reports">${w('orion.nav.reports')}</a></nav>`;
const orLayout = (b: string) => `${orNav}${b}</main>`;
const orion = staticSite(
  'orion-security.test',
  {
    '/': pg('orion.home', OR_CSS, orLayout),
    '/about': pg('orion.about', OR_CSS, orLayout),
    '/blog': pg('orion.blog', OR_CSS, orLayout),
    '/blog/write-it-down': pg('orion.write_it_down', OR_CSS, orLayout),
    '/blog/logs-lie-by-omission': pg('orion.logs_lie', OR_CSS, orLayout),
    '/reports': pg('orion.reports', OR_CSS, orLayout),
    '/reports/halden-freight.pdf': { body: HALDEN_REPORT, type: PDF, tag: 'report-halden' },
    '/reports/brask-utilities.pdf': { body: BRASK_REPORT, type: PDF, tag: 'report-brask' },
  },
  { headers: [['Server', 'nginx/1.24.0'], ['X-Served-By', 'orion-edge-1']], cert: { subject: 'CN=orion-security.test', issuer: 'O=Orion Security, CN=Orion Security Internal CA', notAfter: 'Jul 01 2027 GMT' } },
);

// ---------- Nexus ----------

const NX_CSS = `body{margin:0;background:#fff;color:#22302f;font:16px/1.6 "Trebuchet MS",sans-serif}header{background:#0d6e6e;color:#fff;padding:18px 32px;font-size:20px}nav{background:#e6f1f0;padding:10px 32px}nav a{margin-right:18px;color:#0d6e6e}main{max-width:720px;margin:0 auto;padding:32px}footer{padding:24px 32px;color:#6b7c7b;font-size:13px}`;
const nxNav = `<header>Nexus Labs</header><nav><a href="/">${w('nexus.nav.home')}</a><a href="/about">${w('nexus.nav.about')}</a><a href="/news">${w('nexus.nav.news')}</a><a href="/trials">${w('nexus.nav.trials')}</a><a href="/careers">${w('nexus.nav.careers')}</a></nav>`;
const nxLayout = (b: string) => `${nxNav}<main>${b}</main>`;
const nexus = staticSite(
  'nexus-labs.test',
  {
    '/': pg('nexus.home', NX_CSS, (b) => `${nxLayout(b)}<footer>${w('nexus.footer')}</footer>`),
    '/about': pg('nexus.about', NX_CSS, nxLayout),
    '/news': pg('nexus.news', NX_CSS, nxLayout),
    '/news/bulletin-2021-q3.pdf': { body: NEWSLETTER_2021, type: PDF, tag: 'nexus-bulletin' },
    '/news/nx417-topline.pdf': { body: NX417_PRESS, type: PDF, tag: 'nexus-press' },
    '/trials': pg('nexus.trials', NX_CSS, nxLayout),
    '/careers': pg('nexus.careers', NX_CSS, nxLayout),
    '/robots.txt': { body: `User-agent: *\nDisallow: /portal-staging/\nDisallow: /internal/\n`, type: 'text/plain' },
    '/portal-staging/': { status: 403, body: forbidden('nexus.moved') },
  },
  { headers: [['Server', 'nginx/1.24.0'], ['X-Served-By', 'orion-edge-2']], cert: { subject: 'CN=nexus-labs.test', issuer: 'O=Orion Security, CN=Orion Security Internal CA', notAfter: 'Apr 30 2027 GMT' } },
);

// ---------- Forum and profiles (OSINT) ----------

const TT_CSS = `body{margin:0;background:#eef0e6;color:#2d3326;font:15px/1.55 Tahoma,sans-serif}header{background:#4c5e35;color:#f2f4e7;padding:12px 24px;font-weight:bold}main{max-width:760px;margin:0 auto;padding:20px}article{background:#fff;border:1px solid #cdd2bd;padding:14px 16px;margin-bottom:12px}small{color:#6c7360}a{color:#3f5a1d}`;
const ttLayout = (b: string) => `<header>TrailTalk</header><main>${b}</main>`;
const trailtalk = staticSite(
  'trailtalk.test',
  {
    '/': pg('trailtalk.home', TT_CSS),
    '/u/quietfern': pg('trailtalk.quietfern', TT_CSS, ttLayout),
    '/u/hobnail_jo': pg('trailtalk.hobnail_jo', TT_CSS, ttLayout),
    '/t/aldric-ridge': pg('trailtalk.aldric', TT_CSS, ttLayout),
    '/t/hiatus': pg('trailtalk.hiatus', TT_CSS, ttLayout),
    '/t/new-place': pg('trailtalk.new_place', TT_CSS, ttLayout),
    '/t/boots': pg('trailtalk.boots', TT_CSS, ttLayout),
    '/uploads/ridge_0412.jpg': { body: RIDGE_PHOTO, type: JPG, tag: 'ridge-photo' },
    '/uploads/aldric_day3.jpg': { body: ALDRIC_PHOTO, type: JPG, tag: 'aldric-photo' },
  },
  { headers: [['Server', 'Apache/2.4.58']] },
);

const FO_CSS = `body{margin:0;background:#f6f7f9;color:#1c2330;font:15px/1.55 Arial,sans-serif}main{max-width:620px;margin:32px auto;background:#fff;border:1px solid #dfe3ea;padding:28px}h1{margin:0;font-size:22px}small{color:#667085}li{margin-bottom:8px}`;
const inMain = (b: string) => `<main>${b}</main>`;
const folio = staticSite(
  'folio.test',
  {
    '/': pg('folio.home', FO_CSS, inMain),
    '/elin.maret': pg('folio.elin', FO_CSS, inMain),
    '/sanna.reik': pg('folio.sanna', FO_CSS, inMain),
  },
  { headers: [['Server', 'folio-web']] },
);

const GD_CSS = `body{margin:0;background:#17121f;color:#e5dff0;font:15px/1.5 "Comic Sans MS",Verdana,sans-serif}main{max-width:600px;margin:24px auto;padding:20px;background:#221b2f;border:1px solid #3a2f4e}a{color:#b49cf0}small{color:#9184ab}`;
const gamersden = staticSite(
  'gamersden.test',
  {
    '/': pg('gamersden.home', GD_CSS, inMain),
    '/u/quietfern': pg('gamersden.quietfern', GD_CSS, inMain),
  },
  { headers: [['Server', 'nginx/1.18.0']] },
);

// ---------- Registry ----------

const RG_CSS = `body{margin:0;background:#fff;color:#111;font:15px/1.5 "Courier New",monospace}main{max-width:700px;margin:24px auto;padding:0 20px}table{border-collapse:collapse;width:100%}td,th{border:1px solid #999;padding:6px 8px;text-align:left}`;
const company = (id: string, tag?: string): StaticPage => ({ tag, ...pg(`registry.${id}`, RG_CSS, inMain) });
const registry = staticSite(
  'registry.test',
  {
    '/': pg('registry.home', RG_CSS, inMain),
    '/company/hollin-trust': company('hollin', 'registry-hollin'),
    '/company/blackwell-holdings': company('blackwell_holdings'),
    '/company/blackwell-diligence': company('blackwell_diligence'),
    '/company/lindgate-advisory': company('lindgate'),
    '/company/orion-security': company('orion'),
    '/company/gramtele-foundation': company('gramtele'),
    '/company/nexus-labs': company('nexus'),
    '/company/open-archive': company('archive'),
  },
  { headers: [['Server', 'registry-gov/2.1']] },
);

// ---------- Archive (accepts real submissions from the player) ----------

const AR_CSS = `body{margin:0;background:#f7f4ec;color:#26231d;font:17px/1.6 Georgia,serif}main{max-width:640px;margin:0 auto;padding:40px 24px}h1{font-weight:normal;margin-top:0}a{color:#6b3f12}nav{font:14px Georgia,serif;margin-bottom:28px}nav a{margin-right:18px}small{color:#7c7566}`;
const arNav = `<nav><a href="/">${w('archive.nav.home')}</a><a href="/about">${w('archive.nav.about')}</a><a href="/records">${w('archive.nav.records')}</a><a href="/submit">${w('archive.nav.submit')}</a></nav>`;
const arLayout = (b: string) => `<main>${arNav}${b}</main>`;
const archivePages = staticSite('archive.test', {
  '/': pg('archive.home', AR_CSS, arLayout),
  '/about': pg('archive.about', AR_CSS, arLayout),
  '/records': pg('archive.records', AR_CSS, arLayout),
  '/records/halden-appeal': pg('archive.halden', AR_CSS, arLayout),
  '/records/brask-note': pg('archive.brask', AR_CSS, arLayout),
  '/submit': pg('archive.submit', AR_CSS, arLayout),
});
const archive: VSite & { pages: Record<string, StaticPage> } = {
  pages: archivePages.pages,
  host: 'archive.test',
  headers: [['Server', 'nginx/1.24.0'], ['Content-Security-Policy', "default-src 'self'"], ['Strict-Transport-Security', 'max-age=63072000'], ['X-Content-Type-Options', 'nosniff']],
  cert: { subject: 'CN=archive.test', issuer: 'O=Northline Trust Services, CN=Northline CA 4', notAfter: 'May 21 2027 GMT' },
  handle(req, env) {
    if (req.path === '/submit' && req.method === 'POST') {
      const upload = req.files[0];
      if (!upload) return text(400, `${T('archive_no_file_received_use')}\n`);
      if (!upload.content.startsWith('GTDOSSIER')) return text(415, `${T('archive_file_is_not_a', { file: upload.filename })}\n`);
      if (!/verified=true/.test(upload.content)) return text(400, `${T('archive_manifest_hashes_do_not')}\n`);
      env.signal('archive-submission');
      return text(201, `${T('archive_received_manifest_verified_an')}\n${T('thank_you_please_do_not')}\n`);
    }
    return archivePages.handle(req, env);
  },
};

// ---------- Maps ----------

const MP_CSS = `body{margin:0;background:#e9eef0;color:#1d2a30;font:15px/1.5 Arial,sans-serif}main{max-width:560px;margin:32px auto;background:#fff;padding:24px;border:1px solid #cdd8dc}code{background:#eef2f3;padding:1px 4px}`;
const maps: VSite = {
  host: 'maps.test',
  headers: [['Server', 'maps-frontend']],
  handle(req) {
    if (req.path !== '/' && req.path !== '/lookup') return text(404, 'not found\n');
    const form = `<form action="/lookup" method="get"><label>${T('latitude')} <input name="lat"></label> <label>${T('longitude')} <input name="lon"></label> <button>${T('look_up')}</button></form>`;
    if (req.path === '/') return html(`<!doctype html><html><head><title>${T('maps')}</title><style>${MP_CSS}</style></head><body><main><h2>${T('maps')}</h2><p>${T('reverse_geocoding_decimal_degrees')}</p>${form}<p>${T('or')} <code>curl "http://maps.test/lookup?lat=61.4821&amp;lon=14.3307"</code></p></main></body></html>\n`);
    const lat = parseFloat(req.query.get('lat') ?? '');
    const lon = parseFloat(req.query.get('lon') ?? '');
    if (Number.isNaN(lat) || Number.isNaN(lon)) return html(`<!doctype html><html><head><title>${T('maps')}</title><style>${MP_CSS}</style></head><body><main><p>${T('give_a_latitude_and_longitude')}</p>${form}</main></body></html>\n`);
    const near = (a: number, b: number) => Math.abs(lat - a) < 0.2 && Math.abs(lon - b) < 0.2;
    const place = tr(w(near(61.4821, 14.3307) ? 'maps.harrowmere' : near(47.1, 9.2) ? 'maps.aldric' : 'maps.nowhere'));
    return html(`<!doctype html><html><head><title>${place}</title><style>${MP_CSS}</style></head><body><main><h2>${T('result')}</h2><p><b>${lat}, ${lon}</b></p><p>${place}</p>${form}</main></body></html>\n`);
  },
};

// ---------- Search ----------

interface IndexDoc {
  url: string;
  title: string;
  text: string;
  type: string;
}

const SE_CSS = `body{margin:0;background:#fff;color:#20242a;font:15px/1.5 Arial,sans-serif}main{max-width:680px;margin:0 auto;padding:28px 20px}form{margin-bottom:20px}input[name=q]{width:70%;padding:8px;font:inherit;border:1px solid #b8bec7}button{padding:8px 14px;font:inherit}.r{margin-bottom:18px}.r a{font-size:17px;color:#1a4a8a}.u{color:#2c7a4b;font-size:13px}.s{color:#444;font-size:14px}small{color:#667}code{background:#f0f2f4;padding:1px 4px}`;

function stripHtml(s: string): string {
  return s.replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

/** Builds an index from what public sites actually publish. Pages behind robots rules and the portal stay out, as they would on a polite crawler. */
function buildIndex(sources: [string, Record<string, StaticPage>][]): IndexDoc[] {
  const out: IndexDoc[] = [];
  for (const [host, pages] of sources) {
    for (const [path, p] of Object.entries(pages)) {
      if (path === '/robots.txt' || p.status) continue;
      const isPdf = p.type === PDF;
      const isJpg = p.type === JPG;
      if (isJpg) {
        out.push({ url: `http://${host}${path}`, title: path.split('/').pop()!, text: path.split('/').pop()!, type: 'jpg' });
        continue;
      }
      const raw = isPdf ? [...p.body.matchAll(/\((.*)\) Tj/g)].map((m) => m[1]).join(' ') : stripHtml(p.body);
      const title = isPdf ? (/\/Title \((.*)\)/.exec(p.body)?.[1] ?? path) : (/<title>(.*?)<\/title>/.exec(p.body)?.[1] ?? host);
      out.push({ url: `http://${host}${path}`, title, text: raw, type: isPdf ? 'pdf' : 'html' });
    }
  }
  return out;
}

function searchSite(sources: [string, Record<string, StaticPage>][]): VSite {
  // Indexed per language. A query also matches the English wording, so both languages find the same pages.
  const indexes = new Map<Language, IndexDoc[]>();
  const indexIn = (lang: Language): IndexDoc[] => {
    let docs = indexes.get(lang);
    if (!docs) {
      docs = buildIndex(sources.map(([h, pages]) => [h, Object.fromEntries(Object.entries(pages).map(([k, p]) => [k, { ...p, body: localizeDocument(p.body, lang) }]))]));
      indexes.set(lang, docs);
    }
    return docs;
  };
  return {
    host: 'search.test',
    headers: [['Server', 'search-frontend']],
    handle(req: VRequest, env: SiteEnv): VResponse {
      if (req.path !== '/' && req.path !== '/search') return text(404, 'not found\n');
      const q = (req.query.get('q') ?? '').trim();
      const form = `<form action="/search" method="get"><input name="q" value="${esc(q)}" placeholder="${T('search_the_public_web')}"> <button>${T('search')}</button></form>`;
      if (!q) {
        return html(`<!doctype html><html><head><title>${T('search')}</title><style>${SE_CSS}</style></head><body><main><h2>${T('search')}</h2>${form}<p><small>${T('operators')} <code>"exact phrase"</code> <code>site:trailtalk.test</code> <code>filetype:pdf</code> <code>-exclude</code></small></p></main></body></html>\n`);
      }
      const tokens = [...q.matchAll(/(-?)(site:|filetype:)?(?:"([^"]+)"|(\S+))/g)];
      const index = indexIn(getLanguage());
      const english = indexIn('en');
      const hits = index.filter((d, i) => {
        const hay = `${d.title} ${d.text} ${english[i].title} ${english[i].text}`.toLowerCase();
        return tokens.every((t) => {
          const neg = t[1] === '-';
          const op = t[2];
          const val = (t[3] ?? t[4] ?? '').toLowerCase();
          let ok: boolean;
          if (op === 'site:') ok = new URL(d.url).hostname.endsWith(val);
          else if (op === 'filetype:') ok = d.type === val;
          else ok = hay.includes(val);
          return neg ? !ok : ok;
        });
      });
      if (tokens.some((t) => t[2]) || q.includes('"')) env.signal('search-operator');
      const results = hits
        .slice(0, 12)
        .map((d) => {
          const lower = d.text.toLowerCase();
          const term = (tokens.find((t) => !t[2] && t[1] !== '-')?.[3] ?? tokens.find((t) => !t[2] && t[1] !== '-')?.[4] ?? '').toLowerCase();
          const at = term ? Math.max(0, lower.indexOf(term) - 60) : 0;
          return `<div class="r"><a href="${d.url}">${esc(d.title)}</a><div class="u">${d.url}</div><div class="s">${esc(d.text.slice(at, at + 180))}</div></div>`;
        })
        .join('');
      return html(`<!doctype html><html><head><title>${esc(q)} - ${T('search')}</title><style>${SE_CSS}</style></head><body><main>${form}<p><small>${Tn('n_result', 'n_results', hits.length)}</small></p>${results}</main></body></html>\n`);
    },
  };
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function buildSites(): VSite[] {
  const publicSites = [gramtele, lindgate, blackwell, orion, nexus, trailtalk, folio, gamersden, registry];
  const sources: [string, Record<string, StaticPage>][] = publicSites.map((s) => [s.host, s.pages]);
  sources.push(['archive.test', archivePages.pages]);
  return [...publicSites, relay, portalSite, archive, maps, searchSite(sources)];
}
