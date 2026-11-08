import { ui } from '../../i18n';
import type { Command } from '../terminal/types';
import { dbCommands } from './db';
import { forensicCommands } from './forensic';
import { fsCommands } from './fs';
import { gameCommands } from './game';
import { networkCommands } from './network';
import { systemCommands } from './system';
import { textCommands } from './text';

export const ALL_COMMANDS: Command[] = [...fsCommands, ...textCommands, ...systemCommands, ...forensicCommands, ...networkCommands, ...dbCommands, ...gameCommands];

export const HELP_GROUPS: [string, string[]][] = [
  [ui('help_files'), ['pwd', 'ls', 'cd', 'mkdir', 'rmdir', 'touch', 'cp', 'mv', 'rm', 'ln', 'find', 'file', 'stat', 'chmod', 'du']],
  [ui('help_text'), ['cat', 'less', 'head', 'tail', 'grep', 'wc', 'sort', 'uniq', 'cut', 'tr', 'sed', 'awk', 'tee', 'nl', 'diff', 'echo']],
  [ui('system'), ['whoami', 'id', 'uname', 'hostname', 'date', 'ps', 'top', 'env', 'printenv', 'export', 'unset', 'which', 'type', 'history', 'clear', 'man', 'help', 'sudo', 'sh', 'bash', 'exit']],
  [ui('help_osint'), ['curl', 'wget', 'whois', 'exiftool', 'pdftotext']],
  [ui('help_forensics'), ['sha256sum', 'base64', 'xxd', 'strings']],
  [ui('help_network'), ['ping', 'traceroute', 'ip', 'ss', 'dig', 'host', 'nmap']],
  [ui('help_databases'), ['sqlite3']],
  [ui('help_casework'), ['mission', 'submit', 'hint', 'evidence', 'dossier', 'note']],
];
