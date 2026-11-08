/** The shape of the simulated world's text, the same in every language. Pages hold their own inline markup and links. */
export interface Page {
  title: string;
  body: string;
}

export interface EncodedFile {
  /** What lands on disk. */
  file: string;
  /** What the attachment card shows. */
  preview: string;
}

type Nav<K extends string> = Record<K, string>;
type Pages<K extends string> = Record<K, Page>;

export interface WorldText {
  pages: {
    forbidden: string;
    forbidden_logged: string;
    gramtele: { nav: Nav<'about' | 'transparency' | 'standing'> } & Pages<'home' | 'about' | 'transparency' | 'standing'>;
    lindgate: { footer_home: string; footer: string } & Pages<'home' | 'team' | 'contact'>;
    blackwell: { nav: Nav<'home' | 'services' | 'leadership' | 'careers'>; footer_home: string; footer: string } & Pages<'home' | 'services' | 'leadership' | 'careers'>;
    portal: { title: string; heading: string; restricted: string };
    orion: { nav: Nav<'home' | 'about' | 'blog' | 'reports'> } & Pages<'home' | 'about' | 'blog' | 'write_it_down' | 'logs_lie' | 'reports'>;
    nexus: { nav: Nav<'home' | 'about' | 'news' | 'trials' | 'careers'>; footer: string; moved: string } & Pages<'home' | 'about' | 'news' | 'trials' | 'careers'>;
    trailtalk: Pages<'home' | 'quietfern' | 'hobnail_jo' | 'aldric' | 'hiatus' | 'new_place' | 'boots'>;
    folio: Pages<'home' | 'elin' | 'sanna'>;
    gamersden: Pages<'home' | 'quietfern'>;
    registry: Pages<'home' | 'hollin' | 'blackwell_holdings' | 'blackwell_diligence' | 'lindgate' | 'orion' | 'gramtele' | 'nexus' | 'archive'>;
    archive: { nav: Nav<'home' | 'about' | 'records' | 'submit'> } & Pages<'home' | 'about' | 'records' | 'halden' | 'brask' | 'submit'>;
    maps: { harrowmere: string; aldric: string; nowhere: string };
  };
  docs: {
    bulletin: Record<'title' | 'data_desk' | 'enrolment' | 'corner' | 'walk' | 'trail' | 'editor', string>;
    press: Record<'title' | 'topline' | 'deaths' | 'submitted' | 'contact', string>;
    halden: Record<'title' | 'client' | 'origin' | 'alone' | 'confidence', string>;
    brask: Record<'title' | 'client' | 'origin' | 'alone' | 'confidence', string>;
  };
  files: Record<'notes' | 'lowtide' | 'intake' | 'old_draft' | 'readme' | 'relay_readme' | 'motd' | 'sudoers', string> &
    Record<'fragment_01' | 'fragment_02' | 'fragment_03' | 'invoice', EncodedFile>;
}

/** Turns the world's text into lines, under the keys the sites, documents and hosts ask for. */
export function worldLines(text: WorldText): Map<string, string> {
  const out = new Map<string, string>();
  const walk = (prefix: string, v: unknown): void => {
    if (typeof v === 'string') out.set(prefix, v);
    else if (v && typeof v === 'object') for (const [k, c] of Object.entries(v)) walk(`${prefix}.${k}`, c);
  };
  for (const [k, v] of Object.entries(text)) walk(k, v);
  return out;
}
