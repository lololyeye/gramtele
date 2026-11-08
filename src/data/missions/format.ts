import type { AnswerDef, Effect, Mission, Objective, OptionalDiscovery, SkillId } from '../../game/types';

/** The shape of one language's mission writing. en.ts and fr.ts each fill it in, and share nothing else. */
export interface AnswerText {
  prompt: string;
  placeholder?: string;
  wrong?: string;
  right?: string;
}

export interface ObjectiveText {
  text: string;
  note?: string;
  hints: [string, string, string];
  answer?: AnswerText;
  extraAnswers?: AnswerText[];
  /** Journal lines this objective writes, in the order of its effects. */
  journal?: string[];
}

export interface OptionalText {
  title: string;
  text: string;
  journal?: string[];
}

export interface OptionText {
  text: string;
  why?: string;
  decision?: string;
}

export interface SectionText {
  title: string;
  prompt: string;
  items?: Record<string, string>;
  options?: Record<string, OptionText>;
}

export interface MissionText {
  title: string;
  requires: string[];
  intro: string[];
  concepts: { term: string; text: string }[];
  resources: string[];
  environment: string;
  /** Text files the assignment puts on the workbench, in the order the mission lists them. */
  files?: string[];
  objectives: Record<string, ObjectiveText>;
  optionals: Record<string, OptionalText>;
  report?: { title: string; intro: string; sections: Record<string, SectionText> };
  review: { accomplished: string; concepts: string[]; why: string; professional: string; defend: string[] };
}

/** Everything else the record screens show. */
export interface TextSet {
  missions: Record<string, MissionText>;
  chapters: string[];
  skills: Record<SkillId, string>;
  nodes: Record<string, { title: string; text: string }>;
  achievements: Record<string, { title: string; text: string }>;
  evidence: Record<string, { title: string; summary: string; source?: string }>;
}

/** Turns one language's writing into flat keys: missions.m01.objectives.find.hints.0 */
export function flattenText(set: TextSet): Map<string, string> {
  const out = new Map<string, string>();
  const walk = (prefix: string, v: unknown): void => {
    if (typeof v === 'string') out.set(prefix, v);
    else if (Array.isArray(v)) v.forEach((c, i) => walk(`${prefix}.${i}`, c));
    else if (v && typeof v === 'object') for (const [k, c] of Object.entries(v)) walk(`${prefix}.${k}`, c);
  };
  for (const [k, v] of Object.entries(set)) walk(k, v);
  return out;
}

// ---------- logic: what a mission is, with no words in it ----------

type AnswerLogic = Pick<AnswerDef, 'key' | 'accept'>;

export type ObjectiveLogic = Omit<Objective, 'text' | 'note' | 'hints' | 'answer' | 'extraAnswers'> & {
  answer?: AnswerLogic;
  extraAnswers?: AnswerLogic[];
};

export type OptionalLogic = Omit<OptionalDiscovery, 'title' | 'text'>;

export type SectionLogic =
  | { kind: 'choice'; id: string; options: { id: string; correct?: boolean }[] }
  | { kind: 'order'; id: string; items: { id: string }[]; correct: string[] }
  | { kind: 'decision'; id: string; options: { id: string; effects?: Effect[] }[] };

export type MissionLogic = Omit<Mission, 'chapterTitle' | 'title' | 'requires' | 'intro' | 'concepts' | 'resources' | 'environment' | 'objectives' | 'optionals' | 'report' | 'review'> & {
  objectives: ObjectiveLogic[];
  optionals: OptionalLogic[];
  report?: { passMark: number; sections: SectionLogic[] };
};
