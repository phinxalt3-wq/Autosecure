

/**
 * 
 * @param {HttpClient} axios 
 */
module.exports = async (axios) => {
    try {
        const { data } = await axios.get(`https://account.microsoft.com/family/home`, {
            headers: {
                "X-Requested-With": "XMLHttpRequest",
            }
        });
        const newText = data.split('\n').slice(500).join('\n')
        const regex = /var areaConfig = JSON.stringify\((.*)\);/
        const match = newText.match(regex)

        if (match) {
            const value = JSON.parse(match[1])
            return value?.userPuid?.value || null
        }
    } catch (error) {
        console.error('Error fetching data:', error)
    }

    return null;

}