import type { AnswerDef, Effect, Mission, ReportSection } from '../../game/types';
import { lineKey, registerLines } from '../../i18n';
import { EN_TEXT } from './en';
import { flattenText, MissionLogic } from './format';
import type { TextSet } from './format';

// English ships with the engine. French registers itself from src/i18n/fr.
registerLines('en', flattenText(EN_TEXT));

/** The key of a piece of text in the mission datasets, as tr() reads it. */
export const textKey = (path: string): string => lineKey(path);

/**
 * Fills a mission's text fields with keys into the datasets. The shape comes from the English set, so a field
 * only gets a key if it was written; the parity check then holds French to the same keys.
 */
export function bindMission(logic: MissionLogic): Mission {
  const text = (EN_TEXT as TextSet).missions[logic.id];
  const k = (path: string) => textKey(`missions.${logic.id}.${path}`);
  const list = (path: string, rows: readonly unknown[]) => rows.map((_, i) => k(`${path}.${i}`));

  const answer = (path: string, a: { key: string; accept: string[] }, t: { placeholder?: string; wrong?: string; right?: string }): AnswerDef => ({
    ...a,
    prompt: k(`${path}.prompt`),
    ...(t.placeholder !== undefined ? { placeholder: k(`${path}.placeholder`) } : {}),
    ...(t.wrong !== undefined ? { wrong: k(`${path}.wrong`) } : {}),
    ...(t.right !== undefined ? { right: k(`${path}.right`) } : {}),
  });

  /** Journal effects are written empty in the logic: their words come from the dataset, in order. */
  const effects = (path: string, fx: Effect[] | undefined): Effect[] | undefined => {
    let n = 0;
    return fx?.map((e) => ('journal' in e ? { ...e, journal: k(`${path}.journal.${n++}`) } : e));
  };

  let fileIndex = 0;
  return {
    ...logic,
    chapterTitle: textKey(`chapters.${logic.chapter}`),
    title: k('title'),
    requires: list('requires', text.requires),
    intro: list('intro', text.intro),
    concepts: text.concepts.map((_, i) => ({ term: k(`concepts.${i}.term`), text: k(`concepts.${i}.text`) })),
    resources: list('resources', text.resources),
    environment: k('environment'),
    files: logic.files?.map((f) => (f.file.db ? f : { ...f, file: { ...f.file, data: k(`files.${fileIndex++}`) } })),
    objectives: logic.objectives.map((o) => {
      const t = text.objectives[o.id];
      const path = `objectives.${o.id}`;
      return {
        ...o,
        text: k(`${path}.text`),
        ...(t.note !== undefined ? { note: k(`${path}.note`) } : {}),
        hints: [k(`${path}.hints.0`), k(`${path}.hints.1`), k(`${path}.hints.2`)],
        answer: o.answer && t.answer ? answer(`${path}.answer`, o.answer, t.answer) : undefined,
        extraAnswers: o.extraAnswers?.map((a, i) => answer(`${path}.extraAnswers.${i}`, a, t.extraAnswers![i])),
        effects: effects(path, o.effects),
      };
    }),
    optionals: logic.optionals.map((o) => ({
      ...o,
      title: k(`optionals.${o.id}.title`),
      text: k(`optionals.${o.id}.text`),
      effects: effects(`optionals.${o.id}`, o.effects),
    })),
    report: logic.report && {
      passMark: logic.report.passMark,
      title: k('report.title'),
      intro: k('report.intro'),
      sections: logic.report.sections.map((s): ReportSection => {
        const p = `report.sections.${s.id}`;
        const head = { id: s.id, title: k(`${p}.title`), prompt: k(`${p}.prompt`) };
        if (s.kind === 'order') return { ...head, kind: 'order', correct: s.correct, items: s.items.map((i) => ({ id: i.id, text: k(`${p}.items.${i.id}`) })) };
        if (s.kind === 'choice') return { ...head, kind: 'choice', options: s.options.map((o) => ({ ...o, text: k(`${p}.options.${o.id}.text`), why: k(`${p}.options.${o.id}.why`) })) };
        return { ...head, kind: 'decision', options: s.options.map((o) => ({ ...o, text: k(`${p}.options.${o.id}.text`), decision: k(`${p}.options.${o.id}.decision`) })) };
      }),
    },
    review: {
      accomplished: k('review.accomplished'),
      concepts: list('review.concepts', text.review.concepts),
      why: k('review.why'),
      professional: k('review.professional'),
      defend: list('review.defend', text.review.defend),
    },
  };
}
