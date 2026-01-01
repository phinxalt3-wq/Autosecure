const axios = require('axios');

module.exports = async (ssid) => {
    try {
        const response = await axios.get('https://api.minecraftservices.com/minecraft/profile', {
            headers: {
                'Authorization': `Bearer ${ssid}`
            },
            timeout: 10000
        });
        const data = response.data;
        if (data && Array.isArray(data.capes)) {
            const capes = data.capes
                .filter(cape => cape.alias)
                .map(cape => cape.alias);
            return capes;
        }
        return [];
    } catch (error) {
        console.error('Error fetching capes:', error.message);
        return [];
    }
};
