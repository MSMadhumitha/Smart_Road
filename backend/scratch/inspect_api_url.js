const fs = require('fs');

const jsCode = fs.readFileSync('scratch/live_js.js', 'utf8');

// Find occurrences of API URL
const index = jsCode.indexOf('https://smart-road.onrender.com/api');
if (index !== -1) {
  console.log('Found API URL at index:', index);
  console.log('Snippet:');
  console.log(jsCode.substring(index - 150, index + 350));
} else {
  console.log('API URL not found in bundle');
}
