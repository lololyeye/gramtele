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
  ['Navigate and manage files', ['pwd', 'ls', 'cd', 'mkdir', 'rmdir', 'touch', 'cp', 'mv', 'rm', 'ln', 'find', 'file', 'stat', 'chmod', 'du']],
  ['Read and filter text', ['cat', 'less', 'head', 'tail', 'grep', 'wc', 'sort', 'uniq', 'cut', 'tr', 'sed', 'awk', 'tee', 'nl', 'diff', 'echo']],
  ['System', ['whoami', 'id', 'uname', 'hostname', 'date', 'ps', 'top', 'env', 'printenv', 'export', 'unset', 'which', 'type', 'history', 'clear', 'man', 'help', 'sudo', 'sh', 'bash', 'exit']],
  ['Open source investigation', ['curl', 'wget', 'whois', 'exiftool', 'pdftotext']],
  ['Forensics', ['sha256sum', 'base64', 'xxd', 'strings']],
  ['Networking', ['ping', 'traceroute', 'ip', 'ss', 'dig', 'host', 'nmap']],
  ['Databases', ['sqlite3']],
  ['Casework', ['mission', 'submit', 'hint', 'evidence', 'dossier', 'note']],
];
