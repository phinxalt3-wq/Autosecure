module.exports = (code) => {

 const decodedUrl = decodeURIComponent(code);

 return decodedText = decodedUrl.replace(/\\u[0-9A-Fa-f]{4}/g, match => String.fromCharCode(parseInt(match.substring(2), 16)));
}