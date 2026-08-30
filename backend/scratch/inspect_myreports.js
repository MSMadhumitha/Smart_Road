const fs = require('fs');

const jsCode = fs.readFileSync('scratch/live_js.js', 'utf8');

const index = 494609;
console.log(jsCode.substring(index - 50, index + 850));
