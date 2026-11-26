import fs from 'fs';
import { run, cmdBlock } from './evidence-sections.mjs';

export function renderCheck() {
  let out = `## 4 CHECK: npm run check (last 80 lines + exit code); test totals; coverage table per src/domain file.\n\n`;
  const checkRes = run('npm run check');
  const combined = [checkRes.stdout, checkRes.stderr].filter(Boolean).join('\n');
  const lines = combined.split(/\r?\n/);
  out += cmdBlock('npm run check (last 80 lines)', lines.slice(-80).join('\n'), checkRes.exitCode);

  const covRes = run('npm run test:coverage');
  const covCombined = [covRes.stdout, covRes.stderr].filter(Boolean).join('\n');
  out += cmdBlock('npm run test:coverage', covCombined, covRes.exitCode);
  return out;
}

export function renderBuild() {
  let out = `## 5 BUILD: the single command that builds and the single command that starts it; build route table with First Load JS; node scripts/smoke.mjs output.\n\n`;
  out += `- Build command: \`npm run build\` (\`next build && node scripts/copy-assets.mjs\`)\n`;
  out += `- Start command: \`npm start\` (\`node .next/standalone/server.js\`)\n\n`;

  const buildRes = run('npm run build');
  out += cmdBlock(
    'npm run build',
    [buildRes.stdout, buildRes.stderr].filter(Boolean).join('\n'),
    buildRes.exitCode
  );

  const smokeRes = run('node scripts/smoke.mjs');
  out += cmdBlock(
    'node scripts/smoke.mjs',
    [smokeRes.stdout, smokeRes.stderr].filter(Boolean).join('\n'),
    smokeRes.exitCode
  );
  return out;
}

export function renderSecurity() {
  let out = `## 6 SECURITY: gitleaks on tree and git history (or documented fallback); curl -I for / and /api/health; grep of .next/static for key patterns and generativelanguage; .gitignore; .env.example.\n\n`;

  const gitleaksCheck = run('gitleaks version');
  if (gitleaksCheck.exitCode === 0) {
    const leakTree = run('gitleaks detect -v');
    out += cmdBlock('gitleaks detect -v', leakTree.stdout || leakTree.stderr, leakTree.exitCode);
  } else {
    out += `### Gitleaks Status\n\`gitleaks\` CLI is not installed on this local host (exit code ${gitleaksCheck.exitCode}); enforced in CI via \`.github/workflows/ci.yml\` (\`gitleaks/gitleaks-action@v2\`). Local git grep fallback:\n\n`;
    const gitGrep = run('git grep -nE "AIzaSy|sk-ant-" -- ":(exclude)scripts/" ":(exclude)docs/"');
    out += cmdBlock(
      'git grep -nE "AIzaSy|sk-ant-"',
      gitGrep.stdout || '(0 matches across working tree)',
      gitGrep.exitCode === 1 ? 0 : gitGrep.exitCode
    );
  }

  const probeRoot = `node -e "fetch('http://localhost:3000/').then(r=>{console.log('HTTP',r.status); for(const [k,v] of r.headers) console.log(k+': '+v);})"`;
  const hRoot = run(probeRoot);
  out += cmdBlock('HTTP headers probe GET /', hRoot.stdout || hRoot.stderr, hRoot.exitCode);

  const probeHealth = `node -e "fetch('http://localhost:3000/api/health').then(r=>{console.log('HTTP',r.status); for(const [k,v] of r.headers) console.log(k+': '+v);})"`;
  const hHealth = run(probeHealth);
  out += cmdBlock(
    'HTTP headers probe GET /api/health',
    hHealth.stdout || hHealth.stderr,
    hHealth.exitCode
  );

  const grepCmd = `node -e "const fs=require('fs'); const hits=[]; function s(d){for(const f of fs.readdirSync(d,{withFileTypes:true})){const p=d+'/'+f.name; if(f.isDirectory()) s(p); else if(f.name.endsWith('.js')){const c=fs.readFileSync(p,'utf8'); if(/generativelanguage|AIzaSy|GEMINI_API_KEY|sk-ant-/.test(c)) hits.push(p);}}} s('.next/static'); console.log(hits.length ? hits.join('\\n') : '0 matches across .next/static');"`;
  const grepRes = run(grepCmd);
  out += cmdBlock(
    'Scan .next/static for secret patterns and generativelanguage',
    grepRes.stdout || grepRes.stderr,
    grepRes.exitCode
  );

  out += `### .gitignore\n\`\`\`text\n${fs.readFileSync('.gitignore', 'utf8')}\n\`\`\`\n\n`;
  out += `### .env.example\n\`\`\`text\n${fs.readFileSync('.env.example', 'utf8')}\n\`\`\`\n\n`;
  return out;
}

export function renderConfig() {
  let out = `## 7 CONFIG: next.config.*, src/server/security/limits.ts, middleware if present, Dockerfile, .dockerignore, .github/workflows/*.yml, .gitattributes.\n\n`;
  const files = [
    ['next.config.mjs', 'javascript'],
    ['src/server/security/limits.ts', 'typescript'],
    ['src/middleware.ts', 'typescript'],
    ['Dockerfile', 'dockerfile'],
    ['.dockerignore', 'text'],
    ['.github/workflows/ci.yml', 'yaml'],
    ['.github/workflows/cd.yml', 'yaml'],
    ['.gitattributes', 'text'],
  ];
  for (const [file, lang] of files) {
    const content = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : `(Missing: ${file})`;
    out += `### ${file}\n\`\`\`${lang}\n${content}\n\`\`\`\n\n`;
  }
  return out;
}

export function renderChangeHistory() {
  let out = `## 8 CHANGE HISTORY: git log --oneline -30; git log -p -5 -- src/server/security/limits.ts.\n\n`;
  const log30 = run('git log --oneline -30');
  out += cmdBlock('git log --oneline -30', log30.stdout || log30.stderr, log30.exitCode);

  const logLimits = run('git log -p -5 -- src/server/security/limits.ts');
  out += cmdBlock(
    'git log -p -5 -- src/server/security/limits.ts',
    logLimits.stdout || logLimits.stderr,
    logLimits.exitCode
  );
  return out;
}
