import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const data = JSON.parse(readFileSync(join(__dirname, 'g13_reports.json'), 'utf8'));
console.log('Total records:', data.length);
data.forEach((r, i) => {
  const report = r.report;
  const sourceNums = report.sources ? report.sources.map(s => s.num) : [];
  const text = JSON.stringify(report);
  const refs = [...new Set((text.match(/\[(\d+)\]/g) || []).map(m => parseInt(m.slice(1,-1))))].sort((a,b)=>a-b);
  const missingInSources = refs.filter(n => !sourceNums.includes(n));
  const unusedSources = sourceNums.filter(n => !refs.includes(n));
  console.log('\n--- Record', i+1, ':', r.keyword, '---');
  console.log('  totalScore:', r.totalScore, '| category:', r.category);
  console.log('  Sources:', sourceNums.join(','));
  console.log('  Refs in text:', refs.join(','));
  console.log('  Missing in sources (B7/B8):', missingInSources.join(',') || 'none');
  console.log('  Unused sources (B9):', unusedSources.join(',') || 'none');
  // Print marketSize for checking
  if (report.marketSize) {
    console.log('  marketSize excerpt:', report.marketSize.substring(0, 200));
  }
  // Print summary for fact checking
  if (report.summary) {
    console.log('  summary excerpt:', report.summary.substring(0, 200));
  }
});
