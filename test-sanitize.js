const input = '<script>alert("xss")</script>test';
const result = input.trim().replace(/<[^>]*>/g, '');
console.log('Input:', input);
console.log('Result:', result);
console.log('Expected: alert("xss")test');
