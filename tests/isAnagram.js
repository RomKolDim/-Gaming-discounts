function isAnagram(str1, str2)
{
  if(str1.includes(" ") || str2.includes(" "))
  {
    console.warn("Don't write with spaces!!! >:(");
    return false;
  }
  const normalize = (str) => str.toLowerCase().split('').sort().join('');
  return normalize(str1) === normalize(str2);
}
module.exports = isAnagram;