import { b64encode } from '../../game/commands/forensic';
import { FRAGMENTS } from './fragments';
import type { DialogueSet } from './format';

/**
 * L'histoire en français. Écrite pour des lecteurs français : ce fichier partage avec en.ts l'intention
 * de chaque scène, jamais ses phrases. Les voix sont définies dans docs/VOICES.md.
 *
 * Règles à garder en tête :
 * - On ne connaît pas le genre du joueur : aucun accord qui le suppose (ni « prêt », ni « doué »).
 *   Pour parler de lui à la troisième personne, le « ça » méprisant ou « le nouveau pseudo ».
 * - NULL et ECHO vouvoient. VANTA, MOTH, ROOTLESS et #lowlight tutoient.
 * - ROOTLESS n'écrit aucun accent. C'est sa marque, comme les tirets.
 */

const hex = (s: string) => [...new TextEncoder().encode(s)].map((b) => b.toString(16).padStart(2, '0')).join('');
const rot13 = (s: string) => s.replace(/[a-z]/gi, (c) => {
  const base = c <= 'Z' ? 65 : 97;
  return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base);
});

const ACCEPT = { label: 'Accepter la mission', reply: 'Je prends.' };
const DECLINE = { label: 'Refuser pour l’instant', reply: 'Pas celle-là.' };
const offer = (m: string[], declined: string, again: string, reply = 'Bon. Envoyez.') => ({
  offer: { m, c: { accept: ACCEPT, decline: DECLINE } },
  reoffer: { m: [declined, again], c: { accept: { label: ACCEPT.label, reply } } },
});

const n1 = offer(
  ['Un petit test rémunéré, si le cœur vous en dit. 40 crédits, une heure de votre soirée. Nous vous fournissons un poste, et vous me montrez que vous savez vous y repérer. À ce stade, la plupart des gens se surestiment. C’est le meilleur moment de ma semaine.', 'Mission en pièce jointe.'],
  'Entendu. Les gens sont souvent occupés, ou inquiets. Vu d’ici, c’est la même chose.',
  'Le test reste ouvert ce soir, à 50 crédits. D’habitude, je ne demande pas deux fois.',
);
const n2 = offer(
  ['Une vraie mission, si vous avez la soirée. Un client veut en savoir plus sur une personne passée par l’un de ses fournisseurs. Nous n’avons qu’un pseudonyme.', 'Sources publiques uniquement, et on ne contacte jamais la personne visée. 80 crédits. kelpie la réclamait et ne l’aura pas. Inutile de le préciser : kelpie s’en chargera.'],
  'C’est votre droit. kelpie sera ravi.',
  'Les 80 sont passés à 90 de mon côté : le client s’impatiente. Mêmes conditions.',
);
const n3 = offer(
  ['Votre prochaine mission est étroite. Un client veut des garanties sur des paiements à des fournisseurs, dans une base de données désaffectée. Une image vous attend.', 'Le périmètre, ce sont les factures. 120 crédits. Vous touchez désormais plus que certains de ceux qui riaient de vous. Je n’en parlerais pas. Ils savent compter.'],
  'Comme vous voudrez.',
  'Je peux monter à 130. C’est une soirée facile, et ce ne sont que des factures.',
);
const n4 = offer(
  ['Le client aimerait maintenant un regard extérieur sur ce même fournisseur : ce que n’importe qui peut voir de son réseau à partir d’informations publiques. Tout est simulé dans votre environnement de labo.', '150 crédits.'],
  'Noté.',
  'Je vous la garde à 160. Ensuite vient un travail plus important, et j’aimerais que vous soyez à la hauteur.',
);
const r2 = offer(
  ['ils t\'ont propose le gros job hein - chiffre rond - portail - c\'est celui-la - c\'est la qu\'ils arretent de payer et qu\'ils commencent a ecrire des rapports', 'reponds pas tout de suite - lowtide l\'a ecrit dans sa note - garde des copies - j\'ai mis un dossier sur ta machine - le relais marche dans les deux sens si tu sais demander - moth me doit un truc'],
  'ok - tu veux verifier - comme tout le monde',
  'mais la date bouge pas parce que t\'as besoin d\'une journee',
  'Bon. Envoie.',
);

export const FR_DIALOGUE: DialogueSet = {
  scenes: {
    n0_hello: {
      m: [
        'Bonsoir. Vous avez posé une bonne question tout à l’heure sur le canal ouvert : pourquoi une vieille réponse DNS peut survivre à l’enregistrement qui l’a produite. La plupart des gens ne se demandent jamais pourquoi.',
        'Je place des missions pour un petit cabinet de vérification. De la paperasse, pour l’essentiel. Je tiens aussi une liste de noms, où vous ne figuriez pas il y a quatre minutes. N’y voyez rien de flatteur : elle est longue, et je m’enthousiasme rarement.',
      ],
      c: {
        firm: { label: 'Quel cabinet ?', then: ['Lindgate Advisory. Renseignez-vous, je vous en prie. Je vous estimerais moins si vous ne le faisiez pas, et je vous estime déjà très peu : vous avez de la marge.'] },
        how: { label: 'Comment avez-vous eu mon pseudo ?', then: ['Vous avez posé une bonne question en public. Je lis les canaux publics depuis qu’ils tournaient à 2400 bauds. Repérer la seule personne qui réfléchit n’a rien de sorcier.'] },
        work: { label: 'Quel genre de travail ?', then: ['De la lecture attentive, surtout. Des registres, des documents, de la configuration. Personne n’a jamais souffert d’une lecture attentive.'] },
      },
    },
    n1_offer: n1.offer,
    n1_reoffer: n1.reoffer,

    lg_hello: {
      m: [
        'NULL vous a ajouté à #lowlight.',
        'Bienvenue. Règle 1 : pas de noms. Règle 2 : pas de clients. Règle 3 : on ne demande pas le tarif des autres.',
        'la règle 3 a tenu neuf minutes en 2024 mdr. le nouveau pseudo, tu tournes à combien ?',
        'regarde le profil gros. réputation zéro. ça tourne au pourboire de NULL',
        'VIANDE FRAICHE - wsh zero - ca fait quoi rm -rf - mauvaises reponses uniquement',
      ],
      c: {
        back: { label: 'Répondre à ROOTLESS', reply: 'Ça libère de l’espace disque.', then: ['MDRRR - ok zero a de l\'humour - zero peut rester', 'l’humour ça se facture toujours zéro de TJM'] },
        short: { label: 'Faire court', reply: 'Bonsoir. Je suis là pour bosser.', then: ['mignon. les trois derniers aussi', 'C’est la bonne réponse, au passage. Personne n’écoute jamais.'] },
      },
    },
    lg_fails: {
      m: [
        'y a quelqu’un sur l’image du labo qui vient de rater quatre commandes d’affilée',
        'ça ouvre un terminal et ça se croit arrivé 💀',
        '😂😂',
        'NULL, ça ne te ressemble pas.',
        'Veuillez m’excuser. Longue nuit.',
      ],
    },
    lg_hints: {
      m: [
        'Petite remarque à l’attention de la recrue : le compteur d’indices n’a rien de privé. « hint » est une commande, et les commandes se journalisent. Je le signale uniquement parce que personne ici n’a jamais ouvert un man.',
        'LE ROI DU HINT 💀',
        'Laisse-les parler. Tout le monde ici a déjà tapé hint. Certains n’ont jamais arrêté.',
      ],
    },
    n1_done: {
      m: [
        'Bien reçu. 40 crédits versés. Vous avez lu la configuration active plutôt que le brouillon d’à côté. Plusieurs ne l’ont pas fait, avec beaucoup d’assurance.',
        'Et sans le moindre indice. Je ne distribue pas de compliments. Je distribue du travail.',
        'Vous avez pris des indices. Ils sont journalisés, et je les ai lus. Il faut bien commencer. Certains ont commencé plus tôt.',
        'Une précision pratique. Vous tomberez sur de vieux fichiers laissés sur cette image par un prestataire précédent. Ils sont sans intérêt, et je n’y toucherais pas.',
      ],
    },
    lg_m1: {
      m: [
        'bon le classement a bougé. le nouveau pseudo a validé l’orientation. réputation différente de zéro, prévenez la presse',
        'sans indice en plus. tinsel tu me dois cinq',
        'Je ne te dois rien. L’orientation, c’est un dossier et un fichier texte.',
        'moi je l’ai pliée en gueule de bois dans un TGV gros. réveillez-moi quand ça signera une vraie mission 💸',
        'kelpie tu l\'as faite DEUX FOIS - on a tous vu',
        'c’était pas le même client',
      ],
    },
    ltd_archive: {
      m: [
        'Conversation récupérée sur l’image du poste. Compte fermé le 22 août 2025. 11 février 2025 :',
        'Bonsoir. Vous avez posé une bonne question tout à l’heure sur le canal ouvert. La plupart des gens ne se demandent jamais pourquoi.',
        'ha merci. t’es qui ?',
        'Je place des missions pour un petit cabinet de vérification. De la paperasse, pour l’essentiel.',
        '20 août 2025 :',
        'y a un rapport de police avec mon numéro de prestataire dessus',
        'NULL',
        'réponds',
        'NULL a quitté cette conversation.',
      ],
      journal: ['Une conversation archivée de lowtide commence presque mot pour mot comme la mienne avec NULL. Elle finit sur un rapport de police.'],
    },
    v1_request: {
      m: [
        'bon alors quelqu’un sur #lowlight raconte que le nouveau pseudo a lu un fichier de conf avant de poser des questions dessus. rare. salut.',
        'je fais de la recherche en sécu, surtout depuis des salons d’aéroport, parce que je peux. je réponds quand j’en ai envie. une seule règle. écris tout.',
      ],
      c: {
        yes: { label: 'Accepter la demande de contact', reply: 'Salut. Écrire quoi ?', then: ['tout. la commande, l’heure, pourquoi tu l’as lancée. tu t’en souviendras pas, personne s’en souvient. et prends-toi un vrai clavier, j’entends le tien d’ici.'] },
        no: { label: 'Ignorer pour l’instant', reply: 'Je ne te connais pas.', then: ['bonne réponse, franchement. mignonne, mais bonne. l’offre tient.'] },
      },
    },

    n2_offer: n2.offer,
    n2_reoffer: n2.reoffer,
    v2_tip: {
      m: [
        'il paraît que t’as piqué la mission de kelpie. bon alors un truc. même pseudo sur deux sites, ça fait pas la même personne. y a des gens qui se font détruire pour cette erreur, et c’est jamais ceux qui la commettent.',
        'pour chaque fait, demande-toi : qui le dit, et à quoi ça ressemblerait s’il se trompait ?',
      ],
    },
    lg_kelpie_flex: {
      m: [
        'perso on m’a grillé la priorité sur une mission cette semaine et ça me va TRÈS bien gros, j’en ai closé deux plus grosses à côté',
        '4k, 5k, j’ai arrêté de compter. le nouveau setup est full watercooling 💸',
        'mignon. lesquelles ? je demande parce que je connais ceux qui signent les factures à ce bureau, et personne ne se souvient de t’avoir payé depuis août.',
        'autre bureau',
        'askip le « watercooling » de la photo avait un sticker de location dessus. j’ai zoomé 👀',
        'IL REFROIDIT UN PC DE LOCATION AVEC UNE BASSINE 💀',
        'Règle 3.',
        'bon alors. ma baie vaut plus que ce que tout ce canal a gagné l’an dernier, et je note quand même ce qu’elle m’a coûté. kelpie, écris-le.',
      ],
    },
    m1_hello: {
      m: [
        'Bonsoir, c-0047. Pardon pour le numéro. Ton pseudo est très bien ; simplement, les numéros mentent moins.',
        'Tu lis un forum de randonnée depuis le début de la soirée. Charmant passe-temps, j’imagine, au sens où « charmant » et « passe-temps » font ici de gros efforts...',
      ],
      c: {
        how: { label: 'Comment tu sais ça ?', then: ['Ton relais et le mien s’entendent à merveille. Je t’expliquerais bien la topologie, mais tu hocherais la tête. Redemande-moi quand tu auras quelque chose à échanger...'] },
        block: { label: 'Lâche-moi.', then: ['Tout le monde ouvre par là. Statistiquement, une question suit. Je peux attendre : j’ai lu toute la file de tickets et presque tout Saint-Simon...'] },
      },
    },
    n2_done_gave: { m: ['Travail très complet, et une prime a été versée pour la localisation. Le client est satisfait. Vous n’avez plus à penser à cette personne.'] },
    n2_done_withheld: {
      m: [
        'Bien reçu. Un nom, un emploi, pas de localisation. Trouver si peu ne vous ressemble pas. Je vous ai vu lire.',
        'Peu importe. Paiement versé. kelpie aurait trouvé le village, et nous aurait tous épuisés avec.',
      ],
    },
    lg_m2: {
      m: [
        'maj du classement. {handle} vient de me passer devant. je suis pas vexé. mes autruches sont vexées',
        '{handle} a eu du bol sur une mission',
        'Je note que kelpie a retenu le pseudo.',
        'ils connaissent ton nom maintenant {handle} - bravo - c\'est comme ca que ca commence',
      ],
    },
    lg_duel: {
      m: [
        'bon vu que tout le monde m’audite. le mois dernier, facture et tout. encodée parce que NDA. asseyez-vous',
        'Le base64 n’est pas un NDA. Ce n’est même pas une serrure. C’est une police de caractères un peu plus laide.',
        '{handle} c’est toi qui es en forme. ouvre et lis-nous ça 👀',
      ],
      c: {
        expose: {
          label: 'Lire la facture à voix haute',
          reply: 'Facture 2026-0093. Montant : 40 crédits. Statut : impayée, contestée par le client.',
          then: [
            'c’est un template ça',
            'QUARANTE',
            'QUARANTE CREDITS 💀 LA BASSINE ETAIT A CREDIT',
            'Règle 3. Cela dit.',
            'bon alors ça, c’était propre. {handle} a ouvert le fichier avant d’ouvrir sa bouche. rare. écrivez-le, tout le monde.',
          ],
        },
        pass: { label: 'Laisser tomber', reply: 'Pas ma facture, pas mon problème.', then: ['malin. chacun son niveau', 'chiant. respectable, mais chiant'] },
      },
    },
    e1_fragment: {
      m: [b64encode(FRAGMENTS.fr[0])],
      c: {
        decoded: { label: 'Je sais, maintenant. Qui êtes-vous ?', then: ['Encoder n’est pas cacher. Vous avez réussi.'] },
        what: { label: 'C’est censé être quoi, ça ?', then: ['bWFuIGJhc2U2NA=='] },
      },
    },
    lg_echo: {
      m: [
        'attendez pourquoi ça raconte qu’ECHO a ouvert un canal avec {handle}',
        'Je n’ai rien dit. J’ai rarement besoin de le faire.',
        'ECHO a posté trois fois en un an. Trois rétractations ont suivi. Personne n’a jamais gagné un débat contre ECHO, surtout parce que personne n’a droit à un deuxième message.',
        'réputation 40 gros. on s’en fout',
        'kelpie. va lire les trois posts. et ensuite tais-toi un moment.',
      ],
    },
    e1_gave: {
      m: [
        'Mardi, un homme a descendu la route du ponton. À l’épicerie, il a demandé où trouver une femme qui randonne.',
        'Je n’habite plus là-bas. J’avais un jardin.',
      ],
      journal: ['ECHO a fui Harrowmere parce que quelqu’un est venu poser des questions. Le village, c’est moi qui l’ai donné.'],
    },
    e1_withheld: {
      m: [
        'Un profil que je surveille a été lu de près, photo comprise. Puis personne n’est venu. Quelqu’un savait, et n’a rien dit.',
        'J’aimerais savoir pourquoi. Je n’attends pas de réponse pour l’instant.',
      ],
    },

    n3_offer: n3.offer,
    n3_reoffer: n3.reoffer,
    lg_db: {
      m: [
        'y en a d’autres qui se sont fait payer pour lire une base morte cette année ?',
        'Règle 2.',
        'j’ai dit « d’autres », j’ai pas dit un client',
        'vous vous rappelez d’unfurl ? toujours les missions marrantes. meilleur classement du canal pendant tout un hiver. et puis plus un message depuis février',
        'Les gens passent à autre chose.',
        'on peut dire ca comme ca',
      ],
    },
    lg_group_by: {
      m: [
        'Petit sondage. kelpie soutient que GROUP BY « filtre les lignes ». Avant que je dise une méchanceté : quelqu’un ici sait-il ce que cela fait ?',
        'ça groupe, ça filtre, peu importe. je paie des gens pour le sql',
      ],
      c: {
        wrong: { label: 'Ça trie les lignes', reply: 'GROUP BY trie les lignes selon cette colonne.', then: ['Ça, c’est ORDER BY. GROUP BY réduit les lignes à une par clé, pour que les agrégats puissent s’y appliquer. Je veux croire que tu voulais ménager kelpie...', 'ILS SONT DEUX 💀'] },
        right: { label: 'Ça réduit à une ligne par clé', reply: 'GROUP BY réduit à une ligne par clé pour que les agrégats tournent. WHERE filtre avant, HAVING après.', then: ['Exact, et dans le bon ordre. Que c’est agaçant.', 'c’est ce que j’ai dit', 'non. c’est {handle} qui l’a dit 👀'] },
      },
    },
    lg_kelpie_asks: {
      m: [
        'dis {handle} tu tournes à combien en ce moment. pas pour moi hein. c’est un pote qui renégocie',
        'Règle 3.',
        'la règle 3 c’est pour ceux qui gagnent tinsel',
      ],
    },
    lg_passed_kelpie: {
      m: [
        '{handle} vient de passer kelpie au classement. kelpie est très silencieux. kelpie a changé d’avatar 👀',
        'la réputation c’est un concours de popularité',
        'En effet. Et tu le gagnais.',
      ],
      c: {
        gloat: { label: 'Enfoncer le clou', reply: 'Tu voulais qu’on te réveille quand je signerais une vraie mission.', then: ['ok. ça va.', 'OHHH - KELPIE EST MORT - PREVENEZ LA BASSINE 💀'] },
        gracious: { label: 'Laisser couler', reply: 'Il y a de la place pour tout le monde au classement.', then: ['C’est pire, tu sais.'] },
      },
    },
    e2_fragment: { m: [rot13(FRAGMENTS.fr[1]), rot13('tr a-z n-za-m')] },
    v3_ask: {
      m: ['tu m’as l’air bien calme. les bases de données font ça. t’as trouvé un truc hors périmètre ? tu peux me le dire. cette phrase-là, je la facture 900 de l’heure, toi tu l’as gratos. je prends de bonnes notes, tu le sais.'],
      c: {
        share: { label: 'Parler à VANTA des événements supprimés', reply: 'Trois événements indésirables ont été supprimés la veille d’une grosse facture. Deux étaient des décès.', decision: 'Tu as parlé à VANTA des événements indésirables supprimés.', then: ['ok. là c’est sérieux. pas de blague sur ce coup. t’as hashé l’image ? hashe l’image. et fais gaffe à qui d’autre tu dis ça.'] },
        keep: { label: 'Garder ça pour toi', reply: 'Rien à signaler. Juste des factures.', decision: 'Tu n’as dit à personne ce que contenait l’archive.', then: ['mm. ok. des notes, quand même. même si c’est juste pour toi.'] },
      },
    },
    n3_done: {
      m: [
        'Vos chiffres de factures sont parvenus au client. Merci. Paiement versé.',
        'Le rapport était juste du premier coup. J’en lis très peu. Ne me faites pas regretter de vous l’avoir dit.',
        'Vous n’avez pas à vous préoccuper des entrées supprimées. Elles étaient hors de votre périmètre.',
      ],
      c: {
        confront: { label: 'Qu’est-il arrivé à ces patients ?', decision: 'Tu as interpellé NULL au sujet des patients de NX-417.', then: ['Des patients ? Je vous ai parlé de factures.', 'Votre travail reste excellent. À votre place, je veillerais à ce que cela dure.'] },
        noticed: { label: 'Je ne vous ai jamais parlé d’entrées supprimées.', decision: 'Tu as remarqué que NULL savait une chose que tu n’avais dite qu’à VANTA.', journal: ['NULL a parlé des entrées supprimées. Je ne l’avais dit qu’à VANTA.'], then: ['Vous avez interrogé la table d’audit sur notre poste. Nous lisons nos propres journaux.'] },
        quiet: { label: 'Ne rien dire', reply: 'Entendu.' },
      },
    },
    lg_m3: {
      m: [
        'classement. {handle} passe au-dessus de tinsel. j’ai les captures si quelqu’un veut faire son deuil',
        'La réputation n’est pas l’ancienneté.',
        'un peu quand meme tinsel - c\'est tout le drame',
        'Bien travailler n’est pas une personnalité. Continuez.',
      ],
    },
    v_respect: {
      m: [
        'bon alors j’ai regardé le classement. je le regarde comme toi ton compte en banque, sauf que moi ça me fait rire. t’es là-haut maintenant. c’était du vrai boulot, et ça m’agace de pas avoir parié dessus.',
        'achète rien tout de suite. ils achètent tous quelque chose.',
      ],
    },
    e3_fragment: { m: [hex(FRAGMENTS.fr[2])] },

    n4_offer: n4.offer,
    n4_reoffer: n4.reoffer,
    lg_race: {
      m: [
        'ok {handle} - nouveau jeu - meme image de labo pour tout le monde donc personne chiale pour le NDA - le premier qui donne la passerelle par defaut et le nombre de machines en vie a gagne',
        'je suis sur un thinkpad de 12 ans et sur la haine pure - GO',
        'occupé',
        'kelpie est occupé 👀 les paris sont ouverts',
      ],
    },
    lg_race_won: {
      m: [
        'NON - non non non - ce n00b m\'a pas devance - impossible',
        'je tapais - mon thinkpad reflechissait',
        'paie. 5 crédits pour le n00b',
        'je dois 5 credits a tout le monde - fais la queue - bon - envoye',
      ],
    },
    r1_hello: {
      m: [
        'autre canal autre moi - sur lowlight je fais le clown - personne lit le clown - c\'est tout l\'interet du clown',
        'c-0031 - j\'avais ta machine avant le type qui avait ta machine - demande-leur ce qui s\'est passe chez halden freight',
      ],
      c: {
        yes: { label: 'Il s’est passé quoi chez Halden Freight ?', then: ['lis le rapport - orion-security.test/reports - mon numero est dessus - j\'etais chez moi ce soir-la - le juge s\'en foutait'] },
        no: { label: 'Pourquoi je te ferais confiance ?', then: ['fais pas confiance - verifie - archive.test a le dossier d\'appel - verifie tout c\'est pour ca qu\'ils t\'ont forme - marrant non'] },
      },
    },
    lg_ttl: {
      m: [
        'Puisque le niveau de la conversation est bas, un fait pour les enfants : dès qu’on modifie un enregistrement DNS faisant autorité, l’ancienne réponse disparaît. Tout le monde obtient aussitôt la nouvelle. La « propagation » est une légende vendue par les hébergeurs.',
        'oh ca va monsieur le professeur',
      ],
      c: {
        agree: { label: 'Laisser passer', reply: 'Ça me paraît juste.', then: ['Cela paraît juste, en effet. C’est aussi faux : les résolveurs gardent l’ancienne réponse jusqu’à expiration de son TTL. Je voulais voir qui le dirait. Personne...', 'C’était un test. Tu viens de le rater devant tout le monde.'] },
        ttl: {
          label: 'Reprendre MOTH : les résolveurs gardent la réponse jusqu’au TTL',
          reply: 'Faux. Un résolveur garde l’ancienne réponse jusqu’à expiration du TTL, c’est pour ça qu’elle peut survivre à son enregistrement. C’est la question qui m’a valu ce job.',
          then: [
            '👀👀👀',
            'Au sens strict... oui. Je simplifiais.',
            'TU SIMPLIFIAIS ?? 💀💀 MOTH SE FAIT REPRENDRE PAR LE STAGIAIRE',
            'Savoure, {handle}. Cela ne se reproduira pas. Je m’en souviendrai, en revanche.',
          ],
        },
      },
    },
    m2_watch: { m: ['Tu as cherché à qui appartient ton employeur. Bien : c’est la première chose lettrée qu’ait faite quelqu’un de ta promotion. Ils l’ont vu, évidemment. Ton poste leur raconte tout... personne ne te l’a dit ?'] },
    n4_done: {
      m: [
        'Une carte claire, bien séparée des opinions. Paiement versé.',
        'C’était propre. Ne le laissez pas vous monter à la tête : il n’y trouverait pas grand-chose à quoi s’accrocher.',
        'Le prochain travail est plus gros et rapporte 2000. Les détails suivront dès que vous aurez confirmé. Il concerne ce même portail. Prenez une journée.',
      ],
    },
    lg_m4: {
      m: [
        'maj du classement et je veux tout le monde assis. {handle} est au-dessus de MOTH.',
        'La réputation mesure qui a été remarqué, non qui a raison.',
        'tu disais que c\'etait le seul chiffre honnete du reseau - en MARS',
        'J’ai dit beaucoup de choses en mars.',
        'maj du classement. {handle} se rapproche de MOTH. je vends des places',
        'Pour mémoire, je l’avais vu venir.',
        'non',
        'bon alors. tout le monde ici vient d’apprendre ton nom. demande-toi à qui ça sert.',
      ],
    },

    r2_offer: r2.offer,
    r2_reoffer: r2.reoffer,
    r_table: {
      m: [
        'j\'ai ete a 812 sur ce classement - top 5 - j\'ai garde une capture - rigole pas',
        'tu sais ce que ca fait la reputation quand ils te choisissent - ca fait une meilleure histoire - prestataire notoire ca passe super bien dans un rapport - personne ecrit un rapport sur un inconnu',
      ],
    },
    mt_trade: {
      m: [
        'Alors... j’ai un petit export. Des enregistrements de sessions, des identifiants d’appareils, la chose même dont notre page de transparence nie l’existence. Il répondrait à l’essentiel de tes questions, et dans une meilleure langue que la tienne.',
        'Et toi, tu as quelqu’un qui t’envoie de l’hexa à l’aube. J’aimerais savoir sur quel relais elle se trouve. Rien que cela. Un échange équitable : des métadonnées contre des métadonnées...',
      ],
      c: {
        give: { label: 'Donner à MOTH ce que tu sais sur ECHO', reply: 'Son pseudo, c’est ECHO. Elle se connecte vers l’aube. Envoie le fichier.', decision: 'Tu as échangé les habitudes de connexion d’ECHO contre l’export de MOTH.', then: ['Un plaisir... je le pense vraiment.'] },
        refuse: { label: 'Refuser', reply: 'Non. Pas elle.', decision: 'Tu as refusé de livrer ECHO à MOTH.', then: ['Des principes... cela coûte généralement quelque chose à quelqu’un. Nous en reparlerons.'] },
      },
    },
    mt_weight: { m: ['Mes félicitations pour la réputation. Demande-toi maintenant, si l’effort n’est pas trop grand, qui finance le classement. Un prestataire dont personne n’a entendu parler fait un piètre coupable. Un prestataire célèbre, en revanche, se lit très bien...'] },
    r3_export: { m: ['moth t\'a demande pour elle hein - t\'as dit non - bien - moth m\'a aussi vendu ca l\'an dernier pour moins que tu crois - vieux format memes tables - je l\'ai mis a jour moi-meme'] },
    v4_confront: {
      m: [
        't’as lancé un group by sur la table sessions. je l’ai vu passer.',
        'bon alors. oui. d-90be, c’est mon portable. je m’occupe des recrues. j’ai appris à six personnes à prendre des notes, et ensuite j’ai écrit les rapports avec leurs numéros dessus. la baie, les salons d’aéroport. c’est ça que ça paie.',
        'je cherchais aussi une septième personne, une qui lirait son propre journal d’audit avant d’y être obligée. toi, tu l’as fait. personne d’autre.',
      ],
      c: {
        believe: { label: 'Pourquoi je croirais un mot de ça ?', decision: 'Tu as exigé que VANTA se justifie.', then: ['tu devrais pas. vérifie. j’ai signé Halden et Brask, mon nom est sur les PDF. si tu publies, je tombe la première. l’ordre me va.'] },
        cut: { label: 'Tu as fait ça à six personnes.', decision: 'Tu as dit à VANTA qu’elle n’avait plus rien à dire.', then: ['oui.'] },
        help: { label: 'Alors aide-moi. Retarde la clôture.', decision: 'Tu as demandé son aide à VANTA, en sachant qui elle est.', then: ['je peux égarer un formulaire pendant une semaine. peut-être. c’est tout ce que j’ai jamais su faire, égarer des formulaires.'] },
      },
    },
    e4_plain: {
      m: [
        'On me dit que vous avez constitué le dossier. Je m’appelle Elin Maret. J’ai gardé l’export d’audit pendant dix-neuf mois, et je n’ai trouvé personne pour le lire.',
        'Mon relais a été sondé ce matin. Je sais comment, et je sais que vous avez le dossier. Je m’appelle Elin Maret. Il me reste très peu de choses à protéger.',
        'Deux familles n’ont jamais su comment ces personnes sont mortes. Si ceci est publié, je suis le témoin, et on me retrouvera. Si on me le remet, j’irai moi-même voir le régulateur, quand je le déciderai. Ce choix m’a déjà été retiré une fois.',
      ],
      c: {
        custody: { label: 'Envoyer le dossier à ECHO', reply: 'Il est à vous. J’envoie le dossier scellé.', decision: 'Tu as remis le dossier à Elin Maret et tu l’as laissée décider.' },
        wait: { label: 'Pas encore', reply: 'Laissez-moi encore un peu de temps.', then: ['Cela, je sais faire.'] },
      },
    },
    mt_buy: {
      m: ['Un dossier scellé ! Publier, c’est tellement définitif... donne-le-moi plutôt. Je le garde au-dessus de leurs têtes, ils financent une nouvelle vie pour deux personnes, personne ne va en prison, personne n’est retrouvé. Le monde reste exactement aussi mauvais, mais nous, on en est sortis.'],
      c: {
        sell: { label: 'Remettre le dossier à MOTH', reply: 'Prends-le. Sors-moi de là.', decision: 'Tu as vendu le dossier à MOTH comme moyen de pression.' },
        no: { label: 'Pas de marché', reply: 'Non.', then: ['L’offre vieillit mal. Comme tout, et comme la plupart des gens.'] },
      },
    },
    n5_final: {
      m: [
        'Vous avez lu un fichier qu’on ne vous avait pas demandé de lire. Je m’y attendais, tôt ou tard. Les gens de votre niveau le font.',
        'Votre situation est simple. Acceptez le prochain contrat et vous passez de notre côté du bureau : un salaire, un nouveau pseudonyme, et le numéro inscrit à cette date de clôture devient celui de quelqu’un d’autre. Sinon, je ne pourrai rien pour vous.',
        'Vous aurez remarqué que votre nom pèse, à présent. Cette balance, c’est nous qui l’avons construite. Nous la lisons très bien.',
      ],
      c: {
        seat: { label: 'Accepter le contrat', reply: 'Que dois-je signer ?', decision: 'Tu as pris la place au bureau de NULL.' },
        ghost: { label: 'Fermer ton compte et disparaître', reply: 'Fermez mon compte.', decision: 'Tu as fermé le compte et tu as disparu sans un mot.' },
        later: { label: 'Ne pas répondre tout de suite', reply: 'J’ai besoin de réfléchir.', then: ['Bien sûr. La date reste la date.'] },
        which: { label: 'Demander auquel d’entre eux tu parles', reply: 'd-7f3a, d-21c9, d-90be. Trois appareils, une seule voix, une seule histoire de 2400 bauds. Auquel d’entre vous suis-je en train de parler ?', then: ['En trois ans, personne ne m’a posé la question.', 'Cela ne change rien à votre situation. Cela améliore, je vous l’accorde, l’idée que je m’en fais.'] },
      },
    },
  },

  small: {
    NULL: {
      low: [
        'Noté. Je réponds à ce qui appelle une réponse.',
        'Tenez-vous-en à la mission, je vous prie. Ce sera plus simple pour vous.',
        'Je lis tout ce que vous envoyez. Cela ne veut pas dire que j’y réponds.',
        'Une question sur le travail, posez-la clairement. Une opinion, terminez d’abord une mission.',
        'Nous en reparlerons quand vous aurez mérité une deuxième phrase.',
      ],
      mid: [
        'Noté. Vous progressez. Je ne le répéterais à personne.',
        'C’est la première chose que vous dites aujourd’hui que j’aie lue deux fois.',
        'Posez-moi une question difficile. Je m’ennuie, et vous avez presque le niveau.',
        'Peut-être. Apportez des preuves et j’envisagerai d’avoir une opinion.',
      ],
      high: [
        'Votre réputation ne vous donne aucun droit sur mes soirées. Elle vous vaut une réponse.',
        'Vous êtes une fréquentation coûteuse, désormais. C’est rarement bon signe, pour qui que ce soit.',
        'Noté, {handle}. Vous verrez que j’use de ce nom avec parcimonie.',
        'Il y a un an, je vous aurais fait corriger. Aujourd’hui, je me contente d’être en désaccord.',
      ],
    },
    VANTA: {
      low: [
        'bon alors. tu l’as noté quelque part ou tu me le dis juste à moi ?',
        'hm. t’as vu quoi, exactement ? pas ce que tu crois que ça veut dire',
        'occupée. en voiture. une belle. les notes d’abord, les questions après',
        'pose-moi une question avec une commande dedans et je deviens beaucoup plus bavarde',
      ],
      mid: [
        'mieux. encore mignon, mais mieux',
        'bon alors tu commences à parler comme quelqu’un qui facture. t’as vu quoi, exactement ?',
        'je te répondrais bien, mais cet appel coûte cher à quelqu’un',
        'bien. maintenant écris-le. je continuerai à le dire',
      ],
      high: [
        '{handle}. regarde-toi. écris quand même',
        'bon alors cette phrase, tu pourrais la facturer. tu devrais. pas à moi par contre',
        'on me pose des questions sur toi. je dis rien, ça coûte plus cher',
        'bon. t’as le niveau. je l’ai dit une fois, c’est dans mes notes, me cite pas',
      ],
    },
    MOTH: {
      low: [
        'Quel courage, de dire cela là où c’est journalisé...',
        'Intéressant. Que me donnerais-tu pour que cela m’intéresse ?',
        'Je suis d’astreinte. Parle-moi quand quelque chose brûle, et tâche d’identifier quoi...',
        'Je me souviendrai que tu as dit cela. Je me souviens de presque tout ; c’est un problème...',
        'C’était presque un argument. Garde le « presque », il te va bien.',
      ],
      mid: [
        'Mieux. Tu as employé un nom à bon escient...',
        'J’allais te reprendre, mais il aurait fallu que je vérifie d’abord, et je t’en veux pour cela.',
        'T’ignorer commence à coûter cher...',
        'C’est presque juste, ce qui est pire que faux : cela voyage plus loin.',
      ],
      high: [
        'Je me suis mis à lire tes messages deux fois. Ne te flatte pas : je lis aussi deux fois la file d’incidents...',
        'Continue, {handle}. Il me reste si peu de gens qui méritent d’être repris.',
        'Tu n’as pas tort. Note la date.',
        'Je t’échange cela contre un fait ? Je demande rarement deux fois, et jamais gentiment...',
      ],
    },
    ROOTLESS: {
      low: [
        'je peux rien faire de ca zero - reessaie avec des mots',
        'fais gaffe a ce que tu tapes sur leur machine - tu le sais deja ou tu vas le savoir',
        'je suis pas ton pote n00b - je suis juste encore la',
        'quoi que ce soit - garde une copie',
        'tu tapes FORT pour quelqu\'un avec cette reputation 💀',
      ],
      mid: [
        'ok tu deviens relou - c\'est une promotion',
        'ouais - bienvenue dans la location',
        'je te defoncerais bien mais mon thinkpad redemarre - il redemarre tout le temps',
        'pas mal - le dis a personne - ils me croiraient pas de toute facon',
      ],
      high: [
        '{handle} t\'es connu maintenant - bravo - moi aussi j\'etais connu - regarde comment ca se passe 💀',
        'garde une copie - serieux - les gens connus ont droit aux beaux rapports',
        'non mais tu sais vraiment des trucs - c\'est degueulasse',
        'encore la - toi aussi - c\'est le seul classement qui compte',
      ],
    },
    ECHO: {
      low: [
        'Bien reçu. Je ne discute pas ici sans raison.',
        'De l’exactitude, ou le silence. Ce canal ne supporte pas les approximations.',
        'Je répondrai quand il y aura quelque chose à vérifier.',
      ],
    },
    lowlight: {
      low: [
        'personne t’a rien demandé, le nouveau pseudo',
        'Lis les règles. Ensuite, lis l’ambiance.',
        'c’est encore pour la facture ?',
        'ZERO A PARLE 💀',
      ],
      mid: [
        'ça va, détends-toi gros. une bonne semaine',
        'Garde ça pour le boulot. Les modos n’ont aucun humour. Les modos, c’est moi.',
        'je capture ça pour le classement 👀',
        'ok ca a des dents - des petites dents',
      ],
      high: [
        'ouais ouais on a tous vu le classement',
        'Noté, {handle}. Tâche de ne pas me faire regretter l’épingle.',
        '{handle} a parlé. tout le monde fait comme si de rien n’était 👀',
        'Exact, contre toute attente. Continue.',
      ],
    },
  },

  files: {
    NULL: ['Bien reçu. Les conclusions passent par le bureau, pas par ce canal.', 'Je n’avais pas demandé ce fichier. Je l’ai maintenant, bien entendu.'],
    VANTA: ['reçu. ça vient d’où, et tu l’as hashé d’abord ?', 'ok. note la source, sinon ce fichier c’est juste une rumeur'],
    MOTH: ['Oh, un cadeau... Je ne demanderai pas ce qu’il vaut. Pas encore...', 'Prudence. Les pièces jointes aussi sont des métadonnées...'],
    ROOTLESS: ['m\'envoie rien - tout est loggue', 'recu - je supprime - tu l\'as jamais envoye'],
    ECHO: ['N’envoyez pas de fichiers ici. Envoyez une empreinte, et je vous dirai si cela m’intéresse.'],
    lowlight: ['On ne poste PAS de fichiers clients ici.', 'audacieux. cher, mais audacieux'],
  },

  characters: {
    NULL: {
      tagline: 'Mises en relation sur rendez-vous.',
      joined: 'août 2023',
      bio: ['Place des missions pour un petit cabinet de vérification.', 'Paie le jour même. N’a jamais eu de retard. N’a jamais eu tort en public, à ce que chacun veut bien dire.'],
      reveals: {
        knows_lindgate_shell: { label: 'Couverture', value: 'Lindgate Advisory : cinq mois d’existence, propriété de Hollin Trust.' },
        knows_null_devices: { label: 'Sessions', value: 'Trois appareils, par roulement. NULL est un poste, pas une personne.' },
        knows_blackwell: { label: 'Travaille pour', value: 'Blackwell Holdings, Special Engagements.' },
      },
    },
    VANTA: {
      tagline: 'écris-le.',
      joined: 'août 2023',
      bio: ['Chercheuse en sécu au matériel hors de prix. Répond quand ça lui chante.', 'Se porte garante de très peu de gens, et leur envoie la facture.'],
      reveals: {
        knows_vanta_style: { label: 'Écrit comme', value: 'S. Reik, associée chez Orion Security. Les mêmes tournures, le même « bon alors ».' },
        knows_vanta_device: { label: 'Appareil', value: 'Se connecte depuis d-90be. NULL aussi.' },
      },
    },
    MOTH: {
      tagline: 'attiré par tout ce qui brûle',
      joined: 'juin 2023',
      bio: ['Sait les choses avant qu’elles arrivent. Le rappelle souvent.', 'L’un des plus anciens pseudos du réseau. Reprend les inconnus par plaisir.'],
      reveals: { knows_moth_staff: { label: 'Travaille chez', value: 'Infrastructure de Gramtele. D’astreinte, à en juger par ces horaires.' } },
    },
    ROOTLESS: {
      tagline: 'locataire precedent',
      joined: 'janv. 2024',
      bio: ['Le pseudo le plus bruyant du réseau. Sa réputation baisse depuis deux ans.', 'Banni de #lowlight quatre fois. Toujours là. Signalé « à surveiller » par personne en particulier.'],
      reveals: { knows_rootless_kessel: { label: 'Vrai nom', value: 'Jonah Kessel. Prestataire c-0031. Condamné pour l’affaire Halden Freight.' } },
    },
    ECHO: {
      tagline: '...',
      joined: 'sept. 2025',
      bio: ['Rarement en ligne, et jamais longtemps. Trois messages publics en un an, trois rétractations.', 'Envoie plus souvent des documents que des phrases.'],
      reveals: { knows_echo_elin: { label: 'Est', value: 'Elin Maret. Ancienne responsable des données chez Nexus Labs.' } },
    },
    lowlight: {
      tagline: 'groupe privé : missions payées, pas de noms',
      joined: 'mars 2024',
      bio: ['Sur invitation. Des prestataires qui comparent leurs notes, râlent sur leurs clients et font semblant de ne pas être concurrents. ostrich_farm tient le classement.'],
    },
    lowtide: {
      tagline: 'compte fermé le 22 août 2025',
      joined: 'févr. 2025',
      bio: ['Conversation archivée, récupérée sur l’image du poste.'],
    },
  },

  endings: {
    record: {
      title: 'Le dossier ouvert',
      epigraph: 'Les archives publiques appartiennent au public.',
      p: {
        read: 'Maud Ferreira a lu votre dossier le soir même, et tous les hashs concordaient. Elle a publié onze jours plus tard, les noms privés caviardés et les lignes d’audit au complet.',
        fallout: 'Nexus Labs a publié un communiqué, puis un deuxième. Le régulateur a ouvert un dossier sur NX-417. Deux familles ont reçu des lettres qui auraient dû être écrites en 2025.',
        elin_hurt: 'Elin Maret n’a rien vu de tout cela. Elle avait déjà déménagé deux fois de plus à cause de ce que vous aviez livré, et quand l’Archive lui a écrit, le relais qu’elle utilisait depuis un an est resté muet. Votre dossier a fait d’elle un témoin. Vous savez qui l’a rendue facile à trouver.',
        elin_safe: 'Un journal a révélé le nom d’Elin Maret dans le mois, contre sa volonté. Elle a témoigné quand même, d’une voix simple et exacte, puis elle est repartie quelque part au bord d’un lac.',
        vanta_helped: 'Votre formulaire de clôture a disparu pendant neuf jours, et cela a suffi. Sanna Reik a quitté Orion avant qu’on le lui demande, et a fait une déclaration qui n’épargnait personne, elle comprise.',
        vanta_not: 'Le rapport d’Orion portant votre numéro a été déposé le 5 novembre, une semaine trop tard pour qu’on y croie. Il a tout de même fallu deux avocats et presque un an pour s’en défaire.',
        coda: 'ostrich_farm a publié le classement une dernière fois avant que le canal se taise. Votre pseudo y figurait presque en haut, grisé, avec un seul commentaire, venu d’un compte qui n’avait jamais complimenté personne : « propre. »',
        after: 'Gramtele a perdu un tiers de ses pseudos en une semaine. Les autres sont restés. Cela restait le meilleur endroit pour trouver quelqu’un qui pose une bonne question.',
      },
    },
    custody: {
      title: 'La garde',
      epigraph: 'Ce choix m’a déjà été retiré une fois.',
      p: {
        sent: 'Vous avez envoyé le dossier scellé à un relais qui répondait à l’aube. Puis vous avez attendu, et vous n’avez jamais su attendre.',
        weeks: 'Elin Maret a pris sept semaines. Elle a trouvé une avocate qui n’a pas cillé, et un inspecteur du régulateur que le jour 40 de traitement inquiétait déjà. Elle y est allée un mardi, sous son propre nom, avec son export et vos hashs.',
        hurt: 'Elle n’a jamais dit qu’elle vous pardonnait ce que vous aviez livré plus tôt. Son dernier message disait seulement : « Reçu. Vérifié. » Vous avez compris que c’était tout ce qu’elle pouvait donner, et plus que ce à quoi vous aviez droit.',
        safe: 'Son dernier message tenait en une ligne de base64. Vous l’avez décodée à la main, pour le plaisir. Elle disait : merci de l’avoir laissé de côté.',
        slow: 'Cela n’a pas fait un scandale. Cela a fait une enquête lente, une licence retirée et un règlement discret. Blackwell existe toujours sous un autre nom, et vous vérifiez encore à qui appartiennent les choses.',
        vanta_helped: 'Votre formulaire de clôture a disparu, et personne n’a jamais déposé de rapport avec votre numéro. Vous ne savez pas qui remercier, et vous ne le feriez pas.',
        vanta_not: 'Un rapport avec votre numéro a bien paru. Il a fallu longtemps pour prouver qu’il était faux. Vos hashs ont aidé.',
        coda: 'Sur #lowlight, on se dispute encore sur votre sort. kelpie jure que vous avez touché un chèque. ROOTLESS soutient que vous n’avez jamais existé. Personne ne dit que vous n’aviez pas le niveau.',
      },
    },
    leverage: {
      title: 'Le moyen de pression',
      epigraph: 'Le monde reste exactement aussi mauvais, mais nous, on en est sortis.',
      p: {
        offer: 'MOTH a tenu parole. En un mois, plus de date de clôture, plus de rapport, plus de poste. Une nouvelle identité est arrivée par la poste, avec un compte en banque assez garni pour être insultant.',
        nothing: 'Personne n’est allé en prison. NX-417 est resté classé. Le Calvexin a obtenu son autorisation au printemps suivant. Vous avez lu le communiqué, puis vous avez arrêté de lire les communiqués.',
        gave: 'Vous aviez aussi donné à MOTH les habitudes d’Elin. Un matin, sans raison, vous avez regardé son relais : il n’existait plus. Vous ne saurez jamais si c’était son choix.',
        kept: 'Elin Maret a gardé sa copie de l’export d’audit. Quelque part, elle cherche encore quelqu’un qui voudra le lire. Vous pourriez lui écrire. Vous y avez pensé.',
        coda: 'Votre ancien pseudo figure toujours au classement, figé, au-dessus de gens qui travaillent encore. Vous allez le regarder plus souvent que vous ne l’avoueriez.',
        favour: 'Six mois plus tard, un message est arrivé sur un compte que personne n’aurait dû connaître. « Je le garde toujours », disait-il, avec un papillon de nuit. « Rien qu’un petit service... » Vous commencez à comprendre comment ont débuté les gens de ce bureau.',
      },
    },
    seat: {
      title: 'La place',
      epigraph: 'Vous avez posé une bonne question sur le canal ouvert.',
      p: {
        contract: 'Le contrat faisait deux pages. Le salaire était réel. On vous a remis un nouvel appareil et, le premier du mois, votre nom est entré au roulement. Vous aviez le niveau. La formation avait été bonne.',
        date: 'La date de clôture sur votre ligne a été remplacée par celle de quelqu’un d’autre. Vous n’avez pas cherché de qui.',
        note: 'C’est vous qui avez effacé le dossier personnel sur l’ancienne image du poste. Vous avez d’abord cherché les fichiers cachés. Vous avez trouvé la note, vous l’avez gardée, et vous ne savez pas pourquoi.',
        nonote: 'Quelqu’un a effacé le dossier personnel sur votre ancienne image de poste. Elle est retournée dans le lot.',
        coda: 'La réputation allait avec le poste : 940. Hier soir, sur #lowlight, vous avez mouché un nouveau pseudo pour une commande mal tapée. Tout le monde a ri. kelpie plus fort que les autres.',
        evening: 'C’est une soirée calme. Un nouveau pseudo a posé une question pointue sur le canal ouvert : pourquoi une réponse en cache survit à son enregistrement. Vous ouvrez une conversation. Vous n’êtes plus {handle}. Vous tapez comme on vous l’a appris : ponctuation correcte, sans hâte.',
        line: '« Bonsoir. Vous avez posé une bonne question. La plupart des gens ne se demandent jamais pourquoi. »',
      },
    },
    ghost: {
      title: 'Fantôme',
      epigraph: 'La réputation est la seule chose que possède un pseudo.',
      p: {
        closed: 'Vous avez fermé le compte. Vous avez effacé ce que vous pouviez, en sachant très bien ce que cela valait. Vous avez pris un bus vers un endroit que vous ne connaissiez pas et, pendant un temps, vous avez regardé chaque voiture.',
        date: 'Votre date de clôture est passée. Un rapport a paru avec votre numéro de prestataire, et il ne désignait personne, puisque personne n’avait jamais connu votre nom. L’anonymat a fini par servir à exactement une chose.',
        kept: 'Vous avez encore une archive scellée sur un disque, dans un tiroir.',
        nothing: 'Vous n’avez rien gardé, et cela vous a semblé sage sur le moment.',
        coda: 'Votre pseudo s’est éteint au sommet de sa courbe. Pendant quelques semaines, on a demandé de vos nouvelles. Puis ostrich_farm vous a retiré du classement pour faire de la place, et les autruches n’étaient pas vexées.',
        note: 'NX-417 est resté classé. Quelque part, un nouveau prestataire lit une note dans un fichier caché, écrite par quelqu’un qui est allé plus loin que vous. Vous n’en avez pas laissé. Vous y pensez plus que prévu.',
      },
    },
  },

  misc: {
    export_preview: 'Base SQLite, export de métadonnées de session. Enregistrez-la, puis ouvrez-la avec sqlite3.',
  },
};
