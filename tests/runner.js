const fs = require('fs');
const vm = require('vm');

// Load scales.js into global context
const scalesPath = require('path').join(__dirname, '..', 'scales.js');
const scalesCode = fs.readFileSync(scalesPath, 'utf8');
vm.runInNewContext(scalesCode, global, { filename: 'scales.js' });

// Run all test files in this directory except this runner
const files = fs.readdirSync(__dirname).filter(f => f.endsWith('.js') && f !== 'runner.js');
for (const f of files) {
  console.log('\n--- Running', f, '---');
  require('./' + f);
}

console.log('\nAll tests executed.');
