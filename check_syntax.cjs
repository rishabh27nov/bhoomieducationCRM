const fs = require('fs');
const path = require('path');
const cp = require('child_process');

let hasError = false;

function check(dir) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      check(fullPath);
    } else if (fullPath.endsWith('.js') || fullPath.endsWith('.jsx')) {
      try {
        cp.execSync('node --check "' + fullPath + '"');
      } catch (e) {
        console.error('Syntax error in ' + fullPath);
        console.error(e.stderr ? e.stderr.toString() : e.message);
        hasError = true;
      }
    }
  });
}

console.log('Checking API...');
check('api');
console.log('Checking SRC...');
check('src');

if (hasError) {
  console.log('Found syntax errors.');
  process.exit(1);
} else {
  console.log('No syntax errors found!');
}
