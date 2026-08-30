const https = require('https');

https.get('https://smart-road-frontend-three.vercel.app/', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('Homepage HTML:');
    console.log(data);
  });
}).on('error', (err) => {
  console.error('Error fetching homepage:', err.message);
});
