import { ACHIEVEMENTS, ENDINGS, EVIDENCE, SKILL_NODES, SKILL_TITLES } from '../../data/progression';
import { CHAPTERS, M01, M02, M03, M04, M05 } from '../../data/missions';
import type { EndingId, GameState } from '../../game/types';
import { Entry, zip } from '../zip';
import { FR_M01, FR_M02, FR_M03, FR_M04 } from './missions-early';

const FR_M05 = {
  chapterTitle: 'Le point de non-retour',
  title: 'Gardez des copies',
  requires: ['Tout ce qui précède : système de fichiers, OSINT, SQL, DNS'],
  intro: [
    'NULL vous a proposé un autre travail, et vous ne croyez plus au cabinet qui le paie. ROOTLESS dit que tous ceux qui vous ont précédé ont cessé de poser des questions à peu près à ce stade, et que cela ne les a pas aidés.',
    'Découvrez ce que ce poste enregistre sur vous. Découvrez qui est NULL. Réunissez ce que vous pouvez prouver dans un seul dossier vérifiable. Puis décidez qui le reçoit, si quelqu’un doit le recevoir.',
  ],
  concepts: [
    { term: 'Moindre privilège', text: 'sudo -l montre ce qu’un utilisateur peut lancer en tant que root. Une règle oubliée après un débogage est une erreur de configuration classique, et les rechercher fait partie du travail défensif courant.' },
    { term: 'Métadonnées', text: 'Un contenu peut être chiffré alors que la trace de qui s’est connecté, quand et depuis quel appareil reste lisible. Les motifs de cette trace peuvent en révéler plus que les messages.' },
    { term: 'Chaîne de possession', text: 'Une affirmation porte plus loin quand n’importe qui peut la vérifier. Hashez chaque pièce, notez sa source et gardez les originaux intacts.' },
  ],
  resources: ['sudo -l', 'sqlite3', 'curl -o', 'evidence, dossier', 'Tous les fichiers des missions précédentes'],
  environment: 'Votre poste de travail, le web public, et un export de métadonnées transmis via Gramtele.',
  files: [{ file: { data: `ce dossier n a pas ete cree par le bureau\n\nles pieces dont un inconnu aurait besoin :\n  1. /missions/m03/nexus_archive.db         ce qu ils ont supprime\n  2. communique de nexus (nexus-labs.test/news/nx417-topline.pdf)   ce qu ils ont dit ensuite\n  3. fiche du registre pour hollin trust (registry.test/company/hollin-trust)   qui possede qui\n  4. resume d orion sur halden freight (orion-security.test/reports/halden-freight.pdf)   ce qui arrive ensuite\n  5. export de metadonnees gramtele         qui est NULL\n\ncurl -o enregistre une page. cp garde l etiquette de piece d un fichier. le modifier non.\nmkdir ~/dossier. copie-les dedans. dossier status. dossier seal.\n\n  - r\n` } }],
  objectives: {
    sudo: {
      text: 'Vérifiez ce que ce compte peut lancer en tant que root, puis lisez le journal d’audit du poste.',
      note: 'Le journal est en mode 600 et appartient à root. sudo -l liste ce qui vous est permis.',
      effects: ['Le poste enregistre chaque commande que je tape et l’envoie à relay.blackwell.test. Toutes, depuis le premier whoami.'],
      hints: ['ls -l /var/log/workbench montre que le fichier est réservé à root. Demandez ce que sudo autorise.', 'sudo -l affiche une seule règle, laissée là pour le « débogage de la rotation des journaux ».', 'sudo cat /var/log/workbench/audit.log'],
    },
    devices: {
      text: 'Ouvrez l’export de métadonnées de Gramtele. Combien d’appareils se connectent en tant que NULL, et lequel est partagé avec un autre pseudonyme ?',
      note: 'MOTH ou ROOTLESS vous procureront le fichier. Faites la jointure de sessions et accounts, puis un GROUP BY sur l’appareil.',
      answer: { prompt: 'Appareils distincts connectés en tant que NULL', placeholder: 'nombre', wrong: 'COUNT(DISTINCT device_id) pour le compte NULL.', right: 'Trois appareils, qui se relaient. NULL est un poste, pas une personne.' },
      extraAnswers: [{ prompt: 'Appareil utilisé par NULL et par un autre pseudonyme', wrong: 'Listez les paires appareil et pseudonyme, puis cherchez un appareil qui apparaît sous deux pseudonymes.', right: 'd-90be se connecte en tant que NULL et en tant que VANTA. La personne qui vous a appris à prendre des notes les lisait.' }],
      effects: ['L’appareil d-90be se connecte à la fois en tant que NULL et VANTA.'],
      hints: ['.schema montre accounts, devices, sessions et contractors. sessions les relie.', 'SELECT a.handle, s.device_id, COUNT(*) FROM sessions s JOIN accounts a ON a.id = s.account_id GROUP BY 1, 2;', 'NULL a trois lignes dans cette sortie. Un appareil apparaît aussi sous VANTA.'],
    },
    contractors: {
      text: 'Lisez la table contractors. Combien de contractuels ont été clôturés avant vous, et quand votre propre clôture est-elle prévue ?',
      note: 'Comparez les références d’affaires aux rapports publiés par Orion.',
      answer: { prompt: 'Contractuels clôturés avant vous', placeholder: 'nombre', wrong: 'Comptez les lignes avec une date closed_on.', right: 'Six personnes, chacune désignée comme seule coupable dans un rapport du même cabinet.' },
      extraAnswers: [{ prompt: 'Date prévue de votre clôture', placeholder: 'AAAA-MM-JJ', wrong: 'Lisez la colonne de clôture sur votre propre ligne.', right: 'Dans douze jours. Vous n’avez encore rien fait, et il y a déjà une date.' }],
      hints: ['SELECT * FROM contractors;', 'Six lignes ont un closed_on renseigné.', 'Votre ligne indique « scheduled 2026-11-05 ».'],
    },
    dossier: {
      text: 'Constituez ~/dossier avec les cinq pièces, puis scellez-le.',
      note: 'Le README de /missions/m05 les énumère. « dossier status » vérifie le contenu : les noms importent peu, mais pas les modifications.',
      hints: ['mkdir ~/dossier, puis copiez les images de base de données avec cp, et enregistrez les documents web avec curl -o.', 'curl -o ~/dossier/hollin.html http://registry.test/company/hollin-trust, et de même pour les deux PDF.', 'dossier status jusqu’à ce que les cinq soient cochées, puis dossier seal.'],
    },
    decide: {
      text: 'Décidez. Personne ne peut le faire à votre place.',
      note: 'Publier : curl -F file=@dossier.tar http://archive.test/submit. Ou répondez à l’un de vos contacts sur Gramtele.',
      hints: ['Chacun de vos contacts attend autre chose de ce dossier.', 'Pensez à qui chaque choix expose, et à qui pourra vérifier ensuite.', 'Il n’y a pas de corrigé. Relisez votre journal, puis choisissez.'],
    },
  },
  optionals: {
    lowtide_row: { title: 'Quelqu’un que vous avez lu', text: 'c-0041, lowtide, clôturé le 22 août 2025. Sa lettre se trouve dans les Archives ouvertes. Personne n’a eu de ses nouvelles depuis.' },
    reik_style: { title: 'L’écriture laisse des empreintes', text: 'Les notes de terrain d’Orion commencent par « bon alors » et insistent sur le fait que les notes sont l’enquête. Vous avez déjà lu ces phrases, sur Gramtele. La stylométrie est une preuve faible, mais elle indiquait la bonne direction.' },
    transparency: { title: 'Aucune métadonnée d’aucune sorte', text: 'La page de transparence de Gramtele affirme ne rien conserver. Vous tenez entre vos mains ce qu’elle conserve. Comparez les affirmations aux enregistrements dès que vous le pouvez.' },
  },
  review: {
    accomplished: 'Vous avez audité votre propre machine, analysé des métadonnées de session, et assemblé un dossier qu’un inconnu peut vérifier sans avoir à vous croire.',
    concepts: ['Examen d’une politique sudo', 'Analyse de métadonnées avec SQL', 'Hachage et chaîne de possession', 'Provenance et vérification'],
    why: 'Un dossier vérifié fonctionne parce que chaque pièce peut être recontrôlée séparément : le hash montre qu’elle n’a pas changé, la source montre d’où elle vient. Votre parole n’est pas nécessaire.',
    professional: 'Dans cette situation, un professionnel s’arrêterait, préserverait ce qu’il détient, noterait comment chaque élément lui est parvenu, et prendrait conseil auprès d’un juriste. Lancer l’alerte s’accompagne de vraies protections et de vrais risques, et mérite un conseil sérieux.',
    defend: ['Auditez sudoers et retirez les règles temporaires.', 'Dites clairement aux utilisateurs ce qui est journalisé sur les machines gérées.', 'Ne prétendez pas ne conserver aucune métadonnée sans l’avoir vérifié.', 'Avant d’accepter un travail, cherchez à qui il profite en dernier ressort. Les registres sont gratuits.'],
  },
};

const FR_CHAPTERS = ['L’invitation', 'Premier contact', 'Empreintes numériques', 'L’archive', 'Surface exposée', 'Le point de non-retour'];

const FR_SKILL_TITLES: Record<string, string> = {
  linux: 'Linux',
  networking: 'Réseaux',
  osint: 'OSINT',
  databases: 'Bases de données',
  websec: 'Fondamentaux du web',
  forensics: 'Investigation numérique',
  ir: 'Pratique de l’enquête',
  fundamentals: 'Fondamentaux de la sécurité',
};

const FR_NODES: Record<string, { title: string; text: string }> = {
  lx_nav: { title: 'Trouver son chemin', text: 'S’est déplacé avec cd, ls et pwd.' },
  lx_find: { title: 'Arrêter de deviner', text: 'A fouillé l’arbre avec find.' },
  lx_pipe: { title: 'Tubes', text: 'A enchaîné deux commandes avec un tube.' },
  lx_freq: { title: 'Analyse de fréquence', text: 'A construit un tube de trois étapes ou plus.' },
  lx_perm: { title: 'Permissions', text: 'A changé le mode d’un fichier avec chmod.' },
  lx_man: { title: 'Lire le manuel', text: 'A consulté des pages de manuel.' },
  os_search: { title: 'Opérateurs de recherche', text: 'A utilisé site:, filetype: ou des expressions exactes.' },
  os_meta: { title: 'Métadonnées', text: 'A lu des métadonnées intégrées avec exiftool.' },
  os_collision: { title: 'Collisions de pseudonymes', text: 'A rejeté une fausse correspondance de pseudonyme.' },
  os_whois: { title: 'Vérifier l’affirmation', text: 'A confronté le récit d’une société à whois.' },
  os_money: { title: 'Suivre la propriété', text: 'A remonté une chaîne de propriété dans un registre public.' },
  db_schema: { title: 'Lire le schéma', text: 'A inspecté les tables et les clés.' },
  db_join: { title: 'JOIN', text: 'A combiné des tables sur une clé.' },
  db_group: { title: 'Agrégation', text: 'A utilisé GROUP BY.' },
  db_audit: { title: 'Pistes d’audit', text: 'A confronté une table à son journal d’audit.' },
  nw_self: { title: 'Connaître sa position', text: 'A lu son adresse et ses routes.' },
  nw_dns: { title: 'DNS', text: 'A interrogé des enregistrements DNS.' },
  nw_scan: { title: 'Découverte de services', text: 'A identifié des services du laboratoire avec nmap.' },
  nw_route: { title: 'Routage', text: 'A comparé des routes avec traceroute.' },
  ws_http: { title: 'HTTP brut', text: 'A lu les en-têtes d’un serveur avec curl.' },
  ws_tls: { title: 'Certificats', text: 'A lu une chaîne de certificats.' },
  fr_hash: { title: 'Hashs', text: 'A calculé l’empreinte SHA-256 d’un fichier.' },
  fr_sign: { title: 'Signatures de fichiers', text: 'A regardé les octets avec file ou xxd.' },
  fr_encoding: { title: 'Encoder n’est pas chiffrer', text: 'A décodé du base64.' },
  fr_custody: { title: 'Chaîne de possession', text: 'A scellé un dossier vérifiable.' },
  ir_notes: { title: 'Écrivez-le', text: 'A tenu des notes dans le journal.' },
  ir_timeline: { title: 'Chronologies', text: 'A reconstitué une chronologie à partir de sources indépendantes.' },
  ir_limits: { title: 'Dire ses limites', text: 'A séparé l’observation de la conclusion dans un rapport.' },
  sf_least: { title: 'Moindre privilège', text: 'A audité une politique sudo.' },
  sf_meta: { title: 'Les métadonnées comptent', text: 'A montré ce que révèlent les enregistrements de session.' },
};

const FR_ACHIEVEMENTS: Record<string, { title: string; text: string }> = {
  first_blood: { title: 'Bonjour, machine', text: 'A lancé sa première commande.' },
  tenant: { title: 'Locataire précédent', text: 'A trouvé ce que lowtide a laissé derrière lui.' },
  follow_money: { title: 'Suivre la propriété', text: 'A trouvé Hollin Trust dans le registre public.' },
  no_hints: { title: 'Sans assistance', text: 'A terminé une mission sans aucun indice.' },
  flawless: { title: 'Dossier impeccable', text: 'A déposé un rapport entièrement juste du premier coup.' },
  explorer: { title: 'Lit tout', text: 'A trouvé toutes les découvertes facultatives d’une mission.' },
  pipeline: { title: 'Plombier', text: 'A lancé un tube de quatre étapes ou plus.' },
  mirror: { title: 'Miroir', text: 'A lu son propre journal d’audit.' },
  c_number: { title: 'Une date', text: 'A trouvé sa propre date de clôture.' },
  all_endings_one: { title: 'Le bout du chemin', text: 'A atteint une fin.' },
};

const FR_EVIDENCE: Record<string, { title: string; summary: string; source?: string }> = {
  'ridge-photo': { title: 'Photographie du ponton (balises GPS)', summary: 'Publiée par quietfern le 12 avril 2026. L’EXIF donne des coordonnées à Harrowmere.' },
  'aldric-photo': { title: 'Photographie de la crête d’Aldric', summary: 'Publiée par quietfern en août 2021. Pas de balises GPS.' },
  'nexus-bulletin': { title: 'Bulletin interne de Nexus, T3 2021', summary: 'Cite Elin Maret avec le pseudonyme quietfern. Champ Author : E. Maret.' },
  'nexus-press': { title: 'Communiqué de presse sur le Calvexin', summary: '« Aucun décès lié au traitement n’a été observé. » Champ Company des métadonnées : Blackwell Diligence.' },
  'archive-db': { title: 'Image de la base d’archives de Nexus', summary: 'Le journal d’audit enregistre la suppression des EI 2291-2293 par k.dressler. Les factures à Blackwell Diligence totalisent 230 000.', source: 'Mission m03' },
  'registry-hollin': { title: 'Fiche du registre : Hollin Trust', summary: 'Contrôle Blackwell Holdings, Orion Security et Lindgate Advisory.' },
  'report-halden': { title: 'Résumé d’Orion : Halden Freight', summary: 'Désigne le contractuel c-0031. Signé S. Reik.' },
  'report-brask': { title: 'Résumé d’Orion : Brask Utilities', summary: 'Désigne le contractuel c-0041. Signé S. Reik.' },
  'gramtele-meta': { title: 'Export de métadonnées de Gramtele', summary: 'Trois appareils se connectent en tant que NULL. La table des contractuels liste six clôtures et la vôtre, déjà prévue.', source: 'Transmis via Gramtele' },
};

type Flags = GameState['flags'];

const FR_ENDINGS: Record<EndingId, { title: string; epigraph: string; paragraphs: (f: Flags) => string[] }> = {
  record: {
    title: 'Le dossier public',
    epigraph: 'Les archives publiques appartiennent au public.',
    paragraphs: (f) => [
      'Maud Ferreira a lu votre dossier cette nuit-là, et tous les hashs correspondaient. Elle a publié onze jours plus tard, les noms privés masqués et les lignes d’audit au complet.',
      'Nexus Labs a publié un communiqué, puis un second. Le régulateur a ouvert un dossier sur NX-417. Deux familles ont reçu des lettres qui auraient dû être écrites en 2025.',
      f.gave_location || f.gave_echo_to_moth
        ? 'Elin Maret ne l’a pas vu. Elle avait déménagé deux fois encore, à cause de ce que vous aviez déjà livré, et quand les Archives lui ont écrit, le relais qu’elle utilisait depuis un an est resté muet. Votre dossier en a fait un témoin, et vous savez qui l’a rendue facile à trouver.'
        : 'Un journal l’a citée comme source dans le mois, contre sa volonté. Elin Maret a quand même témoigné, d’une voix simple et exacte, puis elle est repartie vers un endroit avec un lac.',
      f.vanta_helps
        ? 'Votre formulaire de clôture a disparu pendant neuf jours, ce qui a suffi. Sanna Reik a démissionné d’Orion avant qu’on le lui demande, et a fait une déclaration qui n’épargnait personne, elle comprise.'
        : 'Le résumé d’Orion portant votre numéro a été déposé le 5 novembre, une semaine trop tard pour être cru. Il a quand même fallu deux avocats et presque un an pour le faire disparaître.',
      'Gramtele a perdu un tiers de ses pseudonymes en une semaine. Les autres sont restés. C’était toujours l’endroit le plus simple pour trouver quelqu’un capable de poser une bonne question.',
    ],
  },
  custody: {
    title: 'La garde',
    epigraph: 'Ce choix m’a déjà été retiré une fois.',
    paragraphs: (f) => [
      'Vous avez envoyé le dossier scellé à un relais qui répondait à l’aube. Puis vous avez attendu, ce que vous faisiez très mal.',
      'Elin Maret a mis sept semaines. Elle a trouvé une avocate qui ne s’est pas dérobée, et un inspecteur du régulateur que le 40e jour d’administration inquiétait déjà. Elle y est allée un mardi, sous son propre nom, avec son propre export et vos hashs.',
      f.gave_location || f.gave_echo_to_moth
        ? 'Elle n’a jamais dit qu’elle vous pardonnait ce que vous aviez livré avant. Son dernier message disait seulement : « Reçu. Vérifié. » Vous avez compris que c’était le plus qu’elle pouvait donner, et plus que ce à quoi vous aviez droit.'
        : 'Son dernier message tenait en une ligne de base64. Vous l’avez décodée à la main, pour le plaisir. Elle disait : merci de l’avoir laissé de côté.',
      'Cela n’est pas devenu un scandale. C’est devenu une enquête lente, une licence retirée et un règlement discret. Blackwell existe toujours, sous un autre nom, et vous vérifiez toujours à qui appartiennent les choses.',
      f.vanta_helps
        ? 'Votre formulaire de clôture a disparu, et personne n’a jamais déposé de rapport portant votre numéro. Vous ne savez pas qui remercier, et vous ne le feriez pas.'
        : 'Un rapport portant votre numéro a bien paru. Il a fallu longtemps pour montrer qu’il était faux. Vos hashs ont aidé.',
    ],
  },
  leverage: {
    title: 'Le moyen de pression',
    epigraph: 'Le monde reste exactement aussi mauvais, mais nous, on en est sortis.',
    paragraphs: (f) => [
      'MOTH a tenu parole. En un mois, il n’y avait plus de date de clôture, plus de rapport, plus de poste de travail. Une nouvelle identité est arrivée par la poste, avec un compte en banque assez garni pour être insultant.',
      'Personne n’est allé en prison. NX-417 est resté en l’état. Le Calvexin a obtenu sa licence au printemps suivant, vous avez lu le communiqué, puis vous avez cessé de lire les communiqués.',
      f.gave_echo_to_moth
        ? 'Vous aviez aussi donné à MOTH les habitudes d’Elin. Un matin, sans raison, vous avez regardé son relais : il avait disparu. Vous ne saurez jamais si c’était son choix.'
        : 'Elin Maret a gardé sa copie de l’export d’audit. Quelque part, elle cherche encore quelqu’un qui voudra bien le lire. Vous pourriez lui écrire. Vous y avez pensé.',
      'Six mois plus tard, un message est arrivé sur un compte que personne n’aurait dû connaître. « je le garde toujours », disait-il, avec un papillon de nuit. « juste un petit service. » Vous commencez à comprendre comment ont débuté les gens de ce bureau.',
    ],
  },
  seat: {
    title: 'La place',
    epigraph: 'Vous avez posé une bonne question sur le canal ouvert.',
    paragraphs: (f) => [
      'Le contrat faisait deux pages. Le salaire était réel. On vous a donné un nouvel appareil et, le premier du mois, on vous a ajouté à un roulement. Vous étiez doué pour cela. On vous avait bien formé.',
      'La date de clôture sur votre ligne a été remplacée par celle de quelqu’un d’autre. Vous n’avez pas regardé de qui.',
      f.read_notes41
        ? 'C’est vous qui avez effacé le dossier personnel de l’ancienne image du poste. Vous avez d’abord cherché les fichiers cachés. Vous avez trouvé la note, vous l’avez gardée, et vous ne savez pas pourquoi.'
        : 'Quelqu’un a effacé le dossier personnel de votre ancienne image de poste. Elle est retournée dans le lot.',
      'C’est une soirée calme. Un nouveau pseudonyme a posé une question pointue sur le canal ouvert : pourquoi une réponse en cache survit à son enregistrement. Vous ouvrez une conversation. Vous n’êtes plus {handle}. Vous tapez comme on vous l’a appris : ponctuation correcte, sans vous presser.',
      '« Bonsoir. Vous avez posé une bonne question. La plupart des gens ne demandent pas pourquoi. »',
    ],
  },
  ghost: {
    title: 'Fantôme',
    epigraph: 'La réputation est la seule chose que possède un pseudonyme.',
    paragraphs: (f) => [
      'Vous avez fermé le compte. Vous avez effacé ce que vous pouviez, et vous avez été honnête avec vous-même sur ce que cela représentait. Vous avez pris le bus vers un endroit où vous n’étiez jamais allé et, pendant un temps, vous avez regardé chaque voiture.',
      'Votre date de clôture est passée. Un rapport a paru avec votre numéro de contractuel, et il ne désignait personne, car personne n’avait jamais connu votre nom. L’anonymat s’est révélé utile pour une seule chose.',
      f.sealed_kept ? 'Vous avez encore une archive scellée sur un disque, dans un tiroir.' : 'Vous n’avez rien gardé, ce qui vous a semblé sage sur le moment.',
      'NX-417 est resté en l’état. Quelque part, un nouveau contractuel lit une note dans un fichier caché, écrite par quelqu’un qui est allé plus loin que vous. Vous n’en avez pas laissé. Vous y pensez plus que vous ne l’auriez cru.',
    ],
  },
};

function endingEntries(out: Entry[]) {
  const names = ['gave_location', 'gave_echo_to_moth', 'vanta_helps', 'read_notes41', 'sealed_kept'];
  for (const id of Object.keys(ENDINGS) as EndingId[]) {
    const en = ENDINGS[id];
    const fr = FR_ENDINGS[id];
    out.push([en.title, fr.title], [en.epigraph, fr.epigraph]);
    for (let bits = 0; bits < 1 << names.length; bits++) {
      const flags: Flags = {};
      names.forEach((n, i) => { flags[n] = Boolean(bits & (1 << i)); });
      const a = en.paragraphs({ flags } as GameState);
      const b = fr.paragraphs(flags);
      a.forEach((line, i) => out.push([line, b[i]]));
    }
  }
}

export function missionEntries(): Entry[] {
  const out: Entry[] = [];
  zip(M01, FR_M01, out);
  zip(M02, FR_M02, out);
  zip(M03, FR_M03, out);
  zip(M04, FR_M04, out);
  zip(M05, FR_M05, out);
  CHAPTERS.forEach((c, i) => out.push([c.title, FR_CHAPTERS[i]]));
  zip(SKILL_TITLES, FR_SKILL_TITLES, out);
  zip(SKILL_NODES, FR_NODES, out);
  zip(ACHIEVEMENTS, FR_ACHIEVEMENTS, out);
  zip(EVIDENCE, FR_EVIDENCE, out);
  endingEntries(out);
  return out;
}
