

/**
 * 
 * @param {HttpClient} axios 
 */
module.exports = async (axios) => {
    return (await axios.get(`https://account.microsoft.com/home/api/devices/devices-summary`, { headers: { "X-Requested-With": "XMLHttpRequest" } })).data || null
}