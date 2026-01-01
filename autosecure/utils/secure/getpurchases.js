
async function getpurchases(axios, msatoken) {
  try {
    const response = await axios.get('https://paymentinstruments.mp.microsoft.com/v6.0/users/me/paymentTransactions', {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:138.0) Gecko/20100101 Firefox/138.0',
    'Accept': 'application/json',
    'Accept-Language': 'nl,en-US;q=0.7,en;q=0.3',
    'Accept-Encoding': 'gzip, deflate, br, zstd',
    'Referer': 'https://account.microsoft.com/',
    'Content-Type': 'application/json',
    'Authorization': msatoken,
    'ms-cV': 'NO/nIhSCr7muWwCfSEyVKd.1',
    'Origin': 'https://account.microsoft.com',
    'Connection': 'keep-alive',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'same-site',
    'Priority': 'u=4',
    'TE': 'trailers'
  }
    });
    // console.log(`purchases: ${JSON.stringify(response.data)}`)
    return JSON.stringify(response.data); 
  } catch (error) {
    console.error('Error fetching purchases:'); 
    return null; 
  }
}

module.exports = getpurchases;
