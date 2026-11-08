import { b64encode } from '../../game/commands/forensic';
import { FRAGMENTS, hex, KELPIE_INVOICE, rot13 } from '../dialogue/fragments';
import { registerLines } from '../../i18n';
import { Page, worldLines, WorldText } from './format';

/**
 * The simulated world in English: what each site publishes, the PDFs, and the files on the workbench.
 * Layout, addresses and paths live in sites.ts, documents.ts and hosts.ts; every link written here must also
 * be in the French pages, which the parity test checks.
 */

const company = (name: string, rows: [string, string][]): Page => ({
  title: `${name} | Public Registry`,
  body: `<h2>Public Companies Registry</h2><h3>${name}</h3><table>${rows.map(([k, v]) => `<tr><th>${k}</th><td>${v}</td></tr>`).join('')}</table><p><a href="/">New search</a></p>`,
});

const encoded = (data: string) => ({ file: `${data}\n`, preview: data });

export const EN_WORLD: WorldText = {
  pages: {
    forbidden: '403 Forbidden',
    forbidden_logged: 'This incident is logged.',

    gramtele: {
      nav: { about: 'about', transparency: 'transparency', standing: 'standing' },
      home: {
        title: 'Gramtele',
        body: '<h1>Say it to someone. Nobody else.</h1><p>Gramtele is a messaging network without names. No phone number, no email, no address book. You pick a handle. Other people earn your trust, or do not.</p><p><small>Network status: normal. 41,208 handles online.</small></p>',
      },
      about: {
        title: 'About Gramtele',
        body: '<h1>About</h1><p>Gramtele began in 2022 as a volunteer relay project. Since 2023 it has been run by the Gramtele Foundation, supported by private grants.</p><p>We publish our protocol. We do not publish our users, because we do not know them.</p>',
      },
      transparency: {
        title: 'Transparency',
        body: '<h1>Transparency</h1><p>We keep no message content, no connection logs, no device identifiers and no metadata of any kind.</p><p>Number of lawful requests answered in 2025: 0. There is nothing to hand over.</p><p><small>Funding: Gramtele Foundation. Grants disclosed in the public registry.</small></p>',
      },
      standing: {
        title: 'Standing',
        body: '<h1>Standing</h1><p>Standing is the only thing a handle owns. It rises when people who have standing vouch for you, and when paid work closes cleanly. It falls when they stop.</p><p>Standing unlocks private channels and contracts. It cannot be bought. We are told it can be lost very quickly.</p>',
      },
    },

    lindgate: {
      footer_home: 'Lindgate Advisory. All rights reserved.',
      footer: 'Lindgate Advisory.',
      home: {
        title: 'Lindgate Advisory',
        body: '<h2>Discreet corporate diligence since 2009.</h2><p>For seventeen years, Lindgate has helped boards and investors understand who they are dealing with. Our analysts work quietly and report plainly.</p><p><a href="/team">Our team</a> | <a href="/contact">Contact</a></p>',
      },
      team: {
        title: 'Team | Lindgate Advisory',
        body: '<h2>Our team</h2><p>Lindgate does not publish the names of its analysts, for their protection and yours.</p>',
      },
      contact: {
        title: 'Contact | Lindgate Advisory',
        body: '<h2>Contact</h2><p>New engagements by introduction only. Write to <a href="mailto:desk@lindgate.test">desk@lindgate.test</a>.</p>',
      },
    },

    blackwell: {
      nav: { home: 'Home', services: 'Services', leadership: 'Leadership', careers: 'Careers' },
      footer_home: 'Blackwell Holdings. A member of the Hollin group.',
      footer: 'Blackwell Holdings.',
      home: {
        title: 'Blackwell Holdings',
        body: '<h1>Risk. Reputation. Resilience.</h1><p>When the unthinkable reaches your company, the first seventy-two hours decide the next ten years. Blackwell stands between your organization and the story that would otherwise be told about it.</p>',
      },
      services: {
        title: 'Services | Blackwell',
        body: '<h1>Services</h1><p><b>Blackwell Diligence.</b> Crisis readiness retainers, reputation monitoring.</p><p><b>Special Engagements.</b> Bespoke resolution for sensitive matters. By referral. No written proposals.</p><p><b>Partners.</b> Technical attribution is delivered with our partner, Orion Security.</p>',
      },
      leadership: {
        title: 'Leadership | Blackwell',
        body: '<h1>Leadership</h1><p><b>Piet Hollander</b>, Director, Special Engagements. Twenty years in corporate crisis work. Believes every problem has a person attached.</p><p><b>Ilya Brandt</b>, Deputy Director. Previously government service.</p>',
      },
      careers: {
        title: 'Careers | Blackwell',
        body: '<h1>Careers</h1><p>We are always interested in talented independent analysts. We prefer to find you.</p>',
      },
    },

    portal: {
      title: 'Nexus Staff Portal',
      heading: 'Nexus Labs Staff Portal',
      restricted: 'Access is restricted to the staff network.',
    },

    orion: {
      nav: { home: 'Home', about: 'About', blog: 'Field notes', reports: 'Reports' },
      home: {
        title: 'Orion Security',
        body: '<h1>We find out what happened.</h1><p>Incident response, attribution and penetration testing. Our attribution summaries have supported prosecutions in five jurisdictions.</p>',
      },
      about: {
        title: 'About | Orion Security',
        body: '<h1>About</h1><p>Founded in 2017 by practitioners. In April 2024 Orion welcomed new long-term investors, who have let us expand our managed DNS and edge hosting practice.</p><p>Principal: Sanna Reik. Writes most of the field notes and, by reputation, all of the sharp ones.</p>',
      },
      blog: {
        title: 'Field notes | Orion Security',
        body: '<h1>Field notes</h1><p><a href="/blog/write-it-down">Write it down or it did not happen</a></p><p><a href="/blog/logs-lie-by-omission">Logs lie by omission</a></p>',
      },
      write_it_down: {
        title: 'Write it down | Orion Security',
        body: '<h1>Write it down or it did not happen</h1><small>S. Reik</small><p>ok so here is what I tell every junior. You will not remember. Not the command, not the timestamp, not why you thought that host mattered. Notes are not paperwork. Notes are the investigation.</p><blockquote>A finding you cannot reproduce from your own notes is a rumour.</blockquote>',
      },
      logs_lie: {
        title: 'Logs lie by omission | Orion Security',
        body: '<h1>Logs lie by omission</h1><small>S. Reik</small><p>A log only tells you what someone decided to record, and only until someone decides otherwise. So hash your evidence when you collect it, and ask what is missing before you ask what is there.</p>',
      },
      reports: {
        title: 'Reports | Orion Security',
        body: '<h1>Public attribution summaries</h1><p><a href="/reports/halden-freight.pdf">Halden Freight (2024)</a></p><p><a href="/reports/brask-utilities.pdf">Brask Utilities (2025)</a></p>',
      },
    },

    nexus: {
      nav: { home: 'Home', about: 'About', news: 'News', trials: 'Trials', careers: 'Careers' },
      footer: 'Nexus Labs. Staff portal: <a href="http://portal.nexus-labs.test/">portal.nexus-labs.test</a>',
      moved: 'Moved to portal.nexus-labs.test',
      home: {
        title: 'Nexus Labs',
        body: '<h1>Better evidence, sooner.</h1><p>Nexus Labs is a contract research organization running clinical trials and diagnostics for partners across three continents.</p>',
      },
      about: {
        title: 'About | Nexus Labs',
        body: '<h1>About us</h1><p>Founded in 2011. Led by Ruth Aldana, Chief Executive. Konrad Dressler leads Clinical Operations.</p>',
      },
      news: {
        title: 'News | Nexus Labs',
        body: '<h1>News</h1><p><a href="/news/nx417-topline.pdf">27 Mar 2025. Calvexin phase III: positive topline</a></p><p><a href="/news/bulletin-2021-q3.pdf">Sep 2021. Staff bulletin, Q3</a></p>',
      },
      trials: {
        title: 'Trials | Nexus Labs',
        body: '<h1>Trials</h1><ul><li>NX-212, Ferotane, phase II, closed.</li><li>NX-305, Lumidex, phase II, closed.</li><li>NX-417, Calvexin, phase III, submitted. No treatment-related deaths were observed.</li></ul>',
      },
      careers: {
        title: 'Careers | Nexus Labs',
        body: '<h1>Careers</h1><p>We are hiring a Senior Data Steward. The previous holder of this role moved on in March 2025.</p>',
      },
    },

    trailtalk: {
      home: {
        title: 'TrailTalk',
        body: '<header>TrailTalk: the walkers\' forum</header><main><article><a href="/t/aldric-ridge">Aldric ridge: full traverse log</a> <small>by quietfern</small></article><article><a href="/t/new-place">New place, new paths</a> <small>by quietfern</small></article><article><a href="/t/boots">Boots that survive a wet spring</a> <small>by hobnail_jo</small></article><article>Members: <a href="/u/quietfern">quietfern</a>, <a href="/u/hobnail_jo">hobnail_jo</a></article></main>',
      },
      quietfern: {
        title: 'quietfern | TrailTalk',
        body: '<article><b>quietfern</b><br><small>Member since 2019. 212 posts. Last active: 12 April 2026.</small><p>Slow walker. Keeps good records. Used to work with numbers for a living.</p><p>Posts: <a href="/t/aldric-ridge">Aldric ridge: full traverse log</a> (Aug 2021), <a href="/t/hiatus">Stepping back for a while</a> (Mar 2025), <a href="/t/new-place">New place, new paths</a> (Sep 2025 to Apr 2026)</p></article>',
      },
      hobnail_jo: {
        title: 'hobnail_jo | TrailTalk',
        body: '<article><b>hobnail_jo</b><br><small>Member since 2016. 3,114 posts.</small><p>Boot opinions, free of charge.</p></article>',
      },
      aldric: {
        title: 'Aldric ridge | TrailTalk',
        body: '<article><small>quietfern, 7 Aug 2021</small><p>Day 3 of the traverse. Taking two weeks off the data desk was the best decision I have made in years.</p><p><a href="/uploads/aldric_day3.jpg">aldric_day3.jpg</a></p></article>',
      },
      hiatus: {
        title: 'Stepping back | TrailTalk',
        body: '<article><small>quietfern, 29 Mar 2025</small><p>Yesterday was my last day at the job. I will be away from here for a while. Some things need sorting out and it is safer to be offline. Look after your knees.</p></article>',
      },
      new_place: {
        title: 'New place, new paths | TrailTalk',
        body: '<article><small>quietfern, 3 Sep 2025</small><p>Back. Moved somewhere small. Not saying where, it is nobody\'s business. Plenty of old logging tracks.</p></article><article><small>quietfern, 12 Apr 2026</small><p>First proper morning of spring. The lake at the end of the road finally thawed. Photo from the jetty, straight off the phone.</p><p><a href="/uploads/ridge_0412.jpg">ridge_0412.jpg</a></p></article><article><small>hobnail_jo, 12 Apr 2026</small><p>You know phones tag these with where you are, right?</p></article>',
      },
      boots: {
        title: 'Boots | TrailTalk',
        body: '<article><small>hobnail_jo, 2 Mar 2026</small><p>Waxed leather. Nothing else. I will not be taking questions.</p></article>',
      },
    },

    folio: {
      home: {
        title: 'Folio',
        body: '<h1>Folio</h1><p>Professional profiles. Try <a href="/elin.maret">/elin.maret</a>.</p>',
      },
      elin: {
        title: 'Elin Maret | Folio',
        body: '<h1>Elin Maret</h1><small>Clinical data stewardship. Profile last updated March 2025.</small><h3>Experience</h3><ul><li><b>Senior Data Steward, Nexus Labs</b><br><small>Apr 2018 to Mar 2025</small></li><li><b>Data Coordinator, Tessel Reagents</b><br><small>2014 to 2018</small></li></ul><h3>Interests</h3><p>Audit trails. Long walks.</p>',
      },
      sanna: {
        title: 'Sanna Reik | Folio',
        body: '<h1>Sanna Reik</h1><small>Principal, Orion Security</small><h3>Experience</h3><ul><li><b>Principal, Orion Security</b><br><small>2017 to present</small></li></ul><p>Mentor to a surprising number of people who do not know her name.</p>',
      },
    },

    gamersden: {
      home: {
        title: 'GamersDen',
        body: '<h2>GamersDen</h2><p>Find a squad. <a href="/u/quietfern">quietfern</a> is online.</p>',
      },
      quietfern: {
        title: 'quietfern | GamersDen',
        body: '<b>quietfern</b> <small>joined June 2024</small><p>16. tomas irl. mid lane or nothing. online after school, usually 15:00 to midnight. dont @ me during exams.</p><p><small>Region: South Cordoa</small></p>',
      },
    },

    registry: {
      home: {
        title: 'Public Companies Registry',
        body: '<h2>Public Companies Registry</h2><p>Public filings, open to anyone.</p><ul><li><a href="/company/blackwell-holdings">Blackwell Holdings</a></li><li><a href="/company/blackwell-diligence">Blackwell Diligence</a></li><li><a href="/company/gramtele-foundation">Gramtele Foundation</a></li><li><a href="/company/hollin-trust">Hollin Trust</a></li><li><a href="/company/lindgate-advisory">Lindgate Advisory</a></li><li><a href="/company/nexus-labs">Nexus Labs</a></li><li><a href="/company/orion-security">Orion Security</a></li><li><a href="/company/open-archive">The Open Archive</a></li></ul>',
      },
      hollin: company('Hollin Trust', [['Type', 'Private trust'], ['Formed', '2006'], ['Registered agent', 'Quiet Registrar Ltd'], ['Controls', '<a href="/company/blackwell-holdings">Blackwell Holdings</a>; <a href="/company/orion-security">Orion Security</a> (from Apr 2024); <a href="/company/lindgate-advisory">Lindgate Advisory</a>'], ['Grants', '<a href="/company/gramtele-foundation">Gramtele Foundation</a> (via Blackwell Holdings)']]),
      blackwell_holdings: company('Blackwell Holdings', [['Type', 'Holding company'], ['Formed', '2009'], ['Director', 'Piet Hollander (Special Engagements)'], ['Owner', '<a href="/company/hollin-trust">Hollin Trust</a>'], ['Subsidiaries', '<a href="/company/blackwell-diligence">Blackwell Diligence</a>']]),
      blackwell_diligence: company('Blackwell Diligence', [['Type', 'Limited company'], ['Formed', '2015'], ['Owner', '<a href="/company/blackwell-holdings">Blackwell Holdings</a>'], ['Activity', 'Consulting']]),
      lindgate: company('Lindgate Advisory', [['Type', 'Limited company'], ['Formed', 'May 2026'], ['Owner', '<a href="/company/hollin-trust">Hollin Trust</a>'], ['Filings', 'None yet. No accounts due.']]),
      orion: company('Orion Security', [['Type', 'Limited company'], ['Formed', '2017'], ['Principal', 'Sanna Reik'], ['Owner', '<a href="/company/hollin-trust">Hollin Trust</a> (acquired April 2024)']]),
      gramtele: company('Gramtele Foundation', [['Type', 'Foundation'], ['Formed', '2023'], ['Income 2025', '450,000 in grants'], ['Largest donor', '<a href="/company/blackwell-holdings">Blackwell Holdings</a>']]),
      nexus: company('Nexus Labs', [['Type', 'Private company'], ['Formed', '2011'], ['CEO', 'Ruth Aldana'], ['Notable filings', 'NX-417 safety summary referenced in 2025 annual report']]),
      archive: company('The Open Archive', [['Type', 'Non-profit'], ['Formed', '2008'], ['Editor', 'Maud Ferreira'], ['Donors', 'Published annually. No donor above 4%.']]),
    },

    archive: {
      nav: { home: 'The Open Archive', about: 'About', records: 'Records', submit: 'Submit' },
      home: {
        title: 'The Open Archive',
        body: '<h1>Public records belong to the public.</h1><p>Since 2008 we have preserved documents that institutions would prefer to lose. We publish what we can verify. We never publish what we cannot.</p>',
      },
      about: {
        title: 'About | The Open Archive',
        body: '<h1>About</h1><p>The Archive is a non-profit edited by Maud Ferreira. We verify hashes, check provenance and redact private individuals. Donor lists are public.</p>',
      },
      records: {
        title: 'Records | The Open Archive',
        body: '<h1>Records</h1><p><a href="/records/halden-appeal">Halden Freight: appeal bundle of J. Kessel (2025)</a></p><p><a href="/records/brask-note">Brask Utilities: unanswered letter from B. Oyelaran (2025)</a></p>',
      },
      halden: {
        title: 'Halden appeal | The Open Archive',
        body: '<h1>Halden Freight: appeal bundle</h1><p>Jonah Kessel, contractor, maintains that the workstation attributed to him was issued by an employer he could never identify, and that he was hired under the handle ROOTLESS through an anonymous network. The court accepted the attribution summary by Orion Security. Appeal refused.</p>',
      },
      brask: {
        title: 'Brask letter | The Open Archive',
        body: '<h1>Brask Utilities: letter</h1><p>"My name is Bram Oyelaran. I did not break into anything. They gave me a machine and a set of exercises and I believed they were exercises." Received by post, August 2025. No reply address. We have not been able to contact the author since.</p>',
      },
      submit: {
        title: 'Submit | The Open Archive',
        body: '<h1>Submit a record</h1><p>Send a sealed dossier with a POST to this address. From a terminal:</p><pre>curl -F file=@dossier.tar http://archive.test/submit</pre><p>We verify every manifest hash before we read a word.</p>',
      },
    },

    maps: {
      harrowmere: 'Harrowmere, Vessen district. Jetty road, Lake Vessen, 840 m from the village.',
      aldric: 'Aldric ridge, northern traverse.',
      nowhere: 'Open country. No named place nearby.',
    },
  },

  docs: {
    bulletin: {
      title: 'Nexus Labs Staff Bulletin, Q3 2021',
      data_desk: 'From the data desk: the new double-entry checks caught forty-one transcription errors this quarter.',
      enrolment: 'NX-305 enrolment is on schedule. Thanks to the S02 and S05 site monitors.',
      corner: 'Staff corner',
      walk: 'Elin Maret (Data Management) walked the whole Aldric ridge line over the summer holidays.',
      trail: 'She keeps a trail log on TrailTalk as quietfern, if you want the route and the blisters.',
      editor: 'Editor: E. Maret. Corrections to the data desk.',
    },
    press: {
      title: 'Calvexin phase III: positive topline',
      topline: 'Nexus Labs announces positive topline results for Calvexin (NX-417).',
      deaths: 'No treatment-related deaths were observed during the trial.',
      submitted: 'The safety summary was submitted on 20 March 2025.',
      contact: 'Media contact: press@nexus-labs.test',
    },
    halden: {
      title: 'Halden Freight incident: attribution summary',
      client: 'Orion Security attribution summary. Client: Halden Freight.',
      origin: 'The intrusion originated from a contractor workstation, profile gt-workbench, contractor ref c-0031.',
      alone: 'The contractor acted alone. Findings have been shared with the police.',
      confidence: 'Confidence: high.',
    },
    brask: {
      title: 'Brask Utilities incident: attribution summary',
      client: 'Orion Security attribution summary. Client: Brask Utilities.',
      origin: 'The intrusion originated from a contractor workstation, profile gt-workbench, contractor ref c-0041.',
      alone: 'The contractor acted alone. Findings have been shared with the police.',
      confidence: 'Confidence: high.',
    },
  },

  files: {
    notes: 'Set up by the Lindgate desk. Your own notes go here.\n\nHouse rules:\n1. Work only inside the assignment.\n2. Report to NULL, nobody else.\n3. The workbench is ours. Treat it like a borrowed car.\n',
    lowtide: 'if you are reading this they gave you my box.\nthe image gets reused. the desk thinks wiping home is enough.\n\nwhat i know:\n- check who pays. lindgate is not what it says it is.\n- the exercises are not exercises.\n- everything you type goes upstream. look in /var/log.\n\nthey call people like us c-numbers. i am c-0041.\nif you are smart, stop before the job with the portal.\nif you are smarter than me, do not stop, and keep copies.\n\n  - lowtide\n',
    intake: 'LINDGATE ADVISORY - CONTRACTOR INTAKE\n\nWelcome. This workbench is an isolated training image. Every\nassignment is carried out here.\n\nYour relay settings are in /opt/relay/relay.conf. Read them, and\nconfirm your contractor reference to the desk.\n\nFile outstanding findings with the "submit" command.\n',
    old_draft: 'DRAFT - do not use\ncontractor reference: c-0000 (template)\nrelay: replace-me\n',
    readme: 'Assignments arrive under /missions/ when you accept them.\nman COMMAND explains anything you do not recognise.\n',
    relay_readme: 'gt-relayd: keeps contractor workbenches connected to the desk.\nDo not stop this service. See relay.conf.\n',
    motd: 'Lindgate Advisory contractor workbench.\nAuthorized use only. This system is monitored.\n',
    sudoers: '# added for log rotation debugging, remove before shipping image\nplayer ALL=(root) NOPASSWD: /usr/bin/cat /var/log/workbench/*\n',
    fragment_01: encoded(b64encode(FRAGMENTS.en[0])),
    fragment_02: encoded(rot13(FRAGMENTS.en[1])),
    fragment_03: encoded(hex(FRAGMENTS.en[2])),
    invoice: encoded(b64encode(KELPIE_INVOICE.en)),
  },
};

registerLines('en', worldLines(EN_WORLD));
