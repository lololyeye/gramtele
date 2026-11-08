import { registerLines } from '../../i18n';
import { EN_DIALOGUE } from './en';
import { flatten } from './format';

// English ships with the engine. French registers itself from src/i18n/fr.
registerLines('en', flatten(EN_DIALOGUE));

export { BEATS, WORLD_RULES } from './script';
