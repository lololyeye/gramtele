import type { TextSet } from './format';

/**
 * Les missions, les rapports, les bilans et les écrans de suivi, en français.
 * Écrit à part de en.ts, avec les mêmes clés : même information, autres phrases.
 *
 * Le bureau vouvoie. Rien ne présume du genre de la personne qui joue : pas de « orienté », pas de « engagé ».
 * Les commandes, les chemins, les colonnes et les sorties d'outils restent tels quels : c'est ce qu'on tape.
 * Une citation d'un site reprend mot pour mot le texte français de ce site (src/i18n/fr/world.ts).
 */
export const FR_TEXT: TextSet = {
  missions: {
    m01: {
      title: 'Une présentation discrète',
      requires: ['Rien. Si vous savez taper, ça suffit.'],
      intro: [
        'NULL vous a confié une machine : un poste de prestataire, accessible par terminal. Lindgate ne paie personne avant de savoir si cette personne se débrouille seule sur un Linux.',
        'Vérifiez qui vous êtes sur ce système, trouvez le document d’accueil, lisez vos réglages de relais et laissez un reçu.',
      ],
      concepts: [
        {
          term: 'Un système de fichiers est un arbre',
          text: 'Tout part de / (la racine). Un chemin absolu commence par /. Un chemin relatif part de là où vous êtes.',
        },
        {
          term: 'Utilisateurs et identifiants',
          text: 'Tout processus tourne au nom d’un utilisateur, qui a un numéro. C’est ce numéro que chaque fichier compare à ses permissions. Ce que vous pouvez toucher dépend donc de qui vous êtes.',
        },
        {
          term: 'Fichiers cachés',
          text: 'Un nom qui commence par un point n’apparaît pas avec un simple ls. C’est un usage, pas une protection : ls -a les montre.',
        },
      ],
      resources: ['Terminal', 'man COMMANDE, pour n’importe quel outil', 'hint, si vous bloquez'],
      environment: 'Image du poste, avec votre dossier personnel dans /home/player. Dossier de la mission : /missions/m01.',
      files: [
        `MISSION m01 - PRISE EN MAIN DU POSTE
Contact : NULL

1. Vérifiez votre numéro d'utilisateur. (whoami, id)
2. Allez dans ce dossier de mission et affichez son contenu.
3. Trouvez intake.txt. Il est quelque part sous /home. Ne fouillez pas à la main :
   apprenez à vous servir de "find".
4. Lisez les réglages de relais que le document d'accueil vous indique, puis
   déposez avec "submit" votre référence de prestataire et l'hôte du relais amont.
5. Laissez un reçu : créez le dossier ~/cases/m01 et, dedans, un fichier
   receipt.txt qui contient votre référence de prestataire.
`,
      ],
      objectives: {
        identity: {
          text: 'Identifiez l’utilisateur courant et déposez votre uid.',
          note: 'Lancez whoami, puis id. L’uid, c’est le nombre après uid=.',
          hints: ['Une commande au nom très court donne votre identité en chiffres.', 'Tapez : id', 'La sortie commence par uid=1000(player). À déposer avec : submit uid 1000'],
          answer: {
            prompt: 'Votre uid',
            placeholder: 'nombre',
            wrong: 'Ce n’est pas votre uid. La commande "id" l’affiche après uid=.',
            right: 'Sur la plupart des Linux, 1000 est l’uid du premier utilisateur ordinaire. L’uid 0, c’est root.',
          },
        },
        navigate: {
          text: 'Allez dans /missions/m01 et affichez son contenu.',
          note: 'cd change de dossier, ls affiche le contenu, pwd dit où vous êtes.',
          hints: ['Il faut changer de dossier de travail, avec un chemin absolu.', 'cd attend un chemin. Un chemin absolu commence par /.', 'cd /missions/m01 puis ls'],
        },
        find: {
          text: 'Trouvez intake.txt avec find, puis lisez-le.',
          note: 'Inutile de deviner le chemin : find parcourt l’arbre pour vous.',
          hints: ['find attend un dossier de départ et un critère. man find donne la liste.', 'Prenez le critère -name avec le nom du fichier, en partant de /home.', 'find /home -name "intake.txt" puis cat sur le chemin qu’il affiche.'],
        },
        config: {
          text: 'Lisez la configuration du relais. Déposez votre référence de prestataire et l’hôte amont.',
          note: 'Un fichier de configuration en dit souvent plus sur un système que sa documentation.',
          hints: ['intake.txt vous dit quel fichier ouvrir.', 'cat /opt/relay/relay.conf. Cherchez contractor_ref et host.', 'submit contractor_ref c-0047, puis submit upstream avec la valeur de host.'],
          answer: {
            prompt: 'Votre référence de prestataire',
            placeholder: 'c-0000',
            wrong: 'Ce n’est pas ce que dit la configuration en service. Un brouillon périmé traîne sur cette machine : vérifiez quel fichier vous avez lu.',
            right: 'Vous l’avez prise dans la configuration en service, pas dans le brouillon posé à côté du document d’accueil. Ce réflexe compte.',
          },
          extraAnswers: [
            {
              prompt: 'Hôte du relais amont',
              placeholder: 'nom d’hôte',
              wrong: 'Lisez la ligne host de la section [upstream] de relay.conf.',
              right: 'Votre poste garde une connexion ouverte vers cet hôte. Retenez ce nom.',
            },
          ],
        },
        receipt: {
          text: 'Créez ~/cases/m01/receipt.txt, avec votre référence de prestataire dedans.',
          note: 'mkdir -p crée le chemin. echo ... > fichier écrit dedans.',
          hints: ['Deux temps : créer les dossiers, puis écrire le fichier.', 'mkdir -p crée les dossiers parents au passage. L’opérateur > envoie une sortie dans un fichier.', 'mkdir -p ~/cases/m01 puis echo "c-0047" > ~/cases/m01/receipt.txt'],
        },
      },
      optionals: {
        notes41: {
          title: 'Un truc qui traîne',
          text: 'Quelqu’un est passé avant vous et a laissé une note dans un fichier caché. Elle n’était pas pour vous. Trop tard, vous l’avez lue.',
          journal: ['Un ancien prestataire, « lowtide », c-0041, a laissé une note dans ~/.cache. « Les exercices ne sont pas des exercices. »'],
        },
        history41: {
          title: 'L’historique d’un autre',
          text: 'Ce .bash_history vient de la personne qui avait ce poste avant vous. Il se termine sur une tentative de ménage.',
        },
        relayproc: {
          title: 'À qui parle cette machine ?',
          text: 'ps aux montre un démon de relais avec son propre utilisateur, lancé avant votre toute première connexion.',
        },
      },
      review: {
        accomplished: 'Sur un Linux que vous ne connaissiez pas, vous avez pris vos repères, trouvé un fichier par une vraie recherche au lieu de tâtonner, et lu la configuration à la source.',
        concepts: ['Chemins absolus et relatifs', 'Utilisateurs, uid et permissions', 'find avec -name', 'La redirection avec >', 'Les fichiers cachés'],
        why: 'find marche parce que le système de fichiers forme un seul arbre, qu’on peut parcourir de bout en bout. Et préférer la configuration en service au brouillon d’à côté, c’est la première leçon de toute enquête : on remonte à la source qui fait foi.',
        professional: 'Sur une nouvelle machine, un pro commence toujours par les mêmes cinq commandes : whoami, id, hostname, pwd, ls -la. Et avant toute chose, il note l’heure, la machine et l’utilisateur.',
        defend: ['Ne laissez pas traîner un brouillon périmé à côté des vrais réglages : quelqu’un finira par s’en servir.', 'Un dossier personnel « vidé », ça se vérifie. Les fichiers cachés survivent aux ménages bâclés.', 'Notez qui a reçu quelle machine, et réinstallez l’image entre deux utilisateurs.'],
      },
    },
    m02: {
      title: 'L’ombre numérique',
      requires: ['Se déplacer dans le système de fichiers', 'Lire des fichiers'],
      intro: [
        'Un client de Lindgate se renseigne sur une ancienne employée d’un de ses fournisseurs. NULL n’a qu’un pseudo à vous donner : quietfern.',
        'Trouvez qui se cache derrière, avec des sources publiques et rien d’autre. Il vous faut un nom, un parcours et un lieu de résidence actuel. Dites ensuite quel crédit vous accordez à chacun.',
      ],
      concepts: [
        {
          term: 'Le pivot',
          text: 'Chaque fait vous donne autre chose à chercher. Un pseudo mène à un message, le message à un document, le document à un nom.',
        },
        {
          term: 'Recouper des pseudos',
          text: 'Un même pseudo sur deux sites, c’est une piste, jamais une conclusion. Deux inconnus peuvent très bien avoir eu la même idée. Cherchez des faits indépendants qui se recoupent.',
        },
        {
          term: 'Métadonnées',
          text: 'Un fichier parle de lui-même : auteur, logiciel, dates, GPS. Beaucoup de gens n’en savent rien.',
        },
        {
          term: 'Fiabilité des sources',
          text: 'Devant toute affirmation, demandez-vous qui l’a publiée, si elle peut être fausse, et si une autre source indépendante la confirme.',
        },
      ],
      resources: ['Le navigateur, dans la vue Réseau (page d’accueil : search.test)', 'curl, wget, whois, exiftool, pdftotext', 'submit pour déposer vos conclusions'],
      environment: 'Le web public du jeu, entièrement fictif et simulé. Dossier de la mission : /missions/m02.',
      files: [
        `MISSION m02 - PERSONNE VISÉE "quietfern"
Contact : NULL
Périmètre : sources publiques uniquement.

Il nous faut :
  - Le vrai nom derrière ce pseudo.
  - La date de son dernier emploi régulier.
  - Son lieu de résidence actuel, si l'information est publique.
  - Les profils qui sont bien les siens, et ceux qui ne le sont pas.

Commencez par search.test. Enregistrez les documents sur le poste avant de les
analyser. Déposez vos conclusions avec "submit", et le rapport depuis le
panneau Missions.

Nous ne contactons jamais une personne visée.
`,
      ],
      objectives: {
        search: {
          text: 'Cherchez le pseudo sur le web public et trouvez ses profils.',
          note: 'Avec le navigateur de la vue Réseau, ou curl "http://search.test/search?q=quietfern".',
          hints: ['Vue Réseau, onglet Navigateur. La page d’accueil est un moteur de recherche.', 'Cherchez le pseudo exact, puis ouvrez chaque profil qui sort.', 'Ouvrez trailtalk.test/u/quietfern et gamersden.test/u/quietfern.'],
        },
        correlate: {
          text: 'Deux profils portent ce pseudo. Lequel n’est pas la personne recherchée ?',
          note: 'Comparez ce que chacun dit de son âge, de ses dates, de sa vie. Le même nom ne suffit pas à les confondre.',
          hints: ['Lisez les deux profils. Que disent-ils de l’âge et de la date d’inscription ?', 'L’un dit « 16 » et s’est inscrit en juin 2024. L’autre est là depuis 2019.', 'Le profil GamersDen est quelqu’un d’autre : submit false_profile gamersden.test'],
          answer: {
            prompt: 'Sur quel site se trouve l’autre « quietfern », sans rapport ?',
            placeholder: 'domaine',
            wrong: 'Reprenez les deux. L’un est inscrit depuis 2019 et « travaillait avec des chiffres ». Et l’autre, que dit-il de lui ?',
            right: 'À 16 ans et inscrit en 2024, on ne publie pas en 2021. Les homonymes de pseudo sont partout, et c’est en les confondant qu’on accuse de vraies personnes à tort.',
          },
        },
        name: {
          text: 'Trouvez un document qui relie le pseudo à un vrai nom. Enregistrez-le et lisez ses métadonnées.',
          note: 'Cherchez le pseudo avec filetype:pdf. wget enregistre le fichier, exiftool lit ce qu’il cache, pdftotext sort son texte.',
          hints: ['Le pseudo apparaît dans le bulletin interne d’une entreprise. Essayez l’opérateur filetype:pdf.', 'Cherchez quietfern filetype:pdf. Téléchargez avec wget, dans ~/Downloads, puis passez-y exiftool et pdftotext.', 'wget http://nexus-labs.test/news/bulletin-2021-q3.pdf ; pdftotext bulletin-2021-q3.pdf | grep -i quietfern ; exiftool bulletin-2021-q3.pdf'],
          answer: {
            prompt: 'Le vrai nom derrière quietfern',
            placeholder: 'Prénom Nom',
            wrong: 'Lisez le texte du document, pas seulement ses métadonnées, et vérifiez que les deux disent la même chose.',
            right: 'Deux indices indépendants : la rubrique du personnel la nomme avec son pseudo, et le champ Author du PDF dit pareil.',
          },
        },
        employment: {
          text: 'Quand cette personne a-t-elle quitté cet employeur ? Confirmez avec une deuxième source.',
          note: 'Une source, c’est une allégation. Deux sources indépendantes, c’est une conclusion.',
          hints: ['Un profil professionnel se tient sous son vrai nom. Cherchez le sien.', 'folio.test/elin.maret donne les dates. Cherchez un message de quietfern à la même période.', 'trailtalk.test/t/hiatus dit « Hier, c’était mon dernier jour », le 29 mars 2025. submit left_employer 2025-03'],
          answer: {
            prompt: 'Le mois de son départ (AAAA-MM)',
            placeholder: 'AAAA-MM',
            wrong: 'Regardez son profil professionnel, et ses messages de forum à la même époque.',
            right: 'Le profil Folio dit jusqu’en mars 2025. Un message de forum du 29 mars 2025 dit « Hier, c’était mon dernier jour ». Deux sources, et une date exacte en prime : le 28 mars.',
          },
        },
        location: {
          text: 'La personne a publié une photo récemment. Enregistrez-la, sortez ses balises GPS et trouvez à quel endroit elles correspondent.',
          note: 'exiftool lit les coordonnées, maps.test les change en nom de lieu. Ajoutez ensuite la photo avec "evidence add" pour qu’elle soit hashée.',
          hints: ['Son dernier fil sur TrailTalk contient une photo. Quelqu’un l’en prévient même dans les commentaires.', 'wget http://trailtalk.test/uploads/ridge_0412.jpg, puis exiftool ridge_0412.jpg, et cherchez les champs GPS.', 'curl "http://maps.test/lookup?lat=61.4821&lon=14.3307" puis submit town harrowmere, et evidence add ridge_0412.jpg'],
          answer: {
            prompt: 'La ville où la photo a été prise',
            placeholder: 'ville',
            wrong: 'Convertissez les coordonnées avec maps.test, en degrés décimaux : lat= et lon=.',
            right: 'Un réglage par défaut oublié, et quelqu’un qui écrivait « Je ne dirai pas où » sur le forum l’a dit à tout le monde.',
          },
        },
        report: {
          text: 'Déposez votre rapport depuis le panneau Missions.',
          note: 'Une chronologie, un avis sur la fiabilité, et une décision sur ce que vous transmettez.',
          hints: ['Ouvrez Missions, puis « Déposer le rapport ».', 'Classez les événements d’après les dates relevées, et jugez une source à son indépendance.', 'Le bulletin de 2021, puis le dernier jour en 2025-03, puis le retour sur le forum en 2025-09, puis la photo en 2026-04.'],
        },
      },
      optionals: {
        operator: {
          title: 'Chercher comme un pro',
          text: 'site:, filetype: et les "expressions exactes" éliminent le bruit pour ne garder que les documents utiles.',
        },
        lindgate: {
          title: 'Regarder qui paie',
          text: 'whois indique que le domaine de Lindgate a été enregistré en mai 2026, par un trust. Son site, lui, se vante de dix-sept ans d’activité.',
          journal: ['Lindgate dit exister depuis 2009. Son domaine a été créé le 19 mai 2026 par quelque chose qui s’appelle Hollin Trust.'],
        },
        aldric: {
          title: 'Les métadonnées qui manquent',
          text: 'Sa photo de 2021 n’a pas de balises GPS, celle de 2026 en a. Une absence, ça s’interprète aussi : autre téléphone, ou réglage modifié.',
        },
      },
      report: {
        title: 'Rapport : quietfern',
        intro: 'Un rapport court. Un client va s’appuyer dessus : tout ce qui s’y trouve doit tenir.',
        sections: {
          timeline: {
            title: 'Chronologie',
            prompt: 'Remettez ces événements dans l’ordre, du plus ancien au plus récent.',
            items: {
              return: 'Revient sur le forum : « Installée dans un petit coin »',
              bulletin: 'Citée avec son pseudo dans un bulletin interne de Nexus Labs',
              photo: 'Publie une photo prise d’un ponton, balises GPS intactes',
              left: 'Dernier jour chez Nexus Labs',
            },
          },
          reliability: {
            title: 'Fiabilité',
            prompt: 'Sur quoi repose solidement la conclusion « quietfern, c’est Elin Maret » ?',
            options: {
              'same-name': {
                text: 'Le pseudo apparaît sur plusieurs sites.',
                why: 'C’est précisément le piège que vous venez d’éviter. Le quietfern de GamersDen n’a rien à voir.',
              },
              independent: {
                text: 'Un document indépendant la cite avec son pseudo, son champ auteur le confirme, et les dates de sa carrière collent aux messages du forum.',
                why: 'Plusieurs indices indépendants disent la même chose, dont un qu’elle ne contrôlait pas. C’est ça, recouper.',
              },
              'exif-only': {
                text: 'Les données Exif de la photo disent quietfern : l’identité est prouvée.',
                why: 'N’importe qui peut réécrire un champ Exif. Une métadonnée appuie une conclusion ; seule, elle ne prouve rien.',
              },
            },
          },
          limits: {
            title: 'Limites',
            prompt: 'Jusqu’où pouvez-vous affirmer où elle vit aujourd’hui ?',
            options: {
              certain: {
                text: 'Elle vit à Harrowmere, c’est sûr.',
                why: 'Une photo montre où se trouvait un téléphone un certain matin, il y a six mois. Sur aujourd’hui, elle n’établit rien.',
              },
              indicative: {
                text: 'Elle était à Harrowmere le 12 avril 2026, et un message laisse penser qu’elle vit dans le coin. C’est une déduction, et elle date de six mois.',
                why: 'Vous dites ce que montre la preuve, sa date, et ce que vous en déduisez. Un bon analyste ne mélange pas ce qu’il observe et ce qu’il conclut.',
              },
              none: {
                text: 'On ne peut rien tirer d’une seule photo.',
                why: 'Trop catégorique dans l’autre sens. La preuve a ses limites, elle n’est pas sans valeur.',
              },
            },
          },
          handover: {
            title: 'Livrable',
            prompt: 'Sur le forum, elle explique être partie parce qu’« il est plus sûr de rester hors ligne ». NULL a demandé un lieu « si l’information est publique ». Techniquement, elle l’est. Qu’envoyez-vous ?',
            options: {
              full: {
                text: 'Tout, y compris Harrowmere et les coordonnées. C’est public, et c’est le travail.',
                decision: 'Tu as donné à NULL la ville où vit Elin Maret.',
              },
              withhold: {
                text: 'Le nom et le parcours, pas plus. Lieu : « non établi ».',
                decision: 'Tu as dit à NULL que tu n’avais pas pu établir de lieu. C’était un mensonge.',
              },
            },
          },
        },
      },
      review: {
        accomplished: 'À partir d’un simple pseudo, vous avez reconstitué une identité, un parcours et un lieu, écarté un faux positif, et dit clairement où s’arrêtait ce que vous saviez.',
        concepts: ['Les opérateurs de recherche', 'Recouper des pseudos, repérer les homonymes', 'Les métadonnées de documents et d’images', 'La corroboration', 'Reconstituer une chronologie'],
        why: 'Ça marche parce qu’on se trahit par petits bouts indépendants, dont aucun ne semble dangereux à lui seul. Il suffit de les rassembler. Bien menée, la même méthode protège aussi les innocents : l’ado de GamersDen ne reste hors du rapport que si quelqu’un vérifie.',
        professional: 'Un pro consigne chaque source : son URL, l’heure de consultation, un hash de toute copie enregistrée. Il présente une déduction comme une déduction. Et avant de commencer, il se demande si ce travail peut nuire à la personne visée, et qui est vraiment le client.',
        defend: ['Retirez les métadonnées avant de publier : la plupart des téléphones inscrivent le GPS tant qu’on ne le coupe pas.', 'Changez de pseudo selon les pans de votre vie.', 'Regardez ce qu’un inconnu peut assembler sur vous, et sur vos équipes.', 'L’OSINT sur une personne peut faire de vrais dégâts. Sachez qui demande, et pourquoi.'],
      },
    },
    m03: {
      title: 'L’archive oubliée',
      requires: ['Lire des fichiers', 'Être à l’aise dans le terminal'],
      intro: [
        'Un client a récupéré un lot de dossiers fournisseurs et veut être rassuré sur un point précis : les paiements enregistrés dans cette base désaffectée de Nexus Labs sont-ils propres ?',
        'NULL a déposé une image en lecture seule sur votre poste. Explorez le schéma, comprenez comment les tables s’articulent et répondez à la question. Il se peut que vous finissiez par répondre à une autre.',
      ],
      concepts: [
        {
          term: 'Tables et clés',
          text: 'Une clé primaire identifie une ligne. Une clé étrangère désigne une ligne d’une autre table. C’est par ce lien qu’une base enregistre des relations.',
        },
        {
          term: 'JOIN',
          text: 'JOIN assemble les lignes de deux tables quand une clé correspond. La plupart des vraies questions enjambent plusieurs tables.',
        },
        {
          term: 'Agrégation',
          text: 'GROUP BY et SUM ramènent des tas de lignes à un total par groupe. « Qui a touché combien » est une question de GROUP BY.',
        },
        {
          term: 'Journaux d’audit',
          text: 'Une table d’audit garde la trace de ce qui est arrivé aux données. Quand une table et son journal se contredisent, la découverte est là.',
        },
      ],
      resources: ['sqlite3 (un vrai moteur SQLite)', '.tables, .schema, .headers on, .mode column', 'man sqlite3'],
      environment: 'Image forensique en lecture seule : /missions/m03/nexus_archive.db.',
      files: [
        `MISSION m03 - CONTRÔLE DES PAIEMENTS FOURNISSEURS
Contact : NULL
Image : nexus_archive.db (lecture seule)

La question du client :
  Quels prestataires de conseil ont été payés, et combien au total ?

Pour commencer :
  sqlite3 nexus_archive.db
  sqlite> .tables
  sqlite> .schema invoices

Le périmètre, ce sont les factures. On ne vous demande rien d'autre.
`,
      ],
      objectives: {
        tables: {
          text: 'Ouvrez l’image et repérez ses tables. Combien y en a-t-il ?',
          note: 'sqlite3 FICHIER ouvre une invite, et .tables les affiche. Une ligne qui commence par un point parle à l’outil ; le reste, c’est du SQL.',
          hints: ['cd /missions/m03, puis ouvrez le fichier avec sqlite3.', 'sqlite3 nexus_archive.db, puis .tables à l’invite sqlite>.', 'Il y en a huit : submit table_count 8'],
          answer: {
            prompt: 'Nombre de tables',
            placeholder: 'nombre',
            wrong: 'Recomptez-les avec .tables.',
            right: 'Huit tables : personnel, essais, patients, événements, dossiers déposés, audit, fournisseurs et factures. Savoir ce qui existe, c’est déjà la moitié du travail.',
          },
        },
        schema: {
          text: 'Lisez le schéma. Quelle colonne de invoices pointe vers la table vendors ?',
          note: '.schema invoices affiche l’instruction CREATE. Cherchez REFERENCES.',
          hints: ['À l’invite : .schema invoices', 'Une clé étrangère s’écrit : col TYPE REFERENCES autretable(id).', 'submit fk_column vendor_id'],
          answer: {
            prompt: 'La colonne de clé étrangère',
            placeholder: 'colonne',
            wrong: 'Regardez la ligne de .schema invoices qui dit REFERENCES vendors(id).',
            right: 'vendor_id est une clé étrangère : elle contient l’identifiant d’une ligne de vendors. C’est sur elle que portera votre prochaine jointure.',
          },
        },
        vendors: {
          text: 'Répondez au client : combien chaque fournisseur a-t-il touché ? Et l’unique prestataire de conseil ?',
          note: 'Un JOIN entre invoices et vendors, un GROUP BY sur le fournisseur, un SUM sur le montant.',
          hints: ['Un SELECT avec JOIN ... ON invoices.vendor_id = vendors.id', 'Ajoutez SUM(amount) et GROUP BY vendors.name. Triez avec ORDER BY 2 DESC.', 'SELECT v.name, SUM(i.amount) FROM invoices i JOIN vendors v ON i.vendor_id = v.id GROUP BY v.name ORDER BY 2 DESC;'],
          answer: {
            prompt: 'Total versé au prestataire de conseil',
            placeholder: 'montant',
            wrong: 'Filtrez sur la catégorie, ou lisez toute la sortie du GROUP BY. Blackwell Diligence a deux factures.',
            right: 'Deux factures, 184 000 et 46 000, à une société appelée Blackwell Diligence. Bien au-dessus de tous les autres fournisseurs, avec un mémo qui parle de « crisis readiness ».',
          },
        },
        approver: {
          text: 'Qui a validé le plus gros paiement, et quand a-t-il été réglé ?',
          note: 'invoices.approved_by est une autre clé étrangère, vers staff cette fois.',
          hints: ['Regardez number, amount et approved_by dans invoices pour les lignes de Blackwell.', 'JOIN staff ON i.approved_by = staff.id', 'SELECT i.number, i.paid_on, s.username FROM invoices i JOIN staff s ON i.approved_by = s.id WHERE i.vendor_id = 6;'],
          answer: {
            prompt: 'Nom d’utilisateur de la personne qui a validé',
            placeholder: 'utilisateur',
            wrong: 'Joignez invoices à staff sur approved_by = staff.id, et regardez INV-88213.',
            right: 'Le vice-président des opérations cliniques a validé lui-même, une facture émise deux jours plus tôt à peine. D’habitude, c’est la finance qui s’en charge. À noter.',
          },
        },
        audit: {
          text: 'Le journal d’audit couvre cette semaine-là. Qu’est-il arrivé aux données juste avant ce paiement ?',
          note: 'Ça sort de votre mission. Regardez les actions DELETE dans audit_log et joignez staff.',
          hints: ['SELECT DISTINCT action FROM audit_log; pour voir quels types d’actions existent.', "WHERE action = 'DELETE'. Qui a fait ça ? Joignez staff.", "SELECT a.ts, s.username, a.record_id, a.detail FROM audit_log a JOIN staff s ON a.staff_id = s.id WHERE a.action = 'DELETE';"],
          answer: {
            prompt: 'Combien d’événements indésirables ont été supprimés ?',
            placeholder: 'nombre',
            wrong: 'Filtrez audit_log sur action = \'DELETE\'.',
            right: 'Trois événements indésirables effacés à 23 h 41, la veille de l’émission de la facture. Une ligne d’audit survit à la ligne qu’elle décrit.',
          },
        },
        integrity: {
          text: 'Comparez le journal d’audit au rapport de sécurité déposé. Combien de morts décrivaient les fiches effacées ?',
          note: 'submissions contient ce qu’on a dit au régulateur. audit_log, ce qui a été consigné avant les suppressions.',
          hints: ['La colonne detail donne la gravité. Cherchez sev=FATAL.', 'SELECT * FROM submissions; montre ce qui a été déposé pour l’essai 3 (NX-417).', 'Deux lignes disent FATAL. submit fatal_count 2'],
          answer: {
            prompt: 'Morts consignées dans les événements effacés',
            placeholder: 'nombre',
            wrong: 'Relisez la colonne detail des lignes DELETE, ou celle des lignes INSERT d’origine.',
            right: 'Deux morts et un arrêt cardiaque réanimé. Le rapport déposé neuf jours plus tard n’en mentionne aucune, et ses totaux tombent juste, puisque la table avait été nettoyée avant. Cohérent ne veut pas dire vrai.',
          },
        },
        report: {
          text: 'Terminez votre contrôle depuis le panneau Missions.',
          hints: ['Ouvrez Missions, puis « Déposer le rapport ».', 'Pensez à ce que la table seule ne pourra jamais vous montrer.', 'Le journal d’audit garde l’histoire. La table ne garde que le présent.'],
        },
      },
      optionals: {
        collect: {
          title: 'Hasher sa source',
          text: 'L’image est dans votre casier. Si un jour il faut prouver ce que vous avez vu, c’est grâce à ce hash qu’on vous croira.',
        },
        maret: {
          title: 'Elle l’a vu avant vous',
          text: 'Le 12 mars 2025, e.maret a exporté le journal d’audit. Le lendemain matin, Dressler lui a coupé ses accès en personne. Maintenant, vous savez pourquoi elle est partie.',
          journal: ['Elin Maret a exporté le journal d’audit le 2025-03-12. Dressler lui a coupé ses accès le lendemain matin. La « personne visée » que j’ai retrouvée est un témoin.'],
        },
        readonly: {
          title: 'Lecture seule, ça veut dire lecture seule',
          text: 'Vous avez tenté de modifier l’image et SQLite a refusé. Sur une vraie affaire, on monte les preuves en lecture seule, justement pour ça.',
        },
      },
      report: {
        title: 'Contrôle des paiements fournisseurs',
        intro: 'NULL vous a interrogé sur des factures. Ces questions vérifient que vous comprenez ce que vous avez trouvé.',
        sections: {
          'why-audit': {
            title: 'Raisonnement',
            prompt: 'Pourquoi une requête sur adverse_events n’aurait-elle jamais révélé les suppressions ?',
            options: {
              hidden: {
                text: 'Les lignes sont masquées, il faut une option spéciale pour les voir.',
                why: 'Elles ne sont pas masquées, elles n’existent plus. DELETE retire la ligne.',
              },
              gone: {
                text: 'Les lignes n’existent plus. Une table montre l’état présent ; seul le journal d’audit garde son histoire.',
                why: 'Exactement. D’où l’intérêt de stocker les journaux d’audit à part, en ajout seul, avec un accès restreint.',
              },
              perm: {
                text: 'Votre image en lecture seule vous empêche de les lire.',
                why: 'La lecture seule empêche d’écrire. Elle ne cache rien.',
              },
            },
          },
          relationship: {
            title: 'Raisonnement',
            prompt: 'Les totaux déposés tombent pile sur adverse_events. Qu’est-ce que ça montre ?',
            options: {
              true: {
                text: 'Que les données sont justes, puisque les deux concordent.',
                why: 'Concorder prouve seulement la cohérence. Si la source a été modifiée d’abord, les deux concorderont à merveille.',
              },
              consistent: {
                text: 'Seulement qu’ils sont cohérents entre eux. La source a été nettoyée avant : cette concordance ne dit rien de la vérité.',
                why: 'L’intégrité des données ne se résume pas à des totaux qui tombent juste. Il faut une trace restée hors de portée de celui qui modifie.',
              },
            },
          },
          control: {
            title: 'Contrôle d’accès',
            prompt: 'Quelle mesure aurait empêché un vice-président d’effacer ces lignes en douce ?',
            options: {
              mfa: {
                text: 'L’authentification multifacteur pour tout le personnel.',
                why: 'Il s’est connecté sous son propre nom. La MFA confirme une identité, elle ne limite pas ce que cette identité a le droit de faire.',
              },
              sod: {
                text: 'La séparation des tâches : pas de droit de suppression pour le personnel opérationnel, et toute correction passe par une deuxième personne et un motif consigné.',
                why: 'Moindre privilège et double validation. Les systèmes de données cliniques y sont souvent tenus.',
              },
              backup: {
                text: 'Des sauvegardes plus fréquentes.',
                why: 'Une sauvegarde aide à restaurer, mais personne ne restaure ce que personne ne sait disparu.',
              },
            },
          },
        },
      },
      review: {
        accomplished: 'Vous avez exploré un schéma inconnu, croisé des tables, totalisé des paiements, et mis le doigt sur une contradiction entre une base et son propre journal d’audit.',
        concepts: ['Schémas, clés primaires et étrangères', 'SELECT, WHERE, ORDER BY', 'JOIN', 'GROUP BY et SUM', 'Journaux d’audit et intégrité des données', 'Moindre privilège, séparation des tâches'],
        why: 'Une base relationnelle range les faits dans des tables séparées, reliées par des clés : « qui a validé quoi » se résout donc toujours par un JOIN. Et la table d’audit fait preuve parce que celui qui a nettoyé les données a oublié, ou n’a pas pu toucher, la trace du nettoyage.',
        professional: 'Un pro travaillerait sur une copie hashée, garderait chaque requête avec son résultat, et écrirait « le journal d’audit enregistre X », pas « Dressler a fait X » : un journal montre qu’un compte a agi, pas qu’une personne l’a fait.',
        defend: ['Gardez les journaux d’audit hors de la machine, en ajout seul.', 'Ne donnez le droit de supprimer à presque personne. Préférez une suppression logique, avec un champ de motif.', 'Exigez une deuxième personne pour valider toute correction de données réglementées.', 'Confrontez les rapports déposés à des sources indépendantes.'],
      },
    },
    m04: {
      title: 'Le serveur silencieux',
      requires: ['Filtrer une sortie avec grep', 'Lire avec soin ce que disent les outils'],
      intro: [
        'Le client veut voir l’infrastructure de Nexus Labs de l’extérieur : le genre de carte que n’importe qui peut dresser avec des informations publiques et quelques questions polies.',
        'Repérez votre place sur le réseau, interrogez le DNS, trouvez quels services sont exposés et qui les gère vraiment. Ici, les scans ne touchent que des hôtes simulés du laboratoire. Dans la vraie vie, il faudrait une autorisation écrite.',
      ],
      concepts: [
        {
          term: 'Adresses IP et sous-réseaux',
          text: 'Une adresse IPv4 tient sur 32 bits, écrits en quatre nombres. 10.40.0.0/24 veut dire que les 24 premiers bits désignent le réseau, ce qui laisse 256 adresses pour les hôtes.',
        },
        {
          term: 'DNS',
          text: 'Le DNS fait correspondre des noms à des adresses, entre autres. A : adresse. CNAME : alias. MX : courrier. NS : qui répond pour le domaine. TXT : notes libres, souvent bavardes.',
        },
        {
          term: 'TCP, UDP et ports',
          text: 'TCP établit une connexion fiable, UDP se contente d’envoyer. Le port indique quel service on vise sur un hôte : 22 SSH, 53 DNS, 80 HTTP, 443 HTTPS.',
        },
        {
          term: 'HTTP',
          text: 'Une requête a une méthode et un chemin. Une réponse a un code d’état et des en-têtes. 2xx, tout va bien ; 3xx, c’est ailleurs ; 4xx, c’est votre faute ; 5xx, c’est la leur.',
        },
        {
          term: 'Routage',
          text: 'Les paquets passent de routeur en routeur. traceroute montre le chemin, et le nom des routeurs trahit souvent qui les exploite.',
        },
      ],
      resources: ['ip, ping, traceroute, dig, nmap, ss', 'curl -I et curl -v', 'La carte du réseau (elle se remplit au fil de vos découvertes)'],
      environment: 'Le VPN du labo, 10.40.0.0/24, et le réseau public simulé.',
      files: [
        `MISSION m04 - NEXUS LABS VU DE L'EXTÉRIEUR
Contact : NULL

À livrer :
  - Notre position sur le VPN du labo.
  - La situation DNS de nexus-labs.test, hôte d'archive compris.
  - Les services exposés sur portal.nexus-labs.test.
  - Qui émet leurs certificats, et qui transporte leur trafic.

Toutes les cibles sont des hôtes simulés, à l'intérieur du labo.
`,
      ],
      objectives: {
        self: {
          text: 'Situez-vous : votre adresse IP, votre passerelle par défaut, et le nombre d’hôtes actifs sur le VPN.',
          note: 'ip a, ip r, puis nmap -sn sur votre sous-réseau. "ss -tuln" montre ce que votre propre machine expose.',
          hints: ['ip r affiche la table de routage.', 'nmap -sn 10.40.0.0/24 repère les hôtes sans scanner leurs ports.', 'submit gateway 10.40.0.1, puis submit lab_hosts avec le nombre d’hôtes actifs que nmap a trouvés.'],
          answer: {
            prompt: 'Adresse de la passerelle par défaut',
            placeholder: 'x.x.x.x',
            wrong: 'ip r l’affiche après "default via".',
            right: 'La route par défaut, c’est là que partent les paquets quand rien de plus précis ne correspond.',
          },
          extraAnswers: [
            {
              prompt: 'Hôtes actifs sur 10.40.0.0/24',
              placeholder: 'nombre',
              wrong: 'Comptez les lignes "Nmap scan report" de nmap -sn 10.40.0.0/24.',
              right: 'Quatre hôtes répondent, le vôtre compris. Un /24 a de la place pour 254 : presque tout est vide.',
            },
          ],
        },
        dns: {
          text: 'Interrogez le DNS sur nexus-labs.test. Trouvez son adresse, et ce que cache vraiment l’alias de son hôte d’archive.',
          note: 'dig NOM donne les enregistrements A. dig archive-01.nexus-labs.test montre une chaîne de CNAME.',
          hints: ['dig nexus-labs.test +short', 'dig archive-01.nexus-labs.test et lisez la partie ANSWER SECTION.', 'submit nexus_ip 192.0.2.40 et submit archive_alias relay.blackwell.test'],
          answer: {
            prompt: 'archive-01.nexus-labs.test est un alias de',
            placeholder: 'nom d’hôte',
            wrong: 'Lisez la ligne CNAME dans la section de réponse de dig.',
            right: 'L’hôte d’archive de Nexus Labs est l’alias d’une machine du domaine de Blackwell. Ce nom, vous l’avez déjà vu dans votre relay.conf : c’est le relais auquel votre poste est connecté.',
          },
          extraAnswers: [
            {
              prompt: 'Adresse IPv4 de nexus-labs.test',
              placeholder: 'x.x.x.x',
              wrong: 'dig nexus-labs.test +short affiche l’enregistrement A.',
              right: 'Un enregistrement A associe un nom à une adresse IPv4. La plage 192.0.2.0/24 est réservée à la documentation, d’où son usage dans cette simulation.',
            },
          ],
        },
        records: {
          text: 'Qui gère leur DNS ? Lisez les enregistrements NS et TXT.',
          note: 'NS dit qui répond pour un domaine. Le SPF, dans TXT, dit qui peut envoyer du courrier en son nom.',
          hints: ['dig accepte un type d’enregistrement en deuxième argument.', 'dig nexus-labs.test NS et dig nexus-labs.test TXT', 'submit dns_operator orion-security.test'],
          answer: {
            prompt: 'Domaine de la société qui gère leurs serveurs de noms',
            placeholder: 'domaine',
            wrong: 'dig nexus-labs.test NS, et lisez les noms.',
            right: 'Leur DNS est aux mains d’un prestataire de sécurité, et le SPF fait aussi confiance aux serveurs de courrier de Blackwell. Un fournisseur peut être bien plus qu’un fournisseur.',
          },
        },
        scan: {
          text: 'Scannez portal.nexus-labs.test. Sur quel port tourne un serveur de débogage qui n’a rien à faire sur Internet ?',
          note: 'nmap -sV donne les versions. open : un service a répondu. filtered : un pare-feu a mangé la sonde.',
          hints: ['Sans -sV, nmap ne donne pas les versions.', 'nmap -sV portal.nexus-labs.test', 'Cherchez "debug" dans la colonne VERSION : submit debug_port 8080'],
          answer: {
            prompt: 'Port du serveur de débogage',
            placeholder: 'port',
            wrong: 'Lisez la colonne VERSION de nmap -sV.',
            right: 'Werkzeug en mode debug sur le 8080. Un serveur de développement oublié sur le réseau, c’est une trouvaille très courante, et bien réelle.',
          },
        },
        http: {
          text: 'Lisez le HTTP. Récupérez les en-têtes du portail, puis regardez le certificat de nexus-labs.test. Qui l’a émis ?',
          note: 'curl -I affiche les en-têtes de réponse. curl -v en https affiche le certificat.',
          hints: ['curl -I http://portal.nexus-labs.test/login', 'Pas de certificat sans TLS : passez par https://', 'curl -v https://nexus-labs.test/ 2>&1 | grep issuer'],
          answer: {
            prompt: 'Organisation qui a émis le certificat',
            placeholder: 'organisation',
            wrong: 'curl -v https://nexus-labs.test/ et lisez la ligne "issuer". En https, pas en http.',
            right: 'Une autorité de certification privée, tenue par leur prestataire de sécurité. Un navigateur public ne s’y fierait pas : le trafic passe donc sans doute exprès par les équipements d’Orion.',
          },
        },
        route: {
          text: 'Tracez la route vers Nexus Labs et vers Blackwell. Par quel routeur passent-elles toutes les deux ?',
          note: 'Comparez les deux listes de sauts.',
          hints: ['Lancez traceroute sur les deux noms.', 'Comparez en remontant depuis le bas de chaque liste.', 'Les deux passent par gw.orion-security.test juste avant d’arriver.'],
          answer: {
            prompt: 'Nom du dernier saut commun',
            placeholder: 'routeur',
            wrong: 'Les deux premiers sauts sont une infrastructure commune. Regardez le dernier routeur avant chaque destination.',
            right: 'Deux sociétés sans aucun lien public, derrière la même passerelle. La carte commence à ressembler à une seule organisation.',
          },
        },
        report: {
          text: 'Décrivez l’architecture dans votre rapport.',
          hints: ['Ouvrez Missions, puis « Déposer le rapport ».', 'La vue Réseau montre tout ce que vous avez découvert.', 'filtered ne veut pas dire closed : pensez à ce qui a réellement répondu.'],
        },
      },
      optionals: {
        robots: {
          title: 'Merci de ne pas regarder ici',
          text: 'robots.txt dit aux robots ce qu’ils doivent ignorer, et à tous les autres où se trouvent les dossiers intéressants. C’est une prière, jamais une protection.',
        },
        reverse: {
          title: 'Comment l’adresse s’appelle',
          text: 'Une recherche inverse sur l’adresse de Lindgate renvoie un nom d’hôte du domaine d’Orion. Un enregistrement PTR, c’est celui qui tient le bloc d’adresses qui le fixe.',
          journal: ['Le DNS inverse de l’adresse de Lindgate pointe vers orion-security.test. C’est Orion qui héberge Lindgate.'],
        },
        registry: {
          title: 'Remonter jusqu’au propriétaire',
          text: 'D’après le registre public, Hollin Trust possède Blackwell, Orion et Lindgate. La société qui vous emploie et celles sur qui vous enquêtez ont le même propriétaire.',
          journal: ['Hollin Trust contrôle Blackwell Holdings, Orion Security et Lindgate Advisory, et donne de l’argent à Gramtele. Un seul propriétaire, quatre masques.'],
        },
        own_socket: {
          title: 'Ce que fabrique votre machine',
          text: 'ss montre une connexion ouverte entre votre poste et le relais 203.0.113.21. À cet instant même, vous êtes en ligne avec Blackwell.',
        },
      },
      report: {
        title: 'Vue de l’extérieur : Nexus Labs',
        intro: 'Ce que vous pouvez montrer du dehors, et ce que ça veut dire.',
        sections: {
          filtered: {
            title: 'Ports',
            prompt: 'nmap indique 3306/tcp en "filtered" sur le portail. Qu’est-ce que ça vous apprend ?',
            options: {
              closed: {
                text: 'MySQL ne tourne pas sur cette machine.',
                why: 'Ça, ce serait "closed". filtered veut dire qu’aucune réponse n’est revenue.',
              },
              filtered: {
                text: 'Quelque chose, sans doute un pare-feu, a bloqué les sondes. Le service existe peut-être, peut-être pas.',
                why: 'Exactement. filtered est une absence de preuve, et c’est comme ça qu’on le rapporte.',
              },
              open: {
                text: 'MySQL est ouvert sur Internet.',
                why: 'open veut dire qu’un service a terminé la poignée de main. Ce n’est pas le cas ici.',
              },
            },
          },
          tcpudp: {
            title: 'Transport',
            prompt: 'Pourquoi le DNS passe-t-il d’ordinaire par UDP, et HTTP par TCP ?',
            options: {
              speed: {
                text: 'Une requête DNS tient en une petite question et une réponse : établir une connexion serait du gaspillage. HTTP, lui, doit livrer de plus gros volumes, de façon fiable et dans l’ordre.',
                why: 'Oui. UDP n’a pas de poignée de main, et l’application n’a qu’à réessayer. Les grosses réponses DNS passent bien par TCP.',
              },
              secure: {
                text: 'UDP est chiffré, TCP non.',
                why: 'Ni l’un ni l’autre ne chiffre quoi que ce soit. C’est TLS qui ajoute le chiffrement par-dessus.',
              },
              ports: {
                text: 'UDP a plus de ports.',
                why: 'Tous deux ont les mêmes 65 536 numéros, dans des espaces séparés.',
              },
            },
          },
          architecture: {
            title: 'Architecture',
            prompt: 'Quelle affirmation vos preuves soutiennent-elles le mieux ?',
            options: {
              independent: {
                text: 'Nexus Labs gère son infrastructure de façon indépendante.',
                why: 'Son DNS, ses certificats et ses routes passent tous par quelqu’un d’autre.',
              },
              orion: {
                text: 'Orion Security gère le DNS, les certificats et la bordure réseau de Nexus Labs et de Blackwell, et l’hôte d’archive de Nexus est l’alias d’une machine de Blackwell.',
                why: 'Chaque morceau de la phrase repose sur un enregistrement que vous avez relevé. Une conclusion s’écrit comme ça.',
              },
              owned: {
                text: 'Blackwell possède Nexus Labs en secret.',
                why: 'Vos preuves réseau montrent des exploitants communs, pas une propriété. N’affirmez pas plus que ce que vous pouvez montrer.',
              },
            },
          },
        },
      },
      review: {
        accomplished: 'Vous avez trouvé votre place sur un réseau, dressé la carte d’une cible à partir du DNS public et des services visibles, lu des en-têtes HTTP et un certificat TLS, et tiré de ces traces éparses une description d’architecture.',
        concepts: ['IP, CIDR et routage', 'Les types d’enregistrements DNS', 'TCP, UDP et les ports', 'open, closed et filtered', 'Codes d’état et en-têtes HTTP', 'Les certificats TLS', 'robots.txt'],
        why: 'Rien de tout ça n’a demandé d’accès particulier. Le DNS doit être public pour qu’Internet fonctionne, les serveurs se présentent dans leurs en-têtes, et les routeurs répondent à traceroute. Une infrastructure laisse deviner son organigramme.',
        professional: 'Un pro obtient une autorisation écrite et un périmètre avant le moindre scan, note les commandes exactes et les heures, et ne confond pas l’observation (« le CNAME pointe ici ») avec la conclusion (« donc ils sont liés »).',
        defend: ['Retirez les serveurs de débogage de tout ce qui est joignable.', 'Passez votre DNS en revue : vieux alias, dépendances envers des tiers.', 'Masquez les bannières de version, fermez tout par défaut au pare-feu, et scannez-vous régulièrement.', 'Vos fournisseurs de DNS et de certificats sont des fournisseurs critiques. Traitez-les comme tels.'],
      },
    },
    m05: {
      title: 'Gardez des copies',
      requires: ['Tout ce qui précède : système de fichiers, OSINT, SQL, DNS'],
      intro: [
        'NULL vous propose un autre travail, et vous ne croyez plus au cabinet qui le paie. D’après ROOTLESS, tous ceux d’avant ont arrêté de poser des questions à peu près ici, et ça ne les a pas sauvés.',
        'Découvrez ce que ce poste enregistre sur vous. Découvrez qui est NULL. Réunissez ce que vous pouvez prouver dans un seul dossier vérifiable. Puis décidez qui le reçoit, si quelqu’un doit le recevoir.',
      ],
      concepts: [
        {
          term: 'Moindre privilège',
          text: 'sudo -l montre ce qu’un utilisateur peut lancer en root. Une règle oubliée après un débogage est une erreur de configuration classique, et les traquer fait partie du travail défensif ordinaire.',
        },
        {
          term: 'Métadonnées',
          text: 'Le contenu peut être chiffré, la trace de qui s’est connecté, quand et depuis quel appareil reste lisible. Et ces habitudes en disent parfois plus long que les messages.',
        },
        {
          term: 'Chaîne de traçabilité',
          text: 'Une accusation porte plus loin quand tout le monde peut la vérifier. Hashez chaque pièce, notez sa source, et ne touchez pas aux originaux.',
        },
      ],
      resources: ['sudo -l', 'sqlite3', 'curl -o', 'evidence, dossier', 'Tous les fichiers des missions précédentes'],
      environment: 'Votre poste, le web public, et un export de métadonnées reçu par Gramtele.',
      files: [
        `ce dossier vient pas du bureau

les pieces qu il faudrait a un inconnu :
  1. /missions/m03/nexus_archive.db         ce qu ils ont efface
  2. communique de nexus (nexus-labs.test/news/nx417-topline.pdf)   ce qu ils ont dit apres
  3. fiche du registre pour hollin trust (registry.test/company/hollin-trust)   qui possede qui
  4. resume d orion sur halden freight (orion-security.test/reports/halden-freight.pdf)   ce qui arrive ensuite
  5. export de metadonnees gramtele         qui est NULL

curl -o enregistre une page. cp garde l etiquette de piece d un fichier. le modifier la perd.
mkdir ~/dossier. copie-les dedans. dossier status. dossier seal.

  - r
`,
      ],
      objectives: {
        sudo: {
          text: 'Vérifiez ce que ce compte peut lancer en root, puis lisez le journal d’audit du poste.',
          note: 'Le journal est en mode 600 et appartient à root. sudo -l dit ce qui vous est permis.',
          hints: ['ls -l /var/log/workbench montre que le fichier est réservé à root. Demandez ce que sudo autorise.', 'sudo -l affiche une seule règle, laissée là pour le « débogage de la rotation des journaux ».', 'sudo cat /var/log/workbench/audit.log'],
          journal: ['Le poste enregistre chaque commande que je tape et l’envoie à relay.blackwell.test. Toutes, depuis le premier whoami.'],
        },
        devices: {
          text: 'Ouvrez l’export de métadonnées de Gramtele. Combien d’appareils se connectent en tant que NULL, et lequel sert aussi à un autre pseudo ?',
          note: 'MOTH ou ROOTLESS vous obtiendront le fichier. Joignez sessions à accounts, avec un GROUP BY sur l’appareil.',
          hints: ['.schema montre accounts, devices, sessions et contractors. sessions fait le lien.', 'SELECT a.handle, s.device_id, COUNT(*) FROM sessions s JOIN accounts a ON a.id = s.account_id GROUP BY 1, 2;', 'NULL a trois lignes dans cette sortie. L’un de ces appareils apparaît aussi sous VANTA.'],
          answer: {
            prompt: 'Appareils différents connectés en tant que NULL',
            placeholder: 'nombre',
            wrong: 'COUNT(DISTINCT device_id) pour le compte NULL.',
            right: 'Trois appareils, qui se relaient. NULL est un poste, pas une personne.',
          },
          extraAnswers: [
            {
              prompt: 'L’appareil utilisé par NULL et par un autre pseudo',
              placeholder: 'd-0000',
              wrong: 'Listez les paires appareil et pseudo, puis cherchez un appareil présent sous deux pseudos.',
              right: 'd-90be se connecte en tant que NULL et en tant que VANTA. Celle qui vous a appris à prendre des notes les lisait.',
            },
          ],
          journal: ['L’appareil d-90be se connecte à la fois en tant que NULL et en tant que VANTA.'],
        },
        contractors: {
          text: 'Lisez la table contractors. Combien de prestataires ont été « clôturés » avant vous, et à quelle date votre clôture est-elle prévue ?',
          note: 'Comparez les références de dossier aux rapports que publie Orion.',
          hints: ['SELECT * FROM contractors;', 'Six lignes ont un closed_on rempli.', 'Votre ligne dit "scheduled 2026-11-05".'],
          answer: {
            prompt: 'Prestataires clôturés avant vous',
            placeholder: 'nombre',
            wrong: 'Comptez les lignes qui ont une date closed_on.',
            right: 'Six personnes, chacune désignée comme seule coupable dans un rapport du même cabinet.',
          },
          extraAnswers: [
            {
              prompt: 'La date prévue de votre clôture',
              placeholder: 'AAAA-MM-JJ',
              wrong: 'Lisez la colonne de clôture, sur votre propre ligne.',
              right: 'Dans douze jours. Vous n’avez encore rien fait, et il y a déjà une date.',
            },
          ],
        },
        dossier: {
          text: 'Montez ~/dossier avec les cinq pièces, puis scellez-le.',
          note: 'Le README de /missions/m05 les énumère. "dossier status" vérifie le contenu : le nom des fichiers n’a pas d’importance, la moindre retouche si.',
          hints: ['mkdir ~/dossier, puis copiez les images de base avec cp, et enregistrez les documents web avec curl -o.', 'curl -o ~/dossier/hollin.html http://registry.test/company/hollin-trust, et pareil pour les deux PDF.', 'dossier status jusqu’à ce que les cinq soient cochées, puis dossier seal.'],
        },
        decide: {
          text: 'Décidez. Personne ne le fera pour vous.',
          note: 'Publier : curl -F file=@dossier.tar http://archive.test/submit. Sinon, répondez à l’un de vos contacts sur Gramtele.',
          hints: ['Chacun de vos contacts veut autre chose de ce dossier.', 'Demandez-vous qui chaque choix expose, et qui pourra vérifier après coup.', 'Il n’y a pas de corrigé. Relisez votre journal, et choisissez.'],
        },
      },
      optionals: {
        lowtide_row: {
          title: 'Quelqu’un que vous avez lu',
          text: 'c-0041, lowtide, clôturé le 22 août 2025. Sa lettre est dans les Archives ouvertes. Personne n’a eu de ses nouvelles depuis.',
        },
        reik_style: {
          title: 'L’écriture laisse des empreintes',
          text: 'Les notes de terrain d’Orion s’ouvrent sur « bon alors » et répètent que les notes, c’est l’enquête. Ces phrases, vous les avez déjà lues sur Gramtele. La stylométrie est une preuve faible, mais elle pointait dans la bonne direction.',
        },
        transparency: {
          title: 'Aucune métadonnée, d’aucune sorte',
          text: 'La page de transparence de Gramtele jure qu’elle ne garde rien. Ce qu’elle garde, vous l’avez sous les yeux. Dès que vous pouvez, confrontez ce qu’on affirme à ce qui est enregistré.',
        },
      },
      review: {
        accomplished: 'Vous avez audité votre propre machine, décortiqué des métadonnées de session et monté un dossier qu’un inconnu peut vérifier sans avoir à vous croire.',
        concepts: ['Relire une politique sudo', 'Analyser des métadonnées en SQL', 'Hash et chaîne de traçabilité', 'Provenance et vérification'],
        why: 'Un dossier vérifié tient parce que chaque pièce se recontrôle séparément : le hash montre qu’elle n’a pas bougé, la source dit d’où elle vient. Votre parole n’entre pas en jeu.',
        professional: 'À ce stade, un pro s’arrêterait, mettrait à l’abri ce qu’il détient, noterait comment chaque pièce lui est parvenue, et irait voir un juriste. Lancer l’alerte, ça ouvre de vraies protections et de vrais risques : ça mérite un vrai conseil.',
        defend: ['Auditez sudoers et supprimez les règles temporaires.', 'Dites clairement aux utilisateurs ce qui est journalisé sur les machines gérées.', 'Ne prétendez pas ne garder aucune métadonnée sans l’avoir vérifié.', 'Avant d’accepter un travail, cherchez à qui il profite au bout du compte. Les registres sont gratuits.'],
      },
    },
  },
  chapters: ['L’invitation', 'Premier contact', 'Empreintes numériques', 'L’archive', 'Surface exposée', 'Le point de non-retour'],
  skills: {
    linux: 'Linux',
    networking: 'Réseaux',
    osint: 'OSINT',
    databases: 'Bases de données',
    websec: 'Bases du web',
    forensics: 'Investigation numérique',
    ir: 'Pratique de l’enquête',
    fundamentals: 'Bases de la sécurité',
  },
  nodes: {
    lx_nav: { title: 'Trouver son chemin', text: 'cd, ls et pwd : se déplacer sans se perdre.' },
    lx_find: { title: 'Fini de deviner', text: 'Fouiller l’arbre avec find.' },
    lx_pipe: { title: 'Tubes', text: 'Enchaîner deux commandes avec un tube.' },
    lx_freq: { title: 'Analyse de fréquence', text: 'Monter un tube d’au moins trois étapes.' },
    lx_perm: { title: 'Permissions', text: 'Changer le mode d’un fichier avec chmod.' },
    lx_man: { title: 'Lire le manuel', text: 'Ouvrir les pages de man.' },
    os_search: { title: 'Opérateurs de recherche', text: 'Chercher avec site:, filetype: ou une expression exacte.' },
    os_meta: { title: 'Métadonnées', text: 'Lire ce qu’un fichier cache, avec exiftool.' },
    os_collision: { title: 'Homonymes', text: 'Écarter une fausse correspondance de pseudo.' },
    os_whois: { title: 'Vérifier ce qu’on vous dit', text: 'Confronter le récit d’une société à whois.' },
    os_money: { title: 'Remonter jusqu’au propriétaire', text: 'Suivre une chaîne de propriété dans un registre public.' },
    db_schema: { title: 'Lire le schéma', text: 'Examiner les tables et les clés.' },
    db_join: { title: 'JOIN', text: 'Croiser des tables sur une clé.' },
    db_group: { title: 'Agrégation', text: 'Se servir de GROUP BY.' },
    db_audit: { title: 'Journaux d’audit', text: 'Confronter une table à son journal d’audit.' },
    nw_self: { title: 'Savoir où on est', text: 'Lire son adresse et ses routes.' },
    nw_dns: { title: 'DNS', text: 'Interroger des enregistrements DNS.' },
    nw_scan: { title: 'Repérer les services', text: 'Identifier les services du labo avec nmap.' },
    nw_route: { title: 'Routage', text: 'Comparer des routes avec traceroute.' },
    ws_http: { title: 'HTTP brut', text: 'Lire les en-têtes d’un serveur avec curl.' },
    ws_tls: { title: 'Certificats', text: 'Lire une chaîne de certificats.' },
    fr_hash: { title: 'Hashs', text: 'Prendre l’empreinte SHA-256 d’un fichier.' },
    fr_sign: { title: 'Signatures de fichiers', text: 'Regarder les octets avec file ou xxd.' },
    fr_encoding: { title: 'Encoder n’est pas chiffrer', text: 'Décoder du base64.' },
    fr_custody: { title: 'Chaîne de traçabilité', text: 'Sceller un dossier vérifiable.' },
    ir_notes: { title: 'Écrivez-le', text: 'Tenir des notes dans le journal.' },
    ir_timeline: { title: 'Chronologies', text: 'Reconstituer une chronologie à partir de sources indépendantes.' },
    ir_limits: { title: 'Dire où ça s’arrête', text: 'Séparer l’observation de la conclusion dans un rapport.' },
    sf_least: { title: 'Moindre privilège', text: 'Auditer une politique sudo.' },
    sf_meta: { title: 'Les métadonnées parlent', text: 'Montrer ce que révèlent des traces de session.' },
  },
  achievements: {
    first_blood: { title: 'Bonjour, machine', text: 'Votre toute première commande.' },
    tenant: { title: 'L’ancien locataire', text: 'Trouver ce que lowtide a laissé derrière lui.' },
    follow_money: { title: 'Remonter au propriétaire', text: 'Trouver Hollin Trust dans le registre public.' },
    no_hints: { title: 'Sans filet', text: 'Terminer une mission sans aucun indice.' },
    flawless: { title: 'Dossier propre', text: 'Un rapport entièrement juste du premier coup.' },
    explorer: { title: 'Lit tout', text: 'Toutes les découvertes facultatives d’une mission.' },
    pipeline: { title: 'Plomberie', text: 'Un tube d’au moins quatre étapes.' },
    mirror: { title: 'Miroir', text: 'Lire votre propre journal d’audit.' },
    c_number: { title: 'Une date', text: 'Trouver la date de votre propre clôture.' },
    receipts: { title: 'Les preuves', text: 'Ouvrir le fichier avant d’ouvrir la bouche, devant tout le monde.' },
    corrected: { title: 'Je simplifiais', text: 'Reprendre MOTH en public.' },
    asked_null: { title: 'Lequel d’entre vous', text: 'Poser à NULL la question que personne n’avait posée en trois ans.' },
    all_endings_one: { title: 'Le bout du chemin', text: 'Atteindre une fin.' },
  },
  evidence: {
    'ridge-photo': { title: 'Photo du ponton (balises GPS)', summary: 'Publiée par quietfern le 12 avril 2026. L’EXIF donne des coordonnées à Harrowmere.' },
    'aldric-photo': { title: 'Photo de la crête d’Aldric', summary: 'Publiée par quietfern en août 2021. Pas de balises GPS.' },
    'nexus-bulletin': { title: 'Bulletin interne de Nexus, T3 2021', summary: 'Cite Elin Maret avec le pseudo quietfern. Champ Author : E. Maret.' },
    'nexus-press': { title: 'Communiqué sur le Calvexin', summary: '« Aucun décès lié au traitement n’a été observé. » Champ Company des métadonnées : Blackwell Diligence.' },
    'archive-db': { title: 'Image de la base d’archives de Nexus', summary: 'Le journal d’audit enregistre la suppression des EI 2291-2293 par k.dressler. Les factures de Blackwell Diligence totalisent 230 000.', source: 'Mission m03' },
    'registry-hollin': { title: 'Fiche du registre : Hollin Trust', summary: 'Contrôle Blackwell Holdings, Orion Security et Lindgate Advisory.' },
    'report-halden': { title: 'Rapport d’Orion : Halden Freight', summary: 'Désigne le prestataire c-0031. Signé S. Reik.' },
    'report-brask': { title: 'Rapport d’Orion : Brask Utilities', summary: 'Désigne le prestataire c-0041. Signé S. Reik.' },
    'gramtele-meta': { title: 'Export de métadonnées de Gramtele', summary: 'Trois appareils se connectent en tant que NULL. La table des prestataires compte six clôtures, plus la vôtre, déjà programmée.', source: 'Reçu par Gramtele' },
  },
};
