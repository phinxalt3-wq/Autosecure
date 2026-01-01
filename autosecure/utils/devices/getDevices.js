

/**
 * 
 * @param {HttpClient} axios 
 */
module.exports = async (axios) => {
    const response = await axios.get(`https://account.microsoft.com/home/api/devices/devices-summary`, { 
        headers: { "X-Requested-With": "XMLHttpRequest" } 
    });
    
    return JSON.stringify(response.data) || null;
}
