import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { HOSTS } from '../../data/world/network';
import { tr, trn } from '../../i18n';
import { Icon, IconButton } from '../components/Icon';
import { timeOf } from '../format';
import type { FetchResult } from '../../game/virtual-network/net';
import { useSession } from '../session';

// ---------- safe rendering of simulated pages ----------

/**
 * Simulated pages render inside a shadow root, after this sanitizer. Scripts, frames, inline handlers
 * and anything that could load a remote resource are removed, so a page can never reach the real network.
 */
export function sanitizePage(src: string): { css: string; html: string; title: string } {
  const doc = new DOMParser().parseFromString(src, 'text/html');
  doc.querySelectorAll('script,iframe,object,embed,link,meta,base,video,audio,source,svg').forEach((n) => n.remove());
  const css = [...doc.querySelectorAll('style')]
    .map((s) => s.textContent ?? '')
    .join('\n')
    .replace(/@import[^;]*;?/gi, '')
    .replace(/url\s*\(\s*(?!['"]?data:)[^)]*\)/gi, 'none')
    .replace(/\bhtml\b/g, ':host')
    .replace(/\bbody\b/g, '.page-root');
  doc.querySelectorAll('style').forEach((n) => n.remove());
  doc.body.querySelectorAll('*').forEach((el) => {
    for (const a of [...el.attributes]) {
      const name = a.name.toLowerCase();
      const v = a.value.trim().toLowerCase();
      if (name.startsWith('on') || name === 'style' || name === 'srcset') el.removeAttribute(a.name);
      if ((name === 'href' || name === 'action' || name === 'formaction') && v.startsWith('javascript:')) el.removeAttribute(a.name);
      if (name === 'src' && !v.startsWith('data:')) el.removeAttribute(a.name);
    }
  });
  return { css, html: doc.body.innerHTML, title: doc.title };
}

function PageFrame({ src, onNavigate, onForm }: { src: string; onNavigate: (href: string) => void; onForm: (f: HTMLFormElement) => void }) {
  const host = useRef<HTMLDivElement>(null);
  const handlers = useRef({ onNavigate, onForm });
  handlers.current = { onNavigate, onForm };

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const root = el.shadowRoot ?? el.attachShadow({ mode: 'open' });
    const { css, html } = sanitizePage(src);
    root.innerHTML = `<style>:host{all:initial;display:block;min-height:100%;color-scheme:light;background:#fff;color:#111}.page-root{min-height:100%}${css}</style><div class="page-root">${html}</div>`;
    const click = (e: Event) => {
      const a = (e.target as Element).closest?.('a');
      if (!a) return;
      e.preventDefault();
      const href = a.getAttribute('href');
      if (href) handlers.current.onNavigate(href);
    };
    const submit = (e: Event) => {
      e.preventDefault();
      handlers.current.onForm(e.target as HTMLFormElement);
    };
    root.addEventListener('click', click);
    root.addEventListener('submit', submit);
    return () => {
      root.removeEventListener('click', click);
      root.removeEventListener('submit', submit);
    };
  }, [src]);

  return <div className="page-frame" ref={host} />;
}

// ---------- browser ----------

const MODE_LABEL = { page: 'Page', source: 'Source', headers: 'Headers' } as const;

interface Loaded {
  url: string;
  result: FetchResult;
}

function Browser() {
  const s = useSession();
  const net = s.engine.net;
  const [address, setAddress] = useState(s.engine.state.browserHome);
  const [page, setPage] = useState<Loaded | null>(null);
  const [back, setBack] = useState<string[]>([]);
  const [forward, setForward] = useState<string[]>([]);
  const [mode, setMode] = useState<'page' | 'source' | 'headers'>('page');
  const [saved, setSaved] = useState<string | null>(null);
  const seq = useRef(0);
  const current = useRef<string | null>(null);

  const load = useCallback(async (raw: string, opts: { method?: string; body?: string; push?: boolean } = {}) => {
    const n = ++seq.current;
    let url = raw.trim();
    if (!/^https?:\/\//i.test(url)) url = `http://${url}`;
    let result = await net.fetch({ url, method: opts.method, body: opts.body, via: 'browser', headers: opts.body ? { 'content-type': 'application/x-www-form-urlencoded' } : undefined });
    for (let hop = 0; hop < 5 && result.ok && result.status && result.status >= 300 && result.status < 400; hop++) {
      const loc = result.headers?.find(([k]) => k.toLowerCase() === 'location')?.[1];
      if (!loc) break;
      url = new URL(loc, url).href;
      result = await net.fetch({ url, via: 'browser' });
    }
    if (n !== seq.current) return;
    const prev = current.current;
    if (opts.push !== false && prev) {
      setBack((b) => [...b, prev]);
      setForward([]);
    }
    current.current = url;
    setPage({ url, result });
    setAddress(url);
    setMode('page');
    setSaved(null);
    s.engine.evaluate();
    s.notify();
  }, [net, s]);

  useEffect(() => {
    void load(s.engine.state.browserHome, { push: false });
  }, [load, s.engine.state.browserHome]);

  // The same page, in the language just chosen.
  const shownLanguage = useRef(s.language);
  useEffect(() => {
    if (shownLanguage.current === s.language) return;
    shownLanguage.current = s.language;
    if (current.current) void load(current.current, { push: false });
  }, [load, s.language]);

  const resolve = (href: string) => (page ? new URL(href, page.url).href : href);
  const onForm = (f: HTMLFormElement) => {
    const data = new URLSearchParams();
    new FormData(f).forEach((v, k) => {
      if (typeof v === 'string') data.append(k, v);
    });
    const action = resolve(f.getAttribute('action') ?? page?.url ?? '');
    if ((f.getAttribute('method') ?? 'get').toLowerCase() === 'post') void load(action, { method: 'POST', body: data.toString() });
    else {
      const u = new URL(action);
      u.search = data.toString();
      void load(u.href);
    }
  };

  const r = page?.result;
  const ctype = r?.headers?.find(([k]) => k.toLowerCase() === 'content-type')?.[1] ?? '';
  const isHtml = ctype.includes('html');
  const filename = page ? (new URL(page.url).pathname.split('/').pop() || 'index.html') : '';

  return (
    <div className="browser">
      <form className="browser-bar" onSubmit={(e: FormEvent) => {
        e.preventDefault();
        void load(address);
      }}>
        <IconButton icon="back" label={tr('Back')} disabled={!back.length} onClick={() => {
          const url = back.at(-1)!;
          setBack(back.slice(0, -1));
          if (page) setForward([page.url, ...forward]);
          void load(url, { push: false });
        }} />
        <IconButton icon="next" label={tr('Forward')} disabled={!forward.length} onClick={() => {
          const url = forward[0];
          setForward(forward.slice(1));
          if (page) setBack([...back, page.url]);
          void load(url, { push: false });
        }} />
        <label className="browser-address">
          <Icon name="globe" size={15} />
          <input value={address} onChange={(e) => setAddress(e.target.value)} aria-label={tr('Address')} spellCheck={false} autoComplete="off" />
        </label>
        <button type="submit" className="btn-quiet">{tr('Go')}</button>
      </form>
      <div className="browser-tabs" role="tablist" aria-label={tr('Page view')}>
        {(['page', 'source', 'headers'] as const).map((m) => (
          <button key={m} role="tab" aria-selected={mode === m} className={mode === m ? 'active' : ''} onClick={() => setMode(m)}>{tr(MODE_LABEL[m])}</button>
        ))}
        <span className="grow" />
        {r?.ok && <span className="browser-status">{r.status} {r.statusText} {r.ip && tr('from {ip}', { ip: r.ip })}</span>}
        {r?.ok && r.status === 200 && (
          <button className="btn-quiet small" onClick={() => setSaved(s.engine.saveDownload(filename, r.body ?? '', r.tag))}><Icon name="save" size={14} /> {tr('Save to workbench')}</button>
        )}
      </div>
      {saved && <div className="browser-saved" role="status">{tr('Saved to {path}', { path: saved.replace('/home/player', '~') })}</div>}
      <div className="browser-view">
        {!page && <p className="browser-msg">{tr('Loading.')}</p>}
        {r && !r.ok && <div className="browser-msg"><h3>{tr('This site cannot be reached')}</h3><p>{r.error}</p><p className="muted">{tr("This network only resolves the lab's own zones.")}</p></div>}
        {r?.ok && mode === 'page' && (isHtml ? <PageFrame src={r.body ?? ''} onNavigate={(h) => void load(resolve(h))} onForm={onForm} /> : <pre className="browser-raw">{r.body}</pre>)}
        {r?.ok && mode === 'source' && <pre className="browser-raw">{r.body}</pre>}
        {r?.ok && mode === 'headers' && (
          <pre className="browser-raw">
            {`${page?.result.method ?? 'GET'} ${r.path} HTTP/1.1\nHost: ${r.host}\n\nHTTP/1.1 ${r.status} ${r.statusText}\n${(r.headers ?? []).map(([k, v]) => `${k}: ${v}`).join('\n')}${r.site?.cert ? `\n\nCertificate\n  subject: ${r.site.cert.subject}\n  issuer:  ${r.site.cert.issuer}\n  expires: ${r.site.cert.notAfter}` : ''}`}
          </pre>
        )}
      </div>
    </div>
  );
}

// ---------- map ----------

function NetworkMap({ onOpen }: { onOpen: () => void }) {
  const s = useSession();
  const st = s.engine.state;
  const known = st.discoveredHosts;
  const [sel, setSel] = useState<string | null>(null);

  const layout = useMemo(() => {
    const names = new Set(['workbench.lab.test', ...known]);
    const hosts = HOSTS.filter((h) => names.has(h.name));
    // Show a router only if a traceroute has revealed it, otherwise link to the nearest known hop.
    const parentOf = (h: (typeof HOSTS)[number]) => {
      for (let i = h.path.length - 1; i >= 0; i--) if (names.has(h.path[i])) return h.path[i];
      return h.name === 'workbench.lab.test' ? null : 'workbench.lab.test';
    };
    const children = new Map<string, string[]>();
    for (const h of hosts) {
      const p = parentOf(h);
      if (p) children.set(p, [...(children.get(p) ?? []), h.name]);
    }
    const pos = new Map<string, { x: number; y: number }>();
    let row = 0;
    const COL = 215;
    const ROW = 34;
    const place = (name: string, depth: number) => {
      const kids = children.get(name) ?? [];
      kids.forEach((k) => place(k, depth + 1));
      let y: number;
      if (kids.length) y = (pos.get(kids[0])!.y + pos.get(kids[kids.length - 1])!.y) / 2;
      else y = row++ * ROW + 20;
      pos.set(name, { x: depth * COL + 10, y });
    };
    place('workbench.lab.test', 0);
    const width = Math.max(...[...pos.values()].map((p) => p.x)) + 200;
    const height = row * ROW + 20;
    return { hosts, pos, children, width, height };
  }, [known]);

  const selected = HOSTS.find((h) => h.name === sel);
  const scanned = selected && st.seen.probes.some((p) => p.startsWith('nmap|') && (p.endsWith(selected.name) || p.endsWith(selected.ip)));
  return (
    <div className="netmap">
      <div className="netmap-canvas">
        <svg width={layout.width} height={layout.height} role="img" aria-label={tr('Map of hosts you have discovered')}>
          {[...layout.children.entries()].flatMap(([p, kids]) => kids.map((k) => {
            const a = layout.pos.get(p)!;
            const b = layout.pos.get(k)!;
            return <path key={`${p}-${k}`} d={`M${a.x + 170} ${a.y} C${a.x + 195} ${a.y} ${b.x - 25} ${b.y} ${b.x} ${b.y}`} className="netmap-edge" />;
          }))}
          {layout.hosts.map((h) => {
            const p = layout.pos.get(h.name);
            if (!p) return null;
            return (
              <g key={h.name} transform={`translate(${p.x},${p.y})`} className={sel === h.name ? 'netmap-node sel' : 'netmap-node'} onClick={() => setSel(h.name)}>
                <rect x={0} y={-12} width={170} height={24} />
                <text x={8} y={4}>{h.name.length > 24 ? `${h.name.slice(0, 23)}.` : h.name}</text>
              </g>
            );
          })}
        </svg>
        <p className="netmap-note">{tr('The map grows as you resolve, scan and visit.')} {trn('{n} host known.', '{n} hosts known.', known.length)}</p>
      </div>
      <aside className="netmap-side">
        <h3>{tr('Hosts')}</h3>
        <ul className="host-list">
          {layout.hosts.map((h) => (
            <li key={h.name}><button className={sel === h.name ? 'active' : ''} onClick={() => setSel(h.name)}><span>{h.name}</span><code>{h.ip}</code></button></li>
          ))}
        </ul>
        {selected && (
          <div className="host-card">
            <h4>{selected.name}</h4>
            <dl className="kv">
              <dt>{tr('Address')}</dt><dd><code>{selected.ip}</code></dd>
              {selected.ptr && <><dt>{tr('Reverse DNS')}</dt><dd><code>{selected.ptr}</code></dd></>}
            </dl>
            {scanned ? (
              <ul className="ports">{selected.services.filter((x) => !x.filtered).map((x) => <li key={x.port}><code>{x.port}/{x.proto}</code> {x.name} {x.version}</li>)}{selected.services.some((x) => x.filtered) && <li className="muted">{tr('Some ports filtered.')}</li>}</ul>
            ) : <p className="muted">{tr('Services unknown. Scan it with:')} <code>nmap -sV {selected.name}</code></p>}
            {selected.services.some((x) => x.port === 80 || x.port === 443) && <button className="btn-quiet" onClick={() => { s.engine.state.browserHome = `http://${selected.name}/`; onOpen(); s.notify(); }}>{tr('Open in browser')}</button>}
          </div>
        )}
        <h3>{tr('Recent requests')}</h3>
        <ul className="req-log">
          {st.httpLog.slice(-8).reverse().map((r, i) => <li key={`${r.at}-${i}`}><time>{timeOf(r.at)}</time> <b>{r.status}</b> {r.host}{r.path}</li>)}
          {!st.httpLog.length && <li className="muted">{tr('None yet.')}</li>}
        </ul>
      </aside>
    </div>
  );
}

export function NetworkView() {
  const [tab, setTab] = useState<'browser' | 'map'>('browser');
  return (
    <div className="network">
      <div className="view-tabs" role="tablist" aria-label={tr('Network')}>
        <button role="tab" aria-selected={tab === 'browser'} className={tab === 'browser' ? 'active' : ''} onClick={() => setTab('browser')}>{tr('Browser')}</button>
        <button role="tab" aria-selected={tab === 'map'} className={tab === 'map' ? 'active' : ''} onClick={() => setTab('map')}>{tr('Map')}</button>
      </div>
      <div className={tab === 'browser' ? 'network-pane' : 'network-pane hidden'}><Browser /></div>
      {tab === 'map' && <div className="network-pane"><NetworkMap onOpen={() => setTab('browser')} /></div>}
    </div>
  );
}
