import { FR_DIALOGUE } from '../../data/dialogue/fr';
import { flatten } from '../../data/dialogue/format';
import { flattenText } from '../../data/missions/format';
import { FR_TEXT } from '../../data/missions/fr';
import { FR_WORLD } from '../../data/world/fr';
import { worldLines } from '../../data/world/format';
import { manLines, registerCatalog, registerLines, uiLines } from '../index';
import legacy from './legacy-dialogue.json';
import { FR_MAN } from './man';
import { FR_UI } from './ui';

export const FR_READY = true;

registerLines('fr', flatten(FR_DIALOGUE));
registerLines('fr', flattenText(FR_TEXT));
registerLines('fr', uiLines(FR_UI));
registerLines('fr', worldLines(FR_WORLD));
registerLines('fr', manLines(FR_MAN));
// legacy-dialogue.json: only for messages already stored in saves from before the datasets. Nothing new reads it.
registerCatalog('fr', legacy as [string, string][]);
