const https = require('https');

// Step 1: Fetch the homepage to get the latest JS bundle filename
https.get('https://smart-road-frontend-three.vercel.app/', (res) => {
  let html = '';
  res.on('data', (chunk) => { html += chunk; });
  res.on('end', () => {
    const match = html.match(/src="(\/assets\/index-[^"]+\.js)"/);
    if (!match) {
      console.log('Could not find JS bundle in homepage HTML.');
      process.exit(1);
    }
    
    const jsPath = match[1];
    const jsUrl = `https://smart-road-frontend-three.vercel.app${jsPath}`;
    console.log(`Downloading live JS bundle: ${jsUrl}`);
    
    https.get(jsUrl, (jsRes) => {
      let jsCode = '';
      jsRes.on('data', (chunk) => { jsCode += chunk; });
      jsRes.on('end', () => {
        // Search for the new startsWith('data:') logic in the JS code
        const hasBase64Support = jsCode.includes('startsWith("data:")') || jsCode.includes('startsWith(\'data:\')') || jsCode.includes('.startsWith("data:")') || jsCode.includes('.startsWith("data")');
        console.log(`Does the live frontend support Base64 images? ${hasBase64Support ? 'YES' : 'NO'}`);
        process.exit(0);
      });
    });
  });
}).on('error', (err) => {
  console.error('Error:', err.message);
});
