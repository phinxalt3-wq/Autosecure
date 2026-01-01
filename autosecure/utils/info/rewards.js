const HttpClient = require("../process/HttpClient");

/**
 * 
 * @param {HttpClient} axios 
 */
module.exports = async (axios) => {
    let data = await axios.get(`https://account.microsoft.com/home/api/rewards/rewards-summary?lang=en-US&refd=account.live.com&refp=landing&mkt=EN-US&status=cancelled&res=acw_landing_page_cancelled`, {
        headers: {
            "X-Requested-With": "XMLHttpRequest"
        },
    })
    return data?.data || 0
}