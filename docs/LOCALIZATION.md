# Localization

## Where text lives

| Text | Files | How |
|---|---|---|
| Everything characters say, choices, journal decisions, profiles, endings | `src/data/dialogue/en.ts`, `fr.ts` | Two independent datasets, same keys, no shared sentences |
| Who speaks, when, what a choice changes | `src/data/dialogue/script.ts` | Logic only: not one word of dialogue |
| Encoded files (ECHO's fragments, kelpie's invoice) | `src/data/dialogue/fragments.ts` for the plaintext, `src/data/world/en.ts`, `fr.ts` for the files | ASCII plaintext per language, so terminal tools decode them cleanly |
| Mission briefs, objectives, hints, reports, reviews, skills, achievements, evidence | `src/data/missions/en.ts`, `fr.ts` | Two independent datasets, same keys |
| What a mission checks, pays and accepts as an answer | `src/data/missions/early.ts`, `finale.ts`, `src/data/progression.ts` | Logic only. `bind.ts` fills in the keys |
| Navigation, buttons, notifications, errors, settings, terminal messages | `src/i18n/en/ui.ts`, `src/i18n/fr/ui.ts` | Two independent tables. Code asks for `T('key')`; the type refuses a key that does not exist, and French must have them all |
| Web pages, PDFs, files on the workbench | `src/data/world/en.ts`, `fr.ts` | Two independent datasets. A page's body holds its own inline markup and links |
| Layout of each site, addresses, server headers, PDF metadata, paths | `src/data/world/sites.ts`, `documents.ts`, `hosts.ts` | Logic only. Keys mark where the words go; `localizeDocument` fills them in as a page leaves the site |
| Manual pages and `help` | `src/i18n/en/man.ts`, `src/i18n/fr/man.ts` | Two independent datasets. Flags and example commands are the keys. The usage line stays with the command, through `manual()` |

There is no machine translation anywhere, at build time or at runtime.

`src/i18n/fr/legacy-dialogue.json` exists only so that messages already stored in pre-v2 saves still show in French. It is the last English-keyed table, and nothing new may read it. From version 4, saves store keys for workbench files too (`migrateWorldFiles`, which leaves the player's own files alone). Version 3 saves store keys: on load, `migrateText` in the engine replaces English sentences in older journals, evidence and assignment files with their keys.

Accepted answers live in the logic, so both languages accept the same ones, including French spellings such as « huit » or « mars 2025 ».

The player's own text passes through untouched. A string starting with `§` that is a key in no language is theirs too.

## Missing text

- A missing line never shows another language. `tr()` throws while developing and in tests; in production it logs an error and shows `[fr: key]`.
- `npm run i18n:check` lists every missing or unused line, per language. It also runs as part of `npm test`.
- A missing interface key does not compile.

## What the checks enforce

`src/data/dialogue/parity.test.ts`:

- Both languages have exactly the keys the script, the missions and the interface need.
- Clues match: `.test` domains, device ids, contractor numbers, `NX-` ids and every figure (prices must match what the mission pays).
- No French line is identical to its English one, unless nothing in it can be translated.
- Voice rules: ROOTLESS has no accents in French and no apostrophes or full stops in English. NULL and ECHO punctuate and use no emoji (except the night shift clue, which must stay). VANTA is lower case with her tic. MOTH capitalises and never uses an emoji.
- French address: NULL and ECHO say *vous*; VANTA, MOTH, ROOTLESS, kelpie and ostrich_farm say *tu*.
- A word list catches French that assumes the player's gender, in dialogue, missions and interface. It is a safety net, not a guarantee.
- Hints, notes, error messages and assignment files keep every command, path, flag, query and `submit` value: the player copies them.
- The desk says *vous* in mission text. Only journal decisions and ROOTLESS's note say *tu*.
- Interface texts keep the same `{variables}` in both languages, and no key goes unused.
- Every web page has the same links in both languages, every man page the same flags, examples and "why" section, and workbench files the same paths and references.

Text quoted from a site or a tool must match what that site or tool shows in the same language. The checks cannot see this: read it. Database contents and tool output stay in English in both languages, so a mission quotes them as they appear (« crisis readiness », "scheduled 2026-11-05").

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
| Missions 1 to 5 | yes | yes | yes | **not yet** |
| Interface | yes | yes | yes | **not yet** |
| Web pages, PDFs, workbench files | yes | yes | yes | **not yet** |
| Manual pages | yes | yes | spot-checked | **not yet** |

French slang in particular dates quickly and deserves a read by someone who lives in that community. Mark scenes here as they are reviewed.

## Adding text

- **A line of dialogue:** add the beat, message slot or choice to `script.ts`, then write it in `dialogue/en.ts` and `dialogue/fr.ts`.
- **Mission text:** add the logic to the mission, then write it in `missions/en.ts` and `missions/fr.ts`.
- **A web page or a document:** add the path and its layout to `world/sites.ts` or `world/documents.ts`, then write it in `world/en.ts` and `world/fr.ts`. Any phrase a mission quotes must match in the same language.
- **A manual page:** give the command `man: manual('name', [usage])`, then write the page in `i18n/en/man.ts` and `i18n/fr/man.ts`.
- **Interface text:** add a key to `i18n/en/ui.ts`. The compiler then asks for it in `i18n/fr/ui.ts`. Use `T('key')`, or `ui('key')` in a constant or anything saved.

Then `npm run i18n:check`.
