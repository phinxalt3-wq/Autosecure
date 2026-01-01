const HttpClient = require('../process/HttpClient')

module.exports = async function checkIfUserIsOnline(uuid) {
  try {
    const axios = new HttpClient()
    const response = await axios.get(`https://hypixel.paniek.de/player/${uuid}/status`)

    const status = {
      online: response?.data?.status?.online === true,
      game: response?.data?.status?.game || null,
      mode: response?.data?.status?.mode_fancy || null
    }

    return status
  } catch (error) {
    console.error("Error fetching player status:", error.message)
    return false
  }
}
