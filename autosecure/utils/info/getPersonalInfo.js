const HttpClient = require("../../../process/httpClient")

/**
 * 
 * @param {HttpClient} axios 
 */
module.exports = async (axios) => {
    let {data} = await axios.get(`https://account.microsoft.com/profile/api/v1/personal-info`, { headers: { "X-Requested-With": "XMLHttpRequest" } })
    return data
}