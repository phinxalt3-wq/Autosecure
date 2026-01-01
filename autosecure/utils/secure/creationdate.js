const axios = require('axios');

module.exports = async (ssid) => {
  try {
    let req = await axios({
      method: "GET",
      url: "https://api.minecraftservices.com/minecraft/profile/namechange",
      headers: {
        Authorization: `Bearer ${ssid}`
      }
    });

 //   console.log(`creationdate response: ${req.data}`)


    if (isvalid(req)) {
      return {
        created: req.data.createdAt,
        allowed: req.data.nameChangeAllowed
      };
    }
    
  } catch (error) {
    console.error(error);
  }

  return {};

}


function isvalid(req) {
  return req.status === 200 && req.data && req.data.createdAt;
}
