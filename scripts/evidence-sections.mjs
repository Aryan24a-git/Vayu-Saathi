import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

export function run(cmd) {
  try {
    const stdout = execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    return { stdout: stdout.trim(), stderr: '', exitCode: 0 };
  } catch (err) {
    return {
      stdout: (err.stdout || '').toString().trim(),
      stderr: (err.stderr || err.message || '').toString().trim(),
      exitCode: err.status ?? 1,
    };
  }
}

export function redact(str) {
  if (!str) return '';
  return str
    .replace(/AIza[0-9A-Za-z-_]{35}/g, '[REDACTED_GEMINI_KEY]')
    .replace(/sk-ant-[0-9A-Za-z-_]{20,}/g, '[REDACTED_ANTHROPIC_KEY]')
    .replace(/AIzaSy[A-Za-z0-9_-]{33}/g, '[REDACTED_GOOGLE_KEY]')
    .replace(/(GEMINI_API_KEY\s*=\s*)[^\r\n]+/g, '$1[REDACTED]')
    .replace(/(ANTHROPIC_API_KEY\s*=\s*)[^\r\n]+/g, '$1[REDACTED]');
}

export function truncateLines(str, max = 200) {
  if (!str) return '';
  const lines = str.split(/\r?\n/);
  if (lines.length <= max) return str;
  const keep = lines.slice(-max);
  return `[... Truncated first ${lines.length - max} lines ...]\n` + keep.join('\n');
}

export function cmdBlock(cmd, output, exitCode) {
  const safeOutput = truncateLines(redact(output));
  return `Command: \`${cmd}\`\n\`\`\`text\n${safeOutput}\n\`\`\`\n[Exit code: ${exitCode}]\n\n`;
}

export function buildTree(dir, maxDepth = 3, currentDepth = 0) {
  if (currentDepth > maxDepth) return '';
  const ignored = new Set(['node_modules', '.next', '.git']);
  let result = '';
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (ignored.has(entry.name)) continue;
      const indent = '  '.repeat(currentDepth);
      if (entry.isDirectory()) {
        result += `${indent}├── ${entry.name}/\n`;
        result += buildTree(path.join(dir, entry.name), maxDepth, currentDepth + 1);
      } else {
        result += `${indent}├── ${entry.name}\n`;
      }
    }
  } catch {}
  return result;
}

export function auditToTable(auditJsonStr) {
  try {
    const json = JSON.parse(auditJsonStr);
    const vulns = json.vulnerabilities || {};
    let table =
      '| Advisory ID | Severity | Package | Direct / Transitive | Fix Available | Fix Version |\n';
    table += '|---|---|---|---|---|---|\n';
    const keys = Object.keys(vulns);
    if (keys.length === 0) {
      table += '| 0 advisories | none | none | - | - | - |\n';
      return table;
    }
    for (const key of keys) {
      const v = vulns[key];
      const advIds = Array.isArray(v.via)
        ? v.via
            .map((item) =>
              typeof item === 'object' ? item.url?.split('/').pop() || item.title : item
            )
            .join(', ')
        : String(v.via || '-');
      const direct = v.isDirect ? 'Direct' : 'Transitive';
      const fix = v.fixAvailable
        ? typeof v.fixAvailable === 'object'
          ? v.fixAvailable.name
          : 'Yes'
        : 'No';
      const fixVer = typeof v.fixAvailable === 'object' ? v.fixAvailable.version : '-';
      table += `| ${advIds} | **${v.severity?.toUpperCase()}** | \`${v.name}\` | ${direct} | ${fix} | \`${fixVer}\` |\n`;
    }
    return table;
  } catch (err) {
    return `Error parsing audit JSON: ${err.message}\n`;
  }
}

export function renderMeta() {
  const head = run('git rev-parse HEAD');
  const status = run('git status --porcelain');
  const nodeV = run('node -v');
  const npmV = run('npm -v');
  const osInfo = `${os.type()} ${os.release()} (${os.platform()} ${os.arch()})`;

  let out = `## 0 META: date, git rev-parse HEAD, git status --porcelain, node -v, npm -v, OS.\n\n`;
  out += `- **Date**: ${new Date().toISOString()}\n`;
  out += `- **OS**: ${osInfo}\n\n`;
  out += cmdBlock('git rev-parse HEAD', head.stdout || head.stderr, head.exitCode);
  out += cmdBlock(
    'git status --porcelain',
    status.stdout || '(clean working tree)',
    status.exitCode
  );
  out += cmdBlock('node -v', nodeV.stdout, nodeV.exitCode);
  out += cmdBlock('npm -v', npmV.stdout, npmV.exitCode);
  return out;
}

export function renderTree() {
  let out = `## 1 TREE: tree to depth 3 excluding node_modules and .next; file lists of src/app/api, src/server/llm, src/server/security.\n\n`;
  out += `### Directory Tree (Depth 3, excluding node_modules and .next)\n\`\`\`text\n`;
  out += buildTree(process.cwd(), 3);
  out += `\`\`\`\n\n`;

  const listDir = (dir) => {
    try {
      return fs.readdirSync(dir, { recursive: true }).join('\n');
    } catch (e) {
      return `(Directory ${dir} not found: ${e.message})`;
    }
  };

  out += `### File list: src/app/api\n\`\`\`text\n${listDir('src/app/api')}\n\`\`\`\n\n`;
  out += `### File list: src/server/llm\n\`\`\`text\n${listDir('src/server/llm')}\n\`\`\`\n\n`;
  out += `### File list: src/server/security\n\`\`\`text\n${listDir('src/server/security')}\n\`\`\`\n\n`;
  return out;
}

export function renderDependencies() {
  let out = `## 2 DEPENDENCIES: package.json in full; npm ls --depth=0; npm ls next zod react.\n\n`;
  const pkgContent = fs.readFileSync('package.json', 'utf8');
  out += `### package.json (Full Content)\n\`\`\`json\n${pkgContent}\n\`\`\`\n\n`;

  const ls0 = run('npm ls --depth=0');
  out += cmdBlock('npm ls --depth=0', ls0.stdout || ls0.stderr, ls0.exitCode);

  const lsNZR = run('npm ls next zod react');
  out += cmdBlock('npm ls next zod react', lsNZR.stdout || lsNZR.stderr, lsNZR.exitCode);
  return out;
}

export function renderAudit() {
  let out = `## 3 AUDIT: npm audit --json reduced to a table (advisory id, severity, package, direct or transitive, fix available, fix version) once for all dependencies and once with --omit=dev.\n\n`;
  const allAudit = run('npm audit --json');
  out += `### All Dependencies Audit Table\n\n`;
  out += auditToTable(allAudit.stdout);
  out += `\n[Audit Command: \`npm audit --json\` | Exit code: ${allAudit.exitCode}]\n\n`;

  const prodAudit = run('npm audit --omit=dev --json');
  out += `### Production-Only Audit Table (--omit=dev)\n\n`;
  out += auditToTable(prodAudit.stdout);
  out += `\n[Audit Command: \`npm audit --omit=dev --json\` | Exit code: ${prodAudit.exitCode}]\n\n`;
  return out;
}
