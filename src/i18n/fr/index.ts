import { registerCatalog } from '../index';
import { Entry } from '../zip';
import { dialogueEntries } from './dialogue';
import { manEntries } from './man';
import { missionEntries } from './missions';
import { FR_UI } from './ui';
import { FR_WORLD } from './world';

export const FR_READY = true;

const flat = (table: Record<string, string>): Entry[] => Object.entries(table);

registerCatalog('fr', [...flat(FR_WORLD), ...flat(FR_UI), ...dialogueEntries(), ...missionEntries(), ...manEntries()]);
