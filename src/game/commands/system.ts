import { tr, T } from '../../i18n';
import { ROOT } from '../filesystem/vfs';
import type { Command, FullScreen } from '../terminal/types';
import { isoTime, pad, padEnd, parseArgs } from './args';
import { pagerFor } from './text';
import { manual } from './manual';

const whoami: Command = {
  name: 'whoami',
  man: manual('whoami', ['whoami']),
  run(ctx) {
    ctx.line(ctx.sh.userName(ctx.id.uid));
    return 0;
  },
};

const id: Command = {
  name: 'id',
  man: manual('id', ['id']),
  run(ctx) {
    const u = ctx.id;
    const groups = u.groups.map((g) => `${g}(${ctx.sh.groupName(g)})`).join(',');
    ctx.line(`uid=${u.uid}(${ctx.sh.userName(u.uid)}) gid=${u.gid}(${ctx.sh.groupName(u.gid)}) groups=${groups}`);
    return 0;
  },
};

const uname: Command = {
  name: 'uname',
  man: manual('uname', ['uname [-a] [-s] [-n] [-r] [-m]']),
  run(ctx) {
    const a = parseArgs(ctx.argv.slice(1), { flags: 'asnrvmo' });
    const host = ctx.sh.frame.profile.hostname;
    if (a.flags.has('a')) {
      ctx.line(`Linux ${host} 6.8.0-47-generic #47-gt SMP PREEMPT_DYNAMIC Mon Sep 21 04:12:33 UTC 2026 x86_64 GNU/Linux`);
      return 0;
    }
    const parts: string[] = [];
    if (a.flags.has('s') || a.flags.size === 0) parts.push('Linux');
    if (a.flags.has('n')) parts.push(host);
    if (a.flags.has('r')) parts.push('6.8.0-47-generic');
    if (a.flags.has('m')) parts.push('x86_64');
    if (a.flags.has('o')) parts.push('GNU/Linux');
    ctx.line(parts.join(' '));
    return 0;
  },
};

const hostname: Command = {
  name: 'hostname',
  man: manual('hostname', ['hostname']),
  run(ctx) {
    ctx.line(ctx.sh.frame.profile.hostname);
    return 0;
  },
};

const date: Command = {
  name: 'date',
  man: manual('date', ['date', 'date -u']),
  run(ctx) {
    ctx.line(new Date(ctx.sh.host.now()).toUTCString().replace('GMT', 'UTC'));
    return 0;
  },
};

interface ProcRow {
  pid: number;
  user: string;
  cpu: number;
  mem: number;
  cmd: string;
  start: string;
}

function procTable(ctx: { sh: { frame: { profile: { hostname: string; user: string } }; services?: unknown; host: { services: Record<string, unknown> } } }): ProcRow[] {
  const table = ctx.sh.host.services.processes as ((host: string, user: string) => ProcRow[]) | undefined;
  return table ? table(ctx.sh.frame.profile.hostname, ctx.sh.frame.profile.user) : [];
}

const ps: Command = {
  name: 'ps',
  man: manual('ps', ['ps', 'ps aux', 'ps -ef']),
  run(ctx) {
    const all = ctx.argv.slice(1).some((a) => /aux|ax|-e/.test(a));
    const rows = procTable(ctx);
    const shown = all ? rows : rows.filter((r) => r.user === ctx.sh.userName(ctx.id.uid) && /bash|ps/.test(r.cmd));
    if (all) {
      ctx.line('USER         PID %CPU %MEM START   COMMAND');
      for (const r of shown) ctx.line(`${padEnd(r.user, 10)} ${pad(r.pid, 5)} ${pad(r.cpu.toFixed(1), 4)} ${pad(r.mem.toFixed(1), 4)} ${padEnd(r.start, 7)} ${r.cmd}`);
    } else {
      ctx.line('    PID TTY          TIME CMD');
      for (const r of shown) ctx.line(`${pad(r.pid, 7)} pts/0    00:00:00 ${r.cmd.split(' ')[0].split('/').pop()}`);
      ctx.line(`${pad(rows.length ? rows[rows.length - 1].pid + 7 : 4312, 7)} pts/0    00:00:00 ps`);
    }
    return 0;
  },
};

const top: Command = {
  name: 'top',
  man: manual('top', ['top']),
  run(ctx) {
    const rows = procTable(ctx);
    if (!ctx.isTty) {
      for (const r of rows) ctx.line(`${pad(r.pid, 6)} ${padEnd(r.user, 10)} ${pad(r.cpu.toFixed(1), 5)} ${pad(r.mem.toFixed(1), 5)} ${r.cmd}`);
      return 0;
    }
    let quit = false;
    let seed = 3;
    const scr: FullScreen = {
      title: 'top',
      render(n) {
        const jitter = rows.map((r) => {
          seed = (seed * 31 + 7) % 101;
          return { ...r, cpu: Math.max(0, r.cpu + (seed % 7) / 10 - 0.3) };
        });
        jitter.sort((x, y) => y.cpu - x.cpu);
        const now = new Date(ctx.sh.host.now()).toISOString().slice(11, 19);
        const head = [
          `top - ${now} up 12 days,  3:41,  1 user,  load average: 0.${10 + (seed % 40)}, 0.21, 0.18`,
          `Tasks: ${pad(rows.length, 3)} total,   1 running, ${rows.length - 1} sleeping,   0 stopped,   0 zombie`,
          `%Cpu(s): ${(2 + (seed % 30) / 10).toFixed(1)} us,  0.9 sy,  0.0 ni, 95.8 id,  0.1 wa`,
          `MiB Mem :   3936.0 total,   1812.4 free,    902.2 used,   1221.4 buff/cache`,
          '',
          '    PID USER        %CPU  %MEM COMMAND',
        ];
        const body = jitter.map((r) => `${pad(r.pid, 7)} ${padEnd(r.user, 10)} ${pad(r.cpu.toFixed(1), 5)} ${pad(r.mem.toFixed(1), 5)} ${r.cmd}`);
        return [...head, ...body].slice(0, n);
      },
      status: () => 'press q to quit',
      key(k) {
        if (k === 'q' || k === 'Escape') quit = true;
      },
      done: () => quit,
      tick() {
        seed = (seed + 11) % 101;
      },
    };
    ctx.sh.fullscreen = scr;
    return 0;
  },
};

const history: Command = {
  name: 'history',
  man: manual('history', ['history [N]', 'history -c']),
  run(ctx) {
    const a = ctx.argv[1];
    if (a === '-c') {
      ctx.sh.history.length = 0;
      return 0;
    }
    const h = ctx.sh.history;
    const start = a && /^\d+$/.test(a) ? Math.max(0, h.length - Number(a)) : 0;
    for (let i = start; i < h.length; i++) ctx.line(`${pad(i + 1, 5)}  ${h[i]}`);
    return 0;
  },
};

const clear: Command = {
  name: 'clear',
  man: manual('clear', ['clear']),
  run(ctx) {
    if (ctx.isTty) ctx.sh.clearRequested = true;
    return 0;
  },
};

const env: Command = {
  name: 'env',
  man: manual('env', ['env', 'printenv [NAME]']),
  run(ctx) {
    for (const k of Object.keys(ctx.sh.env).sort()) ctx.line(`${k}=${ctx.sh.env[k]}`);
    return 0;
  },
};

const printenv: Command = {
  name: 'printenv',
  man: env.man,
  run(ctx) {
    const n = ctx.argv[1];
    if (n) {
      if (ctx.sh.env[n] === undefined) return 1;
      ctx.line(ctx.sh.env[n]);
      return 0;
    }
    for (const k of Object.keys(ctx.sh.env).sort()) ctx.line(`${k}=${ctx.sh.env[k]}`);
    return 0;
  },
};

const exportCmd: Command = {
  name: 'export',
  man: manual('export', ['export NAME=VALUE', 'export']),
  run(ctx) {
    if (ctx.argv.length < 2) {
      for (const k of Object.keys(ctx.sh.env).sort()) ctx.line(`declare -x ${k}="${ctx.sh.env[k]}"`);
      return 0;
    }
    for (const a of ctx.argv.slice(1)) {
      const m = /^([A-Za-z_][A-Za-z0-9_]*)(?:=(.*))?$/s.exec(a);
      if (!m) {
        ctx.err(`bash: export: \`${a}': not a valid identifier\n`);
        return 1;
      }
      if (m[2] !== undefined) ctx.sh.env[m[1]] = m[2];
      else ctx.sh.env[m[1]] ??= '';
    }
    return 0;
  },
};

const unset: Command = {
  name: 'unset',
  man: manual('unset', ['unset NAME...']),
  run(ctx) {
    for (const a of ctx.argv.slice(1)) delete ctx.sh.env[a];
    return 0;
  },
};

const which: Command = {
  name: 'which',
  man: manual('which', ['which COMMAND...']),
  run(ctx) {
    let code = 0;
    for (const n of ctx.argv.slice(1)) {
      const c = ctx.sh.commands.get(n);
      if (!c || (c.tool && !ctx.sh.host.isToolUnlocked(c.tool)) || BUILTINS.has(n)) {
        code = 1;
        continue;
      }
      ctx.line(c.tool ? `/opt/toolkit/bin/${n}` : `/usr/bin/${n}`);
    }
    return code;
  },
};

const BUILTINS = new Set(['cd', 'export', 'unset', 'history', 'exit', 'help', 'type', 'alias']);

const type: Command = {
  name: 'type',
  man: manual('type', ['type NAME...']),
  run(ctx) {
    let code = 0;
    for (const n of ctx.argv.slice(1)) {
      const c = ctx.sh.commands.get(n);
      if (!c || (c.tool && !ctx.sh.host.isToolUnlocked(c.tool))) {
        ctx.err(`bash: type: ${n}: not found\n`);
        code = 1;
      } else if (BUILTINS.has(n)) ctx.line(`${n} is a shell builtin`);
      else ctx.line(`${n} is ${c.tool ? '/opt/toolkit/bin/' : '/usr/bin/'}${n}`);
    }
    return code;
  },
};

export function renderMan(cmd: Command): string {
  const m = cmd.man;
  const out: string[] = [];
  const name = cmd.name.toUpperCase();
  out.push(`${name}(1)${' '.repeat(26)}${T('workbench_manual')}${' '.repeat(26)}${name}(1)`, '');
  out.push(T('name'), `       ${cmd.name} - ${tr(m.name)}`, '');
  out.push(T('synopsis'));
  for (const s of m.synopsis) out.push(`       ${s}`);
  out.push('', T('description'));
  out.push(...wrap(tr(m.description), 70).map((l) => `       ${l}`));
  if (m.options?.length) {
    out.push('', T('options'));
    for (const [k, v] of m.options) {
      out.push(`       ${k}`);
      out.push(...wrap(tr(v), 62).map((l) => `              ${l}`));
    }
  }
  if (m.examples?.length) {
    out.push('', T('examples'));
    for (const [k, v] of m.examples) {
      out.push(`       $ ${k}`);
      out.push(...wrap(tr(v), 62).map((l) => `              ${l}`));
    }
  }
  if (m.why) {
    out.push('', T('why_it_matters'));
    out.push(...wrap(tr(m.why), 70).map((l) => `       ${l}`));
  }
  return out.join('\n') + '\n';
}

function wrap(s: string, w: number): string[] {
  const out: string[] = [];
  let cur = '';
  for (const word of s.split(/\s+/)) {
    if (cur.length + word.length + 1 > w && cur) {
      out.push(cur);
      cur = word;
    } else cur = cur ? `${cur} ${word}` : word;
  }
  if (cur) out.push(cur);
  return out;
}

const man: Command = {
  name: 'man',
  man: manual('man', ['man COMMAND']),
  run(ctx) {
    const n = ctx.argv[1];
    if (!n) {
      ctx.err('What manual page do you want?\nFor example, try \'man grep\'.\n');
      return 1;
    }
    const c = ctx.sh.commands.get(n);
    if (!c || (c.tool && !ctx.sh.host.isToolUnlocked(c.tool))) {
      ctx.err(`No manual entry for ${n}\n`);
      return 16;
    }
    const text = renderMan(c);
    if (ctx.isTty) ctx.sh.fullscreen = pagerFor(T('manual_page_name_1', { name: n }), text);
    else ctx.out(text);
    return 0;
  },
};

const help: Command = {
  name: 'help',
  man: manual('help', ['help', 'help COMMAND']),
  run(ctx) {
    const n = ctx.argv[1];
    if (n) {
      const c = ctx.sh.commands.get(n);
      if (!c || (c.tool && !ctx.sh.host.isToolUnlocked(c.tool))) return ctx.fail(`no help topics match '${n}'`);
      ctx.line(`${c.name}: ${tr(c.man.name)}`);
      for (const s of c.man.synopsis) ctx.line(`  ${s}`);
      ctx.line(T('see_man_name', { name: c.name }));
      return 0;
    }
    const groups = (ctx.sh.host.services.helpGroups as [string, string[]][] | undefined) ?? [];
    for (const [title, names] of groups) {
      const shown = names.filter((m) => {
        const c = ctx.sh.commands.get(m);
        return c && (!c.tool || ctx.sh.host.isToolUnlocked(c.tool));
      });
      if (!shown.length) continue;
      ctx.line(`${tr(title)}:`);
      ctx.line(`  ${shown.join('  ')}`);
    }
    ctx.line('');
    ctx.line(T('man_command_gives_the_full'));
    return 0;
  },
};

const exit: Command = {
  name: 'exit',
  man: manual('exit', ['exit [N]']),
  run(ctx) {
    if (ctx.sh.popSession()) {
      ctx.line(`logout\nConnection to remote host closed.`);
      return 0;
    }
    ctx.line('logout: this is your workbench session. Use the interface to leave.');
    return Number(ctx.argv[1] ?? 0);
  },
};

const logout: Command = { ...exit, name: 'logout' };

const sudo: Command = {
  name: 'sudo',
  man: manual('sudo', ['sudo COMMAND', 'sudo -l']),
  async run(ctx) {
    const policy = ctx.sh.frame.profile.sudoers ?? [];
    const user = ctx.sh.frame.profile.user;
    if (ctx.argv[1] === '-l') {
      if (!policy.length) {
        ctx.line(`Sorry, user ${user} may not run sudo on ${ctx.sh.frame.profile.hostname}.`);
        return 1;
      }
      ctx.line(`User ${user} may run the following commands on ${ctx.sh.frame.profile.hostname}:`);
      for (const p of policy) ctx.line(`    (root) NOPASSWD: ${p}`);
      return 0;
    }
    if (ctx.argv.length < 2) return ctx.fail('usage: sudo [-l] COMMAND');
    const cmdline = ctx.argv.slice(1);
    const fullName = cmdline[0].includes('/') ? cmdline[0] : `/usr/bin/${cmdline[0]}`;
    const joined = [fullName, ...cmdline.slice(1)].join(' ');
    const allowed = policy.some((p) => {
      const re = new RegExp('^' + p.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[^ ]*') + '$');
      return re.test(joined);
    });
    if (!allowed) {
      ctx.err(`[sudo] user ${user} is not allowed to execute '${joined}' as root on ${ctx.sh.frame.profile.hostname}.\nThis incident has been reported to the administrator.\n`);
      return 1;
    }
    const quoted = cmdline.map((s) => `'${s.replace(/'/g, `'\\''`)}'`).join(' ');
    const r = await ctx.sh.withIdentity(ROOT, () => ctx.sh.exec(quoted, false));
    ctx.out(r.output);
    return r.exit;
  },
};

const shCmd: Command = {
  name: 'sh',
  man: manual('sh', ['sh FILE', 'bash FILE', './FILE']),
  run(ctx) {
    const f = ctx.argv[1];
    if (!f) {
      ctx.line('This workbench does not nest interactive shells. Pass a script file.');
      return 0;
    }
    return ctx.sh.runScriptFile(f, ctx, false);
  },
};

const bash: Command = { ...shCmd, name: 'bash' };

const trueCmd: Command = { name: 'true', man: manual('true', ['true']), run: () => 0 };
const falseCmd: Command = { name: 'false', man: manual('false', ['false']), run: () => 1 };

const dateIso = isoTime;
void dateIso;

export const systemCommands: Command[] = [whoami, id, uname, hostname, date, ps, top, history, clear, env, printenv, exportCmd, unset, which, type, man, help, exit, logout, sudo, shCmd, bash, trueCmd, falseCmd];
