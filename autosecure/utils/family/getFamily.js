

/**
 * 
 * @param {HttpClient} axios 
 */
module.exports = async (axios) => {
    let data = await axios.get(`https://account.microsoft.com/family/api/roster`, {
        headers: {
            "X-Requested-With": "XMLHttpRequest",
        }
    })
    return data.data || null
}