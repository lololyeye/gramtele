<div align="center">

# gramtele

**Un jeu d'enquête en cybersécurité, qui se joue dans un vrai terminal.**

[**Jouer dans le navigateur**](https://lololyeye.github.io/gramtele/)

Aucune installation, aucun compte. La partie reste dans ton navigateur.

![Tests et déploiement](https://github.com/lololyeye/gramtele/actions/workflows/deploy.yml/badge.svg)

</div>

---

Un inconnu qui signe NULL te contacte sur Gramtele, une messagerie anonyme. Il te propose de petits travaux de vérification, bien payés, sans histoires. Tu lis des fichiers, tu croises des sources, tu interroges une base de données.

Puis tu commences à comprendre pour qui tu travailles, et ce qui est arrivé aux contractuels d'avant.

![Le terminal et la mission en cours](docs/screens/terminal.png)

## Ce qu'on y fait

Rien n'est scripté à coups de réponses toutes faites. Le terminal interprète vraiment ce que tu tapes, et les objectifs vérifient l'état réel du jeu : le fichier existe-t-il, la requête a-t-elle renvoyé les bonnes lignes, la preuve est-elle intacte ?

| Chapitre | Mission | Ce que tu apprends |
|---|---|---|
| 1 | **A Quiet Introduction** | Linux : arborescence, droits, `find`, `grep`, pipes |
| 2 | **The Digital Shadow** | OSINT : pivots, métadonnées, fiabilité des sources |
| 3 | **The Forgotten Archive** | SQL : schémas, `JOIN`, `GROUP BY`, journaux d'audit |
| 4 | **Surface Area** | Réseau : DNS, ports, HTTP, certificats, traceroute |
| 5 | **Keep Copies** | Le dossier de preuves, puis la décision qui clôt l'histoire |

Chaque mission se termine par une revue : ce que tu as fait, pourquoi la méthode marche, et comment s'en défendre. Trois niveaux d'indices sont là si tu bloques.

**Cinq fins.** Tes choix comptent : ce que tu transmets, ce que tu tais et à qui tu fais confiance changent la manière dont l'histoire se conclut.

![Une conversation sur Gramtele](docs/screens/gramtele.png)

## Dans le jeu

- **Terminal** : système de fichiers virtuel, permissions, pipes, redirections, variables, globs, historique, complétion, `man` et `less`.
- **Vraies requêtes SQL** : SQLite tourne en WebAssembly. Les bases de preuves sont en lecture seule.
- **Internet simulé** : `dig`, `nmap`, `curl`, `whois`, `traceroute`, un navigateur intégré et une carte qui grandit avec tes découvertes.
- **Gramtele** : conversations, groupe, archives, pièces jointes, profils que tu complètes en enquêtant.
- **Progression** : les compétences s'obtiennent en les démontrant, pas en les achetant.
- **Sauvegardes** : automatique, trois emplacements, export et import.
- **Confort** : tout au clavier, adapté au mobile, mouvement réduit, taille de texte réglable, son optionnel et coupé par défaut.

![L'analyse d'une base de données](docs/screens/mission.png)

## Tout est simulé

Rien de ce que tu tapes ne quitte la page.

- Les commandes ne touchent jamais ta machine : elles s'exécutent sur un système de fichiers virtuel.
- Les machines et les sites sont fictifs. Le jeu n'utilise que des domaines `.test` et des adresses réservées (RFC 5737 et RFC 1918).
- La version en ligne applique une politique de sécurité (CSP) qui interdit au navigateur de contacter un autre serveur.
- Les personnes, les entreprises et les données sont inventées.

Le jeu enseigne à enquêter et à comprendre. Il ne contient ni exploitation d'application, ni outil utilisable contre un vrai système.

## Lancer le projet

Il faut Node.js 22 ou plus récent.

```bash
git clone https://github.com/lololyeye/gramtele.git
cd gramtele
npm install
npm run dev
```

| Commande | Rôle |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm test` | Tests, dont une partie complète jouée de bout en bout |
| `npm run build` | Vérification des types et build de production |

## Organisation du code

```
src/
  game/   moteur sans React : shell, système de fichiers, réseau virtuel, SQL, sauvegardes
  data/   contenu : missions, dialogues, sites, bases de données
  ui/     interface React
docs/     bible de l'histoire (attention, elle dévoile tout)
```

Construit avec React, TypeScript, Vite et [sql.js](https://github.com/sql-js/sql.js).

Le contenu du jeu est en anglais.
