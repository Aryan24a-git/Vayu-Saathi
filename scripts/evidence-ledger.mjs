import fs from 'fs';
import path from 'path';

const ledgerPath = path.resolve('scripts/evidence-ledger.json');
export const LEDGER_ROWS = JSON.parse(fs.readFileSync(ledgerPath, 'utf8'));
