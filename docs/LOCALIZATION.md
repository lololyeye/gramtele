# Localization

## Where text lives

| Text | Files | How |
|---|---|---|
| Everything characters say, choices, journal decisions, profiles, endings | `src/data/dialogue/en.ts`, `fr.ts` | Two independent datasets, same keys, no shared sentences |
| Who speaks, when, what a choice changes | `src/data/dialogue/script.ts` | Logic only: not one word of dialogue |
| Encoded files (ECHO's fragments, kelpie's invoice) | `src/data/dialogue/fragments.ts` | ASCII plaintext per language, so terminal tools decode them cleanly |
| Mission instructions, reports, reviews, interface, web pages, man pages | English in `src/data/`, `src/game/`, `src/ui/`; French in `src/i18n/fr/` | Hand-written catalog looked up by the English string |

There is no machine translation anywhere, at build time or at runtime.

`src/i18n/fr/legacy-dialogue.json` exists only so that messages already stored in pre-v2 saves still show in French. Nothing new may read it.

## Missing text

- A missing dialogue line never shows another language. `tr()` throws while developing and in tests; in production it logs an error and shows `[fr: key]`.
- `npm run i18n:check` lists every missing or unused line, per language. It also runs as part of `npm test`.
- Catalog strings (missions, interface) are checked by `src/i18n/i18n.test.ts`.

## What the checks enforce

`src/data/dialogue/parity.test.ts`:

- Both languages have exactly the keys the script needs.
- Clues match: `.test` domains, device ids, contractor numbers, `NX-` ids and every figure (prices must match what the mission pays).
- No French line is identical to its English one, unless nothing in it can be translated.
- Voice rules: ROOTLESS has no accents in French and no apostrophes or full stops in English. NULL and ECHO punctuate and use no emoji (except the night shift clue, which must stay). VANTA is lower case with her tic. MOTH capitalises and never uses an emoji.
- French address: NULL and ECHO say *vous*; VANTA, MOTH, ROOTLESS, kelpie and ostrich_farm say *tu*.
- A word list catches French that assumes the player's gender. It is a safety net, not a guarantee.

## Scene review

No test can tell whether a joke lands. For every important scene, a person reads it in both languages:

1. Write the English naturally.
2. Write the French independently, without working from the English sentence.
3. Same meaning: does the player learn the same things and face the same choice?
4. Same person: cover the name. Can you tell who is speaking? (See `VOICES.md`.)
5. Slang: would someone in that community actually type this today?
6. Jokes and insults: do they work on their own terms, or only as a translation?
7. Does either version read like a translation?
8. Narrative clues intact? (The automated check covers only the mechanical ones.)

Personality wins over literal accuracy. The goal is the same intent and equal quality, not the same sentence.

### Status

| Scene | Written EN+FR | Checks pass | Author read-through | Native-speaker read |
|---|---|---|---|---|
| All scenes in `script.ts` | yes | yes | yes | **not yet** |

French slang in particular dates quickly and deserves a read by someone who lives in that community. Mark scenes here as they are reviewed.

## Adding a line

1. Add the beat, message slot or choice to `script.ts`.
2. Write it in `en.ts` and `fr.ts`.
3. `npm run i18n:check`.
