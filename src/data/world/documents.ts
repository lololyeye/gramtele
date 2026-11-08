import { makeJpeg, makePdf } from '../../game/commands/magic';

/** World documents, referenced by several sites and mission folders. */

export const NEWSLETTER_2021 = makePdf(
  {
    Title: 'Nexus Labs Staff Bulletin, Q3 2021',
    Author: 'E. Maret',
    Creator: 'Scrivwell Writer 7.1',
    Producer: 'Scrivwell PDF Export',
    CreationDate: '2021:09:12 18:44:07+00:00',
    ModifyDate: '2021:09:12 18:51:30+00:00',
  },
  [
    'Nexus Labs Staff Bulletin, Q3 2021',
    'From the data desk: the new double-entry checks caught forty-one transcription errors this quarter.',
    'NX-305 enrolment is on schedule. Thanks to the S02 and S05 site monitors.',
    '',
    'Staff corner',
    'Elin Maret (Data Management) walked the whole Aldric ridge line over the summer holidays.',
    'She keeps a trail log on TrailTalk as quietfern, if you want the route and the blisters.',
    '',
    'Editor: E. Maret. Corrections to the data desk.',
  ],
);

export const RIDGE_PHOTO = makeJpeg({
  Make: 'Sorrel',
  CameraModelName: 'Sorrel P9',
  Artist: 'quietfern',
  CreateDate: '2026:04:12 07:31:44',
  GPSLatitude: '61.4821 N',
  GPSLongitude: '14.3307 E',
  Software: 'Sorrel Camera 12.2',
  ImageDescription: 'morning, end of the road',
});

export const ALDRIC_PHOTO = makeJpeg(
  {
    Make: 'Sorrel',
    CameraModelName: 'Sorrel P4',
    Artist: 'quietfern',
    CreateDate: '2021:08:07 12:02:19',
    Software: 'Sorrel Camera 9.0',
    ImageDescription: 'Aldric ridge, day 3',
  },
  3264,
  2448,
);

export const NX417_PRESS = makePdf(
  {
    Title: 'Calvexin phase III: positive topline',
    Author: 'Nexus Labs Communications',
    Creator: 'Scrivwell Writer 7.1',
    CreationDate: '2025:03:27 10:12:00+00:00',
    Company: 'Blackwell Diligence',
  },
  [
    'Nexus Labs announces positive topline results for Calvexin (NX-417).',
    'No treatment-related deaths were observed during the trial.',
    'The safety summary was submitted on 20 March 2025.',
    'Media contact: press@nexus-labs.test',
  ],
);

export const HALDEN_REPORT = makePdf(
  { Title: 'Halden Freight incident: attribution summary', Author: 'S. Reik', Creator: 'Scrivwell Writer 7.1', Company: 'Orion Security', CreationDate: '2024:11:13 21:40:00+00:00' },
  [
    'Orion Security attribution summary. Client: Halden Freight.',
    'The intrusion originated from a contractor workstation, profile gt-workbench, contractor ref c-0031.',
    'The contractor acted alone. Findings have been shared with the police.',
    'Confidence: high.',
  ],
);

export const BRASK_REPORT = makePdf(
  { Title: 'Brask Utilities incident: attribution summary', Author: 'S. Reik', Creator: 'Scrivwell Writer 7.1', Company: 'Orion Security', CreationDate: '2025:08:21 22:05:00+00:00' },
  [
    'Orion Security attribution summary. Client: Brask Utilities.',
    'The intrusion originated from a contractor workstation, profile gt-workbench, contractor ref c-0041.',
    'The contractor acted alone. Findings have been shared with the police.',
    'Confidence: high.',
  ],
);
