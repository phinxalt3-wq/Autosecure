module.exports = async function RemoveAppPasswords(axios) {
  try {
    await axios.get("https://account.live.com/proofs/manage/additional/")
    
      const postResponse = await axios.post("https://account.live.com/API/Proofs/DeleteAppPassword", {
        uiflvr: 1001,
        uaid: '423f2d2d46204392b7ed97b293248ef5',
        scid: 100109,
        hpgid: 201030
      }, {
        headers: {
          'Content-Type': 'application/json',
          "X-Requested-With": "XMLHttpRequest",
          'Accept': 'application/json'
        }
      });

      console.log(`removepw: ${postResponse.data}`)

      if (postResponse.data?.apiCanary) {
        return true;
      }

    return false;
  } catch (error) {
    console.error('Error while removing app passwords:', error.message);
    if (error.response) {
      console.log('API Response data:', error.response.data);
      console.log('Status code:', error.response.status);
    }
    return false;
  }
};