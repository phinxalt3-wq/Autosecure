module.exports = async function changedobregion(axios, dob) {
  console.log(`Profile verification token: ${axios.axios.defaults.headers.common['__RequestVerificationToken']}`)
const [day, month, year, country] = dob.split("|");

const parsedDay = parseInt(day, 10);
const parsedMonth = parseInt(month, 10);
const parsedYear = parseInt(year, 10);

if (
  isNaN(parsedDay) || isNaN(parsedMonth) || isNaN(parsedYear) ||
  parsedDay < 1 || parsedDay > 31 ||
  parsedMonth < 1 || parsedMonth > 12 ||
  parsedYear < 1900 || parsedYear > new Date().getFullYear()
) {
  console.error('Invalid date provided.');
  return false;
}

  if (typeof country !== 'string' || country.length === 0) {
    console.error('Invalid country code.');
    return false;
  }

  console.log('Changing personal info!');
  const send = {
    structuredBirthdate: {
      day: parsedDay,
      month: parsedMonth,
      year: parsedYear
    },
    country: country,
    isConfirmedToConvertToMinor: false
  };

  console.log(`Sending with ${JSON.stringify(send)}`);

  try {
    const response = await axios.post(
      'https://account.microsoft.com/profile/api/v1/personal-info/msa-profile',
      send,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:139.0) Gecko/20100101 Firefox/139.0',
          'Accept-Language': 'nl,en-US;q=0.7,en;q=0.3',
          'Accept-Encoding': 'gzip, deflate, br, zstd',
          'X-Requested-With': 'XMLHttpRequest',
          'Correlation-Context': 'v=1,ms.b.tel.market=nl-NL,ms.b.qos.rootOperationName=GLOBAL.PROFILE.PERSONALINFO.UPDATEMSAPROFILE,ms.b.tel.scenario=ust.amc.profile.editprofileinfo,ms.c.ust.scenarioStep=Saving',
          'Origin': 'https://account.microsoft.com',
          'Connection': 'keep-alive',
          'Referer': 'https://account.microsoft.com/profile/edit-profile-information',
          'Sec-Fetch-Dest': 'empty',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'same-origin',
          'Priority': 'u=0'
        }
      }
    );

    if (response.status === 200) {
      console.log('Changed dob & region!');
      return true;
    } else {
      console.log(`Response at dobregion: ${JSON.stringify(response.data)}`);
      return false;
    }
  } catch (error) {
    console.error('Request failed:', error.message);
    return false;
  }
};
