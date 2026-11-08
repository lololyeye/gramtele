/**
 * Les quatre premières missions. Les commandes, les chemins, les noms de colonnes et les
 * sorties d'outils ne se traduisent pas : ce sont eux qu'on apprend à manipuler.
 */

export const FR_M01 = {
  chapterTitle: 'Premier contact',
  title: 'Une présentation discrète',
  requires: ['Rien. Si vous savez taper au clavier, vous pouvez commencer.'],
  intro: [
    'NULL vous a confié une machine : un poste de travail de prestataire, accessible par un terminal. Avant de payer qui que ce soit, Lindgate veut savoir si cette personne se repère sur une machine Linux sans qu’on lui tienne la main.',
    'Confirmez qui vous êtes sur le système, trouvez le document d’accueil, lisez vos réglages de relais et laissez un reçu.',
  ],
  concepts: [
    { term: 'Le système de fichiers est un arbre', text: 'Tout part de / (la racine). Un chemin absolu commence par /. Un chemin relatif part de l’endroit où vous vous trouvez.' },
    { term: 'Utilisateurs et identifiants', text: 'Chaque processus tourne sous un utilisateur doté d’un identifiant numérique. Les permissions de chaque fichier sont vérifiées par rapport à cet identifiant. Qui vous êtes décide de ce que vous pouvez toucher.' },
    { term: 'Fichiers cachés', text: 'Les noms qui commencent par un point n’apparaissent pas avec un simple ls. C’est une convention, pas une protection. ls -a les affiche.' },
  ],
  resources: ['Terminal', 'man COMMANDE pour chaque outil', 'hint, si vous bloquez'],
  environment: 'Image du poste de travail, votre dossier personnel dans /home/player. Dossier de mission dans /missions/m01.',
  files: [{ file: { data: `MISSION m01 - PRISE EN MAIN DU POSTE DE TRAVAIL\nContact : NULL\n\n1. Confirmez votre identifiant numérique d'utilisateur. (whoami, id)\n2. Placez-vous dans ce dossier de mission et listez-le.\n3. Trouvez intake.txt. Il se trouve quelque part sous /home. Ne le cherchez pas\n   à la main. Apprenez à utiliser "find".\n4. Lisez les réglages de relais indiqués par le document d'accueil, puis déposez\n   votre référence de prestataire et l'hôte du relais amont avec "submit".\n5. Laissez un reçu : créez le dossier ~/cases/m01 et, dedans, un fichier\n   receipt.txt contenant votre référence de prestataire.\n` } }],
  objectives: {
    identity: {
      text: 'Identifiez l’utilisateur courant et déposez votre uid numérique.',
      note: 'Lancez whoami, puis id. L’uid est le nombre qui suit uid=.',
      answer: { prompt: 'Votre identifiant numérique d’utilisateur', placeholder: 'nombre', wrong: 'Ce n’est pas votre uid. La commande « id » l’affiche après uid=.', right: 'L’uid 1000 est le premier utilisateur ordinaire sur la plupart des systèmes Linux. L’uid 0 est root.' },
      hints: ['Une commande affiche votre identité en chiffres. Son nom est très court.', 'Tapez : id', 'La sortie commence par uid=1000(player). Déposez-le avec : submit uid 1000'],
    },
    navigate: {
      text: 'Placez-vous dans /missions/m01 et listez son contenu.',
      note: 'cd change de dossier. ls liste. pwd indique où vous êtes.',
      hints: ['Vous devez changer de dossier de travail, avec un chemin absolu.', 'cd prend un chemin. Les chemins absolus commencent par /.', 'cd /missions/m01 puis ls'],
    },
    find: {
      text: 'Trouvez intake.txt avec find, puis lisez-le.',
      note: 'Ne devinez pas le chemin. find parcourt l’arbre à votre place.',
      hints: ['find prend un dossier de départ et un test. man find liste les tests.', 'Utilisez le test -name avec le nom du fichier, à partir de /home.', 'find /home -name "intake.txt" puis cat sur le chemin affiché.'],
    },
    config: {
      text: 'Lisez la configuration du relais. Déposez votre référence de prestataire et l’hôte amont.',
      note: 'Les fichiers de configuration en disent souvent plus sur un système que sa documentation.',
      answer: { prompt: 'Votre référence de prestataire', wrong: 'Ce n’est pas ce que dit la configuration active. Un brouillon périmé traîne sur cette machine : vérifiez quel fichier vous avez lu.', right: 'Notez que vous l’avez lue dans la configuration active, pas dans le brouillon posé à côté du document d’accueil.' },
      extraAnswers: [{ prompt: 'Hôte du relais amont', placeholder: 'nom d’hôte', wrong: 'Lisez la ligne host de la section [upstream] de relay.conf.', right: 'Votre poste garde une connexion active vers cet hôte. Retenez ce nom.' }],
      hints: ['intake.txt indique le fichier qu’il vous faut.', 'cat /opt/relay/relay.conf. Cherchez contractor_ref et host.', 'submit contractor_ref c-0047, et submit upstream avec la valeur de host.'],
    },
    receipt: {
      text: 'Créez ~/cases/m01/receipt.txt contenant votre référence de prestataire.',
      note: 'mkdir -p crée le chemin. echo ... > fichier écrit dedans.',
      hints: ['Deux étapes : créer les dossiers, puis écrire le fichier.', 'mkdir -p crée les parents au passage. L’opérateur > envoie la sortie dans un fichier.', 'mkdir -p ~/cases/m01 puis echo "c-0047" > ~/cases/m01/receipt.txt'],
    },
  },
  optionals: {
    notes41: { title: 'Quelque chose d’oublié', text: 'Un utilisateur précédent a laissé une note dans un fichier caché. Elle ne vous était pas destinée, et vous l’avez lue.', effects: ['Un prestataire précédent, « lowtide », c-0041, a laissé une note dans ~/.cache. « Les exercices ne sont pas des exercices. »'] },
    history41: { title: 'L’historique de quelqu’un d’autre', text: '.bash_history appartient à celui qui avait cette machine avant vous. Il se termine par une tentative de nettoyage.' },
    relayproc: { title: 'À qui parle cette machine ?', text: 'ps aux montre un démon de relais qui tourne sous son propre utilisateur, lancé avant même votre première connexion.' },
  },
  review: {
    accomplished: 'Vous vous êtes orienté sur un système Linux inconnu, vous avez trouvé un fichier par une vraie recherche plutôt qu’au hasard, et vous avez lu la configuration à la source.',
    concepts: ['Chemins absolus et relatifs', 'Utilisateurs, uid et permissions', 'find avec -name', 'Redirection avec >', 'Fichiers cachés'],
    why: 'find fonctionne parce que le système de fichiers est un arbre unique, qu’on peut parcourir. Lire la configuration active plutôt que le brouillon voisin, c’est la première leçon de toute enquête : aller à la source qui fait foi.',
    professional: 'Un professionnel commence chaque intervention sur une nouvelle machine par les cinq mêmes commandes : whoami, id, hostname, pwd, ls -la. Il note l’heure, la machine et l’utilisateur avant de faire quoi que ce soit.',
    defend: ['Ne laissez pas de brouillons aux réglages périmés à côté des réglages actifs : quelqu’un finira par s’en servir.', 'Un dossier personnel « nettoyé » doit être vérifié. Les fichiers cachés survivent aux nettoyages négligents.', 'Gardez une trace de qui a reçu quelle machine, et reconstruisez les images entre deux utilisateurs.'],
  },
};

export const FR_M02 = {
  chapterTitle: 'Empreintes numériques',
  title: 'L’ombre numérique',
  requires: ['Se déplacer dans le système de fichiers', 'Lire des fichiers'],
  intro: [
    'Un client de Lindgate mène une vérification sur une ancienne employée d’un fournisseur. NULL n’a qu’un pseudonyme : quietfern.',
    'Établissez qui se cache derrière, à partir de sources publiques uniquement. Trouvez un nom, un parcours professionnel et un lieu de résidence actuel, puis dites à quel point vous vous fiez à chacun.',
  ],
  concepts: [
    { term: 'Le rebond', text: 'Chaque fait vous donne une nouvelle chose à chercher. Un pseudonyme mène à un message, un message à un document, un document à un nom.' },
    { term: 'Corrélation de pseudonymes', text: 'Le même pseudonyme sur deux sites est une piste, jamais une conclusion. Des gens partagent un pseudonyme par hasard. Cherchez des faits indépendants qui concordent.' },
    { term: 'Métadonnées', text: 'Les fichiers portent des informations sur eux-mêmes : auteur, logiciel, horodatages, GPS. Beaucoup de gens l’ignorent.' },
    { term: 'Fiabilité des sources', text: 'Demandez-vous pour chaque affirmation : qui l’a publiée, peut-elle être fausse, et existe-t-il une seconde source indépendante ?' },
  ],
  resources: ['Le navigateur de la vue Réseau (search.test est la page d’accueil)', 'curl, wget, whois, exiftool, pdftotext', 'submit pour déposer vos conclusions'],
  environment: 'Le web public fictif. Tout ce qui s’y trouve fait partie de la simulation. Dossier de mission dans /missions/m02.',
  files: [{ file: { data: `MISSION m02 - PERSONNE VISEE "quietfern"\nContact : NULL\nPerimetre : sources publiques uniquement.\n\nIl nous faut :\n  - Le vrai nom derriere le pseudonyme.\n  - La date du dernier emploi regulier de cette personne.\n  - Son lieu de residence actuel, si cette information est publique.\n  - Quels profils sont vraiment les siens, et lesquels ne le sont pas.\n\nCommencez par search.test. Enregistrez les documents sur le poste avant de les\nanalyser. Deposez vos conclusions avec "submit". Deposez le rapport depuis le\npanneau Missions.\n\nNous ne contactons jamais une personne visee.\n` } }],
  objectives: {
    search: {
      text: 'Cherchez le pseudonyme sur le web public et trouvez ses profils.',
      note: 'Utilisez le navigateur de la vue Réseau, ou curl "http://search.test/search?q=quietfern".',
      hints: ['Ouvrez la vue Réseau, onglet Navigateur. La page d’accueil est un moteur de recherche.', 'Cherchez le pseudonyme exact. Ouvrez ensuite chaque profil trouvé.', 'Ouvrez trailtalk.test/u/quietfern et gamersden.test/u/quietfern.'],
    },
    correlate: {
      text: 'Deux profils partagent ce pseudonyme. Quel site ne correspond pas à la personne visée ?',
      note: 'Comparez ce que chaque profil dit de l’âge, des dates et de la vie de la personne. Ne les fusionnez pas sous prétexte que le nom est identique.',
      answer: { prompt: 'Quel site héberge le « quietfern » sans rapport ?', placeholder: 'domaine', wrong: 'Comparez encore les deux. L’un est inscrit depuis 2019 et « travaillait avec des chiffres ». Que dit l’autre de lui-même ?', right: 'Un adolescent de 16 ans inscrit en 2024 ne peut pas avoir publié en 2021. Les collisions de pseudonymes sont extrêmement courantes, et c’est en les fusionnant qu’on accuse à tort de vraies personnes.' },
      hints: ['Lisez les deux profils. Que disent-ils de l’âge et de la date d’inscription ?', 'L’un indique « 16 » et une inscription en juin 2024. L’autre est membre depuis 2019.', 'Le profil GamersDen est quelqu’un d’autre : submit false_profile gamersden.test'],
    },
    name: {
      text: 'Trouvez un document qui relie le pseudonyme à un vrai nom. Enregistrez-le et lisez ses métadonnées.',
      note: 'Cherchez le pseudonyme avec filetype:pdf. wget enregistre un fichier, exiftool lit ce qu’il contient, pdftotext en extrait le texte.',
      answer: { prompt: 'Vrai nom derrière quietfern', placeholder: 'Prénom Nom', wrong: 'Lisez le texte du document, pas seulement ses métadonnées, et vérifiez que les deux concordent.', right: 'Deux signaux indépendants : le paragraphe sur le personnel la nomme avec son pseudonyme, et le champ Author du PDF concorde.' },
      hints: ['Le pseudonyme apparaît dans un bulletin interne publié par une entreprise. Essayez l’opérateur de recherche filetype:pdf.', 'Cherchez quietfern filetype:pdf. Téléchargez avec wget, dans ~/Downloads, puis utilisez exiftool et pdftotext.', 'wget http://nexus-labs.test/news/bulletin-2021-q3.pdf ; pdftotext bulletin-2021-q3.pdf | grep -i quietfern ; exiftool bulletin-2021-q3.pdf'],
    },
    employment: {
      text: 'Quand cette personne a-t-elle quitté cet employeur ? Corroborez avec une seconde source.',
      note: 'Une source, c’est une allégation. Deux sources indépendantes, c’est une conclusion.',
      answer: { prompt: 'Mois de son départ (AAAA-MM)', placeholder: 'AAAA-MM', wrong: 'Regardez son profil professionnel et ses messages de forum à la même période.', right: 'Le profil Folio indique jusqu’en mars 2025. Un message de forum du 29 mars 2025 dit « hier, c’était mon dernier jour ». Deux sources, et maintenant une date exacte : le 28 mars.' },
      hints: ['Les gens tiennent leurs profils professionnels sous leur vrai nom. Cherchez le sien.', 'folio.test/elin.maret donne les dates. Cherchez un message de quietfern de la même période.', 'trailtalk.test/t/hiatus dit « hier, c’était mon dernier jour », daté du 29 mars 2025. submit left_employer 2025-03'],
    },
    location: {
      text: 'La personne a publié une photo récemment. Enregistrez-la, extrayez ses balises GPS et retrouvez le lieu.',
      note: 'exiftool lit les coordonnées. maps.test transforme des coordonnées en nom de lieu. Collectez ensuite la photo avec « evidence add » pour qu’elle soit hashée.',
      answer: { prompt: 'Ville où la photo a été prise', placeholder: 'ville', wrong: 'Convertissez les coordonnées avec maps.test. En degrés décimaux : lat= et lon=.', right: 'Un seul réglage par défaut oublié, et quelqu’un qui disait au forum « je ne dirai pas où » l’avait dit à tout le monde.' },
      hints: ['Son fil le plus récent sur TrailTalk contient une photo. Quelqu’un l’en avertit même dans les commentaires.', 'wget http://trailtalk.test/uploads/ridge_0412.jpg, puis exiftool ridge_0412.jpg, et cherchez les champs GPS.', 'curl "http://maps.test/lookup?lat=61.4821&lon=14.3307" puis submit town harrowmere, et evidence add ridge_0412.jpg'],
    },
    report: {
      text: 'Déposez votre rapport de vérification depuis le panneau Missions.',
      note: 'Une chronologie, un jugement de fiabilité, et une décision sur ce que vous transmettez.',
      hints: ['Ouvrez Missions et utilisez « Déposer le rapport ».', 'Classez les événements d’après les dates collectées, et jugez les sources selon leur indépendance.', 'Le bulletin de 2021, puis le dernier jour en 2025-03, puis le retour au forum en 2025-09, puis la photo en 2026-04.'],
    },
  },
  optionals: {
    operator: { title: 'Chercher comme un professionnel', text: 'Des opérateurs comme site:, filetype: et les « expressions exactes » réduisent le bruit aux seuls documents utiles.' },
    lindgate: { title: 'Vérifier qui paie', text: 'whois montre que le domaine de Lindgate a été enregistré en mai 2026, par un trust. Son site revendique dix-sept ans d’activité.', effects: ['Lindgate prétend exister depuis 2009. Son domaine a été créé le 19 mai 2026 par une entité nommée Hollin Trust.'] },
    aldric: { title: 'Des métadonnées absentes', text: 'Sa photo de 2021 n’a pas de balises GPS, celle de 2026 en a. L’absence de métadonnées est aussi une information : un autre téléphone, ou un réglage qui a changé.' },
  },
  report: {
    title: 'Rapport de vérification : quietfern',
    intro: 'Un rapport court. Un client va s’y fier, tout ce qu’il contient doit donc tenir debout.',
    sections: {
      timeline: {
        title: 'Chronologie',
        prompt: 'Remettez ces événements dans l’ordre, du plus ancien au plus récent.',
        items: {
          return: 'Revient sur le forum : « installée dans un petit coin »',
          bulletin: 'Citée avec son pseudonyme dans un bulletin interne de Nexus Labs',
          photo: 'Publie une photo prise depuis un ponton, balises GPS intactes',
          left: 'Dernier jour chez Nexus Labs',
        },
      },
      reliability: {
        title: 'Fiabilité',
        prompt: 'Qu’est-ce qui rend solide la conclusion « quietfern est Elin Maret » ?',
        options: {
          'same-name': { text: 'Le pseudonyme apparaît sur plusieurs sites web.', why: 'C’est exactement le piège que vous venez d’éviter. Le quietfern de GamersDen est quelqu’un d’autre.' },
          independent: { text: 'Un document indépendant la nomme avec son pseudonyme, son champ auteur concorde, et les dates de sa carrière concordent avec les messages du forum.', why: 'Plusieurs signaux indépendants concordent, dont un qu’elle ne maîtrisait pas. C’est cela, corroborer.' },
          'exif-only': { text: 'Les données Exif de la photo indiquent quietfern, l’identité est donc prouvée.', why: 'N’importe qui peut modifier des champs Exif. Les métadonnées appuient une conclusion, mais ne prouvent rien à elles seules.' },
        },
      },
      limits: {
        title: 'Limites',
        prompt: 'Avec quelle assurance pouvez-vous dire où elle vit aujourd’hui ?',
        options: {
          certain: { text: 'Elle vit à Harrowmere. C’est certain.', why: 'Une photo prouve où se trouvait un téléphone un matin, il y a six mois. Elle ne dit rien de certain sur aujourd’hui.' },
          indicative: { text: 'Elle était à Harrowmere le 12 avril 2026, et un message laisse penser qu’elle vit à proximité. C’est une déduction, vieille de six mois.', why: 'Indiquez ce que montre la preuve, sa date et ce que vous en avez déduit. Un bon analyste sépare l’observation de la conclusion.' },
          none: { text: 'On ne peut rien dire à partir d’une seule photo.', why: 'Trop catégorique dans l’autre sens. La preuve est limitée, pas sans valeur.' },
        },
      },
      handover: {
        title: 'Livrable',
        prompt: 'Un message de forum dit qu’elle est partie parce qu’« il est plus sûr de rester hors ligne ». NULL a demandé un lieu « si cette information est publique ». Techniquement, elle l’est. Que transmettez-vous ?',
        options: {
          full: { text: 'Tout, y compris Harrowmere et les coordonnées. C’est public, et c’est le travail.', decision: 'Tu as donné à NULL la ville où vit Elin Maret.' },
          withhold: { text: 'Le nom et le parcours professionnel seulement. Lieu : « non établi ».', decision: 'Tu as dit à NULL que tu n’avais pas pu établir de lieu. C’était un mensonge.' },
        },
      },
    },
  },
  review: {
    accomplished: 'À partir d’un simple pseudonyme, vous avez établi une identité, un parcours professionnel et un lieu, écarté une fausse correspondance, et exposé les limites de ce que vous saviez.',
    concepts: ['Opérateurs de recherche', 'Corrélation et collisions de pseudonymes', 'Métadonnées de documents et d’images', 'Corroboration', 'Reconstitution d’une chronologie'],
    why: 'Cela a fonctionné parce que les gens laissent fuir de petits morceaux indépendants, dont aucun ne semble dangereux isolément. La corrélation les assemble. Suivie avec soin, la même méthode protège aussi les innocents : l’adolescent de GamersDen ne reste hors de votre rapport que si vous vérifiez.',
    professional: 'Un professionnel consigne chaque source avec son URL, l’heure de consultation et un hash de toute copie enregistrée. Il signale une déduction comme telle, et il se demande, avant de commencer, si le travail peut nuire à la personne visée et qui est vraiment le client.',
    defend: ['Retirez les métadonnées avant de publier : la plupart des téléphones intègrent le GPS tant qu’on ne le désactive pas.', 'Utilisez des pseudonymes différents selon les pans de votre vie.', 'Vérifiez ce qu’un inconnu peut assembler sur vous, et sur vos équipes.', 'L’OSINT visant une personne peut faire de vrais dégâts. Sachez qui demande, et pourquoi.'],
  },
};

export const FR_M03 = {
  chapterTitle: 'L’archive',
  title: 'L’archive oubliée',
  requires: ['Lire des fichiers', 'Être à l’aise avec le terminal'],
  intro: [
    'Un client a acquis un lot de dossiers fournisseurs et veut une garantie sur un point précis : les paiements aux fournisseurs de cette base désaffectée de Nexus Labs sont-ils propres ?',
    'NULL a déposé une image en lecture seule sur votre poste. Cartographiez le schéma, comprenez les liens entre les tables et répondez à la question. Il se peut que vous ayez répondu à une autre.',
  ],
  concepts: [
    { term: 'Tables et clés', text: 'Une clé primaire identifie une ligne. Une clé étrangère pointe vers une ligne d’une autre table. C’est ce lien qui enregistre les relations dans une base de données.' },
    { term: 'JOIN', text: 'JOIN combine les lignes de deux tables lorsqu’une clé correspond. La plupart des vraies questions traversent plusieurs tables.' },
    { term: 'Agrégation', text: 'GROUP BY et SUM réduisent de nombreuses lignes à un total par groupe. « Qui a été payé, et combien » est une question de GROUP BY.' },
    { term: 'Pistes d’audit', text: 'Une table d’audit enregistre ce qui est arrivé aux données. Quand une table et sa piste d’audit se contredisent, la contradiction est la découverte.' },
  ],
  resources: ['sqlite3 (un vrai moteur SQLite)', '.tables, .schema, .headers on, .mode column', 'man sqlite3'],
  environment: 'Image judiciaire en lecture seule : /missions/m03/nexus_archive.db.',
  files: [null, { file: { data: `MISSION m03 - EXAMEN DES PAIEMENTS FOURNISSEURS\nContact : NULL\nImage : nexus_archive.db (lecture seule)\n\nLa question du client :\n  Quels prestataires de conseil ont ete payes, et pour quel montant total ?\n\nPour commencer :\n  sqlite3 nexus_archive.db\n  sqlite> .tables\n  sqlite> .schema invoices\n\nLe perimetre, ce sont les factures. Rien d'autre n'est demande.\n` } }],
  objectives: {
    tables: {
      text: 'Ouvrez l’image et identifiez ses tables. Combien y en a-t-il ?',
      note: 'sqlite3 FICHIER ouvre une invite. .tables les liste. Les lignes commençant par un point s’adressent à l’outil, tout le reste est du SQL.',
      answer: { prompt: 'Nombre de tables', placeholder: 'nombre', wrong: 'Recomptez-les à partir de .tables.', right: 'Huit tables : personnes, essais, sujets, événements, dépôts, audit, fournisseurs et factures. Savoir ce qui existe, c’est la moitié du travail.' },
      hints: ['cd /missions/m03, puis ouvrez le fichier avec sqlite3.', 'sqlite3 nexus_archive.db, puis .tables à l’invite sqlite>.', 'Il y en a huit : submit table_count 8'],
    },
    schema: {
      text: 'Lisez le schéma. Quelle colonne de invoices la relie à la table vendors ?',
      note: '.schema invoices affiche l’instruction CREATE. Cherchez REFERENCES.',
      answer: { prompt: 'Colonne de clé étrangère', placeholder: 'colonne', wrong: 'Regardez la ligne de .schema invoices qui indique REFERENCES vendors(id).', right: 'vendor_id est une clé étrangère : elle stocke l’identifiant d’une ligne de vendors. C’est la jointure que vous écrirez ensuite.' },
      hints: ['À l’invite : .schema invoices', 'Une ligne de clé étrangère se lit : col TYPE REFERENCES autretable(id).', 'submit fk_column vendor_id'],
    },
    vendors: {
      text: 'Répondez au client : total payé par fournisseur. Combien est allé à l’unique prestataire de conseil ?',
      note: 'Faites un JOIN de invoices et vendors, un GROUP BY du fournisseur, un SUM du montant.',
      answer: { prompt: 'Total payé au prestataire de conseil', placeholder: 'montant', wrong: 'Filtrez sur la catégorie, ou lisez toute la sortie du GROUP BY. Blackwell Diligence a deux factures.', right: 'Deux factures, de 184 000 et 46 000, à une société nommée Blackwell Diligence. Bien plus que tout autre fournisseur, et le mémo parle de « préparation aux crises ».' },
      hints: ['SELECT avec JOIN ... ON invoices.vendor_id = vendors.id', 'Ajoutez SUM(amount) et GROUP BY vendors.name. Triez avec ORDER BY 2 DESC.', 'SELECT v.name, SUM(i.amount) FROM invoices i JOIN vendors v ON i.vendor_id = v.id GROUP BY v.name ORDER BY 2 DESC;'],
    },
    approver: {
      text: 'Qui a approuvé le plus gros paiement, et quand a-t-il été réglé ?',
      note: 'invoices.approved_by est une autre clé étrangère, cette fois vers staff.',
      answer: { prompt: 'Nom d’utilisateur de l’approbateur', placeholder: 'utilisateur', wrong: 'Faites la jointure de invoices et staff sur approved_by = staff.id, et regardez INV-88213.', right: 'Le vice-président des opérations cliniques l’a approuvé en personne, sur une facture émise deux jours plus tôt seulement. D’ordinaire, c’est la finance qui approuve. Cela mérite d’être noté.' },
      hints: ['Regardez number, amount et approved_by dans invoices pour les lignes de Blackwell.', 'JOIN staff ON i.approved_by = staff.id', 'SELECT i.number, i.paid_on, s.username FROM invoices i JOIN staff s ON i.approved_by = s.id WHERE i.vendor_id = 6;'],
    },
    audit: {
      text: 'La piste d’audit couvre cette semaine-là. Qu’est-il arrivé aux données juste avant ce paiement ?',
      note: 'C’est hors de votre mission. Regardez les actions DELETE dans audit_log et faites la jointure avec staff.',
      answer: { prompt: 'Combien d’événements indésirables ont été supprimés ?', placeholder: 'nombre', wrong: 'Filtrez audit_log sur action = \'DELETE\'.', right: 'Trois événements indésirables supprimés à 23 h 41, la veille de l’émission de la facture. Les lignes d’audit survivent aux lignes qu’elles décrivent.' },
      hints: ['SELECT DISTINCT action FROM audit_log; pour voir quels types d’événements existent.', 'WHERE action = \'DELETE\'. Qui l’a fait ? Faites la jointure avec staff.', 'SELECT a.ts, s.username, a.record_id, a.detail FROM audit_log a JOIN staff s ON a.staff_id = s.id WHERE a.action = \'DELETE\';'],
    },
    integrity: {
      text: 'Comparez la piste d’audit au résumé de sécurité déposé. Combien de décès décrivaient les fiches supprimées ?',
      note: 'submissions contient ce qui a été dit au régulateur. audit_log contient ce qui a été consigné avant les suppressions.',
      answer: { prompt: 'Décès consignés dans les événements supprimés', placeholder: 'nombre', wrong: 'Relisez la colonne detail des lignes DELETE, ou celle des lignes INSERT d’origine.', right: 'Deux décès et un arrêt cardiaque réanimé. Le résumé déposé neuf jours plus tard indique zéro événement mortel, et ses totaux correspondent parfaitement à la table, puisque la table avait été nettoyée avant. Cohérent ne veut pas dire vrai.' },
      hints: ['La colonne detail indique la gravité. Cherchez sev=FATAL.', 'SELECT * FROM submissions; montre ce qui a été déposé pour l’essai 3 (NX-417).', 'Deux lignes indiquent FATAL. submit fatal_count 2'],
    },
    report: {
      text: 'Terminez votre examen depuis le panneau Missions.',
      hints: ['Ouvrez Missions et utilisez « Déposer le rapport ».', 'Pensez à ce que la table seule ne pourrait jamais vous montrer.', 'Le journal d’audit enregistre l’histoire. La table n’enregistre que le présent.'],
    },
  },
  optionals: {
    collect: { title: 'Hasher votre source', text: 'Vous avez enregistré l’image dans votre casier. Si vous deviez un jour prouver ce que vous avez vu, ce hash est la raison pour laquelle on vous croirait.' },
    maret: { title: 'Elle l’a vu la première', text: 'Le 12 mars 2025, e.maret a exporté le journal d’audit. Le lendemain matin, Dressler a révoqué ses accès en personne. Vous savez maintenant pourquoi elle est partie.', effects: ['Elin Maret a exporté le journal d’audit le 2025-03-12. Dressler a révoqué ses accès le lendemain matin. La « personne visée » que j’ai retrouvée est un témoin.'] },
    readonly: { title: 'Lecture seule veut dire lecture seule', text: 'Vous avez tenté de modifier l’image et SQLite a refusé. Sur une vraie affaire, vous monteriez les preuves en lecture seule, exactement pour cette raison.' },
  },
  report: {
    title: 'Examen des paiements fournisseurs',
    intro: 'NULL a posé une question sur des factures. Ces questions vérifient que vous comprenez ce que vous avez trouvé.',
    sections: {
      'why-audit': {
        title: 'Raisonnement',
        prompt: 'Pourquoi n’auriez-vous pas pu trouver les suppressions en interrogeant adverse_events ?',
        options: {
          hidden: { text: 'Les lignes sont masquées et il faut une option spéciale pour les afficher.', why: 'Elles ne sont pas masquées. Elles ont disparu. DELETE retire la ligne.' },
          gone: { text: 'Les lignes n’existent plus. Une table enregistre l’état présent. Seule la piste d’audit enregistre son histoire.', why: 'Exactement. C’est pourquoi les journaux d’audit doivent être stockés séparément, en ajout seul, avec un accès restreint.' },
          perm: { text: 'Votre image en lecture seule ne permet pas de les lire.', why: 'La lecture seule limite les écritures. Elle ne masque rien.' },
        },
      },
      relationship: {
        prompt: 'Les totaux déposés correspondent exactement à adverse_events. Que cela montre-t-il ?',
        options: {
          true: { text: 'Les données sont exactes, puisque les deux concordent.', why: 'La concordance ne montre que la cohérence. Si la source a été modifiée d’abord, les deux concorderont parfaitement.' },
          consistent: { text: 'Seulement qu’ils sont cohérents entre eux. La source a été nettoyée d’abord, cette correspondance ne prouve donc rien sur la vérité.', why: 'L’intégrité des données ne se résume pas à des totaux qui concordent. Il faut un enregistrement resté hors de portée de celui qui modifie.' },
        },
      },
      control: {
        title: 'Contrôle d’accès',
        prompt: 'Quel contrôle aurait empêché un vice-président de supprimer discrètement ces lignes ?',
        options: {
          mfa: { text: 'Une authentification multifacteur pour tout le personnel.', why: 'Il s’est connecté sous son propre nom. La MFA confirme une identité, elle ne limite pas ce que cette identité peut faire.' },
          sod: { text: 'La séparation des tâches : aucun droit de suppression pour le personnel opérationnel, et toute correction exige une seconde personne et un motif consigné.', why: 'Le moindre privilège et la double validation. Les systèmes de données cliniques sont couramment tenus de fonctionner ainsi.' },
          backup: { text: 'Des sauvegardes plus fréquentes.', why: 'Les sauvegardes aident à restaurer, mais personne ne restaure ce dont personne ne sait qu’il manque.' },
        },
      },
    },
  },
  review: {
    accomplished: 'Vous avez cartographié un schéma inconnu, fait des jointures entre tables, agrégé des paiements, et trouvé une contradiction entre une base de données et sa propre piste d’audit.',
    concepts: ['Schémas, clés primaires et étrangères', 'SELECT, WHERE, ORDER BY', 'JOIN', 'GROUP BY et SUM', 'Pistes d’audit et intégrité des données', 'Moindre privilège, séparation des tâches'],
    why: 'Les bases relationnelles stockent les faits dans des tables distinctes reliées par des clés : une question sur « qui a approuvé quoi » est donc toujours un JOIN. La table d’audit a servi de preuve parce que celui qui a nettoyé les données a oublié, ou n’a pas pu toucher, la trace du nettoyage.',
    professional: 'Un professionnel travaillerait sur une copie hashée, conserverait chaque requête avec son résultat, et rédigerait sa conclusion ainsi : « le journal d’audit enregistre X », et non « Dressler a fait X ». Un journal montre qu’un compte a agi, pas une personne.',
    defend: ['Stockez les journaux d’audit hors de la machine, en ajout seul.', 'N’accordez le droit de suppression à presque personne. Préférez une suppression logique avec un champ de motif.', 'Exigez qu’une seconde personne approuve les corrections de données réglementées.', 'Rapprochez les rapports déposés d’enregistrements indépendants.'],
  },
};

export const FR_M04 = {
  chapterTitle: 'Surface exposée',
  title: 'Le serveur silencieux',
  requires: ['Filtrer une sortie avec grep', 'Lire attentivement la sortie des outils'],
  intro: [
    'Le client veut un regard extérieur sur l’infrastructure de Nexus Labs, le genre de carte que n’importe qui pourrait dresser à partir d’informations publiques et de quelques questions polies.',
    'Trouvez votre place sur le réseau, interrogez le DNS, identifiez les services exposés et qui les gère vraiment. Les scans ne touchent ici que des hôtes de laboratoire simulés, et dans le monde réel ils exigeraient une autorisation écrite.',
  ],
  concepts: [
    { term: 'Adresses IP et sous-réseaux', text: 'Une adresse IPv4 fait 32 bits, écrits sous forme de quatre nombres. 10.40.0.0/24 signifie que les 24 premiers bits désignent le réseau, ce qui laisse 256 adresses pour les hôtes.' },
    { term: 'DNS', text: 'Le DNS associe des noms à des adresses, et plus encore. A : adresse. CNAME : alias. MX : courrier. NS : qui répond pour le domaine. TXT : notes libres, souvent révélatrices.' },
    { term: 'TCP, UDP et ports', text: 'TCP établit une connexion fiable, UDP se contente d’envoyer. Un numéro de port désigne le service sur un hôte : 22 SSH, 53 DNS, 80 HTTP, 443 HTTPS.' },
    { term: 'HTTP', text: 'Une requête a une méthode et un chemin. Une réponse a un code d’état et des en-têtes. Codes : 2xx tout va bien, 3xx allez ailleurs, 4xx c’est votre faute, 5xx c’est la leur.' },
    { term: 'Routage', text: 'Les paquets sautent de routeur en routeur. traceroute révèle le chemin, et le nom des routeurs révèle souvent qui les exploite.' },
  ],
  resources: ['ip, ping, traceroute, dig, nmap, ss', 'curl -I et curl -v', 'La carte du réseau (se remplit à mesure que vous découvrez des hôtes)'],
  environment: 'VPN de laboratoire 10.40.0.0/24 et réseau public simulé.',
  files: [{ file: { data: `MISSION m04 - VUE EXTERNE DE NEXUS LABS\nContact : NULL\n\nA livrer :\n  - Notre propre position sur le VPN de laboratoire.\n  - La situation DNS de nexus-labs.test, y compris son hote d'archive.\n  - Les services exposes sur portal.nexus-labs.test.\n  - Qui emet leurs certificats et qui transporte leur trafic.\n\nToutes les cibles sont des hotes simules a l'interieur du laboratoire.\n` } }],
  objectives: {
    self: {
      text: 'Établissez votre position : votre adresse IP, votre passerelle par défaut, et le nombre d’hôtes actifs sur le VPN.',
      note: 'ip a, ip r, puis nmap -sn sur votre sous-réseau. « ss -tuln » montre ce que votre propre machine expose.',
      answer: { prompt: 'Adresse de la passerelle par défaut', wrong: 'ip r l’affiche après « default via ».', right: 'La route par défaut, c’est là où vont les paquets quand rien de plus précis ne correspond.' },
      extraAnswers: [{ prompt: 'Hôtes actifs sur 10.40.0.0/24', placeholder: 'nombre', wrong: 'Comptez les lignes « Nmap scan report » de nmap -sn 10.40.0.0/24.', right: 'Quatre hôtes répondent, le vôtre compris. Un /24 a de la place pour 254 : la plus grande partie est vide.' }],
      hints: ['ip r affiche la table de routage.', 'nmap -sn 10.40.0.0/24 découvre les hôtes sans scanner les ports.', 'submit gateway 10.40.0.1, et submit lab_hosts avec le nombre d’hôtes actifs trouvés par nmap.'],
    },
    dns: {
      text: 'Interrogez le DNS pour nexus-labs.test. Trouvez son adresse, et découvrez de quoi son hôte d’archive est réellement l’alias.',
      note: 'dig NOM donne les enregistrements A. dig archive-01.nexus-labs.test montre une chaîne de CNAME.',
      answer: { prompt: 'archive-01.nexus-labs.test est un alias de', placeholder: 'nom d’hôte', wrong: 'Lisez la ligne CNAME dans la section de réponse de dig.', right: 'L’hôte d’archive de Nexus Labs est un alias d’une machine du domaine de Blackwell. Ce nom figurait aussi dans votre relay.conf. Le même relais auquel votre poste se connecte.' },
      extraAnswers: [{ prompt: 'Adresse IPv4 de nexus-labs.test', wrong: 'dig nexus-labs.test +short affiche l’enregistrement A.', right: 'Un enregistrement A associe un nom à une adresse IPv4. 192.0.2.0/24 est réservé à la documentation, c’est pourquoi cette simulation l’utilise.' }],
      hints: ['dig nexus-labs.test +short', 'dig archive-01.nexus-labs.test et lisez la section ANSWER SECTION.', 'submit nexus_ip 192.0.2.40 et submit archive_alias relay.blackwell.test'],
    },
    records: {
      text: 'Qui gère leur DNS ? Lisez les enregistrements NS et TXT.',
      note: 'NS indique qui répond pour un domaine. Le SPF dans TXT liste qui peut envoyer du courrier au nom de ce domaine.',
      answer: { prompt: 'Domaine de la société qui gère leurs serveurs de noms', placeholder: 'domaine', wrong: 'dig nexus-labs.test NS, et lisez les noms.', right: 'Un prestataire de sécurité gère leur DNS, et l’enregistrement SPF fait aussi confiance aux serveurs de courrier de Blackwell. Un fournisseur peut être bien plus qu’un fournisseur.' },
      hints: ['dig prend un type d’enregistrement comme second argument.', 'dig nexus-labs.test NS et dig nexus-labs.test TXT', 'submit dns_operator orion-security.test'],
    },
    scan: {
      text: 'Scannez portal.nexus-labs.test. Quel port fait tourner un serveur de débogage qui ne devrait jamais être exposé à Internet ?',
      note: 'nmap -sV affiche les versions. Open signifie qu’un service a répondu, filtered qu’un pare-feu a avalé la sonde.',
      answer: { prompt: 'Numéro de port du serveur de débogage', placeholder: 'port', wrong: 'Lisez la colonne VERSION de nmap -sV.', right: 'Werkzeug en mode debug sur le 8080. Un serveur de développement resté exposé au réseau est une découverte très courante, et bien réelle.' },
      hints: ['nmap a besoin de -sV pour indiquer les versions.', 'nmap -sV portal.nexus-labs.test', 'Cherchez « debug » dans la colonne VERSION : submit debug_port 8080'],
    },
    http: {
      text: 'Interprétez le HTTP. Récupérez les en-têtes du portail, puis lisez le certificat de nexus-labs.test. Qui l’a émis ?',
      note: 'curl -I affiche les en-têtes de réponse. curl -v en https affiche le certificat.',
      answer: { prompt: 'Organisation émettrice du certificat', placeholder: 'organisation', wrong: 'curl -v https://nexus-labs.test/ et lisez la ligne « issuer ». Utilisez https, pas http.', right: 'Une autorité de certification privée, gérée par leur prestataire de sécurité. Les navigateurs publics ne lui feraient pas confiance, ce qui laisse penser que le trafic passe volontairement par la périphérie d’Orion.' },
      hints: ['curl -I http://portal.nexus-labs.test/login', 'Les certificats n’existent que sur TLS : utilisez https://', 'curl -v https://nexus-labs.test/ 2>&1 | grep issuer'],
    },
    route: {
      text: 'Tracez la route vers Nexus Labs et vers Blackwell. Par quel routeur passent-elles toutes les deux ?',
      note: 'Comparez les deux listes de sauts.',
      answer: { prompt: 'Nom du dernier saut commun', placeholder: 'routeur', wrong: 'Les deux premiers sauts sont des infrastructures communes. Regardez le dernier routeur avant chaque destination.', right: 'Deux sociétés sans lien public se trouvent derrière la même passerelle. La carte commence à ressembler à une seule et même organisation.' },
      hints: ['Lancez traceroute sur les deux noms.', 'Comparez chaque liste en remontant depuis le bas.', 'Les deux passent par gw.orion-security.test juste avant la destination.'],
    },
    report: {
      text: 'Documentez l’architecture dans votre rapport.',
      hints: ['Ouvrez Missions et utilisez « Déposer le rapport ».', 'La vue Réseau montre tout ce que vous avez découvert.', 'Filtered n’est pas la même chose que closed : pensez à ce qui a réellement répondu.'],
    },
  },
  optionals: {
    robots: { title: 'Merci de ne pas regarder ici', text: 'robots.txt indique aux robots ce qu’ils doivent ignorer, et à tous les autres où se trouvent les dossiers intéressants. C’est une demande, jamais une protection.' },
    reverse: { title: 'Ce que l’adresse dit d’elle-même', text: 'Une recherche inverse sur l’adresse de Lindgate renvoie un nom d’hôte du domaine d’Orion. Les enregistrements PTR sont fixés par celui qui contrôle le bloc d’adresses.', effects: ['Le DNS inverse de l’adresse de Lindgate pointe vers orion-security.test. Lindgate est hébergée par Orion.'] },
    registry: { title: 'Suivre la propriété', text: 'Le registre public indique que Hollin Trust possède Blackwell, Orion et Lindgate. La société qui vous a engagé et celles sur lesquelles vous enquêtez ont le même propriétaire.', effects: ['Hollin Trust contrôle Blackwell Holdings, Orion Security et Lindgate Advisory, et fait des dons à Gramtele. Un seul propriétaire, quatre masques.'] },
    own_socket: { title: 'Ce que fait votre propre machine', text: 'ss montre une connexion active depuis votre poste vers le relais 203.0.113.21. Vous êtes relié à Blackwell en ce moment même.' },
  },
  report: {
    title: 'Vue externe : Nexus Labs',
    intro: 'Ce que vous pouvez montrer depuis l’extérieur, et ce que cela signifie.',
    sections: {
      filtered: {
        title: 'Ports',
        prompt: 'nmap indique 3306/tcp comme « filtered » sur le portail. Qu’est-ce que cela vous apprend ?',
        options: {
          closed: { text: 'MySQL ne tourne pas sur cette machine.', why: 'Ce serait « closed ». Filtered signifie qu’aucune réponse n’est revenue.' },
          filtered: { text: 'Quelque chose, probablement un pare-feu, a bloqué les sondes. Le service existe peut-être, ou peut-être pas.', why: 'Exactement. Filtered est une absence de preuve, et vous la signalez comme telle.' },
          open: { text: 'MySQL est ouvert sur Internet.', why: 'Open signifie qu’un service a mené la poignée de main à son terme. Ce n’est pas le cas.' },
        },
      },
      tcpudp: {
        title: 'Transport',
        prompt: 'Pourquoi le DNS utilise-t-il normalement UDP, alors que HTTP utilise TCP ?',
        options: {
          speed: { text: 'Une requête DNS se résume à une petite question et une réponse, établir une connexion serait donc du gaspillage. HTTP a besoin d’une livraison fiable et ordonnée de données plus volumineuses.', why: 'Juste. UDP n’a pas de poignée de main, et l’application réessaie simplement. Les grandes réponses DNS passent bien à TCP.' },
          secure: { text: 'UDP est chiffré et TCP ne l’est pas.', why: 'Aucun des deux n’est chiffré en soi. TLS ajoute le chiffrement par-dessus.' },
          ports: { text: 'UDP a plus de ports.', why: 'Les deux ont les mêmes 65 536 numéros de port, dans des espaces séparés.' },
        },
      },
      architecture: {
        title: 'Architecture',
        prompt: 'Quelle affirmation vos preuves appuient-elles le mieux ?',
        options: {
          independent: { text: 'Nexus Labs gère sa propre infrastructure indépendante.', why: 'Son DNS, ses certificats et ses routes passent tous par quelqu’un d’autre.' },
          orion: { text: 'Orion Security gère le DNS, les certificats et la périphérie réseau de Nexus Labs et de Blackwell, et l’hôte d’archive de Nexus est un alias d’une machine de Blackwell.', why: 'Chaque partie s’appuie sur un enregistrement que vous avez collecté. C’est ainsi qu’on rédige une conclusion.' },
          owned: { text: 'Blackwell possède secrètement Nexus Labs.', why: 'Vos preuves réseau montrent des opérateurs communs, pas une propriété. N’affirmez pas plus que ce que vous pouvez montrer.' },
        },
      },
    },
  },
  review: {
    accomplished: 'Vous vous êtes situé sur un réseau, vous avez cartographié une cible à partir du DNS public et des données de service, lu des en-têtes TLS et HTTP, et transformé des enregistrements épars en description d’architecture.',
    concepts: ['IP, CIDR et routage', 'Types d’enregistrements DNS', 'TCP, UDP et ports', 'Open, closed et filtered', 'Codes d’état et en-têtes HTTP', 'Certificats TLS', 'robots.txt'],
    why: 'Rien de tout cela n’a exigé d’accès particulier. Le DNS doit être public pour qu’Internet fonctionne, les serveurs s’annoncent dans leurs en-têtes, et les routeurs répondent à traceroute. Une infrastructure laisse fuir son organigramme.',
    professional: 'Un professionnel obtient une autorisation écrite et un périmètre avant de lancer le moindre scan, note les commandes exactes et les heures, et sépare l’observation (« le CNAME pointe ici ») de la conclusion (« ils sont donc liés »).',
    defend: ['Retirez les serveurs de débogage de tout ce qui est joignable.', 'Passez en revue le DNS pour repérer les vieux alias et les dépendances envers des tiers.', 'Masquez les bannières de version, bloquez par défaut au pare-feu, et scannez-vous régulièrement.', 'Traitez vos fournisseurs de DNS et de certificats comme des fournisseurs critiques.'],
  },
};
