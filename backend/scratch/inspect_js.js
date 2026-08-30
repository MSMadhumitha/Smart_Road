const https = require('https');
const fs = require('fs');

const url = 'https://smart-road-frontend-three.vercel.app/assets/index-D0q0XoJw.js';

https.get(url, (res) => {
  let jsCode = '';
  res.on('data', (chunk) => { jsCode += chunk; });
  res.on('end', () => {
    // Write code to a local temp file for inspection
    fs.writeFileSync('scratch/live_js.js', jsCode);
    console.log('Saved live JS file.');
    
    // Find segments containing imageUrl or backendBase
    const index = jsCode.indexOf('backendBase');
    if (index !== -1) {
      console.log('Found backendBase, snippet:');
      console.log(jsCode.substring(index - 100, index + 300));
    } else {
      console.log('backendBase not found in JS bundle!');
    }
  });
});
