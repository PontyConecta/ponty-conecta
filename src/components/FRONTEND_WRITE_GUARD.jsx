# Frontend Write Guard — Guardrail Anti-Regressão

## Problema
O runtime das backend functions (Deno) **não tem acesso** ao filesystem do frontend.
Portanto o guardrail precisa rodar como **script Node local / CI**.

---

## Script: `scripts/frontend-write-guard.js`

```js
#!/usr/bin/env node

/**
 * Frontend Write Guard — Ponty
 * 
 * Escaneia arquivos frontend (.js/.jsx/.ts/.tsx) em busca de
 * chamadas diretas de escrita em base44.entities, que são PROIBIDAS.
 * 
 * Toda mutação deve passar por backend functions.
 * 
 * USO:
 *   node scripts/frontend-write-guard.js
 *   npm run guard:writes
 * 
 * EXIT CODES:
 *   0 = OK (nenhuma violação)
 *   1 = Violação encontrada
 */

const fs = require('fs');
const path = require('path');

// ─── Config ───

const SCAN_DIRS = ['pages', 'components', 'hooks', 'contexts', 'src/pages', 'src/components', 'src/hooks', 'src/contexts'];
const EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx'];
const IGNORE_DIRS = new Set(['node_modules', 'dist', 'build', '.next', '.vite', 'functions', 'entities']);

const FORBIDDEN_PATTERNS = [
  { regex: /base44\.entities\.\w+\.create\s*\(/g,      label: '.create()' },
  { regex: /base44\.entities\.\w+\.update\s*\(/g,      label: '.update()' },
  { regex: /base44\.entities\.\w+\.delete\s*\(/g,      label: '.delete()' },
  { regex: /base44\.entities\.\w+\.bulkCreate\s*\(/g,  label: '.bulkCreate()' },
  { regex: /base44\.asServiceRole\.entities/g,          label: '.asServiceRole.entities' },
];

// ─── Scanner ───

function getFiles(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (IGNORE_DIRS.has(entry.name)) continue;
      results.push(...getFiles(fullPath));
    } else if (entry.isFile() && EXTENSIONS.includes(path.extname(entry.name))) {
      results.push(fullPath);
    }
  }
  return results;
}

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const violations = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const pattern of FORBIDDEN_PATTERNS) {
      // Reset regex lastIndex
      const re = new RegExp(pattern.regex.source, 'g');
      if (re.test(line)) {
        violations.push({
          file: filePath,
          line: i + 1,
          pattern: pattern.label,
          content: line.trim().slice(0, 120),
        });
      }
    }
  }
  return violations;
}

// ─── Main ───

function main() {
  console.log('🔍 Frontend Write Guard — scanning for forbidden entity writes...\n');

  let allFiles = [];
  for (const dir of SCAN_DIRS) {
    allFiles.push(...getFiles(dir));
  }

  // Also scan Layout.js / Layout.tsx at root
  for (const layoutFile of ['Layout.js', 'Layout.jsx', 'Layout.ts', 'Layout.tsx']) {
    if (fs.existsSync(layoutFile)) {
      allFiles.push(layoutFile);
    }
  }

  const allViolations = [];
  for (const file of allFiles) {
    allViolations.push(...scanFile(file));
  }

  console.log(`   Scanned: ${allFiles.length} files`);
  console.log(`   Violations: ${allViolations.length}\n`);

  if (allViolations.length === 0) {
    console.log('✅ OK: No forbidden Base44 entity writes found in frontend.\n');
    process.exit(0);
  }

  console.log('❌ VIOLATIONS FOUND:\n');
  console.log('─'.repeat(80));

  for (const v of allViolations) {
    console.log(`  FILE:    ${v.file}`);
    console.log(`  LINE:    ${v.line}`);
    console.log(`  PATTERN: ${v.pattern}`);
    console.log(`  CODE:    ${v.content}`);
    console.log('─'.repeat(80));
  }

  console.log(`\n⛔ ${allViolations.length} violation(s) found. Fix before merging.\n`);
  console.log('RULE: All entity writes MUST go through backend functions.');
  console.log('REF:  components/BACKEND_API.md\n');
  process.exit(1);
}

main();
```

---

## Integração

### package.json
```json
{
  "scripts": {
    "guard:writes": "node scripts/frontend-write-guard.js"
  }
}
```

### CI (GitHub Actions exemplo)
```yaml
- name: Frontend Write Guard
  run: npm run guard:writes
```

### Pre-commit hook (opcional via husky)
```bash
npx husky add .husky/pre-commit "npm run guard:writes"
```

---

## Exemplos de Output

### ✅ Sem violações
```
🔍 Frontend Write Guard — scanning for forbidden entity writes...

   Scanned: 87 files
   Violations: 0

✅ OK: No forbidden Base44 entity writes found in frontend.
```

### ❌ Com violação
```
🔍 Frontend Write Guard — scanning for forbidden entity writes...

   Scanned: 87 files
   Violations: 2

❌ VIOLATIONS FOUND:

────────────────────────────────────────────────────────────────────────────────
  FILE:    pages/AdminDisputes.js
  LINE:    142
  PATTERN: .update()
  CODE:    await base44.entities.Dispute.update(dispute.id, { status: resolution_type });
────────────────────────────────────────────────────────────────────────────────
  FILE:    components/campaign/CampaignForm.jsx
  LINE:    58
  PATTERN: .create()
  CODE:    const campaign = await base44.entities.Campaign.create(sanitized);
────────────────────────────────────────────────────────────────────────────────

⛔ 2 violation(s) found. Fix before merging.

RULE: All entity writes MUST go through backend functions.
REF:  components/BACKEND_API.md
```

---

## Nota Importante

A plataforma Base44 **não suporta** arquivos em `scripts/` nem alterações no `package.json` diretamente pelo editor.
Este documento serve como **blueprint completo** para implementação no seu repositório local / CI.

Copie o script acima para `scripts/frontend-write-guard.js` no seu repo e adicione o npm script ao `package.json`.