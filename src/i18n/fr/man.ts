import type { ManText } from '../en/man';

/**
 * Le manuel du poste, en français. Les commandes et les options servent de clés : elles ne changent pas d’une
 * langue à l’autre. Ton : un manuel sobre qui s’adresse au lecteur en « vous ».
 */
export const FR_MAN: Record<string, ManText> = {
  pwd: {
    name: 'affiche le dossier de travail',
    description: 'Affiche le chemin absolu du dossier où vous êtes. Chaque chemin relatif que vous tapez part d’ici.',
    examples: {
      pwd: 'où suis-je ?',
    },
    why: 'Sur une machine inconnue, savoir exactement où vous êtes évite les erreurs coûteuses.',
  },
  ls: {
    name: 'liste le contenu d’un dossier',
    description: 'Liste les fichiers d’un dossier. Les noms commençant par un point sont masqués, sauf avec -a. Le format long montre les permissions, le propriétaire, le groupe, la taille et la date de modification.',
    options: {
      '-l': 'format long : mode, liens, propriétaire, groupe, taille, date, nom',
      '-a': 'inclut les entrées cachées, y compris . et ..',
      '-A': 'inclut les entrées cachées, sans . ni ..',
      '-h': 'tailles lisibles (avec -l)',
      '-t': 'trie par date de modification, du plus récent au plus ancien',
      '-S': 'trie par taille, du plus grand au plus petit',
      '-r': 'inverse le tri',
      '-R': 'descend dans les sous-dossiers',
      '-d': 'liste le dossier lui-même, pas son contenu',
      '-1': 'une entrée par ligne',
    },
    examples: {
      'ls -la ~': 'tout votre dossier personnel, fichiers cachés compris',
      'ls -lt /var/log': 'les journaux modifiés le plus récemment d’abord',
    },
    why: 'C’est dans les fichiers cachés que vivent la configuration, l’historique du shell et les restes. Le premier réflexe de tout enquêteur est ls -la.',
  },
  cd: {
    name: 'change le dossier de travail',
    description: 'Déplace votre shell vers DIR. Sans argument, va à $HOME. « cd - » revient au dossier précédent. « .. » désigne le dossier parent, « . » le dossier courant, et « ~ » votre dossier personnel. Il faut la permission d’exécution sur un dossier pour y entrer.',
    examples: {
      'cd /var/log': 'chemin absolu, part de la racine',
      'cd ../Downloads': 'chemin relatif, part d’ici',
    },
    why: 'Les chemins absolus commencent par /. Les chemins relatifs partent de là où vous êtes. La plupart des confusions de débutants se résument à cette distinction.',
  },
  mkdir: {
    name: 'crée des dossiers',
    description: 'Crée des dossiers. Échoue si le parent manque ou si le dossier existe, sauf avec -p.',
    options: {
      '-p': 'crée les parents manquants, sans erreur si le dossier existe déjà',
    },
    examples: {
      'mkdir -p ~/cases/m02/notes': 'toute une arborescence d’un coup',
    },
  },
  rmdir: {
    name: 'supprime des dossiers vides',
    description: 'Supprime un dossier uniquement s’il est vide. L’alternative prudente à rm -r.',
  },
  touch: {
    name: 'crée un fichier ou met à jour sa date',
    description: 'Crée un fichier vide s’il n’existe pas, sinon règle sa date de modification sur maintenant.',
    why: 'Les dates se changent facilement. Ne considérez jamais une date de modification comme une preuve à elle seule.',
  },
  cp: {
    name: 'copie des fichiers et des dossiers',
    description: 'Copie des fichiers. Un dossier exige -r. Les copies conservent le contenu à l’octet près : le hash d’une copie correspond donc à celui de l’original.',
    options: {
      '-r': 'copie les dossiers récursivement',
    },
    examples: {
      'cp evidence.log ~/cases/': 'travailler sur une copie, garder l’original intact',
    },
    why: 'En investigation, on ne travaille jamais sur l’original. On travaille sur des copies vérifiées.',
  },
  mv: {
    name: 'déplace ou renomme des fichiers',
    description: 'Renomme un fichier, ou le déplace vers un autre dossier. Les deux opérations reviennent au même : changer l’entrée qui pointe vers les données.',
    examples: {
      'mv draft.txt report.txt': 'renommer',
      'mv report.txt ~/Documents/': 'déplacer',
    },
  },
  rm: {
    name: 'supprime des fichiers ou des dossiers',
    description: 'Supprime des entrées de dossier. Il n’y a pas de corbeille. Un dossier exige -r. -f fait taire les erreurs sur les fichiers manquants.',
    options: {
      '-r': 'supprime les dossiers et leur contenu',
      '-f': 'ignore les fichiers manquants, ne demande jamais',
    },
    why: 'Supprimer un fichier retire le nom, pas forcément les données sur le disque. C’est pour cela que la récupération fonctionne, et que « rm » n’est pas un effacement sûr.',
  },
  stat: {
    name: 'affiche l’état d’un fichier',
    description: 'Montre les métadonnées que le système de fichiers conserve sur un fichier : type, taille, permissions, propriétaire et dates.',
    examples: {
      'stat notes.txt': 'quand a-t-il été modifié pour la dernière fois, et par qui ?',
    },
    why: 'Les métadonnées de fichier ancrent les chronologies, mais elles peuvent être modifiées. Utilisez-les comme une source parmi d’autres.',
  },
  chmod: {
    name: 'change les permissions d’un fichier',
    description: 'Définit qui peut lire (r=4), écrire (w=2) et exécuter (x=1) un fichier, pour le propriétaire, le groupe et tous les autres. Les modes sont des chiffres octaux (640) ou symboliques (u+x, go-w). Seuls le propriétaire ou root peuvent les changer.',
    options: {
      '-R': 'applique récursivement',
    },
    examples: {
      'chmod +x run.sh': 'rendre un script exécutable',
      'chmod 600 key.pem': 'seul le propriétaire peut lire ou écrire',
    },
    why: 'Une clé lisible par tous ou une configuration modifiable est l’une des découvertes réelles les plus courantes. 600 pour les secrets, 755 pour les programmes.',
  },
  ln: {
    name: 'crée des liens entre fichiers',
    description: 'Crée un lien symbolique : un petit fichier qui pointe vers un autre chemin. Seuls les liens symboliques sont pris en charge sur ce système de fichiers.',
    options: {
      '-s': 'crée un lien symbolique',
    },
  },
  find: {
    name: 'cherche des fichiers dans une arborescence',
    description: 'Parcourt une arborescence et affiche chaque chemin qui répond à tous les tests donnés. Contrairement à ls, il regarde tout, fichiers cachés compris. Les dossiers illisibles produisent « Permission denied » sur stderr : éliminez-les avec 2>/dev/null.',
    options: {
      '-name GLOB': 'teste le nom du fichier (mettez le motif entre guillemets pour que le shell ne le développe pas)',
      '-iname GLOB': 'pareil, sans tenir compte de la casse',
      '-type f|d|l': 'seulement les fichiers, dossiers ou liens symboliques',
      '-maxdepth N': 'descend d’au plus N niveaux',
      '-user NAME': 'appartenant à NOM',
      '-perm MODE': 'bits de permission octaux exacts, par exemple 600',
      '-size +10k': 'plus de 10 Kio ; -size -1M signifie moins de 1 Mio',
    },
    examples: {
      'find /home -type f': 'tous les fichiers ordinaires sous /home',
      'find / -name "*.conf" 2>/dev/null': 'les fichiers de configuration, sans les erreurs de permission',
    },
    why: 'Quand vous ne savez pas où se trouve quelque chose, find vous évite de deviner.',
  },
  file: {
    name: 'détermine le type d’un fichier',
    description: 'Identifie un fichier d’après son contenu, plus précisément ses premiers « octets magiques », et non son nom. Une extension n’est qu’une étiquette ; la signature dit ce qu’est réellement le fichier.',
    examples: {
      'file invoice.pdf': 'est-ce vraiment un PDF ?',
    },
    why: 'Les attaquants comme les gens négligents renomment des fichiers. Ne vous fiez jamais à une extension de fichier.',
  },
  du: {
    name: 'estime l’espace disque utilisé',
    description: 'Indique l’espace occupé par une arborescence.',
    options: {
      '-s': 'résumé seulement',
      '-h': 'tailles lisibles',
    },
  },
  cat: {
    name: 'concatène des fichiers et les affiche',
    description: 'Écrit le contenu de chaque fichier sur la sortie standard. Sans fichier, lit l’entrée standard. Son nom vient de « concatenate », car il peut joindre plusieurs fichiers.',
    options: {
      '-n': 'numérote toutes les lignes',
    },
    examples: {
      'cat notes.txt': 'lire un fichier court',
      'cat a.log b.log > all.log': 'joindre deux journaux en un',
    },
  },
  echo: {
    name: 'affiche du texte',
    description: 'Affiche ses arguments séparés par des espaces. Le shell développe les variables avant même qu’echo les voie : c’est donc un moyen pratique d’observer ce que fait le shell.',
    options: {
      '-n': 'pas de saut de ligne final',
      '-e': 'interprète \\n et \\t',
    },
    examples: {
      'echo $HOME': 'afficher une variable',
      'echo "first note" >> notes.txt': 'ajouter à la fin d’un fichier',
    },
  },
  less: {
    name: 'parcourt du texte page par page',
    description: 'Affiche un fichier écran par écran, sans tout charger dans votre historique. Touches : j/k ou flèches pour défiler, espace pour descendre d’une page, b pour remonter, g et G pour aller en haut et en bas, /mot pour chercher, n pour répéter, q pour quitter.',
    examples: {
      'less /var/log/auth.log': 'parcourir un long journal',
      'grep ERROR app.log | less': 'parcourir des résultats',
    },
    why: 'Les vrais journaux font des milliers de lignes. cat sert pour les fichiers courts, less pour tout le reste.',
  },
  head: {
    name: 'affiche le début des fichiers',
    description: 'Affiche les 10 premières lignes, ou les N premières avec -n.',
    options: {
      '-n N': 'nombre de lignes',
      '-c N': 'nombre d’octets',
    },
    examples: {
      'head -n 5 access.log': 'voir le format d’un journal avant de l’analyser',
    },
    why: 'La première chose à faire avec un fichier de données inconnu : regarder sa forme.',
  },
  tail: {
    name: 'affiche la fin des fichiers',
    description: 'Affiche les 10 dernières lignes, ou les N dernières avec -n. « -n +N » commence plutôt à la ligne N.',
    options: {
      '-n N': 'nombre de lignes',
      '-n +N': 'commence à la ligne N',
      '-c N': 'nombre d’octets',
    },
    examples: {
      'tail -n 20 /var/log/auth.log': 'les événements les plus récents',
      'tail -n +2 data.csv': 'sauter une ligne d’en-tête',
    },
    why: 'Un journal s’allonge par le bas : le plus récent est à la fin.',
  },
  grep: {
    name: 'affiche les lignes qui correspondent à un motif',
    description: 'Filtre le texte ligne par ligne, en gardant celles qui correspondent à une expression régulière. Il lit des fichiers ou un tube. Mettez les motifs entre guillemets pour que le shell n’y touche pas.',
    options: {
      '-i': 'ignore la casse',
      '-v': 'inverse : garde les lignes qui ne correspondent PAS',
      '-n': 'préfixe chaque résultat par son numéro de ligne',
      '-c': 'affiche seulement le nombre de lignes trouvées',
      '-l': 'affiche seulement le nom des fichiers contenant un résultat',
      '-r': 'cherche récursivement dans les dossiers',
      '-E': 'regex étendue : + ? | ( ) fonctionnent sans antislash',
      '-o': 'affiche seulement la partie de la ligne qui correspond',
      '-w': 'correspond à des mots entiers seulement',
      '-F': 'traite le motif comme une chaîne fixe',
      '-A N / -B N': 'montre aussi N lignes après / avant chaque résultat',
    },
    examples: {
      'grep "404" access.log': 'toutes les lignes contenant 404',
      'grep -rl "quietfern" /missions': 'quels fichiers mentionnent ce pseudonyme ?',
      'cat auth.log | grep -v "Accepted" | grep -c "Failed"': 'les tubes resserrent les choses étape par étape',
    },
    why: 'L’essentiel d’une enquête, c’est du filtrage. grep transforme un journal d’un million de lignes en douze lignes qui comptent.',
  },
  wc: {
    name: 'compte les lignes, les mots et les octets',
    description: 'Compte des choses. Sans option, il affiche les lignes, les mots et les octets. Souvent placé à la fin d’un tube pour demander « combien ? ».',
    options: {
      '-l': 'lignes',
      '-w': 'mots',
      '-c': 'octets',
    },
    examples: {
      'grep "Failed" auth.log | wc -l': 'combien de connexions échouées ?',
    },
  },
  sort: {
    name: 'trie des lignes de texte',
    description: 'Trie les lignes par ordre alphabétique par défaut. -n trie numériquement : sans cela, 100 passe avant 9.',
    options: {
      '-r': 'inverse',
      '-n': 'numérique',
      '-u': 'unique : retire les doublons',
      '-f': 'ignore la casse',
      '-t SEP': 'séparateur de champs',
      '-k N': 'trie selon le champ N',
    },
    examples: {
      'sort users.txt': 'ordre alphabétique',
      'cut -d" " -f1 access.log | sort | uniq -c | sort -rn | head': 'le classique : qui apparaît le plus dans un journal',
    },
    why: 'sort | uniq -c | sort -rn : le calcul de fréquences que tout analyste tape sans y penser.',
  },
  uniq: {
    name: 'filtre les lignes répétées adjacentes',
    description: 'Réduit les suites de lignes identiques adjacentes. Comme il ne compare que les voisines, on trie presque toujours d’abord.',
    options: {
      '-c': 'préfixe chaque ligne par son nombre',
      '-d': 'montre seulement les lignes dupliquées',
      '-u': 'montre seulement les lignes non répétées',
      '-i': 'ignore la casse',
    },
    examples: {
      'sort users.txt | uniq': 'les utilisateurs distincts',
      'sort users.txt | uniq -d': 'qui apparaît plus d’une fois ?',
    },
  },
  cut: {
    name: 'sélectionne des colonnes de chaque ligne',
    description: 'Extrait des champs ou des caractères de chaque ligne. Le délimiteur par défaut est une tabulation, pas une espace, ce qui piège presque tout le monde une fois.',
    options: {
      '-d C': 'délimiteur de champs (un caractère)',
      '-f LIST': 'champs à garder : 1 ou 1,3 ou 2-4',
      '-c LIST': 'positions de caractères à garder',
    },
    examples: {
      'cut -d: -f1 /etc/passwd': 'tous les noms de comptes',
      'cut -d" " -f1 access.log': 'la première colonne d’un journal séparé par des espaces',
    },
  },
  tr: {
    name: 'transpose ou supprime des caractères',
    description: 'Remplace les caractères de SET1 par ceux de même position dans SET2. Ne lit que stdin. Les plages comme a-z fonctionnent.',
    options: {
      '-d': 'supprime les caractères de SET1',
      '-s': 'réduit les suites de caractères répétés à un seul',
    },
    examples: {
      'echo uryyb | tr a-zA-Z n-za-mN-ZA-M': 'ROT13 : un « chiffre » par décalage de lettres, sans clé',
      'cat f | tr -s " "': 'réduire les suites d’espaces',
    },
    why: 'ROT13 et ses semblables sont des encodages, pas du chiffrement. Sans clé, pas de secret.',
  },
  sed: {
    name: 'éditeur de flux (sous-ensemble de substitution)',
    description: 'Modifie le texte à mesure qu’il passe. Ce poste prend en charge les formes courantes : substitution, affichage de plages de lignes et suppression des lignes qui correspondent.',
    examples: {
      'sed \'s/ERROR/!!/g\' app.log': 'remplacer chaque occurrence',
      'sed -n \'10,20p\' access.log': 'seulement les lignes 10 à 20',
    },
  },
  awk: {
    name: 'affichage de champs selon un motif (sous-ensemble)',
    description: 'Découpe chaque ligne en champs ($1, $2..., $NF le dernier, $0 la ligne entière) et affiche ce que vous demandez. Contrairement à cut, le séparateur par défaut est toute suite d’espaces. Ce poste prend en charge print avec une condition facultative /regex/ ou une comparaison sur $N.',
    examples: {
      'awk \'{print $1}\' access.log': 'la première colonne',
      'awk \'$9 == 404 {print $7}\' access.log': 'les chemins qui ont renvoyé 404',
    },
  },
  tee: {
    name: 'copie l’entrée standard vers un fichier et vers la sortie standard',
    description: 'Permet d’enregistrer la sortie d’un tube tout en la voyant. -a ajoute à la fin.',
    examples: {
      'grep Failed auth.log | tee failures.txt | wc -l': 'garder la preuve et le décompte',
    },
  },
  nl: {
    name: 'numérote les lignes',
    description: 'Affiche les lignes avec leur numéro.',
  },
  whoami: {
    name: 'affiche le nom de l’utilisateur courant',
    description: 'Affiche le nom d’utilisateur sous lequel tourne votre shell. Votre accès à chaque fichier en dépend.',
    why: 'Souvent la toute première commande sur un système. Qui vous êtes décide de ce que vous pouvez toucher.',
  },
  id: {
    name: 'affiche l’identité de l’utilisateur et ses groupes',
    description: 'Affiche votre identifiant numérique (uid), votre groupe principal (gid) et tous vos groupes. L’uid 0 est root. L’appartenance à un groupe donne souvent plus d’accès que l’utilisateur lui-même.',
    why: 'Appartenir à un groupe inattendu, comme « adm » ou « lab », est une façon courante de pouvoir lire plus qu’on ne devrait.',
  },
  uname: {
    name: 'affiche les informations du système',
    description: 'Affiche le nom du noyau. -a affiche tout, y compris le nom d’hôte, la version du noyau et l’architecture.',
    options: {
      '-a': 'toutes les informations',
      '-n': 'nom d’hôte réseau',
      '-r': 'version du noyau',
      '-m': 'matériel de la machine',
    },
  },
  hostname: {
    name: 'affiche le nom d’hôte du système',
    description: 'Affiche le nom de cette machine. Quand vous travaillez sur plusieurs hôtes, vérifiez-le avant de lancer quoi que ce soit.',
  },
  date: {
    name: 'affiche la date et l’heure du système',
    description: 'Affiche la date et l’heure courantes. Ce poste fonctionne en UTC, comme la plupart des serveurs.',
    why: 'Les fuseaux horaires sont le piège classique des chronologies. Ramenez tout à l’UTC.',
  },
  ps: {
    name: 'liste les processus en cours',
    description: 'Liste les processus. Seul, il ne montre que votre terminal. « ps aux » montre chaque processus de la machine avec son propriétaire, ses ressources et sa ligne de commande complète.',
    options: {
      aux: 'tous les processus, format BSD',
      '-ef': 'tous les processus, format complet',
    },
    examples: {
      'ps aux | grep relay': 'ce service tourne-t-il, et sous quel utilisateur ?',
    },
    why: 'Les lignes de commande sont révélatrices. Un processus ou un propriétaire surprenant est souvent le premier signe d’un problème.',
  },
  top: {
    name: 'affiche les processus en direct',
    description: 'Montre une vue actualisée en continu des processus et de la charge. Appuyez sur q pour quitter.',
    why: 'Utile pour voir ce qui consomme une machine en ce moment, et ce qui se réveille à heure fixe.',
  },
  history: {
    name: 'affiche l’historique des commandes',
    description: 'Liste les commandes lancées. « !! » relance la dernière, « !N » relance la numéro N. Les flèches haut et bas le parcourent.',
    options: {
      '-c': 'efface l’historique de la session',
    },
    why: 'L’historique du shell est l’un des premiers éléments qu’un enquêteur lit sur une machine compromise. Il ne capture pas tout, et il peut être effacé.',
  },
  clear: {
    name: 'efface l’écran du terminal',
    description: 'Efface l’écran visible. Votre historique reste intact. Ctrl+L fait la même chose.',
  },
  env: {
    name: 'affiche les variables d’environnement',
    description: 'Affiche toutes les variables d’environnement de ce shell. Les programmes en héritent, et elles configurent beaucoup de comportements.',
    why: 'Les secrets laissés dans des variables d’environnement sont une découverte récurrente. Quiconque peut lire l’environnement d’un processus peut les lire.',
  },
  export: {
    name: 'définit une variable d’environnement',
    description: 'Définit une variable pour ce shell et tout ce qu’il lance. Sans argument, liste les variables exportées.',
    examples: {
      'export CASE=m02': 'puis : echo $CASE',
    },
  },
  unset: {
    name: 'supprime une variable d’environnement',
    description: 'Supprime des variables du shell.',
  },
  which: {
    name: 'localise une commande',
    description: 'Indique où se trouve une commande dans le $PATH, et donc quel programme s’exécute réellement quand vous tapez son nom.',
    why: 'Si un dossier placé plus tôt dans le PATH contient un faux « ls », c’est lui qui s’exécute. Connaître le vrai chemin compte.',
  },
  type: {
    name: 'décrit comment un nom serait interprété',
    description: 'Indique si un nom est une commande interne du shell ou un programme sur le disque.',
  },
  man: {
    name: 'lit le manuel d’une commande',
    description: 'Ouvre la page de manuel d’une commande. Défilez avec les flèches ou l’espace, q pour quitter. Quand quelque chose ne marche pas, commencez par la page de manuel.',
    examples: {
      'man grep': 'toutes les options que grep accepte ici',
    },
    why: 'Les pros ouvrent le manuel sans arrêt. Personne ne retient toutes les options.',
  },
  help: {
    name: 'liste les commandes disponibles',
    description: 'Liste ce qui est disponible sur ce poste, regroupé par usage. « help COMMANDE » en donne un résumé d’une ligne.',
  },
  exit: {
    name: 'quitte le shell courant',
    description: 'Ferme une session ssh et revient à l’hôte précédent. Sur le poste lui-même, il n’y a nulle part où revenir.',
  },
  sudo: {
    name: 'lance une commande sous un autre utilisateur',
    description: 'Lance une commande en tant que root, si la politique sudoers vous y autorise. « sudo -l » liste ce que vous pouvez lancer. Chaque utilisation est journalisée.',
    options: {
      '-l': 'liste vos commandes autorisées',
    },
    why: 'Une règle sudo trop large est une élévation de privilèges en puissance. « sudo -l » est l’une des premières vérifications de tout audit.',
  },
  sh: {
    name: 'lance un script shell',
    description: 'Exécute les commandes d’un fichier texte, une ligne à la fois. « ./fichier » exige la permission d’exécution (chmod +x) ; « sh fichier » exige seulement la permission de lecture. Lisez un script avant de le lancer.',
    why: 'Ne lancez jamais un script que vous n’avez pas lu. C’est la règle la plus utile de ce manuel.',
  },
  true: {
    name: 'ne fait rien, avec succès',
    description: 'Se termine avec le statut 0.',
  },
  false: {
    name: 'ne fait rien, sans succès',
    description: 'Se termine avec le statut 1.',
  },
  sha256sum: {
    name: 'calcule ou vérifie des hashs SHA-256',
    description: 'Calcule l’empreinte de 256 bits d’un fichier. Changez un seul octet et le hash change entièrement. Avec -c, lit des lignes « HASH  FICHIER » et vérifie chacune. Votre copie, ou la preuve qu’on vous a remise, correspond à l’enregistrement ou non.',
    options: {
      '-c FILE': 'vérifie les hashs listés dans FICHIER',
    },
    examples: {
      'sha256sum auth.log': 'calculer l’empreinte d’un fichier',
      'sha256sum -c MANIFEST.sha256': 'vérifier tout un lot de preuves',
    },
    why: 'Les hashs permettent de défendre une preuve numérique. Vous notez le hash à la collecte, et n’importe qui peut vérifier ensuite que rien n’a changé. MD5 et SHA-1 ont des collisions connues : utilisez SHA-256.',
  },
  base64: {
    name: 'encode ou décode du base64',
    description: 'Le base64 représente n’importe quels octets avec seulement 64 caractères imprimables, pour que des données binaires passent par des canaux texte. La sortie se termine souvent par un remplissage =. C’est un encodage : n’importe qui peut l’inverser. Pas de clé, pas de secret.',
    options: {
      '-d': 'décode',
    },
    examples: {
      'echo -n admin | base64': 'donne YWRtaW4=',
      'echo YWRtaW4= | base64 -d': 'donne admin',
    },
    why: 'Le base64 est partout : authentification HTTP basique, jetons de session, pièces jointes. Le prendre pour du chiffrement est une faille classique, et bien réelle.',
  },
  xxd: {
    name: 'produit un vidage hexadécimal, ou l’inverse',
    description: 'Montre les octets bruts d’un fichier en hexadécimal, avec les caractères imprimables à droite. -r -p retransforme de l’hexa pur en octets, utile quand on vous remet une chaîne hexadécimale.',
    options: {
      '-l N': 's’arrête après N octets',
      '-p': 'hexa pur sans adresses',
      '-r': 'inverse : de l’hexa vers les octets',
    },
    examples: {
      'xxd -l 16 photo.jpg': 'les premiers octets révèlent le vrai type de fichier : ff d8 ff, c’est du JPEG',
      'echo 68656c6c6f | xxd -r -p': 'se décode en « hello »',
    },
    why: 'Signatures de fichiers, données cachées, en-têtes malformés : quand les outils se contredisent, les octets tranchent.',
  },
  strings: {
    name: 'affiche les suites de caractères imprimables d’un fichier',
    description: 'Parcourt n’importe quel fichier, même binaire, à la recherche de suites d’au moins 4 caractères imprimables. Un premier regard grossier, mais étonnamment efficace, sur un fichier inconnu.',
    options: {
      '-n N': 'longueur minimale d’une suite',
    },
    examples: {
      'strings photo.jpg | head': 'quel texte lisible se cache là-dedans ?',
    },
    why: 'Des chemins, des URL, des noms d’auteurs et des commentaires oubliés survivent dans les binaires plus souvent que leurs auteurs ne le pensent.',
  },
  exiftool: {
    name: 'lit les métadonnées d’un fichier',
    description: 'Lit les métadonnées intégrées aux documents et aux images : auteur, logiciel, dates de création, modèle d’appareil, coordonnées GPS. Beaucoup de gens ignorent que ces données voyagent avec leurs fichiers.',
    examples: {
      'exiftool ridge_0412.jpg': 'où et quand cette photo a-t-elle été prise ?',
      'exiftool newsletter.pdf': 'qui a écrit ce document, avec quel logiciel ?',
    },
    why: 'Des métadonnées ont brisé des carrières et localisé des fugitifs. La leçon défensive : retirez-les avant de publier quoi que ce soit. Elles peuvent aussi être falsifiées : recoupez toujours.',
  },
  pdftotext: {
    name: 'extrait le texte d’un PDF',
    description: 'Affiche le texte d’un PDF sur la sortie standard, pour pouvoir l’envoyer dans grep et ses semblables.',
    examples: {
      'pdftotext newsletter.pdf | grep -i maret': 'trouver un nom dans un document',
    },
  },
  ping: {
    name: 'teste l’accessibilité avec un écho ICMP',
    description: 'Envoie des requêtes d’écho ICMP et indique les réponses et le temps d’aller-retour. Une réponse signifie que l’hôte est actif et que l’ICMP est autorisé. Pas de réponse ne signifie pas qu’il est éteint : beaucoup d’hôtes ignorent l’ICMP sans rien dire. La sortie montre aussi l’IP résolue et le TTL.',
    options: {
      '-c N': 'nombre de paquets (ici 4 par défaut)',
    },
    examples: {
      'ping -c 2 nexus-labs.test': 'est-il joignable ? à quelle distance ?',
    },
    why: 'Première étape de dépannage, et leçon sur les limites d’une preuve : le silence ne prouve rien.',
  },
  traceroute: {
    name: 'montre la route des paquets vers un hôte',
    description: 'Envoie des paquets avec un TTL croissant. Chaque routeur du chemin qui en abandonne un le signale, ce qui révèle le chemin saut par saut. « * * * » signifie qu’un routeur n’a pas répondu, pas que le chemin est coupé.',
    examples: {
      'traceroute nexus-labs.test': 'qui transporte ce trafic ?',
    },
    why: 'Le nom des routeurs trahit souvent qui exploite un réseau. Si deux sociétés « sans lien » partagent une passerelle, c’est intéressant.',
  },
  ip: {
    name: 'montre les interfaces réseau et les routes',
    description: '« ip addr » liste les interfaces et leurs adresses. « ip route » montre la table de routage : où vont les paquets. La route « default » est la passerelle utilisée pour tout le reste. Le suffixe CIDR /24 signifie que les 24 premiers bits identifient le réseau : 10.40.0.0/24 va donc de 10.40.0.0 à 10.40.0.255.',
    examples: {
      'ip a': 'quelle est mon adresse ?',
      'ip r': 'quelle est ma passerelle ?',
    },
    why: 'Avant d’enquêter sur un réseau, sachez où vous vous y trouvez.',
  },
  ss: {
    name: 'montre les sockets',
    description: 'Liste les sockets réseau de cette machine. TCP ouvre une connexion et garantit la livraison ; UDP envoie sans vérifier. Un port à l’état LISTEN est un service qui attend des connexions ; ESTAB est une connexion active.',
    options: {
      '-t': 'TCP',
      '-u': 'UDP',
      '-l': 'en écoute seulement',
      '-n': 'numérique, ne résout pas les noms',
      '-a': 'tous les états',
      '-p': 'montre le processus propriétaire',
    },
    examples: {
      'ss -tuln': 'que propose cette machine au réseau ?',
    },
    why: 'Chaque port en écoute est une surface d’attaque. Sachez ce qui est ouvert, et pourquoi.',
  },
  dig: {
    name: 'interroge le DNS',
    description: 'Demande au DNS les enregistrements d’un nom. A : adresse IPv4. CNAME : alias vers un autre nom. MX : serveurs de courrier. NS : serveurs de noms faisant autorité. TXT : texte libre, utilisé pour le SPF, les jetons de vérification et bien d’autres choses. C’est la section de réponse qui compte ; +short n’affiche qu’elle.',
    options: {
      TYPE: 'A (par défaut), MX, NS, TXT, CNAME, SOA',
      '+short': 'les réponses seulement',
      '-x IP': 'recherche inverse (PTR)',
    },
    examples: {
      'dig nexus-labs.test': 'l’échange complet',
      'dig nexus-labs.test TXT +short': 'qui peut envoyer du courrier pour ce domaine ?',
      'dig -x 203.0.113.21': 'quel nom revendique cette adresse ?',
    },
    why: 'Le DNS est public par conception. Une société peut cacher bien des choses, mais ses enregistrements DNS disent qui sont vraiment ses prestataires, ses hébergeurs de courrier et son infrastructure.',
  },
  host: {
    name: 'recherche DNS simple',
    description: 'Une alternative concise à dig : affiche les adresses et les serveurs de courrier d’un nom.',
  },
  whois: {
    name: 'consulte l’enregistrement d’un domaine',
    description: 'Interroge la fiche d’enregistrement d’un domaine : bureau d’enregistrement, dates et parfois titulaire. Les services de confidentialité masquent souvent le propriétaire, mais les dates de création sont déjà parlantes. Un « cabinet de dix ans » avec un domaine de cinq mois, c’est un signal d’alerte.',
    examples: {
      'whois lindgate.test': 'quel âge a vraiment cette société ?',
    },
    why: 'Les données d’enregistrement sont l’un des moyens les moins coûteux de vérifier ce qu’une organisation affirme.',
  },
  nmap: {
    name: 'cartographe de réseau (simulé, laboratoire uniquement)',
    description: 'Découvre des hôtes et des ports ouverts. Les scans TCP indiquent si un port est open (un service a répondu), closed (l’hôte a répondu, rien n’écoute) ou filtered (un pare-feu a avalé la sonde). Dans cette simulation, nmap n’atteint que les hôtes définis dans le laboratoire. Sur un vrai réseau, ne scannez que ce que vous avez l’autorisation écrite de scanner.',
    options: {
      '-sn': 'découverte d’hôtes seulement, sans scan de ports',
      '-sV': 'sonde les ports ouverts pour le service et la version',
      '-p LIST': 'ports précis : -p 22,80,443 ou -p 1-1024',
    },
    examples: {
      'nmap -sn 10.40.0.0/24': 'qui est actif sur ce sous-réseau ?',
      'nmap -sV vault-02.lab.test': 'qu’expose cet hôte ?',
    },
    why: 'Les défenseurs le lancent sur leurs propres réseaux pour voir ce que verrait un attaquant. Un scan non autorisé peut être illégal, c’est pourquoi l’autorisation passe d’abord.',
  },
  curl: {
    name: 'transfère des données par URL (réseau simulé)',
    description: 'Parle HTTP en ligne de commande et montre ce qu’un navigateur cache. Une requête a une méthode, un chemin, des en-têtes et parfois un corps ; une réponse a un code d’état, des en-têtes et un corps. Codes : 2xx succès, 3xx redirection, 4xx vous avez fait une erreur, 5xx le serveur en a fait une. Tout le trafic reste dans le réseau simulé.',
    options: {
      '-i': 'inclut les en-têtes de réponse',
      '-I': 'requête HEAD : en-têtes seulement',
      '-v': 'détaillé : montre tout l’échange, y compris le certificat TLS',
      '-L': 'suit les redirections',
      '-s': 'silencieux',
      '-o FILE': 'enregistre le corps dans FICHIER',
      '-O': 'enregistre sous le nom de l’URL',
      '-X METHOD': 'définit la méthode, par exemple POST',
      '-d DATA': 'envoie un corps de formulaire (implique POST)',
      '-H "K: V"': 'ajoute un en-tête de requête',
      '-b "k=v"': 'envoie des cookies, ou les lit depuis un fichier',
      '-c FILE': 'enregistre les cookies reçus dans FICHIER',
      '-A AGENT': 'définit le User-Agent',
      '-F field=@file': 'envoie un fichier en formulaire multipart',
    },
    examples: {
      'curl -I http://nexus-labs.test/': 'quel serveur est-ce ? quels en-têtes définit-il ?',
      'curl -d "user=x&pass=y" -i http://portal.nexus-labs.test/login': 'envoyer un formulaire de connexion à la main',
      'curl -b "session=abc" http://portal.nexus-labs.test/account': 'envoyer un cookie',
    },
    why: 'Un navigateur n’est qu’une couche de politesse posée là-dessus. Voir le HTTP brut permet de comprendre ce qui protège vraiment une application web, et ce qui en a seulement l’air.',
  },
  wget: {
    name: 'télécharge des fichiers (réseau simulé)',
    description: 'Télécharge une URL dans un fichier, nommé par défaut d’après la dernière partie de l’URL. curl affiche par défaut, wget enregistre par défaut.',
    options: {
      '-O FILE': 'fichier de sortie',
      '-q': 'silencieux',
    },
    examples: {
      'wget http://trailtalk.test/uploads/ridge_0412.jpg': 'récupérer un document pour l’analyser hors ligne',
    },
  },
  sqlite3: {
    name: 'interroge une base SQLite',
    description: 'Un vrai moteur SQLite. Avec un simple fichier, il ouvre une invite interactive. Les commandes commençant par un point (.tables, .schema, .headers on, .mode column) s’adressent à l’outil ; tout le reste est du SQL et se termine par un point-virgule. Les images de preuve sont montées en lecture seule : toute tentative d’écriture est refusée, comme il se doit quand on préserve une preuve.',
    options: {
      '-header': 'affiche le nom des colonnes',
      '-column': 'colonnes alignées',
      '-csv': 'sortie CSV',
      '-readonly': 'ouvre en lecture seule',
    },
    examples: {
      'sqlite3 archive.db ".tables"': 'qu’y a-t-il là-dedans ?',
      'sqlite3 archive.db ".schema staff"': 'quelles colonnes a cette table ?',
      'sqlite3 -header -column archive.db "SELECT * FROM staff LIMIT 5"': 'regarder avant de raisonner',
    },
    why: 'La plupart des faits du monde vivent dans des tables. Lire un schéma vous dit ce qu’une organisation jugeait digne d’être enregistré, et les tables d’audit ce qu’elle en a fait.',
  },
  mission: {
    name: 'affiche la mission active',
    description: 'Affiche la mission active et l’état de ses objectifs. Les mêmes informations que le panneau Missions, sans quitter le clavier.',
  },
  submit: {
    name: 'dépose une conclusion pour la mission active',
    description: 'Sans argument, liste ce à quoi la mission attend encore une réponse. Avec une clé et une valeur, dépose une conclusion. Les mauvaises réponses ne coûtent rien, mais figurent dans votre bilan de mission. Réfléchissez d’abord, déposez ensuite.',
    examples: {
      submit: 'que reste-t-il à déposer ?',
      'submit uid 1000': 'déposer une conclusion',
    },
  },
  hint: {
    name: 'demande l’indice suivant pour un objectif',
    description: 'Révèle le niveau d’indice suivant pour le premier objectif ouvert, ou pour l’objectif N. Les indices sont d’abord vagues, puis précis. Les utiliser réduit un peu le bonus de cet objectif, rien de plus. Buter sur un objectif, c’est normal.',
  },
  evidence: {
    name: 'gère votre casier à preuves',
    description: 'Enregistre un fichier dans votre casier avec un hash SHA-256 pris au moment de la collecte, selon le principe de la chaîne de possession. « verify » recalcule le hash d’un fichier et le compare au casier. Modifier un fichier rompt son lien avec l’original : collectez d’abord, annotez des copies.',
    examples: {
      'evidence add ~/Downloads/ridge_0412.jpg': 'collecter et hasher un fichier',
      'evidence list': 'qu’est-ce que j’ai ?',
    },
    why: 'Une preuve que personne ne peut vérifier n’est qu’une histoire. Calculez le hash à la collecte, notez la source, travaillez sur des copies.',
  },
  dossier: {
    name: 'assemble un dossier vérifiable',
    description: 'Travaille sur le dossier ~/dossier. « status » vérifie chaque pièce requise d’après son étiquette de contenu : renommer un fichier ne pose pas de problème, le modifier si. « seal » écrit ~/dossier.tar avec un manifeste de hashs. Une archive ne lira rien de ce qu’elle ne peut pas vérifier.',
    examples: {
      'mkdir ~/dossier && cp evidence.db ~/dossier/': 'le construire avec des commandes de fichiers ordinaires',
      'dossier status': 'que manque-t-il encore ?',
    },
  },
  note: {
    name: 'ajoute une ligne à votre journal',
    description: 'Ajoute une ligne horodatée à votre journal d’enquête. Une conclusion que vous ne pouvez pas reproduire à partir de vos propres notes est une rumeur.',
  },
  diff: {
    name: 'compare deux fichiers ligne par ligne',
    description: 'Montre les lignes qui diffèrent. Les lignes « < » n’existent que dans le premier fichier, les lignes « > » que dans le second. Aucune sortie et un statut 0 signifient que les fichiers sont identiques.',
    examples: {
      'diff auth.log rotated/auth.log.1': 'qu’est-ce qui a changé entre ces deux copies ?',
    },
    why: 'Un hash vous dit que quelque chose a changé. diff vous dit quoi.',
  },
};
