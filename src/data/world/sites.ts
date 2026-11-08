import { getLanguage, tr, T, Tn } from '../../i18n';
import { localizeDocument } from '../../i18n/documents';
import { html, staticSite, StaticPage, text } from '../../game/virtual-network/net';
import type { SiteEnv, VRequest, VResponse, VSite } from '../../game/virtual-network/types';
import { ALDRIC_PHOTO, BRASK_REPORT, HALDEN_REPORT, NEWSLETTER_2021, NX417_PRESS, RIDGE_PHOTO } from './documents';

/** Every fictional website. Each one has its own look because each one is a different organization. */

const page = (title: string, css: string, body: string): StaticPage => ({
  body: `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${title}</title><style>${css}</style></head><body>${body}</body></html>\n`,
});

const PDF = 'application/pdf';
const JPG = 'image/jpeg';

// ---------- Gramtele ----------

const GT_CSS = `body{margin:0;background:#0f1211;color:#c9ccc5;font:16px/1.6 Georgia,serif}main{max-width:620px;margin:0 auto;padding:56px 24px}h1{font-weight:normal;font-size:28px;color:#e8eae4}a{color:#a7b8a4}nav{font:13px monospace;margin-bottom:40px}nav a{margin-right:16px}small{color:#7a7f78}`;
const gtNav = `<nav><a href="/">gramtele</a><a href="/about">about</a><a href="/transparency">transparency</a><a href="/standing">standing</a></nav>`;
const gramtele = staticSite(
  'gramtele.test',
  {
    '/': page('Gramtele', GT_CSS, `<main>${gtNav}<h1>Say it to someone. Nobody else.</h1><p>Gramtele is a messaging network without names. No phone number, no email, no address book. You pick a handle. Other people earn your trust, or do not.</p><p><small>Network status: normal. 41,208 handles online.</small></p></main>`),
    '/about': page('About Gramtele', GT_CSS, `<main>${gtNav}<h1>About</h1><p>Gramtele began in 2022 as a volunteer relay project. Since 2023 it has been run by the Gramtele Foundation, supported by private grants.</p><p>We publish our protocol. We do not publish our users, because we do not know them.</p></main>`),
    '/transparency': page('Transparency', GT_CSS, `<main>${gtNav}<h1>Transparency</h1><p>We keep no message content, no connection logs, no device identifiers and no metadata of any kind.</p><p>Number of lawful requests answered in 2025: 0. There is nothing to hand over.</p><p><small>Funding: Gramtele Foundation. Grants disclosed in the public registry.</small></p></main>`),
    '/standing': page('Standing', GT_CSS, `<main>${gtNav}<h1>Standing</h1><p>Standing is the only thing a handle owns. It rises when people who have standing vouch for you, and when paid work closes cleanly. It falls when they stop.</p><p>Standing unlocks private channels and contracts. It cannot be bought. We are told it can be lost very quickly.</p></main>`),
  },
  { headers: [['Server', 'gt-edge'], ['X-Content-Type-Options', 'nosniff'], ['Strict-Transport-Security', 'max-age=63072000']], cert: { subject: 'CN=gramtele.test', issuer: 'O=Orion Security, CN=Orion Security Internal CA', notAfter: 'Feb 02 2027 GMT' } },
);

// ---------- Lindgate ----------

const LG_CSS = `body{margin:0;background:#f4f2ec;color:#2b2b28;font:16px/1.6 "Times New Roman",serif}header{background:#20302b;color:#efe9d8;padding:24px 40px;font-size:22px;letter-spacing:.04em}main{max-width:680px;margin:32px auto;padding:0 24px}a{color:#20503f}footer{margin:48px auto;max-width:680px;padding:0 24px;font-size:13px;color:#7a776c}`;
const lindgate = staticSite(
  'lindgate.test',
  {
    '/': page('Lindgate Advisory', LG_CSS, `<header>Lindgate Advisory</header><main><h2>Discreet corporate diligence since 2009.</h2><p>For seventeen years, Lindgate has helped boards and investors understand who they are dealing with. Our analysts work quietly and report plainly.</p><p><a href="/team">Our team</a> | <a href="/contact">Contact</a></p></main><footer>Lindgate Advisory. All rights reserved.</footer>`),
    '/team': page('Team | Lindgate Advisory', LG_CSS, `<header>Lindgate Advisory</header><main><h2>Our team</h2><p>Lindgate does not publish the names of its analysts, for their protection and yours.</p></main><footer>Lindgate Advisory.</footer>`),
    '/contact': page('Contact | Lindgate Advisory', LG_CSS, `<header>Lindgate Advisory</header><main><h2>Contact</h2><p>New engagements by introduction only. Write to <a href="mailto:desk@lindgate.test">desk@lindgate.test</a>.</p></main><footer>Lindgate Advisory.</footer>`),
  },
  { headers: [['Server', 'nginx/1.24.0'], ['X-Served-By', 'orion-edge-3']] },
);

// ---------- Blackwell ----------

const BW_CSS = `body{margin:0;background:#101317;color:#d6d8da;font:15px/1.65 Helvetica,Arial,sans-serif}header{padding:28px 48px;border-bottom:1px solid #2a2f35;letter-spacing:.32em;font-size:13px}nav{padding:12px 48px;font-size:13px}nav a{color:#9aa3ab;margin-right:20px;text-decoration:none}main{max-width:720px;padding:48px}h1{font-weight:300;font-size:34px;color:#fff;margin-top:0}footer{padding:48px;color:#646b72;font-size:12px}a{color:#b6c0c9}`;
const bwNav = `<header>BLACKWELL</header><nav><a href="/">Home</a><a href="/services">Services</a><a href="/leadership">Leadership</a><a href="/careers">Careers</a></nav>`;
const blackwell = staticSite(
  'blackwell.test',
  {
    '/': page('Blackwell Holdings', BW_CSS, `${bwNav}<main><h1>Risk. Reputation. Resilience.</h1><p>When the unthinkable reaches your company, the first seventy-two hours decide the next ten years. Blackwell stands between your organization and the story that would otherwise be told about it.</p></main><footer>Blackwell Holdings. A member of the Hollin group.</footer>`),
    '/services': page('Services | Blackwell', BW_CSS, `${bwNav}<main><h1>Services</h1><p><b>Blackwell Diligence.</b> Crisis readiness retainers, reputation monitoring.</p><p><b>Special Engagements.</b> Bespoke resolution for sensitive matters. By referral. No written proposals.</p><p><b>Partners.</b> Technical attribution is delivered with our partner, Orion Security.</p></main><footer>Blackwell Holdings.</footer>`),
    '/leadership': page('Leadership | Blackwell', BW_CSS, `${bwNav}<main><h1>Leadership</h1><p><b>Piet Hollander</b>, Director, Special Engagements. Twenty years in corporate crisis work. Believes every problem has a person attached.</p><p><b>Ilya Brandt</b>, Deputy Director. Previously government service.</p></main><footer>Blackwell Holdings.</footer>`),
    '/careers': page('Careers | Blackwell', BW_CSS, `${bwNav}<main><h1>Careers</h1><p>We are always interested in talented independent analysts. We prefer to find you.</p></main><footer>Blackwell Holdings.</footer>`),
    '/robots.txt': { body: `User-agent: *\nDisallow: /special-engagements/\nDisallow: /contractor-intake/\n`, type: 'text/plain' },
    '/special-engagements/': { status: 403, body: `<!doctype html><html><head><title>403 Forbidden</title></head><body><h1>403 Forbidden</h1><p>This incident is logged.</p></body></html>\n` },
    '/contractor-intake/': { status: 403, body: `<!doctype html><html><head><title>403 Forbidden</title></head><body><h1>403 Forbidden</h1></body></html>\n` },
  },
  { headers: [['Server', 'nginx/1.24.0'], ['X-Served-By', 'orion-edge-1'], ['Strict-Transport-Security', 'max-age=31536000']], cert: { subject: 'CN=blackwell.test', issuer: 'O=Orion Security, CN=Orion Security Internal CA', notAfter: 'Mar 15 2027 GMT' } },
);

const portalSite: VSite = {
  host: 'portal.nexus-labs.test',
  headers: [['Server', 'Werkzeug/2.0.1 Python/3.8.10'], ['X-Served-By', 'orion-edge-2']],
  handle(req) {
    if (req.method === 'POST') return text(403, `${T('staff_network_only')}\n`);
    return html(localizeDocument('<!doctype html><html><head><title>Nexus Staff Portal</title></head><body><h1>Nexus Labs Staff Portal</h1><p>Access is restricted to the staff network.</p></body></html>\n'));
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
const orNav = `<header>ORION SECURITY</header><main><nav><a href="/">Home</a><a href="/about">About</a><a href="/blog">Field notes</a><a href="/reports">Reports</a></nav>`;
const orion = staticSite(
  'orion-security.test',
  {
    '/': page('Orion Security', OR_CSS, `${orNav}<h1>We find out what happened.</h1><p>Incident response, attribution and penetration testing. Our attribution summaries have supported prosecutions in five jurisdictions.</p></main>`),
    '/about': page('About | Orion Security', OR_CSS, `${orNav}<h1>About</h1><p>Founded in 2017 by practitioners. In April 2024 Orion welcomed new long-term investors, who have let us expand our managed DNS and edge hosting practice.</p><p>Principal: Sanna Reik. Writes most of the field notes and, by reputation, all of the sharp ones.</p></main>`),
    '/blog': page('Field notes | Orion Security', OR_CSS, `${orNav}<h1>Field notes</h1><p><a href="/blog/write-it-down">Write it down or it did not happen</a></p><p><a href="/blog/logs-lie-by-omission">Logs lie by omission</a></p></main>`),
    '/blog/write-it-down': page('Write it down | Orion Security', OR_CSS, `${orNav}<h1>Write it down or it did not happen</h1><small>S. Reik</small><p>ok so here is what I tell every junior. You will not remember. Not the command, not the timestamp, not why you thought that host mattered. Notes are not paperwork. Notes are the investigation.</p><blockquote>A finding you cannot reproduce from your own notes is a rumour.</blockquote></main>`),
    '/blog/logs-lie-by-omission': page('Logs lie by omission | Orion Security', OR_CSS, `${orNav}<h1>Logs lie by omission</h1><small>S. Reik</small><p>A log only tells you what someone decided to record, and only until someone decides otherwise. So hash your evidence when you collect it, and ask what is missing before you ask what is there.</p></main>`),
    '/reports': page('Reports | Orion Security', OR_CSS, `${orNav}<h1>Public attribution summaries</h1><p><a href="/reports/halden-freight.pdf">Halden Freight (2024)</a></p><p><a href="/reports/brask-utilities.pdf">Brask Utilities (2025)</a></p></main>`),
    '/reports/halden-freight.pdf': { body: HALDEN_REPORT, type: PDF, tag: 'report-halden' },
    '/reports/brask-utilities.pdf': { body: BRASK_REPORT, type: PDF, tag: 'report-brask' },
  },
  { headers: [['Server', 'nginx/1.24.0'], ['X-Served-By', 'orion-edge-1']], cert: { subject: 'CN=orion-security.test', issuer: 'O=Orion Security, CN=Orion Security Internal CA', notAfter: 'Jul 01 2027 GMT' } },
);

// ---------- Nexus ----------

const NX_CSS = `body{margin:0;background:#fff;color:#22302f;font:16px/1.6 "Trebuchet MS",sans-serif}header{background:#0d6e6e;color:#fff;padding:18px 32px;font-size:20px}nav{background:#e6f1f0;padding:10px 32px}nav a{margin-right:18px;color:#0d6e6e}main{max-width:720px;margin:0 auto;padding:32px}footer{padding:24px 32px;color:#6b7c7b;font-size:13px}`;
const nxNav = `<header>Nexus Labs</header><nav><a href="/">Home</a><a href="/about">About</a><a href="/news">News</a><a href="/trials">Trials</a><a href="/careers">Careers</a></nav>`;
const nexus = staticSite(
  'nexus-labs.test',
  {
    '/': page('Nexus Labs', NX_CSS, `${nxNav}<main><h1>Better evidence, sooner.</h1><p>Nexus Labs is a contract research organization running clinical trials and diagnostics for partners across three continents.</p></main><footer>Nexus Labs. Staff portal: <a href="http://portal.nexus-labs.test/">portal.nexus-labs.test</a></footer>`),
    '/about': page('About | Nexus Labs', NX_CSS, `${nxNav}<main><h1>About us</h1><p>Founded in 2011. Led by Ruth Aldana, Chief Executive. Konrad Dressler leads Clinical Operations.</p></main>`),
    '/news': page('News | Nexus Labs', NX_CSS, `${nxNav}<main><h1>News</h1><p><a href="/news/nx417-topline.pdf">27 Mar 2025. Calvexin phase III: positive topline</a></p><p><a href="/news/bulletin-2021-q3.pdf">Sep 2021. Staff bulletin, Q3</a></p></main>`),
    '/news/bulletin-2021-q3.pdf': { body: NEWSLETTER_2021, type: PDF, tag: 'nexus-bulletin' },
    '/news/nx417-topline.pdf': { body: NX417_PRESS, type: PDF, tag: 'nexus-press' },
    '/trials': page('Trials | Nexus Labs', NX_CSS, `${nxNav}<main><h1>Trials</h1><ul><li>NX-212, Ferotane, phase II, closed.</li><li>NX-305, Lumidex, phase II, closed.</li><li>NX-417, Calvexin, phase III, submitted. No treatment-related deaths were observed.</li></ul></main>`),
    '/careers': page('Careers | Nexus Labs', NX_CSS, `${nxNav}<main><h1>Careers</h1><p>We are hiring a Senior Data Steward. The previous holder of this role moved on in March 2025.</p></main>`),
    '/robots.txt': { body: `User-agent: *\nDisallow: /portal-staging/\nDisallow: /internal/\n`, type: 'text/plain' },
    '/portal-staging/': { status: 403, body: `<!doctype html><html><head><title>403 Forbidden</title></head><body><h1>403 Forbidden</h1><p>Moved to portal.nexus-labs.test</p></body></html>\n` },
  },
  { headers: [['Server', 'nginx/1.24.0'], ['X-Served-By', 'orion-edge-2']], cert: { subject: 'CN=nexus-labs.test', issuer: 'O=Orion Security, CN=Orion Security Internal CA', notAfter: 'Apr 30 2027 GMT' } },
);

// ---------- Forum and profiles (OSINT) ----------

const TT_CSS = `body{margin:0;background:#eef0e6;color:#2d3326;font:15px/1.55 Tahoma,sans-serif}header{background:#4c5e35;color:#f2f4e7;padding:12px 24px;font-weight:bold}main{max-width:760px;margin:0 auto;padding:20px}article{background:#fff;border:1px solid #cdd2bd;padding:14px 16px;margin-bottom:12px}small{color:#6c7360}a{color:#3f5a1d}`;
const trailtalk = staticSite(
  'trailtalk.test',
  {
    '/': page('TrailTalk', TT_CSS, `<header>TrailTalk: the walkers' forum</header><main><article><a href="/t/aldric-ridge">Aldric ridge: full traverse log</a> <small>by quietfern</small></article><article><a href="/t/new-place">New place, new paths</a> <small>by quietfern</small></article><article><a href="/t/boots">Boots that survive a wet spring</a> <small>by hobnail_jo</small></article><article>Members: <a href="/u/quietfern">quietfern</a>, <a href="/u/hobnail_jo">hobnail_jo</a></article></main>`),
    '/u/quietfern': page('quietfern | TrailTalk', TT_CSS, `<header>TrailTalk</header><main><article><b>quietfern</b><br><small>Member since 2019. 212 posts. Last active: 12 April 2026.</small><p>Slow walker. Keeps good records. Used to work with numbers for a living.</p><p>Posts: <a href="/t/aldric-ridge">Aldric ridge: full traverse log</a> (Aug 2021), <a href="/t/hiatus">Stepping back for a while</a> (Mar 2025), <a href="/t/new-place">New place, new paths</a> (Sep 2025 to Apr 2026)</p></article></main>`),
    '/u/hobnail_jo': page('hobnail_jo | TrailTalk', TT_CSS, `<header>TrailTalk</header><main><article><b>hobnail_jo</b><br><small>Member since 2016. 3,114 posts.</small><p>Boot opinions, free of charge.</p></article></main>`),
    '/t/aldric-ridge': page('Aldric ridge | TrailTalk', TT_CSS, `<header>TrailTalk</header><main><article><small>quietfern, 7 Aug 2021</small><p>Day 3 of the traverse. Taking two weeks off the data desk was the best decision I have made in years.</p><p><a href="/uploads/aldric_day3.jpg">aldric_day3.jpg</a></p></article></main>`),
    '/t/hiatus': page('Stepping back | TrailTalk', TT_CSS, `<header>TrailTalk</header><main><article><small>quietfern, 29 Mar 2025</small><p>Yesterday was my last day at the job. I will be away from here for a while. Some things need sorting out and it is safer to be offline. Look after your knees.</p></article></main>`),
    '/t/new-place': page('New place, new paths | TrailTalk', TT_CSS, `<header>TrailTalk</header><main><article><small>quietfern, 3 Sep 2025</small><p>Back. Moved somewhere small. Not saying where, it is nobody's business. Plenty of old logging tracks.</p></article><article><small>quietfern, 12 Apr 2026</small><p>First proper morning of spring. The lake at the end of the road finally thawed. Photo from the jetty, straight off the phone.</p><p><a href="/uploads/ridge_0412.jpg">ridge_0412.jpg</a></p></article><article><small>hobnail_jo, 12 Apr 2026</small><p>You know phones tag these with where you are, right?</p></article></main>`),
    '/t/boots': page('Boots | TrailTalk', TT_CSS, `<header>TrailTalk</header><main><article><small>hobnail_jo, 2 Mar 2026</small><p>Waxed leather. Nothing else. I will not be taking questions.</p></article></main>`),
    '/uploads/ridge_0412.jpg': { body: RIDGE_PHOTO, type: JPG, tag: 'ridge-photo' },
    '/uploads/aldric_day3.jpg': { body: ALDRIC_PHOTO, type: JPG, tag: 'aldric-photo' },
  },
  { headers: [['Server', 'Apache/2.4.58']] },
);

const FO_CSS = `body{margin:0;background:#f6f7f9;color:#1c2330;font:15px/1.55 Arial,sans-serif}main{max-width:620px;margin:32px auto;background:#fff;border:1px solid #dfe3ea;padding:28px}h1{margin:0;font-size:22px}small{color:#667085}li{margin-bottom:8px}`;
const folio = staticSite(
  'folio.test',
  {
    '/': page('Folio', FO_CSS, `<main><h1>Folio</h1><p>Professional profiles. Try <a href="/elin.maret">/elin.maret</a>.</p></main>`),
    '/elin.maret': page('Elin Maret | Folio', FO_CSS, `<main><h1>Elin Maret</h1><small>Clinical data stewardship. Profile last updated March 2025.</small><h3>Experience</h3><ul><li><b>Senior Data Steward, Nexus Labs</b><br><small>Apr 2018 to Mar 2025</small></li><li><b>Data Coordinator, Tessel Reagents</b><br><small>2014 to 2018</small></li></ul><h3>Interests</h3><p>Audit trails. Long walks.</p></main>`),
    '/sanna.reik': page('Sanna Reik | Folio', FO_CSS, `<main><h1>Sanna Reik</h1><small>Principal, Orion Security</small><h3>Experience</h3><ul><li><b>Principal, Orion Security</b><br><small>2017 to present</small></li></ul><p>Mentor to a surprising number of people who do not know her name.</p></main>`),
  },
  { headers: [['Server', 'folio-web']] },
);

const GD_CSS = `body{margin:0;background:#17121f;color:#e5dff0;font:15px/1.5 "Comic Sans MS",Verdana,sans-serif}main{max-width:600px;margin:24px auto;padding:20px;background:#221b2f;border:1px solid #3a2f4e}a{color:#b49cf0}small{color:#9184ab}`;
const gamersden = staticSite(
  'gamersden.test',
  {
    '/': page('GamersDen', GD_CSS, `<main><h2>GamersDen</h2><p>Find a squad. <a href="/u/quietfern">quietfern</a> is online.</p></main>`),
    '/u/quietfern': page('quietfern | GamersDen', GD_CSS, `<main><b>quietfern</b> <small>joined June 2024</small><p>16. tomas irl. mid lane or nothing. online after school, usually 15:00 to midnight. dont @ me during exams.</p><p><small>Region: South Cordoa</small></p></main>`),
  },
  { headers: [['Server', 'nginx/1.18.0']] },
);

// ---------- Registry ----------

const RG_CSS = `body{margin:0;background:#fff;color:#111;font:15px/1.5 "Courier New",monospace}main{max-width:700px;margin:24px auto;padding:0 20px}table{border-collapse:collapse;width:100%}td,th{border:1px solid #999;padding:6px 8px;text-align:left}`;
const companyPage = (name: string, rows: [string, string][], tag?: string): StaticPage => ({ tag, ...page(`${name} | Public Registry`, RG_CSS, `<main><h2>Public Companies Registry</h2><h3>${name}</h3><table>${rows.map(([k, v]) => `<tr><th>${k}</th><td>${v}</td></tr>`).join('')}</table><p><a href="/">New search</a></p></main>`) });
const registry = staticSite(
  'registry.test',
  {
    '/': page('Public Companies Registry', RG_CSS, `<main><h2>Public Companies Registry</h2><p>Public filings, open to anyone.</p><ul><li><a href="/company/blackwell-holdings">Blackwell Holdings</a></li><li><a href="/company/blackwell-diligence">Blackwell Diligence</a></li><li><a href="/company/gramtele-foundation">Gramtele Foundation</a></li><li><a href="/company/hollin-trust">Hollin Trust</a></li><li><a href="/company/lindgate-advisory">Lindgate Advisory</a></li><li><a href="/company/nexus-labs">Nexus Labs</a></li><li><a href="/company/orion-security">Orion Security</a></li><li><a href="/company/open-archive">The Open Archive</a></li></ul></main>`),
    '/company/hollin-trust': companyPage('Hollin Trust', [['Type', 'Private trust'], ['Formed', '2006'], ['Registered agent', 'Quiet Registrar Ltd'], ['Controls', '<a href="/company/blackwell-holdings">Blackwell Holdings</a>; <a href="/company/orion-security">Orion Security</a> (from Apr 2024); <a href="/company/lindgate-advisory">Lindgate Advisory</a>'], ['Grants', '<a href="/company/gramtele-foundation">Gramtele Foundation</a> (via Blackwell Holdings)']], 'registry-hollin'),
    '/company/blackwell-holdings': companyPage('Blackwell Holdings', [['Type', 'Holding company'], ['Formed', '2009'], ['Director', 'Piet Hollander (Special Engagements)'], ['Owner', '<a href="/company/hollin-trust">Hollin Trust</a>'], ['Subsidiaries', '<a href="/company/blackwell-diligence">Blackwell Diligence</a>']]),
    '/company/blackwell-diligence': companyPage('Blackwell Diligence', [['Type', 'Limited company'], ['Formed', '2015'], ['Owner', '<a href="/company/blackwell-holdings">Blackwell Holdings</a>'], ['Activity', 'Consulting']]),
    '/company/lindgate-advisory': companyPage('Lindgate Advisory', [['Type', 'Limited company'], ['Formed', 'May 2026'], ['Owner', '<a href="/company/hollin-trust">Hollin Trust</a>'], ['Filings', 'None yet. No accounts due.']]),
    '/company/orion-security': companyPage('Orion Security', [['Type', 'Limited company'], ['Formed', '2017'], ['Principal', 'Sanna Reik'], ['Owner', '<a href="/company/hollin-trust">Hollin Trust</a> (acquired April 2024)']]),
    '/company/gramtele-foundation': companyPage('Gramtele Foundation', [['Type', 'Foundation'], ['Formed', '2023'], ['Income 2025', '450,000 in grants'], ['Largest donor', '<a href="/company/blackwell-holdings">Blackwell Holdings</a>']]),
    '/company/nexus-labs': companyPage('Nexus Labs', [['Type', 'Private company'], ['Formed', '2011'], ['CEO', 'Ruth Aldana'], ['Notable filings', 'NX-417 safety summary referenced in 2025 annual report']]),
    '/company/open-archive': companyPage('The Open Archive', [['Type', 'Non-profit'], ['Formed', '2008'], ['Editor', 'Maud Ferreira'], ['Donors', 'Published annually. No donor above 4%.']]),
  },
  { headers: [['Server', 'registry-gov/2.1']] },
);

// ---------- Archive (accepts real submissions from the player) ----------

const AR_CSS = `body{margin:0;background:#f7f4ec;color:#26231d;font:17px/1.6 Georgia,serif}main{max-width:640px;margin:0 auto;padding:40px 24px}h1{font-weight:normal;margin-top:0}a{color:#6b3f12}nav{font:14px Georgia,serif;margin-bottom:28px}nav a{margin-right:18px}small{color:#7c7566}`;
const arNav = `<nav><a href="/">The Open Archive</a><a href="/about">About</a><a href="/records">Records</a><a href="/submit">Submit</a></nav>`;
const archivePages = staticSite('archive.test', {
  '/': page('The Open Archive', AR_CSS, `<main>${arNav}<h1>Public records belong to the public.</h1><p>Since 2008 we have preserved documents that institutions would prefer to lose. We publish what we can verify. We never publish what we cannot.</p></main>`),
  '/about': page('About | The Open Archive', AR_CSS, `<main>${arNav}<h1>About</h1><p>The Archive is a non-profit edited by Maud Ferreira. We verify hashes, check provenance and redact private individuals. Donor lists are public.</p></main>`),
  '/records': page('Records | The Open Archive', AR_CSS, `<main>${arNav}<h1>Records</h1><p><a href="/records/halden-appeal">Halden Freight: appeal bundle of J. Kessel (2025)</a></p><p><a href="/records/brask-note">Brask Utilities: unanswered letter from B. Oyelaran (2025)</a></p></main>`),
  '/records/halden-appeal': page('Halden appeal | The Open Archive', AR_CSS, `<main>${arNav}<h1>Halden Freight: appeal bundle</h1><p>Jonah Kessel, contractor, maintains that the workstation attributed to him was issued by an employer he could never identify, and that he was hired under the handle ROOTLESS through an anonymous network. The court accepted the attribution summary by Orion Security. Appeal refused.</p></main>`),
  '/records/brask-note': page('Brask letter | The Open Archive', AR_CSS, `<main>${arNav}<h1>Brask Utilities: letter</h1><p>"My name is Bram Oyelaran. I did not break into anything. They gave me a machine and a set of exercises and I believed they were exercises." Received by post, August 2025. No reply address. We have not been able to contact the author since.</p></main>`),
  '/submit': page('Submit | The Open Archive', AR_CSS, `<main>${arNav}<h1>Submit a record</h1><p>Send a sealed dossier with a POST to this address. From a terminal:</p><pre>curl -F file=@dossier.tar http://archive.test/submit</pre><p>We verify every manifest hash before we read a word.</p></main>`),
});
const archive: VSite = {
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
    const place = tr(near(61.4821, 14.3307) ? 'Harrowmere, Vessen district. Jetty road, Lake Vessen, 840 m from the village.' : near(47.1, 9.2) ? 'Aldric ridge, northern traverse.' : 'Open country. No named place nearby.');
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
  // Indexed per language; a query also matches the original wording, so both languages find the same pages.
  const english = buildIndex(sources);
  const localized = new Map<string, IndexDoc[]>();
  const indexNow = () => {
    const lang = getLanguage();
    if (lang === 'en') return english;
    let docs = localized.get(lang);
    if (!docs) {
      docs = buildIndex(sources.map(([h, pages]) => [h, Object.fromEntries(Object.entries(pages).map(([k, p]) => [k, { ...p, body: localizeDocument(p.body) }]))]));
      localized.set(lang, docs);
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
      const index = indexNow();
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
