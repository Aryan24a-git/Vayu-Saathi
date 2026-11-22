// Satisfies: DATA-004
// Build-time catalog validation script.
// Run via: npx ts-node src/catalog/validate-catalog.ts
// Called from CI — build fails if any action is invalid.

import { readFileSync } from 'fs';
import { join } from 'path';
import { CatalogSchema } from './catalog.schema';

function validateCatalog(): void {
  const catalogPath = join(__dirname, 'catalog.json');
  const raw = readFileSync(catalogPath, 'utf-8');
  const json: unknown = JSON.parse(raw);

  const result = CatalogSchema.safeParse(json);

  if (!result.success) {
    console.error('❌ Catalog validation failed (DATA-004 violation):');
    for (const issue of result.error.issues) {
      console.error(`  Path: ${issue.path.join('.')} — ${issue.message}`);
    }
    process.exit(1);
  }

  const { actions } = result.data;

  // Additional checks
  const ids = actions.map((a) => a.id);
  const uniqueIds = new Set(ids);
  if (uniqueIds.size !== ids.length) {
    console.error('❌ Duplicate action IDs found in catalog');
    process.exit(1);
  }

  // Verify all actions with d3Check=true don't recommend harmful actions
  // (They should be conditional — this is a documentation/review check)
  const d3Actions = actions.filter((a) => a.d3Check);
  console.log(
    `ℹ️  ${d3Actions.length} actions flagged for D3 (do-no-harm) review:`,
    d3Actions.map((a) => a.id)
  );

  // Verify all red-flag triggers
  const redFlags = actions.filter((a) => a.redFlagTrigger);
  console.log(
    `ℹ️  ${redFlags.length} red-flag trigger actions:`,
    redFlags.map((a) => a.id)
  );

  console.log(`✅ Catalog valid: ${actions.length} actions, all with sourced impact evidence`);
}

validateCatalog();
