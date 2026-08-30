const testStr1 = "data:image/jpeg;base64,/9j/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnK,data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAA,/uploads/report-123.jpg";
const testStr2 = "/uploads/report-1.jpg,/uploads/report-2.jpg";
const testStr3 = "data:image/jpeg;base64,/9j/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnK";

const splitImages = (urlStr) => {
  if (!urlStr) return [];
  return urlStr.split(/,(?=data:|https?:|\/uploads|uploads)/).map(url => url.trim()).filter(Boolean);
};

console.log('Test 1 split length:', splitImages(testStr1).length);
console.log('Test 1 split items:');
splitImages(testStr1).forEach((item, idx) => {
  console.log(` - Item ${idx + 1}: ${item.substring(0, 40)}...`);
});

console.log('\nTest 2 split items:');
splitImages(testStr2).forEach((item, idx) => {
  console.log(` - Item ${idx + 1}: ${item}`);
});

console.log('\nTest 3 split items:');
splitImages(testStr3).forEach((item, idx) => {
  console.log(` - Item ${idx + 1}: ${item.substring(0, 40)}...`);
});
