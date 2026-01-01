const listProfile = require("../../utils/hypixelapi/listProfile")

module.exports={
    name:"duels",
    callback:async (client,interaction)=>{
        let username = interaction.customId.split("|")[1]
        let sensored = interaction.customId.split("|")[2]
        if(sensored=="0"){
            sensored=false
        }else{
            sensored=true
        }
        interaction.update(await listProfile(username, { sensored: sensored, list: "duels", ping: "" }))
    }
}