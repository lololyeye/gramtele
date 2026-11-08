import { b64encode } from '../../game/commands/forensic';
import { FRAGMENTS, hex, KELPIE_INVOICE, rot13 } from '../dialogue/fragments';
import type { Page, WorldText } from './format';

/**
 * Le monde simulé en français : ce que publie chaque site, les PDF et les fichiers du poste.
 *
 * Chaque organisation a sa voix : Blackwell parle en plaquette de luxe, le registre en administration, le forum
 * comme un forum, Sanna Reik tutoie ses lecteurs. Les noms propres, les liens et les chiffres sont les mêmes que
 * dans les pages anglaises, ce que vérifie le test de parité. Le reste n’a pas à suivre la phrase anglaise.
 *
 * Les missions citent certaines de ces phrases mot pour mot (src/data/missions/fr.ts) : si l’une change ici,
 * elle change là-bas aussi.
 */

const societe = (nom: string, lignes: [string, string][]): Page => ({
  title: `${nom} | Registre public`,
  body: `<h2>Registre public des sociétés</h2><h3>${nom}</h3><table>${lignes.map(([k, v]) => `<tr><th>${k}</th><td>${v}</td></tr>`).join('')}</table><p><a href="/">Nouvelle recherche</a></p>`,
});

const encode = (donnees: string) => ({ file: `${donnees}\n`, preview: donnees });

export const FR_WORLD: WorldText = {
  pages: {
    forbidden: '403 Accès interdit',
    forbidden_logged: 'Cet incident a été consigné.',

    gramtele: {
      nav: { about: 'à propos', transparency: 'transparence', standing: 'réputation' },
      home: {
        title: 'Gramtele',
        body: '<h1>Dites-le à quelqu’un. À personne d’autre.</h1><p>Gramtele est une messagerie sans noms. Ni numéro de téléphone, ni e-mail, ni carnet d’adresses. Vous choisissez un pseudonyme. La confiance des autres se gagne, ou pas.</p><p><small>État du réseau : normal. 41 208 pseudonymes en ligne.</small></p>',
      },
      about: {
        title: 'À propos de Gramtele',
        body: '<h1>À propos</h1><p>Gramtele est né en 2022 : un projet de relais tenu par des bénévoles. Depuis 2023, la Fondation Gramtele le fait vivre grâce à des subventions privées.</p><p>Notre protocole est public. Nos utilisateurs ne le sont pas, puisque nous ne savons pas qui ils sont.</p>',
      },
      transparency: {
        title: 'Transparence',
        body: '<h1>Transparence</h1><p>Nous ne gardons ni le contenu des messages, ni les journaux de connexion, ni les identifiants d’appareil, ni aucune métadonnée.</p><p>Réquisitions judiciaires satisfaites en 2025 : 0. Nous n’avons rien à remettre.</p><p><small>Financement : Fondation Gramtele. Subventions consultables au registre public.</small></p>',
      },
      standing: {
        title: 'Réputation',
        body: '<h1>Réputation</h1><p>La réputation est tout ce que possède un pseudonyme. Elle monte quand des gens qui en ont se portent garants de vous, et quand un contrat payé se termine sans accroc. Elle retombe quand ça s’arrête.</p><p>Elle ouvre les canaux privés et les contrats. Elle ne s’achète pas. Il paraît qu’elle se perd très vite.</p>',
      },
    },

    lindgate: {
      footer_home: 'Lindgate Advisory. Tous droits réservés.',
      footer: 'Lindgate Advisory.',
      home: {
        title: 'Lindgate Advisory',
        body: '<h2>L’enquête préalable en toute discrétion, depuis 2009.</h2><p>Depuis dix-sept ans, Lindgate aide conseils d’administration et investisseurs à savoir à qui ils ont affaire. Nos analystes travaillent sans bruit et disent les choses simplement.</p><p><a href="/team">Notre équipe</a> | <a href="/contact">Contact</a></p>',
      },
      team: {
        title: 'Équipe | Lindgate Advisory',
        body: '<h2>Notre équipe</h2><p>Lindgate ne publie pas le nom de ses analystes, pour leur protection comme pour la vôtre.</p>',
      },
      contact: {
        title: 'Contact | Lindgate Advisory',
        body: '<h2>Contact</h2><p>Nouvelles missions sur recommandation uniquement. Écrivez à <a href="mailto:desk@lindgate.test">desk@lindgate.test</a>.</p>',
      },
    },

    blackwell: {
      nav: { home: 'Accueil', services: 'Services', leadership: 'Direction', careers: 'Carrières' },
      footer_home: 'Blackwell Holdings. Une société du groupe Hollin.',
      footer: 'Blackwell Holdings.',
      home: {
        title: 'Blackwell Holdings',
        body: '<h1>Risque. Réputation. Résilience.</h1><p>Quand l’impensable frappe votre entreprise, tout se joue en soixante-douze heures, et pour dix ans. Blackwell se tient entre votre organisation et le récit que d’autres feraient d’elle.</p>',
      },
      services: {
        title: 'Services | Blackwell',
        body: '<h1>Services</h1><p><b>Blackwell Diligence.</b> Préparation aux crises sous contrat, veille de réputation.</p><p><b>Special Engagements.</b> Résolution sur mesure des dossiers sensibles. Sur recommandation. Aucune proposition écrite.</p><p><b>Partenaires.</b> L’attribution technique est assurée avec notre partenaire, Orion Security.</p>',
      },
      leadership: {
        title: 'Direction | Blackwell',
        body: '<h1>Direction</h1><p><b>Piet Hollander</b>, directeur, Special Engagements. Vingt ans de gestion de crise en entreprise. Convaincu que derrière chaque problème, il y a une personne.</p><p><b>Ilya Brandt</b>, directeur adjoint. Ancien de la fonction publique.</p>',
      },
      careers: {
        title: 'Carrières | Blackwell',
        body: '<h1>Carrières</h1><p>Les analystes indépendants de talent nous intéressent toujours. Nous préférons vous trouver nous-mêmes.</p>',
      },
    },

    portal: {
      title: 'Portail du personnel de Nexus',
      heading: 'Portail du personnel de Nexus Labs',
      restricted: 'Accès réservé au réseau du personnel.',
    },

    orion: {
      nav: { home: 'Accueil', about: 'À propos', blog: 'Notes de terrain', reports: 'Rapports' },
      home: {
        title: 'Orion Security',
        body: '<h1>Nous établissons ce qui s’est passé.</h1><p>Réponse aux incidents, attribution et tests d’intrusion. Nos résumés d’attribution ont étayé des poursuites dans cinq juridictions.</p>',
      },
      about: {
        title: 'À propos | Orion Security',
        body: '<h1>À propos</h1><p>Fondée en 2017 par des gens du métier. En avril 2024, Orion a accueilli de nouveaux investisseurs de long terme, grâce auxquels nous développons notre offre de DNS géré et d’hébergement en périphérie.</p><p>Associée principale : Sanna Reik. Signe la plupart des notes de terrain et, dit-on, toutes celles qui piquent.</p>',
      },
      blog: {
        title: 'Notes de terrain | Orion Security',
        body: '<h1>Notes de terrain</h1><p><a href="/blog/write-it-down">Si ce n’est pas écrit, ça n’a pas eu lieu</a></p><p><a href="/blog/logs-lie-by-omission">Les journaux mentent par omission</a></p>',
      },
      write_it_down: {
        title: 'Si ce n’est pas écrit | Orion Security',
        body: '<h1>Si ce n’est pas écrit, ça n’a pas eu lieu</h1><small>S. Reik</small><p>bon alors, ce que je répète à tous les juniors. Tu ne t’en souviendras pas. Ni de la commande, ni de l’heure, ni de la raison pour laquelle ce serveur te paraissait important. Les notes, ce n’est pas de la paperasse. Les notes, c’est l’enquête.</p><blockquote>Une conclusion que tu ne peux pas retrouver à partir de tes propres notes, c’est une rumeur.</blockquote>',
      },
      logs_lie: {
        title: 'Les journaux mentent par omission | Orion Security',
        body: '<h1>Les journaux mentent par omission</h1><small>S. Reik</small><p>Un journal ne dit que ce que quelqu’un a décidé d’enregistrer, et seulement jusqu’à ce que quelqu’un en décide autrement. Alors calcule le hash de tes preuves dès la collecte, et demande-toi ce qui manque avant de regarder ce qui est là.</p>',
      },
      reports: {
        title: 'Rapports | Orion Security',
        body: '<h1>Résumés d’attribution publics</h1><p><a href="/reports/halden-freight.pdf">Halden Freight (2024)</a></p><p><a href="/reports/brask-utilities.pdf">Brask Utilities (2025)</a></p>',
      },
    },

    nexus: {
      nav: { home: 'Accueil', about: 'À propos', news: 'Actualités', trials: 'Essais', careers: 'Carrières' },
      footer: 'Nexus Labs. Portail du personnel : <a href="http://portal.nexus-labs.test/">portal.nexus-labs.test</a>',
      moved: 'Déplacé vers portal.nexus-labs.test',
      home: {
        title: 'Nexus Labs',
        body: '<h1>De meilleures preuves, plus tôt.</h1><p>Société de recherche sous contrat, Nexus Labs conduit des essais cliniques et des diagnostics pour des partenaires sur trois continents.</p>',
      },
      about: {
        title: 'À propos | Nexus Labs',
        body: '<h1>À propos de nous</h1><p>Fondée en 2011. Dirigée par Ruth Aldana, directrice générale. Konrad Dressler est à la tête des opérations cliniques.</p>',
      },
      news: {
        title: 'Actualités | Nexus Labs',
        body: '<h1>Actualités</h1><p><a href="/news/nx417-topline.pdf">27 mars 2025. Calvexin, phase III : premiers résultats positifs</a></p><p><a href="/news/bulletin-2021-q3.pdf">Sept. 2021. Bulletin interne, T3</a></p>',
      },
      trials: {
        title: 'Essais | Nexus Labs',
        body: '<h1>Essais</h1><ul><li>NX-212, Ferotane, phase II, terminé.</li><li>NX-305, Lumidex, phase II, terminé.</li><li>NX-417, Calvexin, phase III, dossier déposé. Aucun décès lié au traitement n’a été observé.</li></ul>',
      },
      careers: {
        title: 'Carrières | Nexus Labs',
        body: '<h1>Carrières</h1><p>Nous recrutons un ou une responsable senior des données. La personne qui occupait ce poste est partie en mars 2025.</p>',
      },
    },

    trailtalk: {
      home: {
        title: 'TrailTalk',
        body: '<header>TrailTalk : le forum des marcheurs</header><main><article><a href="/t/aldric-ridge">Crête d’Aldric : carnet de la traversée complète</a> <small>par quietfern</small></article><article><a href="/t/new-place">Nouveau coin, nouveaux sentiers</a> <small>par quietfern</small></article><article><a href="/t/boots">Des chaussures qui tiennent un printemps pourri</a> <small>par hobnail_jo</small></article><article>Membres : <a href="/u/quietfern">quietfern</a>, <a href="/u/hobnail_jo">hobnail_jo</a></article></main>',
      },
      quietfern: {
        title: 'quietfern | TrailTalk',
        body: '<article><b>quietfern</b><br><small>Membre depuis 2019. 212 messages. Dernière activité : 12 avril 2026.</small><p>Marche lentement. Tient bien ses carnets. Travaillait avec des chiffres, dans une autre vie.</p><p>Messages : <a href="/t/aldric-ridge">Crête d’Aldric : carnet de la traversée complète</a> (août 2021), <a href="/t/hiatus">Je lève le pied quelque temps</a> (mars 2025), <a href="/t/new-place">Nouveau coin, nouveaux sentiers</a> (sept. 2025 à avril 2026)</p></article>',
      },
      hobnail_jo: {
        title: 'hobnail_jo | TrailTalk',
        body: '<article><b>hobnail_jo</b><br><small>Membre depuis 2016. 3 114 messages.</small><p>Avis sur les chaussures, gratuits.</p></article>',
      },
      aldric: {
        title: 'Crête d’Aldric | TrailTalk',
        body: '<article><small>quietfern, 7 août 2021</small><p>Jour 3 de la traversée. Prendre deux semaines loin du service des données, c’est la meilleure décision que j’aie prise depuis des années.</p><p><a href="/uploads/aldric_day3.jpg">aldric_day3.jpg</a></p></article>',
      },
      hiatus: {
        title: 'Je lève le pied | TrailTalk',
        body: '<article><small>quietfern, 29 mars 2025</small><p>Hier, c’était mon dernier jour au boulot. Je m’absente d’ici quelque temps. J’ai des choses à régler, et il est plus sûr de rester hors ligne. Prenez soin de vos genoux.</p></article>',
      },
      new_place: {
        title: 'Nouveau coin, nouveaux sentiers | TrailTalk',
        body: '<article><small>quietfern, 3 sept. 2025</small><p>Me revoilà. Installée dans un petit coin. Je ne dirai pas où, ça ne regarde personne. Plein de vieux chemins forestiers.</p></article><article><small>quietfern, 12 avril 2026</small><p>Premier vrai matin de printemps. Le lac au bout de la route a enfin dégelé. Photo prise du ponton, telle qu’elle sort du téléphone.</p><p><a href="/uploads/ridge_0412.jpg">ridge_0412.jpg</a></p></article><article><small>hobnail_jo, 12 avril 2026</small><p>Tu sais que les téléphones inscrivent l’endroit où tu es dans ces photos, hein ?</p></article>',
      },
      boots: {
        title: 'Chaussures | TrailTalk',
        body: '<article><small>hobnail_jo, 2 mars 2026</small><p>Du cuir ciré. Rien d’autre. Je ne prendrai pas de questions.</p></article>',
      },
    },

    folio: {
      home: {
        title: 'Folio',
        body: '<h1>Folio</h1><p>Profils professionnels. Essayez <a href="/elin.maret">/elin.maret</a>.</p>',
      },
      elin: {
        title: 'Elin Maret | Folio',
        body: '<h1>Elin Maret</h1><small>Gestion des données cliniques. Profil mis à jour en mars 2025.</small><h3>Expérience</h3><ul><li><b>Responsable senior des données, Nexus Labs</b><br><small>avril 2018 à mars 2025</small></li><li><b>Coordinatrice des données, Tessel Reagents</b><br><small>2014 à 2018</small></li></ul><h3>Centres d’intérêt</h3><p>Les pistes d’audit. Les longues marches.</p>',
      },
      sanna: {
        title: 'Sanna Reik | Folio',
        body: '<h1>Sanna Reik</h1><small>Associée principale, Orion Security</small><h3>Expérience</h3><ul><li><b>Associée principale, Orion Security</b><br><small>depuis 2017</small></li></ul><p>A formé un nombre surprenant de gens qui ne connaissent même pas son nom.</p>',
      },
    },

    gamersden: {
      home: {
        title: 'GamersDen',
        body: '<h2>GamersDen</h2><p>Trouve ton équipe. <a href="/u/quietfern">quietfern</a> est en ligne.</p>',
      },
      quietfern: {
        title: 'quietfern | GamersDen',
        body: '<b>quietfern</b> <small>inscrit en juin 2024</small><p>16 ans. tomas irl. mid lane ou rien. co apres les cours, en general de 15h00 a minuit. me pingez pas pendant les exams.</p><p><small>Région : Cordoa du Sud</small></p>',
      },
    },

    registry: {
      home: {
        title: 'Registre public des sociétés',
        body: '<h2>Registre public des sociétés</h2><p>Dépôts publics, consultables par tous.</p><ul><li><a href="/company/blackwell-holdings">Blackwell Holdings</a></li><li><a href="/company/blackwell-diligence">Blackwell Diligence</a></li><li><a href="/company/gramtele-foundation">Fondation Gramtele</a></li><li><a href="/company/hollin-trust">Hollin Trust</a></li><li><a href="/company/lindgate-advisory">Lindgate Advisory</a></li><li><a href="/company/nexus-labs">Nexus Labs</a></li><li><a href="/company/orion-security">Orion Security</a></li><li><a href="/company/open-archive">Les Archives ouvertes</a></li></ul>',
      },
      hollin: societe('Hollin Trust', [['Forme', 'Trust privé'], ['Création', '2006'], ['Agent enregistré', 'Quiet Registrar Ltd'], ['Contrôle', '<a href="/company/blackwell-holdings">Blackwell Holdings</a> ; <a href="/company/orion-security">Orion Security</a> (depuis avril 2024) ; <a href="/company/lindgate-advisory">Lindgate Advisory</a>'], ['Subventions', '<a href="/company/gramtele-foundation">Fondation Gramtele</a> (via Blackwell Holdings)']]),
      blackwell_holdings: societe('Blackwell Holdings', [['Forme', 'Société de portefeuille'], ['Création', '2009'], ['Directeur', 'Piet Hollander (Special Engagements)'], ['Propriétaire', '<a href="/company/hollin-trust">Hollin Trust</a>'], ['Filiales', '<a href="/company/blackwell-diligence">Blackwell Diligence</a>']]),
      blackwell_diligence: societe('Blackwell Diligence', [['Forme', 'Société à responsabilité limitée'], ['Création', '2015'], ['Propriétaire', '<a href="/company/blackwell-holdings">Blackwell Holdings</a>'], ['Activité', 'Conseil']]),
      lindgate: societe('Lindgate Advisory', [['Forme', 'Société à responsabilité limitée'], ['Création', 'mai 2026'], ['Propriétaire', '<a href="/company/hollin-trust">Hollin Trust</a>'], ['Dépôts', 'Aucun pour l’instant. Pas de comptes à déposer.']]),
      orion: societe('Orion Security', [['Forme', 'Société à responsabilité limitée'], ['Création', '2017'], ['Associée principale', 'Sanna Reik'], ['Propriétaire', '<a href="/company/hollin-trust">Hollin Trust</a> (rachat en avril 2024)']]),
      gramtele: societe('Fondation Gramtele', [['Forme', 'Fondation'], ['Création', '2023'], ['Revenus 2025', '450 000 en subventions'], ['Principal donateur', '<a href="/company/blackwell-holdings">Blackwell Holdings</a>']]),
      nexus: societe('Nexus Labs', [['Forme', 'Société privée'], ['Création', '2011'], ['Directrice générale', 'Ruth Aldana'], ['Dépôts notables', 'Résumé de sécurité de NX-417 mentionné dans le rapport annuel 2025']]),
      archive: societe('Les Archives ouvertes', [['Forme', 'Association à but non lucratif'], ['Création', '2008'], ['Rédactrice en chef', 'Maud Ferreira'], ['Donateurs', 'Liste publiée chaque année. Aucun donateur au-dessus de 4 %.']]),
    },

    archive: {
      nav: { home: 'Les Archives ouvertes', about: 'À propos', records: 'Documents', submit: 'Déposer' },
      home: {
        title: 'Les Archives ouvertes',
        body: '<h1>Les archives publiques appartiennent au public.</h1><p>Depuis 2008, nous conservons les documents que les institutions préféreraient perdre. Nous publions ce que nous pouvons vérifier. Jamais le reste.</p>',
      },
      about: {
        title: 'À propos | Les Archives ouvertes',
        body: '<h1>À propos</h1><p>Les Archives sont une association à but non lucratif, dirigée par Maud Ferreira. Nous vérifions les hashs, contrôlons la provenance et masquons les noms des particuliers. Nos listes de donateurs sont publiques.</p>',
      },
      records: {
        title: 'Documents | Les Archives ouvertes',
        body: '<h1>Documents</h1><p><a href="/records/halden-appeal">Halden Freight : dossier d’appel de J. Kessel (2025)</a></p><p><a href="/records/brask-note">Brask Utilities : lettre restée sans réponse de B. Oyelaran (2025)</a></p>',
      },
      halden: {
        title: 'Appel Halden | Les Archives ouvertes',
        body: '<h1>Halden Freight : dossier d’appel</h1><p>Jonah Kessel, prestataire, soutient que le poste qu’on lui attribue lui a été fourni par un employeur qu’il n’a jamais pu identifier, et qu’il a été recruté sous le pseudonyme ROOTLESS via un réseau anonyme. Le tribunal a retenu le résumé d’attribution d’Orion Security. Appel rejeté.</p>',
      },
      brask: {
        title: 'Lettre Brask | Les Archives ouvertes',
        body: '<h1>Brask Utilities : lettre</h1><p>« Je m’appelle Bram Oyelaran. Je ne me suis introduit nulle part. On m’a donné une machine et une série d’exercices, et j’ai cru que c’étaient des exercices. » Reçue par la poste, août 2025. Pas d’adresse de retour. Nous n’avons pas réussi à joindre son auteur depuis.</p>',
      },
      submit: {
        title: 'Déposer | Les Archives ouvertes',
        body: '<h1>Déposer un document</h1><p>Envoyez un dossier scellé par POST à cette adresse. Depuis un terminal :</p><pre>curl -F file=@dossier.tar http://archive.test/submit</pre><p>Nous vérifions chaque hash du manifeste avant d’en lire le premier mot.</p>',
      },
    },

    maps: {
      harrowmere: 'Harrowmere, district de Vessen. Route du ponton, lac Vessen, à 840 m du village.',
      aldric: 'Crête d’Aldric, traversée nord.',
      nowhere: 'Rase campagne. Aucun lieu-dit à proximité.',
    },
  },

  docs: {
    bulletin: {
      title: 'Bulletin interne de Nexus Labs, T3 2021',
      data_desk: 'Du côté du service des données : les nouveaux contrôles de double saisie ont repéré quarante et une erreurs de transcription ce trimestre.',
      enrolment: 'Le recrutement de NX-305 tient son calendrier. Merci aux moniteurs des sites S02 et S05.',
      corner: 'Le coin du personnel',
      walk: 'Elin Maret (Gestion des données) a parcouru toute la crête d’Aldric pendant les vacances d’été.',
      trail: 'Elle tient un carnet de route sur TrailTalk sous le nom de quietfern, si l’itinéraire et les ampoules vous intéressent.',
      editor: 'Rédaction : E. Maret. Corrections à adresser au service des données.',
    },
    press: {
      title: 'Calvexin, phase III : premiers résultats positifs',
      topline: 'Nexus Labs annonce des premiers résultats positifs pour le Calvexin (NX-417).',
      deaths: 'Aucun décès lié au traitement n’a été observé pendant l’essai.',
      submitted: 'Le résumé de sécurité a été déposé le 20 mars 2025.',
      contact: 'Contact presse : press@nexus-labs.test',
    },
    halden: {
      title: 'Incident Halden Freight : résumé d’attribution',
      client: 'Résumé d’attribution d’Orion Security. Client : Halden Freight.',
      origin: 'L’intrusion provient d’un poste de prestataire, profil gt-workbench, référence c-0031.',
      alone: 'Le prestataire a agi seul. Les conclusions ont été transmises à la police.',
      confidence: 'Niveau de confiance : élevé.',
    },
    brask: {
      title: 'Incident Brask Utilities : résumé d’attribution',
      client: 'Résumé d’attribution d’Orion Security. Client : Brask Utilities.',
      origin: 'L’intrusion provient d’un poste de prestataire, profil gt-workbench, référence c-0041.',
      alone: 'Le prestataire a agi seul. Les conclusions ont été transmises à la police.',
      confidence: 'Niveau de confiance : élevé.',
    },
  },

  files: {
    notes: 'Le bureau de Lindgate a installé ce poste. Vos notes personnelles vont ici.\n\nRègles de la maison :\n1. Travaillez uniquement dans le cadre de la mission.\n2. Rendez compte à NULL, à personne d’autre.\n3. Ce poste nous appartient. Traitez-le comme une voiture empruntée.\n',
    lowtide: 'si tu lis ça, c’est qu’ils t’ont donné ma machine.\nl’image est réutilisée. le bureau croit qu’effacer home suffit.\n\nce que je sais :\n- regarde qui paie. lindgate n’est pas ce qu’elle prétend être.\n- les exercices ne sont pas des exercices.\n- tout ce que tu tapes remonte en amont. regarde dans /var/log.\n\nils appellent les gens comme nous des numéros c. je suis c-0041.\nsi tu as un peu de jugeote, arrête-toi avant le boulot avec le portail.\nsi tu en as plus que moi, ne t’arrête pas, et garde des copies.\n\n  - lowtide\n',
    intake: 'LINDGATE ADVISORY - ACCUEIL DES PRESTATAIRES\n\nBienvenue. Ce poste est une image de formation isolée. Toutes\nles missions se déroulent ici.\n\nVos réglages de relais se trouvent dans /opt/relay/relay.conf. Lisez-les,\npuis confirmez votre référence de prestataire au bureau.\n\nDéposez vos conclusions en attente avec la commande "submit".\n',
    old_draft: 'BROUILLON - ne pas utiliser\nréférence de prestataire : c-0000 (modèle)\nrelais : a-remplacer\n',
    readme: 'Les missions arrivent dans /missions/ quand vous les acceptez.\nman COMMANDE explique tout ce que vous ne reconnaissez pas.\n',
    relay_readme: 'gt-relayd : garde les postes des prestataires connectés au bureau.\nN’arrêtez pas ce service. Voir relay.conf.\n',
    motd: 'Poste de travail de prestataire, Lindgate Advisory.\nUsage autorisé uniquement. Ce système est surveillé.\n',
    sudoers: '# ajouté pour le débogage de la rotation des journaux, à retirer avant de livrer l’image\nplayer ALL=(root) NOPASSWD: /usr/bin/cat /var/log/workbench/*\n',
    fragment_01: encode(b64encode(FRAGMENTS.fr[0])),
    fragment_02: encode(rot13(FRAGMENTS.fr[1])),
    fragment_03: encode(hex(FRAGMENTS.fr[2])),
    invoice: encode(b64encode(KELPIE_INVOICE.fr)),
  },
};
