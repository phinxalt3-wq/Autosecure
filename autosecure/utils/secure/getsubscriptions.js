

async function getsubscriptions(axios) {
  try {
    const response = await axios.get('https://account.microsoft.com/services/api/subscriptions', {
      params: {
        'excludeWindowsStoreInstallOptions': 'false',
        'excludeLegacySubscriptions': 'true',
        'isReact': 'true',
        'includeCmsData': 'false'
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:135.0) Gecko/20100101 Firefox/135.0',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'nl,en-US;q=0.7,en;q=0.3',
        'Accept-Encoding': 'gzip, deflate, br, zstd',
        'X-TzOffset': '60',
        'X-Requested-With': 'XMLHttpRequest',
        'Correlation-Context': 'v=1,ms.b.tel.market=nl-NL,ms.b.qos.rootOperationName=GLOBAL.SERVICES.GETSUBSCRIPTIONS',
        'Connection': 'keep-alive',
        'Referer': 'https://account.microsoft.com/?lang=nl-NL',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin'
      }
    });

    const subscriptions = response.data.active;
    return JSON.stringify(subscriptions, null, 2); 
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    return null;
  }
}

module.exports = getsubscriptions;
