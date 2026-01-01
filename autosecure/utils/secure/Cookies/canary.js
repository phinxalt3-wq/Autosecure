const decode = require("../../../misc/decode")

/**
 * 
 * @param {HttpClient} axios 
 */
module.exports = async (axios) => {
    const data = await axios.get(`https://account.live.com/password/reset`)
    let a = data?.data?.match(/"apiCanary":"([^"]+)"/)
    let c = data?.data?.match(/"sCanary":"([^"]*)"/)
    if (c && c[1]) {
        axios.canary = decode(c[1])
    }
    if (a && a[1]) {
        axios.axios.defaults.headers.common["canary"] = decode(a[1])
    }
}