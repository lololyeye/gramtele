import { makeJpeg, makePdf } from '../../game/commands/magic';
import { lineKey } from '../../i18n';
import './en';

/** World documents: metadata and layout. The words are in en.ts and fr.ts. Metadata stays as the file's author left it. */

const d = (key: string) => lineKey(`docs.${key}`);

export const NEWSLETTER_2021 = makePdf(
  {
    Title: d('bulletin.title'),
    Author: 'E. Maret',
    Creator: 'Scrivwell Writer 7.1',
    Producer: 'Scrivwell PDF Export',
    CreationDate: '2021:09:12 18:44:07+00:00',
    ModifyDate: '2021:09:12 18:51:30+00:00',
  },
  [d('bulletin.title'), d('bulletin.data_desk'), d('bulletin.enrolment'), '', d('bulletin.corner'), d('bulletin.walk'), d('bulletin.trail'), '', d('bulletin.editor')],
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
    Title: d('press.title'),
    Author: 'Nexus Labs Communications',
    Creator: 'Scrivwell Writer 7.1',
    CreationDate: '2025:03:27 10:12:00+00:00',
    Company: 'Blackwell Diligence',
  },
  [d('press.topline'), d('press.deaths'), d('press.submitted'), d('press.contact')],
);

export const HALDEN_REPORT = makePdf(
  { Title: d('halden.title'), Author: 'S. Reik', Creator: 'Scrivwell Writer 7.1', Company: 'Orion Security', CreationDate: '2024:11:13 21:40:00+00:00' },
  [d('halden.client'), d('halden.origin'), d('halden.alone'), d('halden.confidence')],
);

export const BRASK_REPORT = makePdf(
  { Title: d('brask.title'), Author: 'S. Reik', Creator: 'Scrivwell Writer 7.1', Company: 'Orion Security', CreationDate: '2025:08:21 22:05:00+00:00' },
  [d('brask.client'), d('brask.origin'), d('brask.alone'), d('brask.confidence')],
);
