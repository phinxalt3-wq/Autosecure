const axios = require("axios");
const fs = require("fs");

module.exports = async (ssid) => {
    try {
        const { data } = await axios({
            method: "GET",
            url: "https://api.minecraftservices.com/minecraft/profile/namechange",
            headers: {
                Authorization: `Bearer ${ssid}`
            }
        });


        const createdDate = new Date(data.createdAt);
        const formattedTimestamp = createdDate.toLocaleString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });


        const namechange = data.nameChangeAllowed ? "Available" : "Not Available";

        const response = {
            createdAt: formattedTimestamp + " [UTC]",   // Specified Timezone
            nameChangeAllowed: data.nameChangeAllowed,
            namechange: namechange
        };


        
        return response;
    } catch (error) {
        console.error("Error checking name change availability:", error.message);
        

    
        

        try {
            console.log("Retrying...");
            const { data } = await axios({
                method: "GET",
                url: "https://api.minecraftservices.com/minecraft/profile/namechange",
                headers: {
                    Authorization: `Bearer ${ssid}`
                }
            });


            const createdDate = new Date(data.createdAt);
            const formattedTimestamp = createdDate.toLocaleString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });


            const namechange = data.nameChangeAllowed ? "Available" : "Not Available";

            const response = {
                createdAt: formattedTimestamp + " [UTC]",   // Specified Timezone
                nameChangeAllowed: data.nameChangeAllowed,
                namechange: namechange
            };



            return response;
        } catch (retryError) {
            console.error("Retry failed:", retryError.message);

            

            const nullResponse = {
                createdAt: null,
                nameChangeAllowed: null,
                namechange: null
            };


    

            return nullResponse;
        }
    }
};
