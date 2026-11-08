import { CHARACTERS } from '../../data/characters';
import { BEATS } from '../../data/dialogue';
import { SMALLTALK_STRINGS } from '../../data/dialogue/smalltalk';
import { b64encode } from '../../game/commands/forensic';
import { Entry, zip } from '../zip';

/**
 * L'histoire en français. Écrite, pas traduite mot à mot : chaque voix garde sa marque.
 * NULL vouvoie, ponctue juste et ne se presse jamais. VANTA tutoie, chaleureuse, par fragments, « bon alors ».
 * MOTH bavarde avec des points de suspension. ROOTLESS écrit sans majuscule ni ponctuation, sauf des tirets.
 * ECHO vouvoie, en phrases exactes de quelqu'un qui rédige des protocoles.
 * Les fragments codés restent en ASCII, pour que base64, tr et xxd les décodent proprement.
 */

const hex = (s: string) => [...new TextEncoder().encode(s)].map((b) => b.toString(16).padStart(2, '0')).join('');
const rot13 = (s: string) => s.replace(/[a-z]/gi, (c) => {
  const base = c <= 'Z' ? 65 : 97;
  return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base);
});

const FRAG1 = 'sais-tu ce que tu cherchais';
const FRAG2 = 'la femme du ponton a compte trois morts que personne n a declarees';
const FRAG3 = 'si tu as l image regarde le douze mars. puis decide de quel cote sont tes mains';

const ACCEPT = { label: "Accepter la mission", reply: 'Je la prends.' };
const DECLINE = { label: 'Refuser pour l’instant', reply: 'Pas celle-ci.' };
const EXPORT_NOTE = 'Base SQLite, export de métadonnées de session. Enregistrez-la, puis ouvrez-la avec sqlite3.';

const offer = (messages: string[], decline: string, reoffer: string, reofferAccept = 'Bon. Envoyez-la.') => ({
  offer: { messages, choices: { accept: ACCEPT, decline: DECLINE } },
  reoffer: { messages: [decline, reoffer], choices: { accept: { label: 'Accepter la mission', reply: reofferAccept } } },
});

const n1 = offer(
  ['Un petit test rémunéré, si cela vous intéresse. Quarante crédits, une heure de votre soirée. Nous vous attribuons un poste de travail, et vous me montrez que vous savez vous y repérer.', 'Mission jointe.'],
  'Entendu. Les gens sont souvent occupés.',
  'Le test reste ouvert ce soir, à cinquante crédits. Je ne demande pas deux fois, d’ordinaire.',
);
const n2 = offer(
  ['Une vraie mission, si vous avez la soirée. Un client souhaite comprendre qui est une ancienne employée de l’un de ses fournisseurs. Nous ne disposons que d’un pseudonyme.', 'Sources publiques uniquement, et nous ne contactons jamais une personne visée. Quatre-vingts crédits.'],
  'C’est votre droit.',
  'Les quatre-vingts crédits sont passés à quatre-vingt-dix de mon côté, le client se fait pressant. Mêmes conditions.',
);
const n3 = offer(
  ['Votre prochaine mission est étroite. Un client veut des garanties sur des paiements à des fournisseurs, dans une base de données désaffectée. Une image vous attend.', 'Le périmètre, ce sont les factures. Cent vingt crédits.'],
  'Comme vous préférez.',
  'Je peux aller jusqu’à cent trente. C’est une soirée facile, et ce ne sont que des factures.',
);
const n4 = offer(
  ['Le client aimerait maintenant un regard extérieur sur ce même fournisseur : ce que n’importe qui peut voir de son réseau à partir d’informations publiques. Tout est simulé dans votre environnement de laboratoire.', 'Cent cinquante crédits.'],
  'Noté.',
  'Je vous la garde à cent soixante. Ensuite, il y a un travail plus important, et je voudrais vous y voir prêt.',
);
const r2 = offer(
  ['ils t ont proposé le gros boulot hein - chiffre rond - portail - c est celui-là - c est là qu ils arrêtent de payer et qu ils commencent à écrire des rapports', 'réponds pas tout de suite - lowtide l a dit dans sa note - garde des copies - j ai mis un dossier sur ta machine - le relais marche dans les deux sens si tu sais demander - moth me doit un service'],
  'ok - tu veux être sûr - tout le monde veut',
  'mais la date bouge pas parce que t as besoin d une journée',
  'Bon. Envoie.',
);

const FR_BEATS: Record<string, unknown> = {
  n0_hello: {
    messages: ['Bonsoir. Vous avez posé une bonne question tout à l’heure sur le canal ouvert : pourquoi une ancienne réponse DNS peut survivre à l’enregistrement qui l’a produite. La plupart des gens ne demandent pas pourquoi.', 'Je m’occupe de contrats pour un petit cabinet de vérification. De la paperasse, surtout. S’assurer que les sociétés sont bien ce qu’elles prétendent être.'],
    choices: {
      firm: { label: 'Quel cabinet ?', then: ['Lindgate Advisory. Libre à vous de vous renseigner. J’aurais moins d’estime pour vous si vous ne le faisiez pas.'] },
      how: { label: 'Comment m’avez-vous trouvé ?', then: ['Vous avez posé une bonne question en public. C’est généralement ainsi que cela se passe.'] },
      work: { label: 'Quel genre de travail ?', then: ['De la lecture attentive, surtout. Des registres, des documents, de la configuration. La lecture attentive n’a jamais fait de mal à personne.'] },
    },
  },
  n1_offer: n1.offer, n1_reoffer: n1.reoffer,
  lg_hello: { messages: ['NULL vous a ajouté à #lowlight.', 'nouveau pseudo. salut nouveau pseudo', 'règles : pas de noms, pas de clients, on ne demande pas combien les autres sont payés', 'tout le monde demande combien les autres sont payés'] },
  n1_done: { messages: ['Bien reçu. Quarante crédits versés. Vous avez lu la configuration active plutôt que le brouillon posé à côté. Plusieurs personnes ne l’ont pas fait.', 'Une précision d’ordre pratique. Vous tomberez sur de vieux fichiers d’un contractuel précédent sur cette image. Ils sont sans intérêt, et je les laisserais où ils sont.'] },
  ltd_archive: {
    messages: ['Conversation récupérée depuis l’image du poste de travail. Compte fermé le 22 août 2025. 11 février 2025 :', 'Bonsoir. Vous avez posé une bonne question tout à l’heure sur le canal ouvert. La plupart des gens ne demandent pas pourquoi.', 'ha merci. c’est qui', 'Je m’occupe de contrats pour un petit cabinet de vérification. De la paperasse, surtout.', '20 août 2025 :', 'il y a un rapport de police avec mon numéro de contractuel dessus', 'NULL', 'réponds-moi', 'NULL a quitté cette conversation.'],
    effects: ['Une conversation archivée de lowtide s’ouvre presque avec les mots que NULL a utilisés avec moi. Elle se termine par un rapport de police.'],
  },
  v1_request: {
    messages: ['bon alors quelqu’un sur #lowlight dit que le nouveau pseudo a lu un fichier de config avant de poser des questions dessus. rare. salut.', 'je fais de la recherche en sécu, je réponds aux questions quand ça me chante. une seule règle. écris tout.'],
    choices: {
      yes: { label: 'Accepter la demande de contact', reply: 'Salut. Écrire quoi ?', then: ['tout. la commande, l’heure, pourquoi tu l’as lancée. tu ne t’en souviendras pas. personne ne s’en souvient.'] },
      no: { label: 'Ignorer pour l’instant', reply: 'Je ne te connais pas.', then: ['bonne réponse, franchement. l’offre tient toujours.'] },
    },
  },
  n2_offer: n2.offer, n2_reoffer: n2.reoffer,
  v2_tip: { messages: ['il paraît qu’on t’a filé un boulot sur des gens. bon alors un truc. même pseudo sur deux sites, ça ne fait pas la même personne. des gens ont été détruits par cette erreur.', 'pour chaque fait, demande-toi : qui le dit, et à quoi ça ressemblerait s’il se trompait ?'] },
  m1_hello: {
    messages: ['bonjour c-0047... pardon, c’est impoli ? tu as un joli pseudo aussi, c’est juste que j’aime les numéros', 'tu lis un forum de randonnée depuis le début de la soirée. charmant passe-temps. je suis sûr que c’est un passe-temps'],
    choices: {
      how: { label: 'Comment tu sais ça ?', then: ['ton relais et mon relais sont très bons amis... redemande-moi quand tu auras quelque chose à échanger'] },
      block: { label: 'Laisse-moi tranquille.', then: ['tout le monde commence par dire ça. ce n’est rien. je suis très patient, ça fait partie du travail'] },
    },
  },
  n2_done_gave: { messages: ['Très complet, et une prime a été versée pour la localisation. Le client est satisfait. Vous n’avez plus à penser à cette personne.'] },
  n2_done_withheld: { messages: ['Bien reçu. Un nom, un emploi, et pas de localisation. Il ne vous ressemble pas de trouver si peu.', 'Peu importe. Paiement versé.'] },
  e1_fragment: {
    messages: [{ text: b64encode(FRAG1), attachment: { preview: b64encode(FRAG1), file: { data: `${b64encode(FRAG1)}\n` } } }],
    choices: {
      decoded: { label: 'Je sais, maintenant. Qui êtes-vous ?', then: ['Encoder n’est pas cacher. Vous avez réussi.'] },
      what: { label: 'Qu’est-ce que c’est censé être ?' },
    },
  },
  e1_gave: {
    messages: ['Un homme a descendu la route du ponton mardi, et il a demandé à l’épicerie où trouver une femme qui fait de la randonnée.', 'Je n’habite plus là-bas. J’avais un jardin.'],
    effects: ['ECHO a fui Harrowmere parce que quelqu’un est venu poser des questions. C’est moi qui leur ai donné le village.'],
  },
  e1_withheld: { messages: ['Un profil que je surveille a été lu de près, photo comprise. Puis personne n’est venu. Quelqu’un savait, et n’a rien dit.', 'J’aimerais savoir pourquoi. Je n’attends pas encore de réponse.'] },
  n3_offer: n3.offer, n3_reoffer: n3.reoffer,
  lg_db: { messages: ['quelqu’un d’autre a été payé pour lire une base morte cette année', 'pas de clients', 'j’ai dit quelqu’un, j’ai pas dit un client', 'vous vous souvenez d’unfurl ? toujours les boulots marrants. puis plus un message depuis février', 'les gens passent à autre chose'] },
  e2_fragment: { messages: [{ text: rot13(FRAG2), attachment: { preview: rot13(FRAG2), file: { data: `${rot13(FRAG2)}\n` } } }] },
  v3_ask: {
    messages: ['tu as l’air silencieux. les bases de données font ça. tu as trouvé quelque chose hors périmètre ? tu peux me le dire. je prends de bonnes notes, tu le sais.'],
    choices: {
      share: { label: 'Parler à VANTA des événements supprimés', reply: 'Trois événements indésirables ont été supprimés la veille d’une grosse facture. Deux étaient des décès.', decision: 'Tu as parlé à VANTA des événements indésirables supprimés.', then: ['ok. c’est du sérieux. tu as hashé l’image ? hashe l’image. et fais attention à qui d’autre tu le dis.'] },
      keep: { label: 'Le garder pour toi', reply: 'Rien qui mérite d’être signalé. Juste des factures.', decision: 'Tu n’as dit à personne ce que contenait l’archive.', then: ['mm. ok. des notes, quand même. même si elles ne sont que pour toi.'] },
    },
  },
  n3_done: {
    messages: ['Vos chiffres de factures sont parvenus au client. Merci. Paiement versé.', 'Vous n’avez pas à vous préoccuper des entrées supprimées. Elles étaient hors de votre périmètre.'],
    choices: {
      confront: { label: 'Qu’est-il arrivé à ces patients ?', decision: 'Tu as interpellé NULL au sujet des patients de NX-417.', then: ['Des patients ? Je vous ai interrogé sur des factures.', 'Votre travail reste excellent. À votre place, je ferais en sorte que cela dure.'] },
      noticed: { label: 'Je ne vous ai jamais parlé d’entrées supprimées.', reply: 'Je ne vous ai jamais parlé d’entrées supprimées.', decision: 'Tu as remarqué que NULL savait une chose que tu n’avais dite qu’à VANTA.', effects: ['NULL a mentionné les entrées supprimées. Je n’en avais parlé qu’à VANTA.'], then: ['Vous avez interrogé la table d’audit sur notre poste de travail. Nous lisons nos propres journaux.'] },
      quiet: { label: 'Ne rien dire', reply: 'Entendu.' },
    },
  },
  e3_fragment: { messages: [{ text: hex(FRAG3), attachment: { preview: hex(FRAG3), file: { data: `${hex(FRAG3)}\n` } } }] },
  n4_offer: n4.offer, n4_reoffer: n4.reoffer,
  r1_hello: {
    messages: ['tu me connais pas - personne me connaît plus c est tout l intérêt', 'c-0031 - j avais ta machine avant le type qui avait ta machine - demande-leur ce qui s est passé chez halden freight'],
    choices: {
      yes: { label: 'Que s’est-il passé chez Halden Freight ?', then: ['lis le rapport - orion-security.test/reports - mon numéro est dessus - j étais chez moi ce soir-là - le juge s en foutait'] },
      no: { label: 'Pourquoi je te ferais confiance ?', then: ['fais pas confiance - vérifie - archive.test a le dossier d appel - vérifie tout c est pour ça qu ils t ont formé - marrant non'] },
    },
  },
  m2_watch: { messages: ['tu as cherché à qui appartient ton employeur... bien. ils l’ont vu, évidemment. ton poste leur raconte tout... personne ne te l’a dit ?'] },
  n4_done: { messages: ['Une carte claire, et bien séparée des opinions. Paiement versé.', 'Le prochain travail est plus important et rapporte deux mille. Les détails suivront dès que vous aurez confirmé. Il concerne ce même portail. Prenez une journée.'] },
  r2_offer: r2.offer, r2_reoffer: r2.reoffer,
  mt_trade: {
    messages: ['alors... j’ai un petit export. des enregistrements de sessions, des identifiants d’appareils, la chose dont notre page de transparence dit qu’elle n’existe pas. ça répondrait à beaucoup de tes questions', 'et toi tu as quelqu’un qui t’envoie de l’hexa à l’aube. j’aimerais savoir sur quel relais elle est. juste ça. un échange équitable, des métadonnées contre des métadonnées'],
    choices: {
      give: { label: 'Donner à MOTH ce que tu sais sur ECHO', reply: 'Son pseudo, c’est ECHO. Elle se connecte vers l’aube. Envoie le fichier.', decision: 'Tu as échangé les habitudes de connexion d’ECHO contre l’export de MOTH.', then: [{ text: 'un plaisir... je le pense vraiment', attachment: { preview: EXPORT_NOTE } }] },
      refuse: { label: 'Refuser', reply: 'Non. Pas elle.', decision: 'Tu as refusé de livrer ECHO à MOTH.', then: ['des principes... ça coûte généralement quelque chose à quelqu’un. on en reparlera'] },
    },
  },
  r3_export: { messages: [{ text: 'moth t a demandé pour elle hein - t as dit non - bien - moth m a aussi vendu ça l an dernier pour moins que tu crois - ancien format mêmes tables - je l ai mis à jour moi-même', attachment: { preview: EXPORT_NOTE } }] },
  v4_confront: {
    messages: ['tu as lancé un group by sur la table sessions. je l’ai vu passer.', 'bon alors. oui. d-90be, c’est mon portable. je gère les recrues. j’ai appris à six personnes à prendre des notes, et puis j’ai écrit les rapports avec leurs numéros dessus.', 'je cherchais aussi une septième personne qui lirait son propre journal d’audit avant d’y être forcée. tu l’as fait. personne d’autre.'],
    choices: {
      believe: { label: 'Pourquoi je croirais un seul mot de ça ?', decision: 'Tu as exigé que VANTA se justifie.', then: ['tu ne devrais pas. vérifie. j’ai signé Halden et Brask, mon nom est sur les PDF. si tu publies, je tombe la première. l’ordre me convient.'] },
      cut: { label: 'Tu as fait ça à six personnes.', decision: 'Tu as dit à VANTA qu’elle n’avait plus rien à dire.', then: ['oui.'] },
      help: { label: 'Alors aide-moi. Retarde la clôture.', decision: 'Tu as demandé son aide à VANTA, en sachant qui elle est.', then: ['je peux égarer un formulaire pendant une semaine. peut-être. c’est tout ce que j’ai jamais su faire, égarer des formulaires.'] },
    },
  },
  e4_plain: {
    messages: ['On me dit que vous avez constitué le dossier. Je m’appelle Elin Maret. J’ai gardé l’export d’audit pendant dix-neuf mois, et je n’ai trouvé personne pour le lire.', 'Mon relais a été sondé ce matin. Je sais comment c’est arrivé, et je sais que vous avez le dossier. Je m’appelle Elin Maret. Il me reste très peu de choses à protéger.', 'Deux familles n’ont jamais su comment ces personnes sont mortes. Si ceci est publié, je suis le témoin, et on me retrouvera. Si on me le remet, j’irai moi-même voir le régulateur, quand je le déciderai. Ce choix m’a déjà été retiré une fois.'],
    choices: {
      custody: { label: 'Envoyer le dossier à ECHO', reply: 'Il est à vous. J’envoie le dossier scellé maintenant.', decision: 'Tu as remis le dossier à Elin Maret et tu l’as laissée décider.' },
      wait: { label: 'Pas encore', reply: 'Laissez-moi encore un peu de temps.', then: ['J’y suis devenue habile.'] },
    },
  },
  mt_buy: {
    messages: ['un dossier scellé ! publier, c’est tellement définitif... donne-le-moi plutôt. je le garde au-dessus de leurs têtes, ils financent une nouvelle vie pour deux personnes, personne ne va en prison, personne n’est retrouvé. le monde reste exactement aussi mauvais, mais nous, on en est sortis'],
    choices: {
      sell: { label: 'Remettre le dossier à MOTH', reply: 'Prends-le. Sors-moi de là.', decision: 'Tu as vendu le dossier à MOTH comme moyen de pression.' },
      no: { label: 'Pas d’accord', reply: 'Non.', then: ['l’offre vieillit mal, comme tout'] },
    },
  },
  n5_final: {
    messages: ['Vous avez lu un fichier qu’on ne vous avait pas demandé de lire. Je m’y attendais, tôt ou tard. Les gens de votre niveau le font.', 'Votre situation est simple. Acceptez le prochain contrat et vous passez de notre côté du bureau : un salaire, un nouveau pseudonyme, et le numéro inscrit à cette date de clôture devient celui de quelqu’un d’autre. Sinon, je ne pourrai rien pour vous.'],
    choices: {
      seat: { label: 'Accepter le contrat', reply: 'Que dois-je signer ?', decision: 'Tu as pris la place au bureau de NULL.' },
      ghost: { label: 'Fermer ton compte et disparaître', reply: 'Fermez mon compte.', decision: 'Tu as fermé le compte et tu es parti sans un mot.' },
      later: { label: 'Ne pas répondre tout de suite', reply: 'J’ai besoin de réfléchir.', then: ['Bien sûr. La date reste la date.'] },
    },
  },
};

/** Beats built by the offer() helper are named `{id}_offer` and `{id}_reoffer`, so they pair by id like the rest. */
const FR_SMALLTALK = [
  // NULL
  'Noté. Je réponds à ce qui appelle une réponse.',
  'Tenez-vous-en à la mission, je vous prie. C’est plus simple pour nous deux.',
  'Je lis tout ce que vous envoyez. Ce n’est pas la même chose que d’y répondre.',
  'Si vous avez une question sur le travail, posez-la clairement.',
  'Nous pourrons en parler une autre fois. Peut-être.',
  // VANTA
  'bon alors. tu l’as écrit quelque part ou tu me le dis juste à moi ?',
  'hm. qu’est-ce que tu as vu, exactement ? pas ce que tu crois que ça veut dire',
  'occupée là. les notes d’abord, les questions après',
  'pose-moi une question avec une commande dedans et je deviens bien plus bavarde',
  'je t’ai entendu. continue',
  // MOTH
  'ha... bien sûr. tout le monde finit par me raconter des choses...',
  'intéressant... qu’est-ce que tu me donnerais pour que ça m’intéresse ?',
  'je suis d’astreinte, l’ami... parle-moi quand quelque chose brûle...',
  'mm... je me souviendrai que tu as dit ça. je me souviens de presque tout... c’est un problème...',
  'marrant... celle-là était presque drôle...',
  // ROOTLESS
  'je peux pas faire grand-chose de ça',
  'fais gaffe à ce que tu tapes sur leur machine - tu le sais maintenant ou tu le sauras',
  'ouais - bienvenue dans la location',
  'je suis pas ton ami gamin - je suis juste encore là',
  'quoi que ce soit - garde une copie',
  // ECHO
  'Bien reçu. Je ne discute pas ici sans raison.',
  'Soyez exact, ou taisez-vous. Ce canal ne supporte pas les approximations.',
  'Je répondrai quand il y aura quelque chose à vérifier.',
  // #lowlight
  'personne t’a rien demandé, le nouveau',
  'lol ok',
  'c’est encore pour la facture ?',
  'garde ça pour le boulot, les modos n’ont aucun humour',
  'sens un peu l’ambiance',
  // files: NULL
  'Bien reçu. Les conclusions passent par le bureau, pas par ce canal.',
  'Je n’avais pas demandé ce fichier. Je l’ai maintenant, bien sûr.',
  // VANTA
  'reçu. ça vient d’où, et tu l’as hashé d’abord ?',
  'ok. note la source, sinon ce fichier n’est qu’une rumeur',
  // MOTH
  'oh, un cadeau... je ne demanderai pas ce qu’il vaut... pas encore...',
  'attention... les pièces jointes aussi sont des métadonnées...',
  // ROOTLESS
  'm envoie rien - tout est journalisé',
  'reçu - je le supprime - tu l as jamais envoyé',
  // ECHO
  'N’envoyez pas de fichiers ici. Envoyez une empreinte, et je vous dirai si cela m’intéresse.',
  // #lowlight
  'NE postez PAS de fichiers clients ici',
  'audacieux',
];

const FR_CHARACTERS: Record<string, unknown> = {
  NULL: { tagline: 'Mises en relation sur rendez-vous.', joined: 'août 2023', bio: ['S’occupe des contrats d’un petit cabinet de vérification.', 'Paie le jour même. N’a jamais eu de retard.'], reveals: [
    { label: 'Couverture', value: 'Lindgate Advisory : cinq mois d’existence, propriété de Hollin Trust.' },
    { label: 'Sessions', value: 'Trois appareils, par roulement. NULL est un poste, pas une personne.' },
    { label: 'Travaille pour', value: 'Blackwell Holdings, Special Engagements.' },
  ] },
  VANTA: { tagline: 'écris-le.', joined: 'août 2023', bio: ['Chercheuse en sécurité. Répond aux questions quand ça lui chante.', 'Se porte garante de très peu de gens.'], reveals: [
    { label: 'Écrit comme', value: 'S. Reik, associée chez Orion Security. Les mêmes tournures, le même « bon alors ».' },
    { label: 'Appareil', value: 'Se connecte depuis d-90be. NULL aussi.' },
  ] },
  MOTH: { tagline: 'attiré par tout ce qui brûle', joined: 'juin 2023', bio: ['Sait les choses avant qu’elles arrivent. Le rappelle souvent.', 'L’un des plus anciens pseudos du réseau.'], reveals: [
    { label: 'Travaille chez', value: 'Infrastructure de Gramtele. D’astreinte, à en juger par ces horaires.' },
  ] },
  ROOTLESS: { tagline: 'locataire précédent', joined: 'janv. 2024', bio: ['Sa réputation baisse depuis deux ans.', 'Signalé « à surveiller » par personne en particulier.'], reveals: [
    { label: 'Vrai nom', value: 'Jonah Kessel. Contractuel c-0031. Condamné pour l’affaire Halden Freight.' },
  ] },
  ECHO: { tagline: '...', joined: 'sept. 2025', bio: ['Rarement en ligne, et jamais longtemps.', 'Envoie plus souvent des documents que des phrases.'], reveals: [
    { label: 'Est', value: 'Elin Maret. Ancienne responsable des données chez Nexus Labs.' },
  ] },
  lowlight: { tagline: 'groupe privé : travail payé, pas de noms', joined: 'mars 2024', bio: ['Sur invitation. Des contractuels indépendants qui comparent leurs notes, se plaignent de leurs clients et font semblant de ne pas être concurrents.'] },
  lowtide: { handle: 'lowtide (fermé)', tagline: 'compte fermé le 22 août 2025', joined: 'févr. 2025', bio: ['Conversation archivée, récupérée depuis l’image du poste de travail.'] },
};

export function dialogueEntries(): Entry[] {
  const out: Entry[] = [];
  zip(BEATS, FR_BEATS, out);
  SMALLTALK_STRINGS.forEach((en, i) => out.push([en, FR_SMALLTALK[i]]));
  zip(CHARACTERS, FR_CHARACTERS, out);
  return out;
}
