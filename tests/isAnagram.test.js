const isAnagram = require('./isAnagram.js');

test('Silent vs Listen = true', () => 
{
  expect(isAnagram('Silent', 'Listen')).toBe(true);
});

test('Hello vs World = false', () => 
{
  expect(isAnagram('Hello', 'World')).toBe(false);
});

test('Silent  vs Listen  = false(because of spaces)', () => 
{
  expect(isAnagram('Silent ', 'Listen ')).toBe(false);
});