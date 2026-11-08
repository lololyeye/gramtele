import type { Mission } from '../../game/types';
import { M01, M02, M03, M04 } from './early';
import { M05 } from './finale';

export const MISSIONS: Mission[] = [M01, M02, M03, M04, M05];
export const MISSION_BY_ID: Record<string, Mission> = Object.fromEntries(MISSIONS.map((m) => [m.id, m]));

export const CHAPTERS: { n: number; title: string }[] = [
  { n: 0, title: 'The Invitation' },
  { n: 1, title: 'First Contact' },
  { n: 2, title: 'Digital Footprints' },
  { n: 3, title: 'The Archive' },
  { n: 4, title: 'Surface Area' },
  { n: 5, title: 'The Point of No Return' },
];
