

async function getogo(axios) {
  try {
    const response = await axios.get(`https://account.microsoft.com/profile/api/v1/personal-info`, {
      headers: {
          "X-Requested-With": "XMLHttpRequest",
      }
  });
    

      const email = response.data.signInEmail;
      const firstname = response.data.firstName;
      const lastname = response.data.lastName;
      const birthday = response.data.birthday;
      const country = response.data.region;
      const extractedData = {
        email,
        firstname,
        lastname,
        birthday,
        country
      };
      const jsondata = JSON.stringify(extractedData, null, 2);
      return jsondata;

  } catch (error) {
    if (error.response) {
      console.error('Error response status:', error.response.status);
      console.error('Error response reason:', error.response.statusText);
      console.error('Error response data:', error.response.data);
      return null;
    } else if (error.request) {

      console.error('No response received:', error.request);
      return null;
    } else {
      console.error('Error message:', error.message);
      return null;
    }
    console.error('Error config:', error.config);
    return null;
  }
}

module.exports = getogo;