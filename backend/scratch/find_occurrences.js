const fs = require('fs');

const jsCode = fs.readFileSync('scratch/live_js.js', 'utf8');

// Find all occurrences of the base URL
let pos = jsCode.indexOf('https://smart-road.onrender.com');
while (pos !== -1) {
  console.log('Found occurrence at index:', pos);
  console.log('Snippet:');
  console.log(jsCode.substring(pos - 100, pos + 250));
  console.log('====================================');
  pos = jsCode.indexOf('https://smart-road.onrender.com', pos + 1);
}
