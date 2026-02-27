import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// ─── Frontend Write Guard ───
// Scans frontend source files for direct entity write calls.
// Run periodically or on-demand by admins to detect regressions.

const FN = 'frontendWriteGuard';

function err(msg, code, status = 400) {
  return Response.json({ error: msg, code }, { status });
}

// Patterns that indicate direct entity writes in frontend code
const FORBIDDEN_PATTERNS = [
  /base44\.entities\.\w+\.create\s*\(/g,
  /base44\.entities\.\w+\.update\s*\(/g,
  /base44\.entities\.\w+\.delete\s*\(/g,
  /base44\.entities\.\w+\.bulkCreate\s*\(/g,
];

const PATTERN_LABELS = [
  '.create()',
  '.update()',
  '.delete()',
  '.bulkCreate()',
];

// Directories to scan (frontend only)
const SCAN_DIRS = ['pages', 'components'];

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  try {
    // ── 1. AUTH (admin only) ──
    const user = await base44.auth.me();
    if (!user) return err('Unauthorized', 'UNAUTHORIZED', 401);
    if (user.role !== 'admin') return err('Forbidden: Admin access required', 'FORBIDDEN', 403);

    const violations = [];
    let filesScanned = 0;

    for (const dir of SCAN_DIRS) {
      try {
        for await (const entry of Deno.readDir(dir)) {
          if (!entry.isFile) {
            // Scan subdirectories (components can have subfolders)
            if (entry.isDirectory) {
              try {
                for await (const subEntry of Deno.readDir(`${dir}/${entry.name}`)) {
                  if (!subEntry.isFile) continue;
                  const filePath = `${dir}/${entry.name}/${subEntry.name}`;
                  const result = await scanFile(filePath);
                  filesScanned++;
                  if (result.length > 0) violations.push(...result);
                }
              } catch (_e) { /* skip unreadable subdirs */ }
            }
            continue;
          }

          const filePath = `${dir}/${entry.name}`;
          const result = await scanFile(filePath);
          filesScanned++;
          if (result.length > 0) violations.push(...result);
        }
      } catch (_e) {
        console.warn(`[${FN}] Could not read directory: ${dir}`);
      }
    }

    // Also scan Layout.js
    try {
      const result = await scanFile('Layout.js');
      filesScanned++;
      if (result.length > 0) violations.push(...result);
    } catch (_e) { /* no layout file */ }

    const passed = violations.length === 0;

    console.log(`[${FN}] Scanned ${filesScanned} files — ${violations.length} violation(s) found`);

    return Response.json({
      success: true,
      passed,
      files_scanned: filesScanned,
      violations_count: violations.length,
      violations: violations.slice(0, 50), // cap output
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error(`[${FN}] Error:`, error.message);
    return err(error.message, 'INTERNAL_ERROR', 500);
  }
});

async function scanFile(filePath) {
  const results = [];
  try {
    const content = await Deno.readTextFile(filePath);
    const lines = content.split('\n');

    for (let i = 0; i < FORBIDDEN_PATTERNS.length; i++) {
      const pattern = new RegExp(FORBIDDEN_PATTERNS[i].source, 'g');
      for (let lineNum = 0; lineNum < lines.length; lineNum++) {
        if (pattern.test(lines[lineNum])) {
          results.push({
            file: filePath,
            line: lineNum + 1,
            pattern: PATTERN_LABELS[i],
            content: lines[lineNum].trim().slice(0, 120),
          });
        }
      }
    }
  } catch (_e) {
    // File not readable — skip
  }
  return results;
}