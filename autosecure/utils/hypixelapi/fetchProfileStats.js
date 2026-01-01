module.exports = async function fetchProfileStats(key, profile){
    const { data } = await axios.get(`https://api.hypixel.net/v2/skyblock/profile?key=${key}&profile=${profile}`);
return data
}



