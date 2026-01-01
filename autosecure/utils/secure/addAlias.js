const axios = require("axios");

module.exports = async (name, canary2, amrp, amsc) => {
  try {
    let { data } = await axios({
      method: "POST",
      url: "https://account.live.com/AddAssocId",
      headers: {
        Cookie: `AMRPSSecAuth=${amrp}; amsc=${amsc};`,
      },
      data: `canary=${encodeURIComponent(canary2)}&PostOption=NONE&SingleDomain=outlook.com&UpSell=&AddAssocIdOptions=LIVE&AssociatedIdLive=${name}`,
      maxRedirects: 0,
      validateStatus: (status) => status >= 200 && status < 400,
    });


    if (data.includes("We limit how frequently you can change your primary alias.")) {
      console.log('Alias changes are limited');
      return false; 
    }

    if (data.includes('code="1213"')) {
      console.log('Alias changes are limited');
      return false; 
    }
    

    let match = data.match(/alias=.+?(;)/);
    if (match && match[0]) {
    console.log(`Added!`)
      return true;
    } else {
      return false;
    }

  } catch (error) {
    console.error("Error during addAlias POST request:", error);
    return false;
  }
};
