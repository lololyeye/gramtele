/**
 * The workbench manual, in English. Each page belongs to its command; flags and example commands are the keys,
 * and they are the same in every language. The usage line stays with the command.
 */
export interface ManText {
  name: string;
  description: string;
  options?: Record<string, string>;
  examples?: Record<string, string>;
  /** Why a professional cares. A page that has one also shows up as a field note. */
  why?: string;
}

export const EN_MAN: Record<string, ManText> = {
  pwd: {
    name: 'print working directory',
    description: 'Prints the absolute path of the directory you are in. Every relative path you type is resolved from here.',
    examples: {
      pwd: 'where am I?',
    },
    why: 'On an unfamiliar box, knowing exactly where you are prevents the expensive mistakes.',
  },
  ls: {
    name: 'list directory contents',
    description: 'Lists files in a directory. Names starting with a dot are hidden unless you pass -a. The long format shows permissions, owner, group, size and modification time.',
    options: {
      '-l': 'long format: mode, links, owner, group, size, time, name',
      '-a': 'include hidden entries, including . and ..',
      '-A': 'include hidden entries, without . and ..',
      '-h': 'human-readable sizes (with -l)',
      '-t': 'sort by modification time, newest first',
      '-S': 'sort by size, largest first',
      '-r': 'reverse the sort',
      '-R': 'recurse into subdirectories',
      '-d': 'list the directory itself, not its contents',
      '-1': 'one entry per line',
    },
    examples: {
      'ls -la ~': 'everything in your home, hidden files too',
      'ls -lt /var/log': 'most recently changed logs first',
    },
    why: 'Hidden dotfiles are where configuration, shell history and leftovers live. The first habit of any investigator is ls -la.',
  },
  cd: {
    name: 'change the working directory',
    description: 'Moves your shell to DIR. With no argument, goes to $HOME. "cd -" returns to the previous directory. ".." is the parent directory, "." the current one, and "~" your home. You need execute permission on a directory to enter it.',
    examples: {
      'cd /var/log': 'absolute path, starts at the root',
      'cd ../Downloads': 'relative path, starts here',
    },
    why: 'Absolute paths start with /. Relative paths start from where you are. Most newcomer confusion comes down to that distinction.',
  },
  mkdir: {
    name: 'make directories',
    description: 'Creates directories. Fails if the parent is missing or the directory exists, unless -p is given.',
    options: {
      '-p': 'create missing parents, no error if it already exists',
    },
    examples: {
      'mkdir -p ~/cases/m02/notes': 'a full tree in one go',
    },
  },
  rmdir: {
    name: 'remove empty directories',
    description: 'Removes a directory only if it is empty. The safe alternative to rm -r.',
  },
  touch: {
    name: 'create a file or update its timestamp',
    description: 'Creates an empty file if it does not exist; otherwise sets its modification time to now.',
    why: 'Timestamps are easy to change. Never treat an mtime as proof on its own.',
  },
  cp: {
    name: 'copy files and directories',
    description: 'Copies files. A directory needs -r. Copies keep the content byte for byte, so the hash of a copy matches the original.',
    options: {
      '-r': 'copy directories recursively',
    },
    examples: {
      'cp evidence.log ~/cases/': 'work on a copy, keep the original intact',
    },
    why: 'In forensics you never work on the original. You work on verified copies.',
  },
  mv: {
    name: 'move or rename files',
    description: 'Renames a file, or moves it to another directory. Both operations are the same thing: changing the entry that points to the data.',
    examples: {
      'mv draft.txt report.txt': 'rename',
      'mv report.txt ~/Documents/': 'move',
    },
  },
  rm: {
    name: 'remove files or directories',
    description: 'Deletes directory entries. There is no recycle bin. A directory needs -r. -f silences errors about missing files.',
    options: {
      '-r': 'remove directories and their contents',
      '-f': 'ignore missing files, never prompt',
    },
    why: 'Deleting a file removes the name, not necessarily the data on disk. That is why forensic recovery works, and why "rm" is not secure erasure.',
  },
  stat: {
    name: 'display file status',
    description: 'Shows the metadata the filesystem keeps about a file: type, size, permissions, owner and timestamps.',
    examples: {
      'stat notes.txt': 'when was this last changed, and by whom?',
    },
    why: 'File metadata anchors timelines, but it can be altered. Use it as one source among several.',
  },
  chmod: {
    name: 'change file permissions',
    description: 'Sets who may read (r=4), write (w=2) and execute (x=1) a file, for the owner, the group and everyone else. Modes are octal digits (640) or symbolic (u+x, go-w). Only the owner or root may change them.',
    options: {
      '-R': 'apply recursively',
    },
    examples: {
      'chmod +x run.sh': 'make a script executable',
      'chmod 600 key.pem': 'only the owner can read or write',
    },
    why: 'A world-readable key or a writable config is one of the most common real findings. 600 for secrets; 755 for programs.',
  },
  ln: {
    name: 'make links between files',
    description: 'Creates a symbolic link: a small file that points to another path. Only symbolic links are supported on this filesystem.',
    options: {
      '-s': 'make a symbolic link',
    },
  },
  find: {
    name: 'search for files in a directory tree',
    description: 'Walks a directory tree and prints every path matching all the tests you give. Unlike ls it looks at everything, hidden files included. Directories you cannot read produce "Permission denied" on stderr; discard those with 2>/dev/null.',
    options: {
      '-name GLOB': 'match the file name (quote the pattern so the shell does not expand it)',
      '-iname GLOB': 'same, ignoring case',
      '-type f|d|l': 'only files, directories or symlinks',
      '-maxdepth N': 'descend at most N levels',
      '-user NAME': 'owned by NAME',
      '-perm MODE': 'exact octal permission bits, e.g. 600',
      '-size +10k': 'larger than 10 KiB; -size -1M is smaller than 1 MiB',
    },
    examples: {
      'find /home -type f': 'every regular file under /home',
      'find / -name "*.conf" 2>/dev/null': 'config files, ignoring permission errors',
    },
    why: 'When you do not know where something is, find is how you stop guessing.',
  },
  file: {
    name: 'determine file type',
    description: 'Identifies a file by looking at its content, specifically its leading "magic bytes", not its name. An extension is only a label; the signature tells you what the file actually is.',
    examples: {
      'file invoice.pdf': 'is this really a PDF?',
    },
    why: 'Attackers and careless people both rename files. Never trust an extension.',
  },
  du: {
    name: 'estimate disk usage',
    description: 'Reports how much space a tree uses.',
    options: {
      '-s': 'summary only',
      '-h': 'human-readable',
    },
  },
  cat: {
    name: 'concatenate files and print them',
    description: 'Writes the content of each file to standard output. With no file, reads standard input. Its name comes from "concatenate", since it can join several files.',
    options: {
      '-n': 'number all lines',
    },
    examples: {
      'cat notes.txt': 'read a short file',
      'cat a.log b.log > all.log': 'join two logs into one',
    },
  },
  echo: {
    name: 'print text',
    description: 'Prints its arguments separated by spaces. The shell expands variables before echo ever sees them, so echo is a handy way to inspect what the shell is doing.',
    options: {
      '-n': 'no trailing newline',
      '-e': 'interpret \\n and \\t',
    },
    examples: {
      'echo $HOME': 'print a variable',
      'echo "first note" >> notes.txt': 'append to a file',
    },
  },
  less: {
    name: 'page through text',
    description: 'Shows a file one screen at a time without loading it all into your scrollback. Keys: j/k or arrows scroll, space pages down, b pages up, g and G go to top and bottom, /word searches, n repeats, q quits.',
    examples: {
      'less /var/log/auth.log': 'browse a long log',
      'grep ERROR app.log | less': 'page through results',
    },
    why: 'Real logs are thousands of lines long. cat is for short files; less is for everything else.',
  },
  head: {
    name: 'output the first part of files',
    description: 'Prints the first 10 lines, or the first N with -n.',
    options: {
      '-n N': 'number of lines',
      '-c N': 'number of bytes',
    },
    examples: {
      'head -n 5 access.log': 'see the format of a log before you parse it',
    },
    why: 'The first thing to do with an unfamiliar data file: look at the shape of it.',
  },
  tail: {
    name: 'output the last part of files',
    description: 'Prints the last 10 lines, or the last N with -n. "-n +N" starts printing at line N instead.',
    options: {
      '-n N': 'number of lines',
      '-n +N': 'start at line N',
      '-c N': 'number of bytes',
    },
    examples: {
      'tail -n 20 /var/log/auth.log': 'most recent events',
      'tail -n +2 data.csv': 'skip a header line',
    },
    why: 'Logs grow at the bottom. The newest events are at the end.',
  },
  grep: {
    name: 'print lines that match a pattern',
    description: 'Filters text line by line, keeping those matching a regular expression. It reads files or a pipe. Put patterns in quotes so the shell leaves them alone.',
    options: {
      '-i': 'ignore case',
      '-v': 'invert: keep lines that do NOT match',
      '-n': 'prefix each match with its line number',
      '-c': 'print only the count of matching lines',
      '-l': 'print only names of files with matches',
      '-r': 'search directories recursively',
      '-E': 'extended regex: + ? | ( ) work without backslashes',
      '-o': 'print only the matching part of the line',
      '-w': 'match whole words only',
      '-F': 'treat the pattern as a fixed string',
      '-A N / -B N': 'also show N lines after / before each match',
    },
    examples: {
      'grep "404" access.log': 'every line containing 404',
      'grep -rl "quietfern" /missions': 'which files mention this handle?',
      'cat auth.log | grep -v "Accepted" | grep -c "Failed"': 'pipelines narrow things down step by step',
    },
    why: 'Most investigation is filtering. grep turns a million-line log into the twelve lines that matter.',
  },
  wc: {
    name: 'count lines, words and bytes',
    description: 'Counts things. Without flags it prints lines, words and bytes. Most often used at the end of a pipeline to ask "how many?".',
    options: {
      '-l': 'lines',
      '-w': 'words',
      '-c': 'bytes',
    },
    examples: {
      'grep "Failed" auth.log | wc -l': 'how many failed logins?',
    },
  },
  sort: {
    name: 'sort lines of text',
    description: 'Sorts lines alphabetically by default. -n sorts numerically: without it, 100 sorts before 9.',
    options: {
      '-r': 'reverse',
      '-n': 'numeric',
      '-u': 'unique: drop duplicates',
      '-f': 'ignore case',
      '-t SEP': 'field separator',
      '-k N': 'sort by field N',
    },
    examples: {
      'sort users.txt': 'alphabetical',
      'cut -d" " -f1 access.log | sort | uniq -c | sort -rn | head': 'the classic: top talkers in a log',
    },
    why: 'sort | uniq -c | sort -rn is the frequency analysis every analyst types from muscle memory.',
  },
  uniq: {
    name: 'filter adjacent repeated lines',
    description: 'Collapses runs of identical adjacent lines. Because it only compares neighbours, you almost always sort first.',
    options: {
      '-c': 'prefix each line with its count',
      '-d': 'only show duplicated lines',
      '-u': 'only show lines that are not repeated',
      '-i': 'ignore case',
    },
    examples: {
      'sort users.txt | uniq': 'distinct users',
      'sort users.txt | uniq -d': 'who appears more than once?',
    },
  },
  cut: {
    name: 'select columns from each line',
    description: 'Extracts fields or characters from each line. The default delimiter is a tab, not a space, which trips up nearly everyone once.',
    options: {
      '-d C': 'field delimiter (one character)',
      '-f LIST': 'fields to keep: 1 or 1,3 or 2-4',
      '-c LIST': 'character positions to keep',
    },
    examples: {
      'cut -d: -f1 /etc/passwd': 'every account name',
      'cut -d" " -f1 access.log': 'first column of a space-separated log',
    },
  },
  tr: {
    name: 'translate or delete characters',
    description: 'Replaces characters from SET1 with those at the same position in SET2. Reads stdin only. Ranges like a-z work.',
    options: {
      '-d': 'delete characters in SET1',
      '-s': 'squeeze runs of repeated characters into one',
    },
    examples: {
      'echo uryyb | tr a-zA-Z n-za-mN-ZA-M': 'ROT13: a letter-shift "cipher" with no key',
      'cat f | tr -s " "': 'collapse runs of spaces',
    },
    why: 'ROT13 and friends are encodings, not encryption. If there is no key, there is no secrecy.',
  },
  sed: {
    name: 'stream editor (substitution subset)',
    description: 'Edits text as it streams past. This workbench supports the common forms: substitution, printing line ranges and deleting matching lines.',
    examples: {
      'sed \'s/ERROR/!!/g\' app.log': 'replace every occurrence',
      'sed -n \'10,20p\' access.log': 'just lines 10 to 20',
    },
  },
  awk: {
    name: 'pattern-directed field printing (subset)',
    description: 'Splits each line into fields ($1, $2..., $NF the last, $0 the whole line) and prints what you ask for. Unlike cut, the default separator is any run of whitespace. This workbench supports print with an optional /regex/ or $N comparison condition.',
    examples: {
      'awk \'{print $1}\' access.log': 'first column',
      'awk \'$9 == 404 {print $7}\' access.log': 'paths that returned 404',
    },
  },
  tee: {
    name: 'copy standard input to a file and to standard output',
    description: 'Lets you save the output of a pipeline and still see it. -a appends.',
    examples: {
      'grep Failed auth.log | tee failures.txt | wc -l': 'keep the evidence and the count',
    },
  },
  nl: {
    name: 'number lines',
    description: 'Prints lines with line numbers.',
  },
  whoami: {
    name: 'print the current user name',
    description: 'Prints the user name your shell runs as. Your access to every file depends on this.',
    why: 'Often the very first command on any system. Who you are decides what you can touch.',
  },
  id: {
    name: 'print user and group identity',
    description: 'Prints your numeric user id (uid), primary group (gid) and all groups. Uid 0 is root. Group membership often grants more access than the user itself.',
    why: 'Being in an unexpected group, like "adm" or "lab", is a common way people end up able to read more than they should.',
  },
  uname: {
    name: 'print system information',
    description: 'Prints the kernel name. -a prints everything, including hostname, kernel release and architecture.',
    options: {
      '-a': 'all information',
      '-n': 'network hostname',
      '-r': 'kernel release',
      '-m': 'machine hardware',
    },
  },
  hostname: {
    name: 'show the system host name',
    description: 'Prints the name of this machine. When you work across several hosts, check it before you run anything.',
  },
  date: {
    name: 'print the system date and time',
    description: 'Prints the current date and time. This workbench runs on UTC, like most servers.',
    why: 'Time zones are the classic trap in timeline work. Normalize everything to UTC.',
  },
  ps: {
    name: 'report running processes',
    description: 'Lists processes. Alone it only shows your own terminal. "ps aux" shows every process on the machine with its owner, resource usage and full command line.',
    options: {
      aux: 'all processes, BSD format',
      '-ef': 'all processes, full format',
    },
    examples: {
      'ps aux | grep relay': 'is that service running, and as whom?',
    },
    why: 'Command lines are revealing. A surprising process, or a surprising owner, is often the first sign something is wrong.',
  },
  top: {
    name: 'display processes live',
    description: 'Shows a continually updated view of processes and load. Press q to quit.',
    why: 'Useful to see what is consuming a machine right now, and what wakes up on a schedule.',
  },
  history: {
    name: 'show the command history',
    description: 'Lists commands you ran. "!!" reruns the last one, "!N" reruns number N. Up and down arrows walk through it.',
    options: {
      '-c': 'clear the session history',
    },
    why: 'Shell history is one of the first artifacts an investigator reads on a compromised box. It does not capture everything, and it can be cleared.',
  },
  clear: {
    name: 'clear the terminal screen',
    description: 'Clears the visible screen. Your history is untouched. Ctrl+L does the same.',
  },
  env: {
    name: 'print environment variables',
    description: 'Prints every environment variable for this shell. Programs inherit these, and they configure a lot of behaviour.',
    why: 'Secrets left in environment variables are a recurring finding. Anyone who can read a process environment can read them.',
  },
  export: {
    name: 'set an environment variable',
    description: 'Sets a variable for this shell and anything it starts. With no argument, lists exported variables.',
    examples: {
      'export CASE=m02': 'then: echo $CASE',
    },
  },
  unset: {
    name: 'remove an environment variable',
    description: 'Removes shell variables.',
  },
  which: {
    name: 'locate a command',
    description: 'Tells you where a command lives on the $PATH, and so which program actually runs when you type its name.',
    why: 'If a directory earlier on the PATH holds a fake "ls", that is what runs. Knowing the real path matters.',
  },
  type: {
    name: 'describe how a name would be interpreted',
    description: 'Says whether a name is a shell builtin or a program on disk.',
  },
  man: {
    name: 'read the manual for a command',
    description: 'Opens the manual page for a command. Scroll with arrows or space; q quits. When something does not work, read the man page before you do anything else.',
    examples: {
      'man grep': 'every option grep accepts here',
    },
    why: 'Professionals read man pages constantly. Nobody remembers every flag.',
  },
  help: {
    name: 'list available commands',
    description: 'Lists what is available on this workbench, grouped by purpose. "help COMMAND" gives a one-line summary.',
  },
  exit: {
    name: 'leave the current shell',
    description: 'Closes an ssh session and returns to the previous host. On the workbench itself there is nowhere to go back to.',
  },
  sudo: {
    name: 'run a command as another user',
    description: 'Runs one command as root, if the sudoers policy allows you. "sudo -l" lists what you are allowed to run. Every use is logged.',
    options: {
      '-l': 'list your permitted commands',
    },
    why: 'A broad sudo rule is a privilege escalation waiting to happen. "sudo -l" is one of the first checks in any audit.',
  },
  sh: {
    name: 'run a shell script',
    description: 'Runs the commands in a text file, one line at a time. "./file" needs execute permission (chmod +x); "sh file" only needs read permission. Read a script before you run it.',
    why: 'Never run a script you have not read. This is the single most useful rule in this manual.',
  },
  true: {
    name: 'do nothing, successfully',
    description: 'Exits with status 0.',
  },
  false: {
    name: 'do nothing, unsuccessfully',
    description: 'Exits with status 1.',
  },
  sha256sum: {
    name: 'compute or check SHA-256 hashes',
    description: 'Computes a 256-bit fingerprint of a file. Change a single byte and the hash changes completely. With -c, reads "HASH  FILE" lines and verifies each one. Your copy, or evidence you were handed, either matches the record or it does not.',
    options: {
      '-c FILE': 'check hashes listed in FILE',
    },
    examples: {
      'sha256sum auth.log': 'fingerprint a file',
      'sha256sum -c MANIFEST.sha256': 'verify a whole evidence bundle',
    },
    why: 'Hashes are how forensic evidence stays defensible. You record the hash at collection, and anyone can later verify nothing changed. MD5 and SHA-1 have known collisions; use SHA-256.',
  },
  base64: {
    name: 'encode or decode base64',
    description: 'Base64 represents arbitrary bytes using only 64 printable characters, so binary data can travel through text channels. Output often ends with = padding. It is an encoding: anyone can reverse it. No key, no secrecy.',
    options: {
      '-d': 'decode',
    },
    examples: {
      'echo -n admin | base64': 'gives YWRtaW4=',
      'echo YWRtaW4= | base64 -d': 'gives admin',
    },
    why: 'Base64 is everywhere: HTTP basic auth, session tokens, email attachments. Mistaking it for encryption is a classic, very real security bug.',
  },
  xxd: {
    name: 'make a hexdump, or reverse one',
    description: 'Shows the raw bytes of a file in hexadecimal, with printable characters on the right. -r -p turns plain hex back into bytes, useful when someone hands you a hex string.',
    options: {
      '-l N': 'stop after N bytes',
      '-p': 'plain hex with no addresses',
      '-r': 'reverse: hex to bytes',
    },
    examples: {
      'xxd -l 16 photo.jpg': 'the first bytes reveal the true file type: ff d8 ff is JPEG',
      'echo 68656c6c6f | xxd -r -p': 'decodes to "hello"',
    },
    why: 'File signatures, hidden data, malformed headers: when tools disagree, the bytes settle it.',
  },
  strings: {
    name: 'print printable character sequences in a file',
    description: 'Scans any file, binary included, for runs of printable characters of at least 4 characters. A blunt but astonishingly effective first look at an unknown file.',
    options: {
      '-n N': 'minimum run length',
    },
    examples: {
      'strings photo.jpg | head': 'what readable text is embedded in here?',
    },
    why: 'Paths, URLs, author names and leftover comments survive inside binaries more often than their authors expect.',
  },
  exiftool: {
    name: 'read file metadata',
    description: 'Reads metadata embedded in documents and images: author, software, creation dates, camera model, GPS coordinates. Many people have no idea this data travels with their files.',
    examples: {
      'exiftool ridge_0412.jpg': 'where and when was this photo taken?',
      'exiftool newsletter.pdf': 'who wrote this document, on what software?',
    },
    why: 'Metadata has ended careers and located fugitives. The defensive lesson: strip it before you publish anything. It can also be forged, so corroborate.',
  },
  pdftotext: {
    name: 'extract text from a PDF',
    description: 'Prints the text content of a PDF to standard output, so that it can be piped into grep and friends.',
    examples: {
      'pdftotext newsletter.pdf | grep -i maret': 'find a name in a document',
    },
  },
  ping: {
    name: 'test reachability with ICMP echo',
    description: 'Sends ICMP echo requests and reports replies and round-trip time. A reply means the host is up and ICMP is allowed. No reply does not mean it is down: many hosts silently drop ICMP. Output also shows the resolved IP and TTL.',
    options: {
      '-c N': 'number of packets (default here 4)',
    },
    examples: {
      'ping -c 2 nexus-labs.test': 'is it reachable? how far?',
    },
    why: 'First troubleshooting step, and a lesson in the limits of evidence: silence proves nothing.',
  },
  traceroute: {
    name: 'show the route packets take to a host',
    description: 'Sends packets with increasing TTL. Each router along the path that drops one reports back, revealing the path hop by hop. "* * *" means a router did not answer, not that the path is broken.',
    examples: {
      'traceroute nexus-labs.test': 'who carries this traffic?',
    },
    why: 'Router names leak who operates a network. If two "unrelated" companies share a gateway, that is interesting.',
  },
  ip: {
    name: 'show network interfaces and routes',
    description: '"ip addr" lists interfaces and their addresses. "ip route" shows the routing table: where packets go. The "default" route is the gateway used for anything not otherwise known. The CIDR suffix /24 means the first 24 bits identify the network, so 10.40.0.0/24 spans 10.40.0.0 to 10.40.0.255.',
    examples: {
      'ip a': 'what is my address?',
      'ip r': 'what is my gateway?',
    },
    why: 'Before you investigate a network, know where you stand in it.',
  },
  ss: {
    name: 'show sockets',
    description: 'Lists network sockets on this machine. TCP is connection-oriented and reliable; UDP is fire-and-forget. A port in LISTEN state is a service waiting for connections; ESTAB is a live connection.',
    options: {
      '-t': 'TCP',
      '-u': 'UDP',
      '-l': 'listening only',
      '-n': 'numeric, do not resolve names',
      '-a': 'all states',
      '-p': 'show the owning process',
    },
    examples: {
      'ss -tuln': 'what is this machine offering to the network?',
    },
    why: 'Every listening port is attack surface. Know what is open and why.',
  },
  dig: {
    name: 'query DNS',
    description: 'Asks DNS for records about a name. A: IPv4 address. CNAME: an alias for another name. MX: mail servers. NS: authoritative name servers. TXT: free text, used for SPF, verification tokens and much else. The answer section is what matters; +short prints only that.',
    options: {
      TYPE: 'A (default), MX, NS, TXT, CNAME, SOA',
      '+short': 'just the answers',
      '-x IP': 'reverse lookup (PTR)',
    },
    examples: {
      'dig nexus-labs.test': 'the full exchange',
      'dig nexus-labs.test TXT +short': 'who may send mail for this domain?',
      'dig -x 203.0.113.21': 'what name does this address claim?',
    },
    why: 'DNS is public by design. A company can hide many things, but its DNS records tell you who its vendors, mail hosts and infrastructure really are.',
  },
  host: {
    name: 'simple DNS lookup',
    description: 'A terse alternative to dig: prints addresses and mail servers for a name.',
  },
  whois: {
    name: 'look up domain registration',
    description: 'Queries the registration record for a domain: registrar, dates, and sometimes the registrant. Privacy services often hide the owner, but creation dates alone are telling. A "ten year old firm" with a five-month-old domain is a red flag.',
    examples: {
      'whois lindgate.test': 'how old is this company, really?',
    },
    why: 'Registration data is one of the cheapest ways to test a claim about an organization.',
  },
  nmap: {
    name: 'network mapper (simulated, lab only)',
    description: 'Discovers hosts and open ports. TCP scans show whether a port is open (a service answered), closed (host answered, nothing listening) or filtered (a firewall swallowed the probe). In this simulation nmap only reaches hosts defined inside the laboratory. On a real network, scan only what you have written permission to scan.',
    options: {
      '-sn': 'host discovery only, no port scan',
      '-sV': 'probe open ports for service and version',
      '-p LIST': 'specific ports: -p 22,80,443 or -p 1-1024',
    },
    examples: {
      'nmap -sn 10.40.0.0/24': 'who is alive on this subnet?',
      'nmap -sV vault-02.lab.test': 'what does this host expose?',
    },
    why: 'Defenders run this against their own networks to see what attackers would see. Unauthorized scanning can be illegal, which is why permission comes first.',
  },
  curl: {
    name: 'transfer data with URLs (simulated network)',
    description: 'Speaks HTTP from the command line and shows you what a browser hides. A request has a method, a path, headers and maybe a body; a response has a status code, headers and a body. Codes: 2xx success, 3xx redirect, 4xx you did something wrong, 5xx the server did. All traffic stays inside the simulated network.',
    options: {
      '-i': 'include response headers',
      '-I': 'HEAD request: headers only',
      '-v': 'verbose: show the whole exchange, including TLS certificate',
      '-L': 'follow redirects',
      '-s': 'silent',
      '-o FILE': 'save the body to FILE',
      '-O': 'save under the name from the URL',
      '-X METHOD': 'set the method, e.g. POST',
      '-d DATA': 'send a form body (implies POST)',
      '-H "K: V"': 'add a request header',
      '-b "k=v"': 'send cookies, or read them from a file',
      '-c FILE': 'save received cookies to FILE',
      '-A AGENT': 'set the User-Agent',
      '-F field=@file': 'upload a file as multipart form',
    },
    examples: {
      'curl -I http://nexus-labs.test/': 'what server is this? what headers does it set?',
      'curl -d "user=x&pass=y" -i http://portal.nexus-labs.test/login': 'submit a login form by hand',
      'curl -b "session=abc" http://portal.nexus-labs.test/account': 'send a cookie',
    },
    why: 'A browser is a polite interface over this. Seeing raw HTTP is how you understand what actually protects a web application, and what merely looks like it does.',
  },
  wget: {
    name: 'download files (simulated network)',
    description: 'Downloads a URL to a file, by default named after the last part of the URL. curl prints by default, wget saves by default.',
    options: {
      '-O FILE': 'output file',
      '-q': 'quiet',
    },
    examples: {
      'wget http://trailtalk.test/uploads/ridge_0412.jpg': 'grab a document for offline analysis',
    },
  },
  sqlite3: {
    name: 'query an SQLite database',
    description: 'A real SQLite engine. With a file alone it opens an interactive prompt. Commands starting with a dot (.tables, .schema, .headers on, .mode column) talk to the tool; everything else is SQL and ends with a semicolon. Evidence images are mounted read-only: a write attempt is refused, as it should be when you are preserving evidence.',
    options: {
      '-header': 'show column names',
      '-column': 'aligned columns',
      '-csv': 'CSV output',
      '-readonly': 'open read-only',
    },
    examples: {
      'sqlite3 archive.db ".tables"': 'what is in here?',
      'sqlite3 archive.db ".schema staff"': 'what columns does this table have?',
      'sqlite3 -header -column archive.db "SELECT * FROM staff LIMIT 5"': 'look before you reason',
    },
    why: 'Most of the world\'s facts live in tables. Reading a schema tells you what an organization thought was worth recording, and audit tables tell you what it did about it.',
  },
  mission: {
    name: 'show the active assignment',
    description: 'Prints the active mission and the state of its objectives. The same information as the Missions panel, without leaving the keyboard.',
  },
  submit: {
    name: 'file a finding against the active assignment',
    description: 'With no arguments, lists what the assignment still needs answered. With a key and a value, files a finding. Wrong answers cost nothing but are recorded in your post-mission review. Reason first, then file.',
    examples: {
      submit: 'what is outstanding?',
      'submit uid 1000': 'file a finding',
    },
  },
  hint: {
    name: 'ask for the next hint on an objective',
    description: 'Reveals the next level of hint for the first open objective, or for objective N. Hints start vague and get specific. Using them reduces the bonus for that objective a little, and nothing else. Being stuck is normal.',
  },
  evidence: {
    name: 'manage your evidence locker',
    description: 'Registers a file in your locker with a SHA-256 hash taken at the moment of collection, the way chain of custody works. "verify" recomputes a file\'s hash against the locker. Editing a file breaks its link to the original: collect first, annotate copies.',
    examples: {
      'evidence add ~/Downloads/ridge_0412.jpg': 'collect and hash a file',
      'evidence list': 'what do I have?',
    },
    why: 'Evidence nobody can verify is only a story. Hash at collection, record the source, work on copies.',
  },
  dossier: {
    name: 'assemble a verifiable dossier',
    description: 'Works on the directory ~/dossier. "status" checks each required exhibit by content tag, so renaming a file is fine but editing it is not. "seal" writes ~/dossier.tar with a hash manifest. An archive will not read anything it cannot verify.',
    examples: {
      'mkdir ~/dossier && cp evidence.db ~/dossier/': 'build it with ordinary file commands',
      'dossier status': 'what is still missing?',
    },
  },
  note: {
    name: 'add a line to your journal',
    description: 'Appends a timestamped line to your investigation journal. A finding you cannot reproduce from your own notes is a rumour.',
  },
  diff: {
    name: 'compare two files line by line',
    description: 'Shows the lines that differ. "<" lines exist only in the first file, ">" lines only in the second. No output and exit status 0 means the files are identical.',
    examples: {
      'diff auth.log rotated/auth.log.1': 'what changed between these two copies?',
    },
    why: 'A hash tells you that something changed. diff tells you what.',
  },
};
