# Gramtele: Story Bible (canon)

Everything here is fictional. Consult before writing any content. All references across missions must agree with this file.

## Scope
Four technical missions (Linux, OSINT, SQL, networking) and a finale (dossier and decision). There is no web-exploitation mission and no vulnerable application: `portal.nexus-labs.test` is only a closed staff login page seen from outside.

## Premise
The player (contractor id **c-0047**, chosen handle) joins Gramtele and is recruited by NULL for "diligence" jobs under the cover firm **Lindgate Advisory**. Every job is groundwork for Blackwell Holdings, which sells cover-ups as crisis management. Past contractors were later named as culprits in incidents and "closed". The player is next: closure is scheduled for 2026-11-05. The finale happens before that job ever begins.

## Entities
| Entity | Domain | Truth |
|---|---|---|
| Gramtele | gramtele.test | "Anonymous" messenger with a "standing" score. Funded since 2023 by Blackwell. Keeps metadata it claims not to keep. |
| Blackwell Holdings | blackwell.test | "Risk, reputation, resilience." Unit: Special Engagements. |
| Lindgate Advisory | lindgate.test | NULL's cover firm. Registered May 2026 by Hollin Trust. Claims to date from 2009. |
| Hollin Trust | registry.test record | Owner of Blackwell, Orion Security, Lindgate. |
| Orion Security | orion-security.test | Consultancy, bought by Hollin in April 2024. Runs DNS and edge for the others. Writes attribution summaries naming contractors. |
| Nexus Labs | nexus-labs.test | Contract research lab. Ran trial NX-417 (cardiac drug Calvexin). |
| The Open Archive | archive.test | Non-profit public-records archive. Editor: Maud Ferreira. Genuinely independent. |

## People
- **Elin Maret** = **ECHO**. Nexus data steward 2018 to 2025-03-28. Exported the audit log 2025-03-12; access revoked 03-13. Handle `quietfern` on trailtalk.test. Lives in **Harrowmere**, near Lake Vessen.
- **Konrad Dressler** (`k.dressler`): Nexus VP Clinical Operations. Deleted AE 2291-2293 on 2025-03-11 (two fatal). Approved Blackwell Diligence invoices (230,000 total).
- **Ruth Aldana**: Nexus CEO.
- **Piet Hollander**: Blackwell Director of Special Engagements. NULL device d-7f3a. **Ilya Brandt**: deputy, night shift, device d-21c9.
- **Sanna Reik** = **VANTA**. Principal at Orion. Also a NULL operator (device d-90be). Trains contractors. Claims she has been looking for one good enough to break the scheme. Ambiguous on purpose: both are true.
- **Tove Ostrander** = **MOTH**. Gramtele infrastructure on-call. Sees metadata. Wants out, and wants leverage to sell.
- **Jonah Kessel** = **ROOTLESS**, ex-contractor c-0031, blamed for Halden Freight. Helpful, bitter, would burn Elin to burn Blackwell.
- **Bram Oyelaran** (`lowtide`), ex-contractor c-0041, blamed for Brask Utilities. Left the note in the workbench. Whereabouts unknown.
- False lead: `quietfern` on gamersden.test is a teenager (Tomas), unrelated.

## Voices
- **NULL**: correct punctuation, few contractions; dry, courteous, never hurries. Night-shift Brandt slips: "ok", missing full stops.
- **VANTA**: warm, teacherly, questions and shorthand, fragments, "ok so". Hates sloppy notes.
- **MOTH**: chatty, ellipses, jokes that stop being funny, offers trades.
- **ROOTLESS**: all lowercase, no punctuation except dashes, gallows humour.
- **ECHO**: encoded fragments (base64, rot13, hex), then plain exact sentences of someone used to writing protocols.

## Timeline
2017 Orion founded. 2018 Elin joins Nexus. 2023 Blackwell funds Gramtele. 2024 Hollin buys Orion; Halden Freight. 2025-03 deletions, invoice, Elin leaves. 2025 Brask. 2026-05 Lindgate registered.
Game clock: M1 2026-10-12, M2 10-14, M3 10-17, M4 10-20, finale 10-24. Planned closure 2026-11-05.

## Network canon (all simulated)
See `src/data/world/network.ts`. Only RFC 5737 and RFC 1918 addresses. Lab VPN 10.40.0.0/24: gw .1, workbench .47, ir-01 .12, vault-02 .31 (visible in scans, no access).

## Moral branches (flags)
- `gave_location` / `withheld_location` (M2 report)
- `shared_archive_vanta` / `kept_archive` / `confronted_null` (after M3)
- `gave_echo_to_moth` / `refused_moth` (finale)
- Endings: `seat` (take the next contract), `record` (publish to Archive), `custody` (dossier to ECHO), `leverage` (dossier to MOTH), `ghost` (close the account).
- Foreshadow: if the player tells VANTA about the deletions, NULL casually references them. VANTA is NULL.
