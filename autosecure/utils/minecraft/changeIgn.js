const HttpClient = require('../process/HttpClient')


module.exports = async function changeign(ssid, name){
    let axios = new HttpClient()
    let data = await axios.put(`https://api.minecraftservices.com/minecraft/profile/name/${name}`, ``,
        {
            headers: {
                "Content-Type": "Application/json",
                Authorization: `Bearer ${ssid}`
            }
        }
    )
    if (data.status == 200) {
        return true
    }
    return false
}