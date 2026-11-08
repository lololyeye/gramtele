/**
 * Plain text behind the encoded files. Kept in ASCII so that base64, tr and xxd decode them cleanly in the terminal.
 * ECHO's three fragments and kelpie's "NDA" invoice.
 */
export const FRAGMENTS = {
  en: ['do you know what you looked for', 'the woman on the jetty counted three deaths nobody filed', 'if you have the image look at march twelve. then decide whose side your hands are on'],
  fr: ['savez-vous ce que vous cherchiez', 'la femme du ponton a compte trois morts que personne n a declares', 'si vous avez l image regardez le douze mars. puis decidez de quel cote sont vos mains'],
};

export const KELPIE_INVOICE = {
  en: 'INVOICE 2026-0093 / ISSUED BY kelpie / AMOUNT 40 CREDITS / STATUS UNPAID, DISPUTED BY CLIENT',
  fr: 'FACTURE 2026-0093 / EMISE PAR kelpie / MONTANT 40 CREDITS / STATUT IMPAYEE, CONTESTEE PAR LE CLIENT',
};
