import { FR_DIALOGUE } from '../../data/dialogue/fr';
import { flatten } from '../../data/dialogue/format';
import { b64encode } from '../../game/commands/forensic';
import { FRAGMENTS, KELPIE_INVOICE } from '../../data/dialogue/fragments';
import { flattenText } from '../../data/missions/format';
import { FR_TEXT } from '../../data/missions/fr';
import { registerCatalog, registerLines, uiLines } from '../index';
import { Entry } from '../zip';
import legacy from './legacy-dialogue.json';
import { manEntries } from './man';
import { FR_UI } from './ui';
import { FR_WORLD } from './world';

export const FR_READY = true;

const flat = (table: Record<string, string>): Entry[] => Object.entries(table);
const hex = (s: string) => [...new TextEncoder().encode(s)].map((b) => b.toString(16).padStart(2, '0')).join('');
const rot13 = (s: string) => s.replace(/[a-z]/gi, (c) => {
  const base = c <= 'Z' ? 65 : 97;
  return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base);
});

/** Files keep one source name on disk and open in the reader's language. They are data, not dialogue. */
const ENCODED_FILES: Entry[] = [
  [b64encode(FRAGMENTS.en[0]), b64encode(FRAGMENTS.fr[0])],
  [rot13(FRAGMENTS.en[1]), rot13(FRAGMENTS.fr[1])],
  [hex(FRAGMENTS.en[2]), hex(FRAGMENTS.fr[2])],
  [b64encode(KELPIE_INVOICE.en), b64encode(KELPIE_INVOICE.fr)],
].flatMap(([en, fr]): Entry[] => [[en, fr], [`${en}\n`, `${fr}\n`]]);

registerLines('fr', flatten(FR_DIALOGUE));
registerLines('fr', flattenText(FR_TEXT));
registerLines('fr', uiLines(FR_UI));
// legacy-dialogue.json: only for messages already stored in saves from before the datasets. Nothing new reads it.
registerCatalog('fr', [...(legacy as Entry[]), ...ENCODED_FILES, ...flat(FR_WORLD), ...manEntries()]);
