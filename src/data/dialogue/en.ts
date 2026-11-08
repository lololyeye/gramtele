import { b64encode } from '../../game/commands/forensic';
import { FRAGMENTS } from './fragments';
import type { DialogueSet } from './format';

/**
 * The story in English. Written for English readers; fr.ts is written separately and shares only the intent.
 * Voices are defined in docs/VOICES.md. Read that before touching a line.
 */

const hex = (s: string) => [...new TextEncoder().encode(s)].map((b) => b.toString(16).padStart(2, '0')).join('');
const rot13 = (s: string) => s.replace(/[a-z]/gi, (c) => {
  const base = c <= 'Z' ? 65 : 97;
  return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base);
});

const ACCEPT = { label: 'Accept the assignment', reply: 'I will take it.' };
const DECLINE = { label: 'Decline for now', reply: 'Not this one.' };
const offer = (m: string[], declined: string, again: string, reply = 'Fine. Send it over.') => ({
  offer: { m, c: { accept: ACCEPT, decline: DECLINE } },
  reoffer: { m: [declined, again], c: { accept: { label: ACCEPT.label, reply } } },
});

const n1 = offer(
  ['A small paid test, if it interests you. 40 credits, an hour of your evening. We issue you a workbench, and you show me you can find your way around it. Most people overestimate themselves at this stage. It is the best part of my week.', 'Assignment attached.'],
  'Understood. People are often busy, or afraid. The two look alike from here.',
  'The test stays open tonight, at 50 credits. I do not usually ask twice.',
);
const n2 = offer(
  ['A proper assignment, if you have the evening. A client wishes to understand a former employee of one of its suppliers. All we hold is a handle.', 'Public sources only, and we never contact a subject. 80 credits. kelpie asked for this one and did not get it. You need not mention that. kelpie will.'],
  'That is your right. kelpie will be delighted.',
  'The 80 became 90 on my side, since the client is pressing. Same terms.',
);
const n3 = offer(
  ['Your next assignment is narrow. A client wants assurance on vendor payments in a decommissioned database. An image is ready for you.', 'The scope is the invoices. 120 credits. You are now paid more than some of the people who laughed at you. I would not bring it up. They can count.'],
  'As you prefer.',
  'I can stretch to 130. It is an easy evening, and it is only invoices.',
);
const n4 = offer(
  ['The client would now like an outside view of the same supplier: what anyone could see of its network from public information. It is all simulated within your lab environment.', '150 credits.'],
  'Noted.',
  'I will hold it for you at 160. After this there is a larger job, and I would like you ready for it.',
);
const r2 = offer(
  ['they offered you the big job right - round number - portal - thats the one - thats where they stop paying and start writing reports', 'dont answer them yet - lowtide said it in that note - keep copies - i put a folder on your box - relay goes both ways if you know how to ask - moth owes me'],
  'ok - you want to be sure - everyone does',
  'but the date doesnt move because you need a day',
);

export const EN_DIALOGUE: DialogueSet = {
  scenes: {
    n0_hello: {
      m: [
        'Good evening. You asked a good question in the open channel earlier: why an old DNS answer can outlive the record that produced it. Most people do not ask why.',
        'I handle contract work for a small diligence firm. Paperwork, mostly. I also keep a shortlist, and four minutes ago you were not on it. Do not read too much into that. It is long, and I am rarely impressed.',
      ],
      c: {
        firm: { label: 'Which firm?', then: ['Lindgate Advisory. You are welcome to look them up. I would think less of you if you did not, and I already think very little, so there is room to move.'] },
        how: { label: 'How did you find me?', then: ['You asked a good question in public. I have been reading public channels since they ran at 2400 baud. Spotting the one person thinking is not difficult.'] },
        work: { label: 'What kind of work?', then: ['Careful reading, mostly. Records, documents, configuration. Nobody has ever been hurt by careful reading.'] },
      },
    },
    n1_offer: n1.offer,
    n1_reoffer: n1.reoffer,

    lg_hello: {
      m: [
        'You were added to #lowlight by NULL.',
        'Welcome. Rule 1: no names. Rule 2: no clients. Rule 3: nobody asks what anyone is paid.',
        'rule 3 lasted nine minutes back in 2024 lol. new handle what are you on',
        'check the profile my guy. standing zero. they are on whatever NULL tips them',
        'FRESH MEAT - hey zero - what does rm -rf do - wrong answers only',
      ],
      c: {
        back: { label: 'Answer ROOTLESS', reply: 'Frees up disk space.', then: ['HA - ok zero has jokes - zero can stay', 'jokes still bill at zero per day'] },
        short: { label: 'Keep it short', reply: 'Evening. Just here to work.', then: ['cute. so were the last three', 'That is the correct answer, by the way. Nobody ever listens.'] },
      },
    },
    lg_fails: {
      m: [
        'someone on the lab image just fat-fingered four commands in a row',
        'opened a terminal and really thought they were him 💀',
        '😂😂',
        'NULL, that is not like you.',
        'Apologies. Long shift.',
      ],
    },
    lg_hints: {
      m: [
        'A small observation for the newcomer: hint counters are not private. "hint" is a command, and commands get logged. I mention it only because nobody here has ever read a man page.',
        'HINT ENJOYER SPOTTED 💀',
        'Ignore them. Everyone in here has typed hint. Some of them never stopped.',
      ],
    },
    n1_done: {
      m: [
        'Received. 40 credits released. You read the live configuration rather than the draft beside it. Several people have not, and they were very confident about it.',
        'And no hints. I do not hand out compliments. I hand out further work.',
        'You took hints. They are logged, and I have read them. Everyone starts somewhere. Some of us started earlier.',
        'One housekeeping note. You will come across old files on that image from a previous contractor. They are not relevant, and I would leave them.',
      ],
    },
    lg_m1: {
      m: [
        'ok the table moved. new handle cleared orientation. standing is no longer zero, alert the press',
        'no hints either. tinsel you owe me five',
        'I owe you nothing. Orientation is a directory and a text file.',
        'i did orientation hungover on a train. wake me when they close a real job 💸',
        'kelpie you did orientation TWICE - we all saw',
        'different client',
      ],
    },
    ltd_archive: {
      m: [
        'Conversation recovered from the workbench image. Account closed 22 Aug 2025. 11 Feb 2025:',
        'Good evening. You asked a good question in the open channel earlier. Most people do not ask why.',
        'ha thanks. who is this',
        'I handle contract work for a small diligence firm. Paperwork, mostly.',
        '20 Aug 2025:',
        'there is a police report with my contractor number on it',
        'NULL',
        'answer me',
        'NULL has left this conversation.',
      ],
      journal: ['An archived chat from lowtide opens with almost the same words NULL used on me. It ends with a police report.'],
    },
    v1_request: {
      m: [
        'ok so someone in #lowlight says the new handle read a config file before asking about it. rare. hi.',
        'I do security research, mostly from airport lounges, because I can. I answer questions when I feel like it. one rule. write it down.',
      ],
      c: {
        yes: { label: 'Accept contact request', reply: 'Hi. Write what down?', then: ['everything. the command, the time, why you ran it. you will not remember. nobody does. also get a real keyboard, I can hear that one from here.'] },
        no: { label: 'Ignore for now', reply: 'I do not know you.', then: ['good answer honestly. cute, but good. offer stands.'] },
      },
    },

    n2_offer: n2.offer,
    n2_reoffer: n2.reoffer,
    v2_tip: {
      m: [
        'heard you got the people job over kelpie. ok so one thing. same handle on two sites is not the same person. people get ruined by that mistake, and never the ones who make it.',
        'ask of every fact: who says so, and what would it look like if they were wrong?',
      ],
    },
    lg_kelpie_flex: {
      m: [
        'some of us got passed over on a job this week and that is FINE because i closed two bigger ones',
        '4k, 5k, i stopped counting tbh. new setup is fully liquid cooled 💸',
        'cute. which two? I ask because I know who signs the invoices on that desk, and nobody remembers paying you since august.',
        'different desk',
        'ok but the "liquid cooling" pic had a rental sticker on it. i zoomed 👀',
        'HE IS COOLING A RENTED LAPTOP WITH A BUCKET 💀',
        'Rule 3.',
        'ok so. my rack costs more than this channel earned last year, and I still write down what it cost. kelpie, write it down.',
      ],
    },
    m1_hello: {
      m: [
        'Hello, c-0047. Forgive the number. You have a perfectly nice handle; numbers simply lie less.',
        'You have been reading a walking forum all evening. A charming hobby, I am sure, in the sense that "charming" and "hobby" are both working very hard in that sentence...',
      ],
      c: {
        how: { label: 'How do you know that?', then: ['Your relay and my relay are on excellent terms. I would explain the topology, but you would only nod. Ask me again when you have something to trade...'] },
        block: { label: 'Leave me alone.', then: ['Everyone opens with that. Statistically, a question follows. I can wait; I have read the entire ticket queue and most of Gibbon...'] },
      },
    },
    n2_done_gave: { m: ['Very thorough, and a bonus has been released for the location. The client is pleased. You need think no more about this subject.'] },
    n2_done_withheld: {
      m: [
        'Received. Name and employment, and no location. It seems unlike you to find so little. I have watched you read.',
        'No matter. Payment released. kelpie would have found the town, and been unbearable about it.',
      ],
    },
    lg_m2: {
      m: [
        'table update. {handle} just went past me. i am not upset. the birds are upset',
        '{handle} got lucky on one job',
        'Noting for the record that kelpie has learned the handle.',
        'they know your name now {handle} - congrats - thats how it starts',
      ],
    },
    lg_duel: {
      m: [
        'alright since everyone is auditing me. last month, invoice and all. encoded because NDA. sit down',
        'Base64 is not an NDA. It is not even a lock. It is a slightly uglier font.',
        '{handle} you are the one on a streak. open it and read it out 👀',
      ],
      c: {
        expose: {
          label: 'Read the invoice out loud',
          reply: 'Invoice 2026-0093. Amount: 40 credits. Status: unpaid, disputed by the client.',
          then: [
            'that is a placeholder',
            'FORTY',
            'FORTY CREDITS 💀 THE BUCKET WAS ON FINANCE',
            'Rule 3. However.',
            'ok so that was clean. {handle} opened the file before opening their mouth. rare. everyone write that down.',
          ],
        },
        pass: { label: 'Leave it alone', reply: 'Not my invoice, not my problem.', then: ['smart. know your level', 'boring. respectable but boring'] },
      },
    },
    e1_fragment: {
      m: [b64encode(FRAGMENTS.en[0])],
      c: {
        decoded: { label: 'I know now. Who are you?', then: ['Encoding is not secrecy. You passed.'] },
        what: { label: 'What is this supposed to be?', then: ['bWFuIGJhc2U2NA=='] },
      },
    },
    lg_echo: {
      m: [
        'ok why is the word going round that ECHO opened a channel to {handle}',
        'I said nothing. I rarely need to.',
        'ECHO has posted three times in a year. Three retractions followed. Nobody has won an argument with ECHO, mostly because nobody gets a second message.',
        'standing 40. who cares',
        'kelpie. go read the three posts. then be quiet for a while.',
      ],
    },
    e1_gave: {
      m: [
        'A man walked down the jetty road on Tuesday, asking in the shop about a woman who hikes.',
        'I do not live there any more. I had a garden.',
      ],
      journal: ['ECHO has fled Harrowmere because someone came asking. I gave them the town.'],
    },
    e1_withheld: {
      m: [
        'A profile I keep an eye on was read closely, photo and all. Then nobody came. Somebody knew, and did not say.',
        'I would like to know why. I do not expect an answer yet.',
      ],
    },

    n3_offer: n3.offer,
    n3_reoffer: n3.reoffer,
    lg_db: {
      m: [
        'anyone else get paid to read a dead database this year',
        'Rule 2.',
        'i said anyone, i did not say a client',
        'remember unfurl? always had the fun jobs. best table run in here for a whole winter. then stopped posting in february',
        'People move on.',
        'thats one word for it',
      ],
    },
    lg_group_by: {
      m: [
        'A small poll. kelpie maintains that GROUP BY "filters the rows". Before I say something unkind: does anyone in this channel know what it does?',
        'it groups and filters whatever. i pay people for sql',
      ],
      c: {
        wrong: { label: 'It sorts the rows', reply: 'GROUP BY sorts the rows by that column.', then: ['That is ORDER BY. GROUP BY collapses rows into one per key, so that aggregates can run over them. I shall assume you were being kind to kelpie...', 'THERE ARE TWO OF THEM 💀'] },
        right: { label: 'It collapses rows per key', reply: 'GROUP BY collapses rows into one per key so aggregates can run. WHERE filters before it, HAVING after it.', then: ['Correct, and in the right order. How irritating.', 'thats what i said', 'it is not. {handle} said it 👀'] },
      },
    },
    lg_kelpie_asks: {
      m: [
        'hey {handle} what are you on these days. not for me. friend of mine is renegotiating',
        'Rule 3.',
        'rule 3 is for people who are winning tinsel',
      ],
    },
    lg_passed_kelpie: {
      m: [
        '{handle} just passed kelpie on the table. kelpie has gone very quiet. kelpie has changed avatar',
        'standing is a popularity contest',
        'It is. You were winning it.',
      ],
      c: {
        gloat: { label: 'Twist the knife', reply: 'You said to wake you when I closed a real job.', then: ['ok. OK.', 'OHHH - KELPIE IS DEAD - SOMEONE TELL THE BUCKET 💀'] },
        gracious: { label: 'Let it go', reply: 'Plenty of table for everyone.', then: ['That is worse, you know.'] },
      },
    },
    e2_fragment: { m: [rot13(FRAGMENTS.en[1]), rot13('tr a-z n-za-m')] },
    v3_ask: {
      m: ['you sound quiet. database jobs do that. did you find something outside scope? you can tell me. I bill 900 an hour to hear that sentence and you get it free. I keep good notes, as you know.'],
      c: {
        share: { label: 'Tell VANTA about the deleted events', reply: 'Three adverse events were deleted the night before a big invoice. Two were deaths.', decision: 'You told VANTA about the deleted adverse events.', then: ['ok. that is real. no jokes on this one. did you hash the image? hash the image. and be careful who else you say that to.'] },
        keep: { label: 'Keep it to yourself', reply: 'Nothing worth mentioning. Just invoices.', decision: 'You told nobody what the archive contained.', then: ['mm. ok. notes, though. even if they are only for you.'] },
      },
    },
    n3_done: {
      m: [
        'Your invoice figures reached the client. Thank you. Payment released.',
        'The report was right the first time. I read very few of those. Do not make me regret saying so.',
        'You need not trouble yourself with the deleted entries. They were outside your scope.',
      ],
      c: {
        confront: { label: 'What happened to those patients?', decision: 'You challenged NULL about the patients in NX-417.', then: ['Patients? I asked you about invoices.', 'Your work remains excellent. I would keep it that way.'] },
        noticed: { label: 'I never told you about any deleted entries.', decision: 'You noticed NULL knew something you had only told VANTA.', journal: ['NULL mentioned the deleted entries. I had told only VANTA.'], then: ['You queried the audit table on our workbench. We do read our own logs.'] },
        quiet: { label: 'Say nothing', reply: 'Understood.' },
      },
    },
    lg_m3: {
      m: [
        'table. {handle} is now above tinsel. i have screenshots if anyone needs to grieve',
        'Standing is not seniority.',
        'it kind of is tinsel - thats the whole tragedy',
        'Good work is not a personality. Carry on.',
      ],
    },
    v_respect: {
      m: [
        'ok so I looked at the table. I check it the way you check your bank balance, except mine is funny. you are up there now. that was real work and I am annoyed I did not bet on it.',
        'do not buy anything yet. they all buy something.',
      ],
    },
    e3_fragment: { m: [hex(FRAGMENTS.en[2])] },

    n4_offer: n4.offer,
    n4_reoffer: n4.reoffer,
    lg_race: {
      m: [
        'ok {handle} - new game - same lab image for everyone so nobody cries NDA - first to name the default gateway and count the live hosts wins',
        'i am on a 12 year old thinkpad and pure spite - GO',
        'busy',
        'kelpie is busy 👀 bets are open',
      ],
    },
    lg_race_won: {
      m: [
        'NAH - nah no way - no way this n00b got there before me',
        'i was typing - my thinkpad was thinking about it',
        'pay up. 5 credits to the n00b',
        'i owe everyone 5 credits - get in the queue - fine - sent',
      ],
    },
    r1_hello: {
      m: [
        'different channel different me - in lowlight i am the clown - nobody reads the clown - thats the point of the clown',
        'c-0031 - i had your box before the guy who had your box - ask them what happened to halden freight',
      ],
      c: {
        yes: { label: 'What happened at Halden Freight?', then: ['read the report - orion-security.test/reports - my number is on it - i was home that night - judge did not care'] },
        no: { label: 'Why should I trust you?', then: ['you shouldnt - check me - archive.test has the appeal bundle - check everything thats what they trained you to do - funny that'] },
      },
    },
    lg_ttl: {
      m: [
        'Since the level of discussion has been low, a fact for the children: once you update an authoritative DNS record, the old answer is gone. Everyone gets the new one at once. "Propagation" is a myth sold by hosting companies.',
        'wow ok professor',
      ],
      c: {
        agree: { label: 'Let it slide', reply: 'Sounds right.', then: ['It does sound right. It is also false: resolvers keep the old answer until its TTL runs out. I wanted to see who would say so. Nobody did...', 'That was a test. You have just failed it in front of everyone.'] },
        ttl: {
          label: 'Correct MOTH: resolvers cache until the TTL runs out',
          reply: 'Wrong. A resolver keeps the old answer until its TTL expires, so a stale answer can outlive its record. That is the question that got me hired.',
          then: [
            '👀👀👀',
            'Strictly speaking... yes. I was compressing.',
            'YOU WERE COMPRESSING?? 💀💀 MOTH GOT CORRECTED BY THE INTERN',
            'Enjoy it, {handle}. It will not recur. I will, however, remember it.',
          ],
        },
      },
    },
    m2_watch: { m: ['You looked up who owns your employer. Good; that is the first literate thing anyone in your cohort has done. They saw, of course. Your workbench tells them everything... did nobody mention?'] },
    n4_done: {
      m: [
        'A clear map, and well separated from opinion. Payment released.',
        'That was clean. Do not let it reach your head; it would find very little to hold on to.',
        'The next job is larger and pays 2000. Details follow once you confirm. It concerns that same portal. Take a day.',
      ],
    },
    lg_m4: {
      m: [
        'table update and i need everyone seated. {handle} is above MOTH.',
        'Standing measures who has been noticed, not who is right.',
        'you called it the only honest number on this network - in MARCH',
        'I have said many things in March.',
        'table update. {handle} is closing on MOTH. i am selling tickets',
        'For the record, I called this one early.',
        'you did not',
        'ok so. everyone here has just learned your name. ask yourself who that is useful to.',
      ],
    },

    r2_offer: r2.offer,
    r2_reoffer: r2.reoffer,
    r_table: {
      m: [
        'i was 812 on that table once - top 5 - kept a screenshot - dont laugh',
        'you know what standing does when they pick you - makes you a better story - notorious contractor reads great in a summary - nobody writes a report about a nobody',
      ],
    },
    mt_trade: {
      m: [
        'So... I have a small export. Session records, device ids, the very thing our transparency page says does not exist. It would answer most of your questions, in better prose than you would manage.',
        'And you have someone who sends you hex at dawn. I would like to know which relay she is on. Only that. A fair trade: one set of metadata for another...',
      ],
      c: {
        give: { label: 'Give MOTH what you know about ECHO', reply: 'Her handle is ECHO. She connects around dawn. Send the file.', decision: "You traded ECHO's connection pattern to MOTH for the export.", then: ['A pleasure... I do mean that.'] },
        refuse: { label: 'Refuse', reply: 'No. Not her.', decision: 'You refused to trade ECHO to MOTH.', then: ['Principled... that usually costs someone. We will talk.'] },
      },
    },
    mt_weight: { m: ['Congratulations on the standing. Now consider, if it is not too much trouble, who pays for the table. A contractor nobody has heard of makes a poor culprit. A notorious one reads beautifully...'] },
    r3_export: { m: ['moth asked for her didnt it - you said no - good - moth also sold me this last year for less than youd think - old format same tables - updated it myself'] },
    v4_confront: {
      m: [
        'you ran a group by on the sessions table. saw it come through.',
        'ok so. yes. d-90be is my laptop. I run recruits. I taught six people to take notes and then I wrote the reports with their numbers on them. the rack, the lounges. that is what it pays for.',
        'I have also been looking for a seventh who would read their own audit log before they had to. you did. nobody else has.',
      ],
      c: {
        believe: { label: 'Why should I believe a word of that?', decision: 'You demanded VANTA justify herself.', then: ['you should not. check it. I signed Halden and Brask, my name is on the PDFs. if you publish, I go first. I have made my peace with the order.'] },
        cut: { label: 'You did this to six people.', decision: 'You told VANTA there was nothing she could say.', then: ['yes.'] },
        help: { label: 'Then help me. Delay the closure.', decision: 'You asked VANTA for help, knowing who she is.', then: ['I can lose a form for a week. maybe. that is all I have ever been able to do, lose forms.'] },
      },
    },
    e4_plain: {
      m: [
        'I am told you have assembled the record. My name is Elin Maret. I kept the audit export for nineteen months, and I have not found anyone who would read it.',
        'My relay was probed this morning. I know how that happened, and I know you have the record. My name is Elin Maret. I have very little left to protect.',
        'Two families have never been told how those people died. If this is published, I am the witness, and I will be found. If it is given to me, I go to the regulator myself, in my own time. That choice was taken from me once.',
      ],
      c: {
        custody: { label: 'Send the dossier to ECHO', reply: 'It is yours. Sending the sealed dossier now.', decision: 'You gave the dossier to Elin Maret and let her decide.' },
        wait: { label: 'Not yet', reply: 'Give me a little longer.', then: ['I have become good at that.'] },
      },
    },
    mt_buy: {
      m: ['A sealed dossier! Publishing is so final... give it to me instead. I hold it over them, they fund a new life for two people, nobody goes to prison, nobody gets found. The world stays exactly as bad, but we are out of it.'],
      c: {
        sell: { label: 'Hand the dossier to MOTH', reply: 'Take it. Get me out.', decision: 'You sold the dossier to MOTH for leverage.' },
        no: { label: 'No deal', reply: 'No.', then: ['The offer ages badly. Like everything, and most people.'] },
      },
    },
    n5_final: {
      m: [
        'You have read a file you were not asked to read. I expected you would, eventually. People of your ability do.',
        "Your position is simple. Take the next contract and you move to our side of the desk: a salary, a new handle, and the number on that closure date becomes someone else's. Or do not, and I cannot help you.",
        'You will have noticed that your name carries weight now. We built that scale. We are very good at reading it.',
      ],
      c: {
        seat: { label: 'Take the contract', reply: 'What do you need me to sign?', decision: "You took the seat at NULL's desk." },
        ghost: { label: 'Close your account and disappear', reply: 'Close my account.', decision: 'You closed the account and walked away with nothing said.' },
        later: { label: 'Do not answer yet', reply: 'I need to think.', then: ['Of course. The date is the date.'] },
        which: { label: 'Ask which one of them you are talking to', reply: 'd-7f3a, d-21c9, d-90be. Three devices, one voice, one story about 2400 baud. Which one of you am I talking to?', then: ['Nobody has asked me that in three years.', 'It does not change your position. It does, I concede, improve my opinion of it.'] },
      },
    },
  },

  small: {
    NULL: {
      low: [
        'Noted. I answer what requires an answer.',
        'Please keep to the assignment. It is simpler for you.',
        'I read everything you send. That is not the same as replying to it.',
        'If you have a question about the work, ask it plainly. If you have an opinion, finish a job first.',
        'We can discuss that when you have earned a second sentence.',
      ],
      mid: [
        'Noted. You are improving. I would not tell anyone.',
        'That is the first thing you have said today that I read twice.',
        'Ask me something difficult. I am bored, and you are nearly qualified.',
        'Perhaps. Bring evidence and I will consider having an opinion.',
      ],
      high: [
        'Your standing does not entitle you to my evenings. It does get you a reply.',
        'You have become expensive. That is rarely good news for anyone.',
        'Noted, {handle}. You will find I use that name sparingly.',
        'A year ago I would have had you corrected. Now I merely disagree.',
      ],
    },
    VANTA: {
      low: [
        'ok so. did you write that down somewhere or just tell me?',
        'hm. what did you see, exactly? not what you think it means',
        'busy. in a car. a nice one. notes first, questions after',
        'ask me something with a command in it and I get a lot more talkative',
      ],
      mid: [
        'better. still cute, but better',
        'ok so you are starting to sound like someone who bills. what did you see, exactly?',
        'I would answer properly but this call is costing someone a lot',
        'good. now write it down. I will keep saying it',
      ],
      high: [
        '{handle}. look at you. still write it down',
        'ok so you could charge for that sentence. you should. not me though',
        'people keep asking me about you. I tell them nothing, it costs more',
        'fine. you are good. I said it once, it is in my notes, do not quote me',
      ],
    },
    MOTH: {
      low: [
        'How brave, to say that where it is logged...',
        'Interesting. What would you give me for caring about that?',
        'I am on call. Talk to me when something is on fire, and do try to identify which thing...',
        'I will remember you said that. I remember most things; it is a problem...',
        'That was almost an argument. Keep the "almost"; it suits you.',
      ],
      mid: [
        'Better. You used a noun correctly...',
        'I was going to correct you, but I would have to look something up first, and I resent that.',
        'You are becoming expensive to ignore...',
        'That is nearly right, which is worse than wrong; it travels further.',
      ],
      high: [
        'I have started reading your messages twice. Do not be flattered; I read the incident queue twice as well...',
        'Go on, {handle}. I have so few people left worth correcting.',
        'You are not wrong. Note the date.',
        'Trade you a fact for that? I rarely ask twice, and I never ask nicely...',
      ],
    },
    ROOTLESS: {
      low: [
        'not much i can do with that zero - try again with words',
        'careful what you type on their box - you know that by now or you will',
        'i am not your friend n00b - i am just still here',
        'whatever it is - keep a copy',
        'LOUD typing for someone with that standing 💀',
      ],
      mid: [
        'ok you are annoying now - thats a promotion',
        'yeah - welcome to the tenancy',
        'i would fight you but my thinkpad is rebooting - it is always rebooting',
        'not bad - dont tell anyone i said - they wouldnt believe it anyway',
      ],
      high: [
        '{handle} ur famous now - congrats - i was famous - look how thats going 💀',
        'keep a copy - i mean it - famous people get the good reports',
        'nah you actually know things - disgusting',
        'still here - you too - thats the only table that counts',
      ],
    },
    ECHO: {
      low: [
        'Received. I do not discuss things here without a reason.',
        'Be exact, or be quiet. This channel is not safe for approximations.',
        'I will reply when there is something to verify.',
      ],
    },
    lowlight: {
      low: [
        'nobody asked, new hire',
        'Read the rules. Then read the room.',
        'is this about the invoice again',
        'ZERO SPEAKS 💀',
      ],
      mid: [
        'ok relax. one good week',
        'Keep it to work chat. The mods are humourless. I am the mods.',
        'screenshotting this for the table 👀',
        'ok this one has teeth - small teeth',
      ],
      high: [
        'yeah yeah we all saw the table',
        'Noted, {handle}. Try not to make me regret the pin.',
        '{handle} spoke. everyone act normal 👀',
        'Correct, surprisingly. Carry on.',
      ],
    },
  },

  files: {
    NULL: ['Received. Findings go through the desk, not through this channel.', 'I did not ask for this file. I have it now, of course.'],
    VANTA: ['got it. where did it come from and did you hash it first?', 'ok. note the source or that file is just a rumour'],
    MOTH: ['Oh, a present... I will not ask what it is worth. Yet...', 'Careful. Attachments are metadata too...'],
    ROOTLESS: ['dont send me things - it all gets logged', 'got it - deleting it - you never sent it'],
    ECHO: ['Do not send files here. Send a hash, and I will tell you if I care.'],
    lowlight: ['Do NOT post client files in here.', 'bold. expensive, but bold'],
  },

  characters: {
    NULL: {
      tagline: 'Introductions by arrangement.',
      joined: 'Aug 2023',
      bio: ['Handles contract work for a small diligence firm.', 'Pays on the day. Has never been late. Has never been wrong in public, as far as anyone will say.'],
      reveals: {
        knows_lindgate_shell: { label: 'Cover', value: 'Lindgate Advisory: five months old, owned by Hollin Trust.' },
        knows_null_devices: { label: 'Sessions', value: 'Three devices, in shifts. NULL is a job, not a person.' },
        knows_blackwell: { label: 'Works for', value: 'Blackwell Holdings, Special Engagements.' },
      },
    },
    VANTA: {
      tagline: 'write it down.',
      joined: 'Aug 2023',
      bio: ['Security researcher with very nice hardware. Answers questions when she feels like it.', 'Vouches for very few people, and invoices them.'],
      reveals: {
        knows_vanta_style: { label: 'Writes like', value: 'S. Reik, principal at Orion Security. The same phrases, the same "ok so".' },
        knows_vanta_device: { label: 'Device', value: 'Signs in from d-90be. So does NULL.' },
      },
    },
    MOTH: {
      tagline: 'drawn to whatever is on fire',
      joined: 'Jun 2023',
      bio: ['Knows things before they happen. Mentions this often.', 'One of the oldest handles on the network. Corrects strangers for pleasure.'],
      reveals: { knows_moth_staff: { label: 'Works at', value: 'Gramtele infrastructure. On call, by the look of those hours.' } },
    },
    ROOTLESS: {
      tagline: 'previous tenant',
      joined: 'Jan 2024',
      bio: ['The loudest handle on the network. Standing has been falling for two years.', 'Banned from #lowlight four times. Still there. Flagged "watch" by nobody in particular.'],
      reveals: { knows_rootless_kessel: { label: 'Real name', value: 'Jonah Kessel. Contractor c-0031. Convicted over Halden Freight.' } },
    },
    ECHO: {
      tagline: '...',
      joined: 'Sep 2025',
      bio: ['Rarely online, and never for long. Three public posts in a year, three retractions.', 'Sends documents more often than sentences.'],
      reveals: { knows_echo_elin: { label: 'Is', value: 'Elin Maret. Former data steward at Nexus Labs.' } },
    },
    lowlight: {
      tagline: 'private group: paid work, no names',
      joined: 'Mar 2024',
      bio: ['Invite-only. Independent contractors comparing notes, complaining about clients, and pretending not to compete. ostrich_farm keeps the table.'],
    },
    lowtide: {
      tagline: 'account closed 22 Aug 2025',
      joined: 'Feb 2025',
      bio: ['Archived conversation, recovered from the workbench image.'],
    },
  },

  endings: {
    record: {
      title: 'The Open Record',
      epigraph: 'Public records belong to the public.',
      p: {
        read: 'Maud Ferreira read your dossier that night and every hash matched. She published eleven days later, with the private names redacted and the audit rows in full.',
        fallout: 'Nexus Labs issued a statement, then a second one. The regulator opened a file on NX-417. Two families received letters that should have been written in 2025.',
        elin_hurt: 'Elin Maret did not see it. By then she had moved twice more because of things you had already handed over, and when the Archive wrote to her, the relay she had used for a year was silent. Your dossier made her a witness, and you know who made her easy to find.',
        elin_safe: 'Elin Maret was named as the source by a newspaper within the month, against her wishes. She gave evidence anyway, in a plain, exact voice, and went back to somewhere with a lake.',
        vanta_helped: 'Your closure form went missing for nine days, which was long enough. Sanna Reik resigned from Orion before anyone asked her to, and gave a statement that spared nobody, herself included.',
        vanta_not: "Orion's summary with your number on it was filed on 5 November, one week too late to be believed. It still took two lawyers and most of a year to make it go away.",
        coda: 'ostrich_farm posted the table one last time before the channel went quiet. Your handle sat near the top, greyed out, with one comment under it from an account that had never praised anyone: "clean."',
        after: 'Gramtele lost a third of its handles in a week. The rest stayed. It was still the easiest place to find someone who would ask a good question.',
      },
    },
    custody: {
      title: 'Custody',
      epigraph: 'That choice was taken from me once.',
      p: {
        sent: 'You sent the sealed dossier to a relay that answered at dawn. Then you waited, which you were bad at.',
        weeks: "Elin Maret took seven weeks. She found a lawyer who did not flinch and a regulator's inspector who had already been uneasy about day 40 of dosing. She went in on a Tuesday, under her own name, with her own export and your hashes.",
        hurt: 'She never said she forgave you for what you handed over earlier. Her last message said only: "Received. Verified." You understood it was the most she could give, and more than you had a right to.',
        safe: 'Her last message to you was one line of base64. You decoded it by hand, for the pleasure of it. It said: thank you for leaving it out.',
        slow: 'It did not become a scandal. It became a slow inquiry, a withdrawn licence and a quiet settlement. Blackwell is still in business, under another name, and you still check who owns things.',
        vanta_helped: 'Your closure form went missing, and nobody ever filed a report with your number on it. You do not know whom to thank, and you would not.',
        vanta_not: 'A report with your number on it did appear. It took a long time to be shown to be false. Your hashes helped.',
        coda: 'In #lowlight they still argue about what happened to you. kelpie says you took a buyout. ROOTLESS says you never existed. Nobody says you were bad at it.',
      },
    },
    leverage: {
      title: 'Leverage',
      epigraph: 'The world stays exactly as bad, but we are out of it.',
      p: {
        offer: 'MOTH was as good as the offer. Within a month there was no closure date, no report and no workbench. A new identity arrived by post, with a bank account that had enough in it to be insulting.',
        nothing: 'Nobody went to prison. NX-417 stayed filed. Calvexin was licensed the following spring, and you read the press release, and then you stopped reading press releases.',
        gave: "You had given MOTH Elin's pattern too. One morning you checked her relay, for no reason, and it was gone. You will never know if that was her choice.",
        kept: 'Elin Maret kept her copy of the audit export. Somewhere, she is still looking for someone who will read it. You could write to her. You have thought about it.',
        coda: 'Your old handle still sits on the table, frozen, above people still working for a living. You check it more than you would admit.',
        favour: 'Six months later a message arrived on an account nobody should have known about. "Still holding," it said, with a moth. "Only a small favour..." You have started to understand how the people at that desk began.',
      },
    },
    seat: {
      title: 'The Seat',
      epigraph: 'You asked a good question in the open channel.',
      p: {
        contract: 'The contract was two pages long. The salary was real. They gave you a new device, and on the first of the month you were added to a rota. You were good at it. They had taught you well.',
        date: "The closure date on your row was changed to someone else's. You did not look up whose.",
        note: 'You are the one who wiped the home directory on the old workbench image. You checked for hidden files first. You found the note, and you kept it, and you do not know why.',
        nonote: 'Somebody wiped the home directory on your old workbench image. It went back into the pool.',
        coda: 'The standing came with the role: 940. Last night, in #lowlight, you mocked a new handle for fat-fingering a command. Everyone laughed. kelpie laughed hardest.',
        evening: 'It is a quiet evening. A new handle has asked something sharp in the open channel, about why a cached answer outlives its record. You open a conversation. You are not {handle} any more. You type the way you were taught: correct punctuation, no hurry.',
        line: '"Good evening. You asked a good question. Most people do not ask why."',
      },
    },
    ghost: {
      title: 'Ghost',
      epigraph: 'Standing is the only thing a handle owns.',
      p: {
        closed: 'You closed the account. You wiped what you could, and you were honest with yourself about how much that was. You took the bus somewhere you had never been, and for a while you checked every car.',
        date: 'Your closure date came and went. A report appeared with your contractor number on it, and it named no one, because no one had ever known your name. Anonymity turned out to be good for exactly one thing.',
        kept: 'You still have a sealed archive on a drive in a drawer.',
        nothing: 'You kept nothing, which felt like wisdom at the time.',
        coda: 'Your handle went dark at the top of its arc. For a few weeks people asked. Then ostrich_farm took you off the table to make room, and the birds were not upset.',
        note: 'NX-417 stayed filed. Somewhere, a new contractor is reading a note in a hidden file, written by somebody who went further than you did. You did not leave one. You think about that more than you expected.',
      },
    },
  },

  misc: {
    export_preview: 'SQLite database, session metadata export. Save it and open it with sqlite3.',
  },
};
