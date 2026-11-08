import type { DnsRecord, VHost, WhoisRecord } from '../../game/virtual-network/types';

/** Central registry of hosts. Only RFC 5737 and RFC 1918 addresses, only .test names. */

const WEB = { port: 80, proto: 'tcp' as const, name: 'http', version: 'nginx 1.24.0' };
const TLS = { port: 443, proto: 'tcp' as const, name: 'https', version: 'nginx 1.24.0' };
const SSH = { port: 22, proto: 'tcp' as const, name: 'ssh', version: 'OpenSSH 9.6p1' };

const EDGE = ['gw.lab.test', 'edge-1.transit.test'];
const VIA_ORION = ['gw.lab.test', 'edge-1.transit.test', 'gw.orion-security.test'];

export const HOSTS: VHost[] = [
  // lab VPN
  { name: 'gw.lab.test', ip: '10.40.0.1', services: [{ port: 53, proto: 'tcp', name: 'domain', version: 'Unbound 1.19' }], path: [], latency: 1, ptr: 'gw.lab.test' },
  { name: 'workbench.lab.test', ip: '10.40.0.47', services: [SSH], path: [], latency: 0.1, ptr: 'workbench.lab.test' },
  { name: 'ir-01.lab.test', ip: '10.40.0.12', services: [SSH], path: ['gw.lab.test'], latency: 2, ptr: 'ir-01.lab.test' },
  { name: 'vault-02.lab.test', ip: '10.40.0.31', services: [SSH, { port: 5432, proto: 'tcp', name: 'postgresql', filtered: true }], path: ['gw.lab.test'], latency: 3, ptr: 'vault-02.lab.test' },

  // transit
  { name: 'edge-1.transit.test', ip: '198.51.100.1', services: [], path: ['gw.lab.test'], latency: 7, ptr: 'edge-1.transit.test' },

  // gramtele
  { name: 'gramtele.test', ip: '198.51.100.10', services: [WEB, TLS, { port: 8448, proto: 'tcp', name: 'gt-relay', version: 'gt-relayd 3.4' }], path: EDGE, latency: 18, noPing: true, ptr: 'edge.gramtele.test' },

  // the holding and its fronts
  { name: 'blackwell.test', ip: '203.0.113.20', services: [WEB, TLS], path: VIA_ORION, latency: 24, ptr: 'www.blackwell.test' },
  { name: 'relay.blackwell.test', ip: '203.0.113.21', services: [SSH, TLS, { port: 8443, proto: 'tcp', name: 'https-alt', version: 'gt-relayd 3.4' }], path: VIA_ORION, latency: 25, ptr: 'relay.blackwell.test' },
  { name: 'lindgate.test', ip: '203.0.113.23', services: [WEB], path: VIA_ORION, latency: 26, ptr: 'host23.orion-security.test' },
  { name: 'orion-security.test', ip: '203.0.113.30', services: [WEB, TLS], path: VIA_ORION, latency: 23, ptr: 'www.orion-security.test' },
  { name: 'gw.orion-security.test', ip: '203.0.113.1', services: [], path: EDGE, latency: 21, ptr: 'gw.orion-security.test' },

  // nexus
  { name: 'nexus-labs.test', ip: '192.0.2.40', services: [WEB, TLS, { port: 25, proto: 'tcp', name: 'smtp', version: 'Postfix' }], path: VIA_ORION, latency: 31, ptr: 'www.nexus-labs.test' },
  { name: 'portal.nexus-labs.test', ip: '192.0.2.41', services: [SSH, WEB, { port: 8080, proto: 'tcp', name: 'http-proxy', version: 'Werkzeug 2.0.1 (debug)' }, { port: 3306, proto: 'tcp', name: 'mysql', filtered: true }], path: VIA_ORION, latency: 33, ptr: 'portal.nexus-labs.test' },

  // independent world
  { name: 'archive.test', ip: '198.51.100.60', services: [WEB, TLS], path: EDGE, latency: 41, ptr: 'archive.test' },
  { name: 'registry.test', ip: '198.51.100.61', services: [WEB], path: EDGE, latency: 38, ptr: 'registry.test' },
  { name: 'trailtalk.test', ip: '198.51.100.70', services: [WEB], path: EDGE, latency: 44, ptr: 'trailtalk.test' },
  { name: 'folio.test', ip: '198.51.100.71', services: [WEB], path: EDGE, latency: 29, ptr: 'folio.test' },
  { name: 'gamersden.test', ip: '198.51.100.72', services: [WEB], path: EDGE, latency: 52, ptr: 'gamersden.test' },
  { name: 'search.test', ip: '198.51.100.80', services: [WEB], path: EDGE, latency: 15, ptr: 'search.test' },
  { name: 'maps.test', ip: '198.51.100.81', services: [WEB], path: EDGE, latency: 17, ptr: 'maps.test' },
];

const a = (name: string, value: string): DnsRecord => ({ name, type: 'A', value });
const cname = (name: string, value: string): DnsRecord => ({ name, type: 'CNAME', value });
const mx = (name: string, value: string): DnsRecord => ({ name, type: 'MX', value });
const ns = (name: string, value: string): DnsRecord => ({ name, type: 'NS', value });
const txt = (name: string, value: string): DnsRecord => ({ name, type: 'TXT', value });

export const DNS: DnsRecord[] = [
  // lab
  a('gw.lab.test', '10.40.0.1'),
  a('workbench.lab.test', '10.40.0.47'),
  a('ir-01.lab.test', '10.40.0.12'),
  a('vault-02.lab.test', '10.40.0.31'),
  a('edge-1.transit.test', '198.51.100.1'),

  // gramtele
  a('gramtele.test', '198.51.100.10'),
  cname('www.gramtele.test', 'gramtele.test'),
  ns('gramtele.test', 'ns1.gramtele.test'),
  mx('gramtele.test', '10 mail.gramtele.test'),
  txt('gramtele.test', 'v=spf1 include:_spf.blackwell.test -all'),

  // blackwell
  a('blackwell.test', '203.0.113.20'),
  cname('www.blackwell.test', 'blackwell.test'),
  a('relay.blackwell.test', '203.0.113.21'),
  ns('blackwell.test', 'ns1.orion-security.test'),
  ns('blackwell.test', 'ns2.orion-security.test'),
  mx('blackwell.test', '10 mail.blackwell.test'),
  txt('blackwell.test', 'v=spf1 ip4:203.0.113.20 -all'),
  txt('_spf.blackwell.test', 'v=spf1 ip4:203.0.113.20 ip4:203.0.113.21 -all'),

  // lindgate
  a('lindgate.test', '203.0.113.23'),
  cname('www.lindgate.test', 'lindgate.test'),
  ns('lindgate.test', 'ns1.orion-security.test'),
  mx('lindgate.test', '10 mail.blackwell.test'),
  txt('lindgate.test', 'v=spf1 include:_spf.blackwell.test -all'),

  // orion
  a('orion-security.test', '203.0.113.30'),
  cname('www.orion-security.test', 'orion-security.test'),
  a('gw.orion-security.test', '203.0.113.1'),
  a('ns1.orion-security.test', '203.0.113.30'),
  a('ns2.orion-security.test', '203.0.113.30'),
  ns('orion-security.test', 'ns1.orion-security.test'),
  ns('orion-security.test', 'ns2.orion-security.test'),
  mx('orion-security.test', '10 mail.orion-security.test'),
  txt('orion-security.test', 'v=spf1 include:_spf.blackwell.test -all'),

  // nexus
  a('nexus-labs.test', '192.0.2.40'),
  cname('www.nexus-labs.test', 'nexus-labs.test'),
  a('portal.nexus-labs.test', '192.0.2.41'),
  cname('archive-01.nexus-labs.test', 'relay.blackwell.test'),
  ns('nexus-labs.test', 'ns1.orion-security.test'),
  ns('nexus-labs.test', 'ns2.orion-security.test'),
  mx('nexus-labs.test', '10 mail.nexus-labs.test'),
  txt('nexus-labs.test', 'v=spf1 ip4:192.0.2.40 include:_spf.blackwell.test -all'),
  txt('nexus-labs.test', 'verification=orion-managed-dns-7c31'),

  // independents
  a('archive.test', '198.51.100.60'),
  mx('archive.test', '10 mail.archive.test'),
  txt('archive.test', 'v=spf1 ip4:198.51.100.60 -all'),
  ns('archive.test', 'ns.archive.test'),
  a('registry.test', '198.51.100.61'),
  a('trailtalk.test', '198.51.100.70'),
  a('folio.test', '198.51.100.71'),
  a('gamersden.test', '198.51.100.72'),
  a('search.test', '198.51.100.80'),
  a('maps.test', '198.51.100.81'),
];

export const WHOIS: WhoisRecord[] = [
  {
    domain: 'lindgate.test',
    fields: [
      ['Registrar', 'Quiet Registrar Ltd'],
      ['Creation Date', '2026-05-19T10:44:02Z'],
      ['Updated Date', '2026-05-19T10:44:02Z'],
      ['Registrant Organization', 'Hollin Trust'],
      ['Registrant Country', 'REDACTED FOR PRIVACY'],
      ['Name Server', 'NS1.ORION-SECURITY.TEST'],
    ],
  },
  {
    domain: 'blackwell.test',
    fields: [
      ['Registrar', 'Quiet Registrar Ltd'],
      ['Creation Date', '2009-03-02T08:12:31Z'],
      ['Updated Date', '2024-04-11T14:09:55Z'],
      ['Registrant Organization', 'Blackwell Holdings'],
      ['Name Server', 'NS1.ORION-SECURITY.TEST'],
      ['Name Server', 'NS2.ORION-SECURITY.TEST'],
    ],
  },
  {
    domain: 'orion-security.test',
    fields: [
      ['Registrar', 'Quiet Registrar Ltd'],
      ['Creation Date', '2017-06-14T16:20:00Z'],
      ['Updated Date', '2024-04-11T14:07:12Z'],
      ['Registrant Organization', 'Hollin Trust'],
      ['Name Server', 'NS1.ORION-SECURITY.TEST'],
    ],
  },
  {
    domain: 'nexus-labs.test',
    fields: [
      ['Registrar', 'Northline Domains'],
      ['Creation Date', '2011-01-24T09:00:12Z'],
      ['Updated Date', '2025-03-19T17:31:40Z'],
      ['Registrant Organization', 'Nexus Labs'],
      ['Name Server', 'NS1.ORION-SECURITY.TEST'],
      ['Name Server', 'NS2.ORION-SECURITY.TEST'],
    ],
  },
  {
    domain: 'gramtele.test',
    fields: [
      ['Registrar', 'Quiet Registrar Ltd'],
      ['Creation Date', '2022-11-03T22:10:47Z'],
      ['Updated Date', '2023-07-02T09:14:18Z'],
      ['Registrant Organization', 'Gramtele Foundation'],
      ['Name Server', 'NS1.GRAMTELE.TEST'],
    ],
  },
  {
    domain: 'archive.test',
    fields: [
      ['Registrar', 'Northline Domains'],
      ['Creation Date', '2008-08-30T12:00:00Z'],
      ['Registrant Organization', 'The Open Archive (non-profit)'],
      ['Name Server', 'NS.ARCHIVE.TEST'],
    ],
  },
];
