import type { Mission } from '../../game/types';
import { textKey } from './bind';
import { M01, M02, M03, M04 } from './early';
import { M05 } from './finale';

export const MISSIONS: Mission[] = [M01, M02, M03, M04, M05];
export const MISSION_BY_ID: Record<string, Mission> = Object.fromEntries(MISSIONS.map((m) => [m.id, m]));

export { M01, M02, M03, M04, M05 };

export const CHAPTERS: { n: number; title: string }[] = [0, 1, 2, 3, 4, 5].map((n) => ({ n, title: textKey(`chapters.${n}`) }));
