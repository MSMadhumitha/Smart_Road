const https = require('https');
const fs = require('fs');

const url = 'https://smart-road-frontend-three.vercel.app/assets/index-CtWDvUBN.js';

https.get(url, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('Downloaded JS Bundle, size:', data.length);
    
    // Search for API URLs
    const matches = data.match(/https?:\/\/[^\s"'`]+/g);
    if (matches) {
      console.log('Found URLs in JS bundle:');
      const uniqueUrls = [...new Set(matches)];
      uniqueUrls.forEach(u => {
        if (u.includes('api') || u.includes('render') || u.includes('vercel') || u.includes('localhost')) {
          console.log(' -', u);
        }
      });
    } else {
      console.log('No URLs found');
    }
  });
}).on('error', (err) => {
  console.error('Error fetching JS bundle:', err.message);
});
