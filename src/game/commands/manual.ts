import { lineKey } from '../../i18n';
import { EN_MAN } from '../../i18n/en/man';
import type { ManPage } from '../terminal/types';

/**
 * A command's manual page, as keys. The text is in one dataset per language; the usage line belongs to the command.
 * The English dataset gives the shape, and the parity test holds every other language to it.
 */
export function manual(name: string, synopsis: string[]): ManPage {
  const text = EN_MAN[name];
  if (!text) throw new Error(`No manual page for ${name}`);
  const key = (field: string) => lineKey(`man.${name}.${field}`);
  const rows = (field: 'options' | 'examples'): [string, string][] => Object.keys(text[field] ?? {}).map((k) => [k, key(`${field}.${k}`)]);
  return {
    name: key('name'),
    synopsis,
    description: key('description'),
    options: rows('options'),
    examples: rows('examples'),
    why: text.why ? key('why') : undefined,
  };
}
