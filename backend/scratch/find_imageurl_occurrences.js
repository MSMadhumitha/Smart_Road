const fs = require('fs');

const jsCode = fs.readFileSync('scratch/live_js.js', 'utf8');

let pos = jsCode.indexOf('.imageUrl');
while (pos !== -1) {
  console.log('Found .imageUrl at index:', pos);
  console.log('Snippet:');
  console.log(jsCode.substring(pos - 150, pos + 250));
  console.log('====================================');
  pos = jsCode.indexOf('.imageUrl', pos + 1);
}
