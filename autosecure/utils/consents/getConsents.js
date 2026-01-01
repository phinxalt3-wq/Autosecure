

/**
 * 
 * @param {HttpClient} axios 
 */
module.exports = async (axios) => {
    let consents = await axios.get(`https://account.live.com/consent/Manage?guat=1`)
    if (consents.data) {
        const match = consents.data.match(/data-clientId="([^"]+)"/g);
        let match2 = consents.data.match(/<div class="consentManageAppName">(.*?)<\/div>/g)
        let names = []
        let i = 0
        if (match != null && typeof match[Symbol.iterator] === 'function') {
            for (let m of match) {
                names[i] = { id: m.split("\"")[1], name: null }
                i++
            }
        }
        i = 0
        if (match2 != null && typeof match2[Symbol.iterator] === 'function') {
            for (let m of match2) {
                names[i].name = m.split(">")[1].replace("</div", "")
                i++
            }
        }
        return names
    } else {
        return false
    }
}