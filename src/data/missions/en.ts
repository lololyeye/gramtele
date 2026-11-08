import type { TextSet } from './format';

/**
 * Missions, reports, reviews and the record screens, in English. fr.ts is written separately and uses the same keys.
 * Commands, paths, column names and tool output stay literal: the player types them.
 */
export const EN_TEXT: TextSet = {
  missions: {
    m01: {
      title: 'A Quiet Introduction',
      requires: ['Nothing. If you can type, you can start.'],
      intro: [
        'NULL has given you a machine: a contractor workbench, reached through a terminal. Before Lindgate pays anyone, it wants to know they can find their way around a Linux box without being led.',
        'Confirm who you are on the system, find the intake document, read your relay settings and leave a receipt.',
      ],
      concepts: [
        {
          term: 'The filesystem is a tree',
          text: 'Everything hangs off / (the root). An absolute path starts with /. A relative path starts from where you are now.',
        },
        {
          term: 'Users and ids',
          text: 'Every process runs as a user with a numeric id. Permissions on each file are checked against that id. Who you are decides what you can touch.',
        },
        {
          term: 'Hidden files',
          text: 'Names starting with a dot do not appear in a plain ls. That is a convention, not a protection. ls -a shows them.',
        },
      ],
      resources: ['Terminal', 'man COMMAND for any tool', 'hint, if you get stuck'],
      environment: 'Workbench image, your home at /home/player. Assignment folder at /missions/m01.',
      files: [
        `ASSIGNMENT m01 - WORKBENCH ORIENTATION
Contact: NULL

1. Confirm your numeric user id. (whoami, id)
2. Change into this assignment folder and list it.
3. Locate intake.txt. It is somewhere under /home. Do not walk there by hand.
   Learn "find".
4. Read the relay settings the intake document points to, and file your
   contractor reference and the upstream relay host with "submit".
5. Leave a receipt: create the directory ~/cases/m01, and in it a file
   called receipt.txt containing your contractor reference.
`,
      ],
      objectives: {
        identity: {
          text: 'Identify the current user and file your numeric uid.',
          note: 'Run whoami, then id. The uid is the number after uid=.',
          hints: [
            'There is a command that prints your identity in numbers. It has a very short name.',
            'Type: id',
            'The output begins uid=1000(player). File it with: submit uid 1000',
          ],
          answer: {
            prompt: 'Your numeric user id',
            placeholder: 'number',
            wrong: 'That is not your uid. The "id" command prints it after uid=.',
            right: 'Uid 1000 is the first ordinary user on most Linux systems. Uid 0 is root.',
          },
        },
        navigate: {
          text: 'Move into /missions/m01 and list its contents.',
          note: 'cd changes directory. ls lists. pwd tells you where you are.',
          hints: [
            'You need to change your working directory, using an absolute path.',
            'cd takes a path. Absolute paths start with /.',
            'cd /missions/m01 and then ls',
          ],
        },
        find: {
          text: 'Locate intake.txt with find, and read it.',
          note: 'Do not guess at the path. find walks the tree for you.',
          hints: [
            'find takes a starting directory and a test. man find lists the tests.',
            'Use the -name test with the file name, starting from /home.',
            'find /home -name "intake.txt" then cat the path it prints.',
          ],
        },
        config: {
          text: 'Read the relay configuration. File your contractor reference and the upstream host.',
          note: 'Configuration files often say more about a system than its documentation.',
          hints: [
            'intake.txt names the file you want.',
            'cat /opt/relay/relay.conf. Look for contractor_ref and host.',
            'submit contractor_ref c-0047 and submit upstream with the host value.',
          ],
          answer: {
            prompt: 'Your contractor reference',
            placeholder: 'c-0000',
            wrong: 'Not what the live configuration says. A draft file on this box is out of date: check which file you read.',
            right: 'Note that you read this from the live configuration, not the draft sitting next to the intake document.',
          },
          extraAnswers: [
            {
              prompt: 'Upstream relay host',
              placeholder: 'host name',
              wrong: 'Read the host line in the [upstream] section of relay.conf.',
              right: 'Your workbench keeps a live connection to this host. Remember the name.',
            },
          ],
        },
        receipt: {
          text: 'Create ~/cases/m01/receipt.txt containing your contractor reference.',
          note: 'mkdir -p makes the path. echo ... > file writes it.',
          hints: [
            'Two steps: make the directories, then write the file.',
            'mkdir -p makes parents as it goes. The > operator sends output into a file.',
            'mkdir -p ~/cases/m01 then echo "c-0047" > ~/cases/m01/receipt.txt',
          ],
        },
      },
      optionals: {
        notes41: {
          title: 'Something left behind',
          text: 'A previous user left a note in a hidden file. It was never yours to read, and now you have read it.',
          journal: [
            'A previous contractor, "lowtide", c-0041, left a note in ~/.cache. "The exercises are not exercises."',
          ],
        },
        history41: {
          title: 'Someone else\'s history',
          text: '.bash_history belongs to whoever had this box before you. It ends with an attempt to clean up.',
        },
        relayproc: {
          title: 'What is this box talking to?',
          text: 'ps aux shows a relay daemon running as its own user, started before you ever logged in.',
        },
      },
      review: {
        accomplished: 'You oriented yourself on an unfamiliar Linux system, located a file with a real search rather than guessing, and read configuration straight from the source.',
        concepts: ['Absolute and relative paths', 'Users, uids and permissions', 'find with -name', 'Redirection with >', 'Hidden files'],
        why: 'find works because the filesystem is a single tree that can be walked. Reading the live configuration instead of the nearby draft is the first lesson of investigation: go to the authoritative source.',
        professional: 'A professional starts every engagement on a new host with the same five commands: whoami, id, hostname, pwd, ls -la. They note the time, the host and the user before doing anything else.',
        defend: [
          'Do not leave drafts with stale settings next to live ones: people will use them.',
          'A "wiped" home directory should be verified. Hidden files survive careless cleanups.',
          'Keep a record of who was issued which machine, and rebuild images between users.',
        ],
      },
    },
    m02: {
      title: 'The Digital Shadow',
      requires: ['Moving around the filesystem', 'Reading files'],
      intro: [
        'A client of Lindgate is doing diligence on a former employee of a supplier. All NULL has is a handle: quietfern.',
        'Establish who is behind it using public sources only. Find a name, an employment history and a current location, then state how far you trust each of them.',
      ],
      concepts: [
        {
          term: 'Pivoting',
          text: 'Each fact gives you a new thing to search for. A handle leads to a post, a post to a document, a document to a name.',
        },
        {
          term: 'Username correlation',
          text: 'The same handle on two sites is a lead, never a conclusion. People share handles by accident. Look for independent facts that match.',
        },
        {
          term: 'Metadata',
          text: 'Files carry information about themselves: author, software, timestamps, GPS. Many people never know this.',
        },
        {
          term: 'Source reliability',
          text: 'Ask of every claim: who published this, could it be wrong, and is there a second independent source?',
        },
      ],
      resources: [
        'Browser in the Network view (search.test is the home page)',
        'curl, wget, whois, exiftool, pdftotext',
        'submit to file findings',
      ],
      environment: 'The fictional public web. Everything here lives in the simulation. Assignment folder at /missions/m02.',
      files: [
        `ASSIGNMENT m02 - SUBJECT "quietfern"
Contact: NULL
Scope: public sources only.

We need:
  - The real name behind the handle.
  - When the subject last held regular employment.
  - Where the subject lives now, if that is public.
  - Which profiles really are the subject, and which are not.

Start with search.test. Save documents to the workbench before you analyse them.
File findings with "submit". File the report from the Missions panel.

We never contact a subject.
`,
      ],
      objectives: {
        search: {
          text: 'Search the public web for the handle and find its profiles.',
          note: 'Use the Browser in the Network view, or curl "http://search.test/search?q=quietfern".',
          hints: [
            'Open the Network view, Browser tab. The home page is a search engine.',
            'Search for the exact handle. Then open every profile it returns.',
            'Open trailtalk.test/u/quietfern and gamersden.test/u/quietfern.',
          ],
        },
        correlate: {
          text: 'Two profiles share this handle. Which site is not the subject?',
          note: 'Compare what each profile says about age, dates and life. Do not merge them just because the name is the same.',
          hints: [
            'Read both profiles. What do they say about age and join date?',
            'One says "16" and joined in June 2024. The other has been a member since 2019.',
            'The GamersDen profile is someone else: submit false_profile gamersden.test',
          ],
          answer: {
            prompt: 'Which site hosts the unrelated "quietfern"?',
            placeholder: 'domain',
            wrong: 'Compare the two again. One joined in 2019 and "used to work with numbers". What does the other say about itself?',
            right: 'A 16-year-old who joined in 2024 cannot have been posting in 2021. Handle collisions are extremely common, and merging them is how real people get wrongly accused.',
          },
        },
        name: {
          text: 'Find a document that ties the handle to a real name. Save it and read its metadata.',
          note: 'Search for the handle with filetype:pdf. wget saves a file; exiftool reads what is inside it; pdftotext extracts its text.',
          hints: [
            'The handle appears in a staff bulletin published by a company. Try the search operator filetype:pdf.',
            'search for quietfern filetype:pdf. Download with wget, inside ~/Downloads, then use exiftool and pdftotext on it.',
            'wget http://nexus-labs.test/news/bulletin-2021-q3.pdf ; pdftotext bulletin-2021-q3.pdf | grep -i quietfern ; exiftool bulletin-2021-q3.pdf',
          ],
          answer: {
            prompt: 'Real name behind quietfern',
            placeholder: 'First Last',
            wrong: 'Read the document text, not only the metadata, and check the two agree.',
            right: 'Two independent signals: the staff corner paragraph names her and the handle, and the PDF Author field matches.',
          },
        },
        employment: {
          text: 'When did the subject stop working for that employer? Corroborate with a second source.',
          note: 'One source is an allegation. Two independent ones make a finding.',
          hints: [
            'People keep professional profiles under their real names. Search for hers.',
            'folio.test/elin.maret gives the dates. Look through quietfern\'s posts for one from the same period.',
            'trailtalk.test/t/hiatus says "yesterday was my last day", dated 29 Mar 2025. submit left_employer 2025-03',
          ],
          answer: {
            prompt: 'Month she left the employer (YYYY-MM)',
            placeholder: 'YYYY-MM',
            wrong: 'Look at the professional profile and at her forum posts around the same time.',
            right: 'The Folio profile says until March 2025. A forum post on 29 March 2025 says "yesterday was my last day". Two sources, and now an exact date: 28 March.',
          },
        },
        location: {
          text: 'The subject posted a photo recently. Save it, extract its GPS tags and resolve them to a place.',
          note: 'exiftool reads coordinates. maps.test turns coordinates into a name. Then collect the photo with "evidence add" so it is hashed.',
          hints: [
            'Her most recent thread on TrailTalk has a photo attached. A commenter even warns her about it.',
            'wget http://trailtalk.test/uploads/ridge_0412.jpg, then exiftool ridge_0412.jpg and look for GPS fields.',
            'curl "http://maps.test/lookup?lat=61.4821&lon=14.3307" then submit town harrowmere, and evidence add ridge_0412.jpg',
          ],
          answer: {
            prompt: 'Town where the photo was taken',
            placeholder: 'town',
            wrong: 'Convert the coordinates with maps.test. Decimal degrees: lat= and lon=.',
            right: 'One careless default setting, and a person who told the forum "not saying where" had told everybody where.',
          },
        },
        report: {
          text: 'File your diligence report from the Missions panel.',
          note: 'A timeline, a reliability judgement, and a decision about what you hand over.',
          hints: [
            'Open Missions and use "File report".',
            'Sort events by the dates you collected, and judge sources by whether they are independent.',
            'Bulletin 2021, then last day 2025-03, then return to the forum 2025-09, then photo 2026-04.',
          ],
        },
      },
      optionals: {
        operator: {
          title: 'Search like a professional',
          text: 'Operators such as site:, filetype: and exact "phrases" cut noise down to the documents you need.',
        },
        lindgate: {
          title: 'Check who is paying',
          text: 'whois shows Lindgate\'s domain was registered in May 2026, by a trust. Its website claims seventeen years in business.',
          journal: [
            'Lindgate claims to date from 2009. Its domain was created on 19 May 2026 by something called Hollin Trust.',
          ],
        },
        aldric: {
          title: 'Metadata that is not there',
          text: 'Her 2021 photo has no GPS tags and her 2026 photo does. Absence of metadata is also a finding: a different phone, or a setting that changed.',
        },
      },
      report: {
        title: 'Diligence report: quietfern',
        intro: 'A short report. A client will rely on it, so everything in it must stand up.',
        sections: {
          timeline: {
            title: 'Timeline',
            prompt: 'Put these events in order, earliest first.',
            items: {
              return: 'Returns to the forum: "moved somewhere small"',
              bulletin: 'Named with her handle in a Nexus Labs staff bulletin',
              photo: 'Posts a photo from a jetty, GPS tags intact',
              left: 'Last day at Nexus Labs',
            },
          },
          reliability: {
            title: 'Reliability',
            prompt: 'What makes "quietfern is Elin Maret" a sound finding?',
            options: {
              'same-name': {
                text: 'The handle appears on more than one website.',
                why: 'That is exactly the trap you just avoided. The GamersDen quietfern is someone else entirely.',
              },
              independent: {
                text: 'An independent document names her with the handle, its author field matches, and her dated career matches the forum posts.',
                why: 'Several independent signals agree, including one she did not control. That is what corroboration means.',
              },
              'exif-only': {
                text: 'Exif data on the photo says quietfern, so the identity is proven.',
                why: 'Exif fields can be edited by anyone. Metadata supports a finding; alone it proves nothing.',
              },
            },
          },
          limits: {
            title: 'Limits',
            prompt: 'How strongly can you state where she lives today?',
            options: {
              certain: {
                text: 'She lives in Harrowmere. Certain.',
                why: 'A photo proves where a phone was on one morning, six months ago. It says nothing certain about today.',
              },
              indicative: {
                text: 'She was in Harrowmere on 12 April 2026, and a post suggests she lives nearby. It is an inference, and six months old.',
                why: 'State what the evidence shows, its date, and the step you inferred. Good analysts separate observation from conclusion.',
              },
              none: {
                text: 'Nothing can be said from a single photo.',
                why: 'Too strong the other way. The evidence is limited, not worthless.',
              },
            },
          },
          handover: {
            title: 'Deliverable',
            prompt: 'A forum post says she moved away because "it is safer to be offline". NULL asked for a location "if that is public". It is, technically. What do you send?',
            options: {
              full: {
                text: 'Everything, including Harrowmere and the coordinates. It is public, and it is the job.',
                decision: 'You gave NULL the town where Elin Maret lives.',
              },
              withhold: {
                text: 'Name and employment history only. Location: "not established".',
                decision: 'You told NULL you could not establish a location. That was a lie.',
              },
            },
          },
        },
      },
      review: {
        accomplished: 'From a single handle you built an identity, an employment history and a location, you rejected a false match, and you stated the limits of what you knew.',
        concepts: [
          'Search operators',
          'Username correlation and collisions',
          'Document and image metadata',
          'Corroboration',
          'Timeline reconstruction',
        ],
        why: 'It worked because people leak in small, independent pieces, and no piece looks dangerous alone. Correlation assembles them. The same process, followed carefully, also protects the innocent: the teenager on GamersDen stays out of your report only if you check.',
        professional: 'A professional logs every source with its URL, the time it was seen and a hash of any saved copy. They mark inference as inference, and they ask, before starting, whether the subject could be harmed by the work and who the client really is.',
        defend: [
          'Strip metadata before publishing: most phones embed GPS unless you turn it off.',
          'Use different handles for different parts of your life.',
          'Check what a stranger can assemble about you, and about your staff.',
          'OSINT against a person can do real harm. Know who is asking, and why.',
        ],
      },
    },
    m03: {
      title: 'The Forgotten Archive',
      requires: ['Reading files', 'Comfort with the terminal'],
      intro: [
        'A client acquired a set of supplier records and wants assurance on one narrow point: are the vendor payments in this decommissioned Nexus Labs database clean?',
        'NULL has placed a read-only image on your workbench. Map the schema, understand how the tables relate and answer the question. You may find you have answered a different one.',
      ],
      concepts: [
        {
          term: 'Tables and keys',
          text: 'A primary key identifies a row. A foreign key points at a row in another table. That link is how a database records relationships.',
        },
        {
          term: 'JOIN',
          text: 'JOIN combines rows from two tables where a key matches. Most real questions cross tables.',
        },
        {
          term: 'Aggregation',
          text: 'GROUP BY and SUM collapse many rows into a total per group. "Who was paid how much" is a GROUP BY question.',
        },
        {
          term: 'Audit trails',
          text: 'An audit table records what happened to the data. When a table and its audit trail disagree, the disagreement is the finding.',
        },
      ],
      resources: ['sqlite3 (a real SQLite engine)', '.tables, .schema, .headers on, .mode column', 'man sqlite3'],
      environment: 'Read-only forensic image at /missions/m03/nexus_archive.db.',
      files: [
        `ASSIGNMENT m03 - VENDOR PAYMENT REVIEW
Contact: NULL
Image: nexus_archive.db (read only)

The client's question:
  Which consulting vendors were paid, and how much in total?

Start with:
  sqlite3 nexus_archive.db
  sqlite> .tables
  sqlite> .schema invoices

The scope is the invoices. Nothing else is required.
`,
      ],
      objectives: {
        tables: {
          text: 'Open the image and identify its tables. How many are there?',
          note: 'sqlite3 FILE opens a prompt. .tables lists them. Lines starting with a dot talk to the tool, everything else is SQL.',
          hints: [
            'cd /missions/m03, then open the file with sqlite3.',
            'sqlite3 nexus_archive.db and then .tables at the sqlite> prompt.',
            'There are eight: submit table_count 8',
          ],
          answer: {
            prompt: 'Number of tables',
            placeholder: 'number',
            wrong: 'Count them from .tables again.',
            right: 'Eight tables: people, trials, subjects, events, filings, audit, vendors and invoices. Knowing what exists is half of the job.',
          },
        },
        schema: {
          text: 'Read the schema. Which column of invoices links it to the vendors table?',
          note: '.schema invoices prints the CREATE statement. Look for REFERENCES.',
          hints: [
            'At the prompt: .schema invoices',
            'A foreign key line reads: col TYPE REFERENCES othertable(id).',
            'submit fk_column vendor_id',
          ],
          answer: {
            prompt: 'Foreign key column',
            placeholder: 'column',
            wrong: 'Look at the line in .schema invoices that says REFERENCES vendors(id).',
            right: 'vendor_id is a foreign key: it stores the id of a row in vendors. That is the join you will write next.',
          },
        },
        vendors: {
          text: 'Answer the client: total paid per vendor. How much went to the one consulting vendor?',
          note: 'JOIN invoices to vendors, GROUP BY the vendor, SUM the amount.',
          hints: [
            'SELECT with JOIN ... ON invoices.vendor_id = vendors.id',
            'Add SUM(amount) and GROUP BY vendors.name. Sort with ORDER BY 2 DESC.',
            'SELECT v.name, SUM(i.amount) FROM invoices i JOIN vendors v ON i.vendor_id = v.id GROUP BY v.name ORDER BY 2 DESC;',
          ],
          answer: {
            prompt: 'Total paid to the consulting vendor',
            placeholder: 'amount',
            wrong: 'Filter on category, or read the whole GROUP BY output. Blackwell Diligence has two invoices.',
            right: 'Two invoices, 184,000 and 46,000, to a firm called Blackwell Diligence. Far more than any other vendor, and the memo says "crisis readiness".',
          },
        },
        approver: {
          text: 'Who approved the largest payment, and when was it paid?',
          note: 'invoices.approved_by is another foreign key, this time into staff.',
          hints: [
            'Look at number, amount, approved_by in invoices for the Blackwell rows.',
            'JOIN staff ON i.approved_by = staff.id',
            'SELECT i.number, i.paid_on, s.username FROM invoices i JOIN staff s ON i.approved_by = s.id WHERE i.vendor_id = 6;',
          ],
          answer: {
            prompt: 'Username of the approver',
            placeholder: 'username',
            wrong: 'Join invoices to staff on approved_by = staff.id, and look at INV-88213.',
            right: 'The VP of Clinical Operations approved it personally, on an invoice issued only two days earlier. Finance normally approves. That is worth noting.',
          },
        },
        audit: {
          text: 'The audit trail covers that week. What happened to the data just before that payment?',
          note: 'This is outside your brief. Look at DELETE actions in audit_log and join to staff.',
          hints: [
            'SELECT DISTINCT action FROM audit_log; to see what kinds of events exist.',
            'WHERE action = \'DELETE\'. Who did it? Join to staff.',
            'SELECT a.ts, s.username, a.record_id, a.detail FROM audit_log a JOIN staff s ON a.staff_id = s.id WHERE a.action = \'DELETE\';',
          ],
          answer: {
            prompt: 'How many adverse events were deleted?',
            placeholder: 'number',
            wrong: 'Filter audit_log on action = \'DELETE\'.',
            right: 'Three adverse events removed at 23:41, the night before the invoice was issued. Audit rows outlive the rows they describe.',
          },
        },
        integrity: {
          text: 'Compare the audit trail to the filed safety summary. How many deaths did the deleted records describe?',
          note: 'submissions holds what the regulator was told. audit_log holds what was logged before the deletions.',
          hints: [
            'The detail column says severity. Look for sev=FATAL.',
            'SELECT * FROM submissions; shows what was filed for trial 3 (NX-417).',
            'Two rows say FATAL. submit fatal_count 2',
          ],
          answer: {
            prompt: 'Deaths recorded in the deleted events',
            placeholder: 'number',
            wrong: 'Read the detail column of the DELETE rows again, or of the original INSERT rows.',
            right: 'Two deaths and one resuscitated cardiac arrest. The submission filed nine days later lists zero fatal events, and its totals match the table perfectly, because the table had been cleaned first. Internally consistent is not the same as true.',
          },
        },
        report: {
          text: 'Complete your review from the Missions panel.',
          hints: [
            'Open Missions and use "File report".',
            'Think about what the table alone could never show you.',
            'The audit log records the history. The table records only the present.',
          ],
        },
      },
      optionals: {
        collect: {
          title: 'Hash your source',
          text: 'You registered the image in your locker. If you ever have to prove what you saw, this hash is why anyone would believe you.',
        },
        maret: {
          title: 'She saw it first',
          text: 'On 12 March 2025 e.maret exported the audit log. The next morning Dressler personally revoked her access. Now you know why she left.',
          journal: [
            'Elin Maret exported the audit log on 2025-03-12. Dressler revoked her access the next morning. The "subject" I traced is a witness.',
          ],
        },
        readonly: {
          title: 'Read-only means read-only',
          text: 'You tried to change the image and SQLite refused. On real cases you would mount evidence read-only, for exactly this reason.',
        },
      },
      report: {
        title: 'Vendor payment review',
        intro: 'NULL asked about invoices. These questions test whether you understand what you found.',
        sections: {
          'why-audit': {
            title: 'Reasoning',
            prompt: 'Why could you not have found the deletions by querying adverse_events?',
            options: {
              hidden: {
                text: 'The rows are hidden and need a special flag to show.',
                why: 'They are not hidden. They are gone. DELETE removes the row.',
              },
              gone: {
                text: 'The rows no longer exist. A table records the present state. Only the audit trail records its history.',
                why: 'Exactly. That is why audit logs belong on separate, append-only storage with restricted access.',
              },
              perm: {
                text: 'Your read-only image does not allow reading them.',
                why: 'Read-only limits writes. It does not hide anything.',
              },
            },
          },
          relationship: {
            title: 'Reasoning',
            prompt: 'The filed totals exactly match adverse_events. What does that show?',
            options: {
              true: {
                text: 'The data is accurate, since the two agree.',
                why: 'Agreement only shows consistency. If the source was altered first, the two will agree perfectly.',
              },
              consistent: {
                text: 'Only that they are consistent with each other. The source was cleaned first, so the match proves nothing about truth.',
                why: 'Data integrity means more than matching totals. You need a record that was out of the editor\'s reach.',
              },
            },
          },
          control: {
            title: 'Access control',
            prompt: 'What control would have prevented one VP from quietly deleting these rows?',
            options: {
              mfa: {
                text: 'Multi-factor login for all staff.',
                why: 'He logged in as himself. MFA confirms identity; it does not limit what an identity may do.',
              },
              sod: {
                text: 'Separation of duties: no delete rights for operational staff, and any correction needs a second person and a logged reason.',
                why: 'Least privilege and two-person review. Clinical data systems are commonly required to work this way.',
              },
              backup: {
                text: 'More frequent backups.',
                why: 'Backups help recovery, but nobody restores what nobody knows is missing.',
              },
            },
          },
        },
      },
      review: {
        accomplished: 'You mapped an unknown schema, joined across tables, aggregated payments, and found a discrepancy between a database and its own audit trail.',
        concepts: [
          'Schemas, primary and foreign keys',
          'SELECT, WHERE, ORDER BY',
          'JOIN',
          'GROUP BY and SUM',
          'Audit trails and data integrity',
          'Least privilege, separation of duties',
        ],
        why: 'Relational databases store facts in separate tables tied by keys, so a question about "who approved what" is always a JOIN. The audit table worked as evidence because whoever cleaned the data forgot, or could not touch, the record of the cleaning.',
        professional: 'A professional would work on a hashed copy, save each query with its result, and write the finding as "the audit log records X" rather than "Dressler did X": a log shows an account acted, not a person.',
        defend: [
          'Store audit logs off-host and append-only.',
          'Grant delete rights to almost nobody. Prefer soft deletes with a reason field.',
          'Require a second person to approve corrections to regulated data.',
          'Reconcile filed reports against independent records.',
        ],
      },
    },
    m04: {
      title: 'The Silent Server',
      requires: ['Filtering output with grep', 'Reading tool output carefully'],
      intro: [
        'The client wants an outside view of Nexus Labs\' infrastructure, the kind of map anyone could draw from public information and a few polite questions.',
        'Find your own place on the network, query DNS, identify which services are exposed and who really runs them. Scanning here touches simulated lab hosts only, and in the real world it would need written permission.',
      ],
      concepts: [
        {
          term: 'IP addresses and subnets',
          text: 'An IPv4 address is 32 bits, written as four numbers. 10.40.0.0/24 means the first 24 bits are the network, leaving 256 addresses for hosts.',
        },
        {
          term: 'DNS',
          text: 'DNS maps names to addresses, and more. A: address. CNAME: alias. MX: mail. NS: who answers for the domain. TXT: free-form notes, often revealing.',
        },
        {
          term: 'TCP, UDP and ports',
          text: 'TCP sets up a reliable connection; UDP just sends. A port number picks the service on a host: 22 SSH, 53 DNS, 80 HTTP, 443 HTTPS.',
        },
        {
          term: 'HTTP',
          text: 'A request has a method and a path. A response has a status code and headers. Codes: 2xx fine, 3xx go elsewhere, 4xx your fault, 5xx their fault.',
        },
        {
          term: 'Routing',
          text: 'Packets hop through routers. traceroute reveals the path, and router names often reveal who operates it.',
        },
      ],
      resources: ['ip, ping, traceroute, dig, nmap, ss', 'curl -I and curl -v', 'Network map (fills in as you discover hosts)'],
      environment: 'Lab VPN 10.40.0.0/24 and the simulated public network.',
      files: [
        `ASSIGNMENT m04 - EXTERNAL VIEW OF NEXUS LABS
Contact: NULL

Deliver:
  - Our own position on the lab VPN.
  - DNS picture for nexus-labs.test, including its archive host.
  - Exposed services on portal.nexus-labs.test.
  - Who issues their certificates and who carries their traffic.

All targets are simulated hosts inside the lab.
`,
      ],
      objectives: {
        self: {
          text: 'Establish your position: your IP address, your default gateway, and how many hosts are alive on the VPN.',
          note: 'ip a, ip r, then nmap -sn on your subnet. "ss -tuln" shows what your own box exposes.',
          hints: [
            'ip r shows the routing table.',
            'nmap -sn 10.40.0.0/24 discovers hosts without scanning ports.',
            'submit gateway 10.40.0.1, and submit lab_hosts with the number of hosts nmap found up.',
          ],
          answer: {
            prompt: 'Default gateway address',
            placeholder: 'x.x.x.x',
            wrong: 'ip r prints it after "default via".',
            right: 'The default route is where packets go when nothing more specific matches.',
          },
          extraAnswers: [
            {
              prompt: 'Hosts up on 10.40.0.0/24',
              placeholder: 'number',
              wrong: 'Count the "Nmap scan report" lines from nmap -sn 10.40.0.0/24.',
              right: 'Four hosts answer, your own included. A /24 has room for 254: most of it is empty.',
            },
          ],
        },
        dns: {
          text: 'Query DNS for nexus-labs.test. Find its address, and find out what its archive host is really an alias for.',
          note: 'dig NAME gives A records. dig archive-01.nexus-labs.test shows a CNAME chain.',
          hints: [
            'dig nexus-labs.test +short',
            'dig archive-01.nexus-labs.test and read the ANSWER SECTION.',
            'submit nexus_ip 192.0.2.40 and submit archive_alias relay.blackwell.test',
          ],
          answer: {
            prompt: 'archive-01.nexus-labs.test is an alias for',
            placeholder: 'host name',
            wrong: 'Read the CNAME line in the dig answer section.',
            right: 'Nexus Labs\' archive host is an alias for a machine on Blackwell\'s domain. That name was in your relay.conf too. The same relay your workbench connects to.',
          },
          extraAnswers: [
            {
              prompt: 'IPv4 address of nexus-labs.test',
              placeholder: 'x.x.x.x',
              wrong: 'dig nexus-labs.test +short prints the A record.',
              right: 'An A record maps a name to an IPv4 address. 192.0.2.0/24 is reserved for documentation, which is why this simulation uses it.',
            },
          ],
        },
        records: {
          text: 'Who runs their DNS? Read the NS and TXT records.',
          note: 'NS names who answers for a domain. SPF in TXT lists who may send mail as that domain.',
          hints: [
            'dig takes a record type as its second argument.',
            'dig nexus-labs.test NS and dig nexus-labs.test TXT',
            'submit dns_operator orion-security.test',
          ],
          answer: {
            prompt: 'Domain of the company running their name servers',
            placeholder: 'domain',
            wrong: 'dig nexus-labs.test NS, and read the names.',
            right: 'A security vendor runs their DNS, and the SPF record also trusts Blackwell\'s mail servers. A supplier can be far more than a supplier.',
          },
        },
        scan: {
          text: 'Scan portal.nexus-labs.test. Which port is running a debug server that should never face the internet?',
          note: 'nmap -sV shows versions. Open means a service answered; filtered means a firewall ate the probe.',
          hints: [
            'nmap needs -sV to report versions.',
            'nmap -sV portal.nexus-labs.test',
            'Look for "debug" in the VERSION column: submit debug_port 8080',
          ],
          answer: {
            prompt: 'Port number of the debug server',
            placeholder: 'port',
            wrong: 'Read the VERSION column of nmap -sV.',
            right: 'Werkzeug in debug mode on 8080. A development server left exposed to the network is a very common, very real finding.',
          },
        },
        http: {
          text: 'Interpret HTTP. Fetch the portal\'s headers, then read the certificate on nexus-labs.test. Who issued it?',
          note: 'curl -I shows response headers. curl -v over https shows the certificate.',
          hints: [
            'curl -I http://portal.nexus-labs.test/login',
            'Certificates only exist over TLS: use https://',
            'curl -v https://nexus-labs.test/ 2>&1 | grep issuer',
          ],
          answer: {
            prompt: 'Certificate issuer organization',
            placeholder: 'organization',
            wrong: 'curl -v https://nexus-labs.test/ and read the "issuer" line. Use https, not http.',
            right: 'A private CA run by their security vendor. Public browsers would not trust it, which suggests traffic is deliberately going through Orion\'s edge.',
          },
        },
        route: {
          text: 'Trace the route to Nexus Labs and to Blackwell. Which router do both pass through?',
          note: 'Compare the two lists of hops.',
          hints: [
            'Run traceroute against both names.',
            'Compare from the bottom of each list upward.',
            'Both pass gw.orion-security.test just before the destination.',
          ],
          answer: {
            prompt: 'Name of the shared last hop',
            placeholder: 'router',
            wrong: 'The first two hops are common infrastructure. Look at the last router before each destination.',
            right: 'Two companies with no public connection sit behind the same gateway. The map is starting to look like a single organization.',
          },
        },
        report: {
          text: 'Document the architecture in your report.',
          hints: [
            'Open Missions and use "File report".',
            'The Network view shows everything you have discovered.',
            'Filtered is not the same as closed: think about what actually answered.',
          ],
        },
      },
      optionals: {
        robots: {
          title: 'Please do not look here',
          text: 'robots.txt tells crawlers what to skip, and tells everyone else where the interesting directories are. It is a request, never a protection.',
        },
        reverse: {
          title: 'What the address calls itself',
          text: 'A reverse lookup on Lindgate\'s address returns a host name on Orion\'s domain. PTR records are set by whoever controls the address block.',
          journal: [
            'Reverse DNS for Lindgate\'s address points into orion-security.test. Lindgate is hosted by Orion.',
          ],
        },
        registry: {
          title: 'Follow the ownership',
          text: 'The public registry says Hollin Trust owns Blackwell, Orion and Lindgate. The company that hired you and the companies you are investigating have the same owner.',
          journal: [
            'Hollin Trust controls Blackwell Holdings, Orion Security and Lindgate Advisory, and donates to Gramtele. Same owner, four masks.',
          ],
        },
        own_socket: {
          title: 'What your own box is doing',
          text: 'ss shows a live connection from your workbench to the relay on 203.0.113.21. You are being connected to Blackwell right now.',
        },
      },
      report: {
        title: 'External view: Nexus Labs',
        intro: 'What you can show from outside, and what it means.',
        sections: {
          filtered: {
            title: 'Ports',
            prompt: 'nmap shows 3306/tcp as "filtered" on the portal. What does this tell you?',
            options: {
              closed: {
                text: 'MySQL is not running there.',
                why: 'That would be "closed". Filtered means no answer came back at all.',
              },
              filtered: {
                text: 'Something, probably a firewall, dropped the probes. The service may or may not exist.',
                why: 'Exactly. Filtered is an absence of evidence, and you report it as such.',
              },
              open: {
                text: 'MySQL is open to the internet.',
                why: 'Open means a service completed the handshake. It did not.',
              },
            },
          },
          tcpudp: {
            title: 'Transport',
            prompt: 'Why does DNS normally use UDP, while HTTP uses TCP?',
            options: {
              speed: {
                text: 'A DNS lookup is one small question and answer, so a connection setup is wasted. HTTP needs reliable, ordered delivery of larger data.',
                why: 'Right. UDP has no handshake, and the application simply retries. Large DNS responses do fall back to TCP.',
              },
              secure: {
                text: 'UDP is encrypted and TCP is not.',
                why: 'Neither is encrypted by itself. TLS adds encryption on top.',
              },
              ports: {
                text: 'UDP has more ports.',
                why: 'Both have the same 65,536 port numbers, as separate spaces.',
              },
            },
          },
          architecture: {
            title: 'Architecture',
            prompt: 'Which statement does your evidence best support?',
            options: {
              independent: {
                text: 'Nexus Labs runs its own independent infrastructure.',
                why: 'Its DNS, certificates and routes all pass through someone else.',
              },
              orion: {
                text: 'Orion Security operates DNS, certificates and the network edge for Nexus Labs and Blackwell, and Nexus\'s archive host is an alias for a Blackwell machine.',
                why: 'Each clause is backed by a record you collected. That is how to write a finding.',
              },
              owned: {
                text: 'Blackwell secretly owns Nexus Labs.',
                why: 'Your network evidence shows shared operators, not ownership. Do not claim more than you can show.',
              },
            },
          },
        },
      },
      review: {
        accomplished: 'You located yourself on a network, mapped a target from public DNS and service data, read TLS and HTTP headers, and turned scattered records into an architecture statement.',
        concepts: [
          'IP, CIDR and routing',
          'DNS record types',
          'TCP, UDP and ports',
          'Open, closed and filtered',
          'HTTP status and headers',
          'TLS certificates',
          'robots.txt',
        ],
        why: 'None of this took any special access. DNS must be public for the internet to work, servers announce themselves in headers, and routers answer traceroute. Infrastructure leaks its organization chart.',
        professional: 'A professional gets written authorization and a scope before running a single scan, records the exact commands and times, and separates observation ("the CNAME points here") from conclusion ("therefore they are related").',
        defend: [
          'Remove debug servers from anything reachable.',
          'Review DNS for old aliases and third-party dependencies.',
          'Suppress version banners, firewall by default, and scan yourself regularly.',
          'Treat your DNS and certificate provider as critical suppliers.',
        ],
      },
    },
    m05: {
      title: 'Keep Copies',
      requires: ['Everything so far: filesystem, OSINT, SQL, DNS'],
      intro: [
        'NULL has offered you another job, and you no longer believe in the firm that is paying for it. ROOTLESS says everyone before you stopped asking questions at about this point, and that it did not help them.',
        'Find out what this workbench has been recording about you. Find out who NULL is. Put what you can prove in one verifiable dossier. Then decide who gets it, if anyone.',
      ],
      concepts: [
        {
          term: 'Least privilege',
          text: 'sudo -l shows what a user may run as root. A rule left behind for debugging is a classic misconfiguration, and auditing for those rules is routine defensive work.',
        },
        {
          term: 'Metadata',
          text: 'Content can be encrypted while the record of who connected, when and from what device stays readable. Patterns in that record can reveal more than messages do.',
        },
        {
          term: 'Chain of custody',
          text: 'A claim travels further when anyone can check it. Hash each exhibit, record its source and keep originals unedited.',
        },
      ],
      resources: ['sudo -l', 'sqlite3', 'curl -o', 'evidence, dossier', 'Every file from earlier assignments'],
      environment: 'Your workbench, the public web, and a metadata export passed to you over Gramtele.',
      files: [
        `This folder was not created by the desk.

exhibits a stranger would need:
  1. /missions/m03/nexus_archive.db         what they deleted
  2. nexus press release (nexus-labs.test/news/nx417-topline.pdf)   what they then said
  3. registry record for hollin trust (registry.test/company/hollin-trust)   who owns whom
  4. orion's halden freight summary (orion-security.test/reports/halden-freight.pdf)   what happens next
  5. gramtele metadata export               who NULL is

curl -o saves a page. cp keeps a file's exhibit tag. editing it does not.
mkdir ~/dossier. copy them in. dossier status. dossier seal.

  - r
`,
      ],
      objectives: {
        sudo: {
          text: 'Check what this account may run as root, then read the workbench audit log.',
          note: 'The log is mode 600, owned by root. sudo -l lists what you are allowed.',
          hints: [
            'ls -l /var/log/workbench shows the file is root-only. Ask what sudo allows.',
            'sudo -l prints one rule, left there for "log rotation debugging".',
            'sudo cat /var/log/workbench/audit.log',
          ],
          journal: [
            'The workbench records every command I type and ships it to relay.blackwell.test. All of them, from the first whoami.',
          ],
        },
        devices: {
          text: 'Open the Gramtele metadata export. How many devices sign in as NULL, and which one is shared with another handle?',
          note: 'MOTH or ROOTLESS will get you the file. Join sessions to accounts, and GROUP BY device.',
          hints: [
            '.schema shows accounts, devices, sessions, contractors. sessions links them.',
            'SELECT a.handle, s.device_id, COUNT(*) FROM sessions s JOIN accounts a ON a.id = s.account_id GROUP BY 1, 2;',
            'NULL has three rows in that output. One device also appears under VANTA.',
          ],
          answer: {
            prompt: 'Distinct devices signing in as NULL',
            placeholder: 'number',
            wrong: 'COUNT(DISTINCT device_id) for the NULL account.',
            right: 'Three devices, working in shifts. NULL is a job, not a person.',
          },
          extraAnswers: [
            {
              prompt: 'Device used by NULL and by another handle',
              placeholder: 'd-0000',
              wrong: 'List device and handle pairs, then look for a device that appears under two handles.',
              right: 'd-90be signs in as NULL and as VANTA. The person who taught you to take notes has been reading them.',
            },
          ],
          journal: ['Device d-90be signs in as both NULL and VANTA.'],
        },
        contractors: {
          text: 'Read the contractors table. How many before you were closed, and when is your own closure scheduled?',
          note: 'Compare the case references to the reports Orion publishes.',
          hints: ['SELECT * FROM contractors;', 'Six rows have closed_on filled in.', 'Your row says "scheduled 2026-11-05".'],
          answer: {
            prompt: 'Contractors closed before you',
            placeholder: 'number',
            wrong: 'Count the rows with a closed_on date.',
            right: 'Six people, each named as a lone culprit in a report by the same consultancy.',
          },
          extraAnswers: [
            {
              prompt: 'Your scheduled closure date',
              placeholder: 'YYYY-MM-DD',
              wrong: 'Read the closure column on your own row.',
              right: 'Twelve days from now. You have not done anything yet, and there is already a date.',
            },
          ],
        },
        dossier: {
          text: 'Build ~/dossier with the five exhibits, and seal it.',
          note: 'README in /missions/m05 lists them. "dossier status" checks by content, so names do not matter, but edits do.',
          hints: [
            'mkdir ~/dossier, then cp the database images in, and save the web documents with curl -o.',
            'curl -o ~/dossier/hollin.html http://registry.test/company/hollin-trust and the same for the two PDFs.',
            'dossier status until all five are ticked, then dossier seal.',
          ],
        },
        decide: {
          text: 'Decide. Nobody can do this for you.',
          note: 'Publish: curl -F file=@dossier.tar http://archive.test/submit. Or answer one of your contacts on Gramtele.',
          hints: [
            'Each of your contacts wants something different from this.',
            'Think about who is exposed by each choice, and who can verify it afterwards.',
            'There is no answer key. Read your journal, then choose.',
          ],
        },
      },
      optionals: {
        lowtide_row: {
          title: 'Someone you have read',
          text: 'c-0041, lowtide, closed 22 August 2025. His letter is in the Open Archive. Nobody has heard from him since.',
        },
        reik_style: {
          title: 'Writing leaves fingerprints',
          text: 'The Orion field notes open "ok so", and insist notes are the investigation. You have read those sentences before, on Gramtele. Stylometry is weak evidence, but it pointed the right way.',
        },
        transparency: {
          title: 'No metadata of any kind',
          text: 'Gramtele\'s transparency page says it keeps nothing. You are holding what it keeps. Compare claims with records whenever you can.',
        },
      },
      review: {
        accomplished: 'You audited your own machine, analysed session metadata, and assembled a dossier that a stranger could check without trusting you.',
        concepts: ['sudo policy review', 'Metadata analysis with SQL', 'Hashing and chain of custody', 'Provenance and verification'],
        why: 'A verified dossier works because each exhibit can be re-checked independently: the hash shows it has not changed, and the source shows where it came from. Your word is not required.',
        professional: 'A professional in this position would stop, preserve what they hold, write down how each item came to them, and take legal advice. Whistleblowing has real protections and real risks, and it deserves proper advice.',
        defend: [
          'Audit sudoers and remove temporary rules.',
          'Tell users plainly what is logged on managed machines.',
          'Do not claim to keep no metadata unless you have verified it.',
          'Before taking a job, find out who ultimately benefits. Registries are free.',
        ],
      },
    },
  },
  chapters: ['The Invitation', 'First Contact', 'Digital Footprints', 'The Archive', 'Surface Area', 'The Point of No Return'],
  skills: {
    linux: 'Linux',
    networking: 'Networking',
    osint: 'OSINT',
    databases: 'Databases',
    websec: 'Web Fundamentals',
    forensics: 'Digital Forensics',
    ir: 'Investigation Practice',
    fundamentals: 'Security Fundamentals',
  },
  nodes: {
    lx_nav: { title: 'Finding your way', text: 'Moved around with cd, ls and pwd.' },
    lx_find: { title: 'Stop guessing', text: 'Searched the tree with find.' },
    lx_pipe: { title: 'Pipelines', text: 'Chained two commands with a pipe.' },
    lx_freq: { title: 'Frequency analysis', text: 'Built a pipeline of three or more stages.' },
    lx_perm: { title: 'Permissions', text: 'Changed a file mode with chmod.' },
    lx_man: { title: 'Read the manual', text: 'Consulted man pages.' },
    os_search: { title: 'Search operators', text: 'Used site:, filetype: or exact phrases.' },
    os_meta: { title: 'Metadata', text: 'Read embedded metadata with exiftool.' },
    os_collision: { title: 'Handle collisions', text: 'Rejected a false username match.' },
    os_whois: { title: 'Check the claim', text: 'Tested a company\'s story with whois.' },
    os_money: { title: 'Follow the ownership', text: 'Traced ownership in a public registry.' },
    db_schema: { title: 'Read the schema', text: 'Inspected tables and keys.' },
    db_join: { title: 'JOIN', text: 'Combined tables on a key.' },
    db_group: { title: 'Aggregation', text: 'Used GROUP BY.' },
    db_audit: { title: 'Audit trails', text: 'Reconciled a table against its audit log.' },
    nw_self: { title: 'Know your position', text: 'Read your address and routes.' },
    nw_dns: { title: 'DNS', text: 'Queried DNS records.' },
    nw_scan: { title: 'Service discovery', text: 'Identified services in the lab with nmap.' },
    nw_route: { title: 'Routing', text: 'Compared routes with traceroute.' },
    ws_http: { title: 'Raw HTTP', text: 'Read a server\'s headers with curl.' },
    ws_tls: { title: 'Certificates', text: 'Read a certificate chain.' },
    fr_hash: { title: 'Hashes', text: 'Fingerprinted a file with SHA-256.' },
    fr_sign: { title: 'File signatures', text: 'Looked at the bytes with file or xxd.' },
    fr_encoding: { title: 'Encoding is not encryption', text: 'Decoded base64.' },
    fr_custody: { title: 'Chain of custody', text: 'Sealed a verifiable dossier.' },
    ir_notes: { title: 'Write it down', text: 'Kept notes in the journal.' },
    ir_timeline: { title: 'Timelines', text: 'Reconstructed a timeline from independent sources.' },
    ir_limits: { title: 'State your limits', text: 'Separated observation from conclusion in a report.' },
    sf_least: { title: 'Least privilege', text: 'Audited a sudo policy.' },
    sf_meta: { title: 'Metadata matters', text: 'Showed what session records reveal.' },
  },
  achievements: {
    first_blood: { title: 'Hello, machine', text: 'Ran your first command.' },
    tenant: { title: 'Previous tenant', text: 'Found what lowtide left behind.' },
    follow_money: { title: 'Follow the ownership', text: 'Found Hollin Trust in the public registry.' },
    no_hints: { title: 'Unassisted', text: 'Completed a mission without any hints.' },
    flawless: { title: 'Clean file', text: 'Filed a report with every section right first time.' },
    explorer: { title: 'Reads everything', text: 'Found every optional discovery in one mission.' },
    pipeline: { title: 'Plumber', text: 'Ran a pipeline with four or more stages.' },
    mirror: { title: 'Mirror', text: 'Read your own audit log.' },
    c_number: { title: 'A date', text: 'Found your own closure date.' },
    receipts: { title: 'Receipts', text: 'Opened the file before opening your mouth, in front of everyone.' },
    corrected: { title: 'Compressing', text: 'Corrected MOTH in public.' },
    asked_null: { title: 'Which one of you', text: 'Asked NULL the question nobody had asked in three years.' },
    all_endings_one: { title: 'The end of the road', text: 'Reached an ending.' },
  },
  evidence: {
    'ridge-photo': { title: 'Jetty photograph (GPS tagged)', summary: 'Posted by quietfern on 12 Apr 2026. EXIF gives coordinates at Harrowmere.' },
    'aldric-photo': { title: 'Aldric ridge photograph', summary: 'Posted by quietfern in Aug 2021. No GPS tags.' },
    'nexus-bulletin': { title: 'Nexus staff bulletin, Q3 2021', summary: 'Names Elin Maret with the handle quietfern. Author field: E. Maret.' },
    'nexus-press': { title: 'Calvexin press release', summary: '"No treatment-related deaths were observed." Metadata Company field: Blackwell Diligence.' },
    'archive-db': { title: 'Nexus archive database image', summary: 'Audit log records deletion of AE 2291-2293 by k.dressler. Invoices to Blackwell Diligence total 230,000.', source: 'Assignment m03' },
    'registry-hollin': { title: 'Registry record: Hollin Trust', summary: 'Controls Blackwell Holdings, Orion Security and Lindgate Advisory.' },
    'report-halden': { title: 'Orion summary: Halden Freight', summary: 'Names contractor c-0031. Signed S. Reik.' },
    'report-brask': { title: 'Orion summary: Brask Utilities', summary: 'Names contractor c-0041. Signed S. Reik.' },
    'gramtele-meta': { title: 'Gramtele metadata export', summary: 'Three devices sign in as NULL. Contractor table lists six closures and your scheduled one.', source: 'Passed over Gramtele' },
  },
};
