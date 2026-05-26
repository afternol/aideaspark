import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const data = JSON.parse(readFileSync(join(__dirname, 'g13_reports.json'), 'utf8'));

data.forEach((r, i) => {
  const report = r.report;
  const text = JSON.stringify(report);

  // HR Tech: check [8] source existence
  if (r.keyword === 'HR Tech') {
    const refs8 = (text.match(/\[8\]/g) || []).length;
    const src8 = report.sources.find(s => s.num === 8);
    console.log('=== HR Tech ===');
    console.log('  [8] references in text:', refs8);
    console.log('  Source 8 exists:', src8 ? src8.url : 'NOT FOUND - MISSING SOURCE');
    // Extract all [8] contexts
    const textStr = JSON.stringify(report, null, 2);
    const lines = textStr.split('\n');
    lines.forEach(line => {
      if (line.includes('[8]')) console.log('    Context:', line.trim());
    });
  }

  // 製造DX: DX銘柄 count mention
  if (r.keyword === '製造DX') {
    console.log('\n=== 製造DX ===');
    const matches30 = (text.match(/30社/g) || []).length;
    const matches49 = (text.match(/49社/g) || []).length;
    console.log('  "30社" mentions:', matches30);
    console.log('  "49社" mentions:', matches49);
  }

  // 会計経理DX: DX銘柄 count
  if (r.keyword === '会計・経理DX') {
    console.log('\n=== 会計・経理DX ===');
    const matches30 = (text.match(/30社/g) || []).length;
    const matches49 = (text.match(/49社/g) || []).length;
    console.log('  "30社" mentions:', matches30);
    console.log('  "49社" mentions:', matches49);
    const textStr = JSON.stringify(report, null, 2);
    const lines = textStr.split('\n');
    lines.forEach(line => {
      if (line.includes('49社') || line.includes('30社')) console.log('    Context:', line.trim());
    });
  }

  // カーボンテック: full reference check
  if (r.keyword === 'カーボンテック') {
    console.log('\n=== カーボンテック ===');
    const sourceNums = report.sources.map(s => s.num);
    const textRefs = [...new Set((text.match(/\[(\d+)\]/g) || []).map(m => parseInt(m.slice(1,-1))))].sort((a,b)=>a-b);
    console.log('  Source nums:', sourceNums.join(','));
    console.log('  Text refs:', textRefs.join(','));
    const missing = textRefs.filter(n => !sourceNums.includes(n));
    console.log('  MISSING in sources:', missing.join(',') || 'none');
    const unused = sourceNums.filter(n => !textRefs.includes(n));
    console.log('  UNUSED sources:', unused.join(',') || 'none');
  }

  // エネルギーテック: CAGR check for IoT market
  if (r.keyword === 'IoT') {
    console.log('\n=== IoT: 5G CAGR check ===');
    const textStr = JSON.stringify(report, null, 2);
    const lines = textStr.split('\n');
    lines.forEach(line => {
      if (line.includes('CAGR') && line.includes('69')) console.log('    Context:', line.trim());
    });
  }
});
