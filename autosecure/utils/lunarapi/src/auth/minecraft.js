
const joinMinecraftServer = async (accessToken, uuid, serverId) => {
    const response = await fetch("https://sessionserver.mojang.com/session/minecraft/join", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            accessToken,
            selectedProfile: uuid,
            serverId,
        }),
    })

    if (!response.ok) {
     //   console.log(`Response: ${response?.data}`)
        return false;
    }

    return true;
}

module.exports = { joinMinecraftServer }