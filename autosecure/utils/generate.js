module.exports = (length = 8) => {
  let charset = "abcdefghijklmnopqrstuvwxyz0123456789",
    retVal = "";


  retVal += "abcdefghijklmnopqrstuvwxyz".charAt(Math.floor(Math.random() * 26));


  for (let i = 1, n = charset.length; i < length; ++i) {
    retVal += charset.charAt(Math.floor(Math.random() * n));
  }

  return retVal;
}