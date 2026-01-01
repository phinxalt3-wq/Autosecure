const HttpClient = require("../process/HttpClient")
// So nice of hypixel to remove the key endpoint
module.exports = async function checkhypixelapi(key){
    let axios = new HttpClient()
    let data = await axios.get(`https://api.hypixel.net/v2/player?key=${key}`)
    // console.log(data.data)
    if (data.data.cause === "Invalid API key"){
        return false
    } else if (data.data.cause === "Missing one or more fields [uuid]") {
        console.log(`Valid api key!`)
        return true
    } 
    console.log(`Other reason: ${data.data}`)
    return true
}