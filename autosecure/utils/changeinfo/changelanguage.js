module.exports = async function changelanguage(axios, lang) {
  try {
    const response = await axios.put(
      'https://account.microsoft.com/profile/api/v1/lang-settings/msa-display-language',
      {
        localeIsoCode: lang
      },
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:141.0) Gecko/20100101 Firefox/141.0',
          'Accept-Language': 'nl,en-US;q=0.7,en;q=0.3',
          'Accept-Encoding': 'gzip, deflate, br, zstd',
          'X-Requested-With': 'XMLHttpRequest',
          'Correlation-Context': 'v=1,ms.b.tel.market=en-GB,ms.b.qos.rootOperationName=GLOBAL.PROFILE.LANGSETTINGS.SETMSADISPLAYLANGUAGE,ms.b.tel.scenario=ust.amc.profile.setmsadisplaylanguage,ms.c.ust.scenarioStep=ConfirmingLanguage',
          'Origin': 'https://account.microsoft.com',
          'Connection': 'keep-alive',
          'Referer': 'https://account.microsoft.com/profile/msa-display-language-selector',
          'Sec-Fetch-Dest': 'empty',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'same-origin',
          'Priority': 'u=0',
          'Pragma': 'no-cache',
          'Cache-Control': 'no-cache'
        }
      }
    );

    return response.status === 200;
  } catch (err) {
    return false;
  }
};
