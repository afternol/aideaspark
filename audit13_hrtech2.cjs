const { readFileSync } = require('fs');
const { join } = require('path');

const data = JSON.parse(readFileSync(join(__dirname, 'g13_reports.json'), 'utf8'));

const hrtech = data.find(r => r.keyword === 'HR Tech');
if (hrtech) {
  const report = hrtech.report;
  const src8 = report.sources.find(s => s.num === 8);
  console.log('Source 8:', src8 ? JSON.stringify(src8, null, 2) : 'NOT FOUND');

  const textStr = JSON.stringify(report, null, 2);
  const lines = textStr.split('\n');
  console.log('\nAll lines containing [8]:');
  lines.forEach((line, idx) => {
    if (line.includes('[8]')) {
      console.log('Line ' + idx + ': ' + line.trim());
    }
  });

  console.log('\nAll sources:');
  report.sources.forEach(function(s) { console.log('  num ' + s.num + ': ' + s.url); });
} else {
  console.log('HR Tech record not found');
}
