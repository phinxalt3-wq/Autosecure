const decode = require("./decode");
const axios = require("axios");

module.exports = async () => {
  let attempts = 0;
  let apicanary, canary, amsc;

  while (attempts < 3) {
    attempts++;
    try {
      let data = await axios({
        method: "GET",
        url: "https://account.live.com/password/reset",
        maxRedirects: 0,
        validateStatus: (status) => status >= 200 && status < 400,
      });

      let a = data?.data?.match(/"apiCanary":"([^"]+)"/);
      if (a && a[1]) {
        apicanary = decode(a[1]);
     //   console.log(`apicanary: ${apicanary}`);
      } else {
        console.log("apiCanary not found");
      }

      let c = data?.data?.match(/"sCanary":\s*"([^"]+)"/);
      if (c && c[1]) {
        canary = decode(c[1]);
     //   console.log(`canary: ${canary}`);
      } else {
        console.log("sCanary not found");
      }

      data.headers["set-cookie"]?.map((cookie) => {
        const [name, ...values] = cookie.split("=");
        if (name === "amsc") {
          amsc = values.join("=").split(";").shift();
        }
      });

      if (apicanary && canary && amsc) {
        return [apicanary, amsc, canary];
      }

    } catch (error) {
      if (attempts >= 3) throw error;
    }
  }
  console.log(`Couldn't get canary and such cookies!`)
    return null
};
