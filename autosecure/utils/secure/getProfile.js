const axios = require("axios");

module.exports = async (ssid) => {
    try {
        const { data, status } = await axios({
            method: "GET",
            url: "https://api.minecraftservices.com/minecraft/profile",
            headers: {
                Authorization: `Bearer ${ssid}`,
            },
            validateStatus: (status) => status >= 200 && status < 500, // Validate status range
        });


        if (!data?.name) {
            return null;
        }


        return data;
    } catch (error) {
        console.error("Error fetching data:", error);
        return null; // Return null on error
    }
};
