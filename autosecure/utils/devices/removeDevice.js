

/**
 * 
 * @param {HttpClient} axios 
 * @param {{id}} device 
 * @returns 
 */
module.exports = async (axios, device) => {
    try {
        const response = await axios.post(`https://account.microsoft.com/devices/api/disclaim`,
            {
                deviceId: device.id
            },
            {
                headers: {
                    "X-Requested-With": "XMLHttpRequest"
                }
            })
        if (response.status == 200) return true
        return false
    } catch (e) {
        console.log(e)
    }
}