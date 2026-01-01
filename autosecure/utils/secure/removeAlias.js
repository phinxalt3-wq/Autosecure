
module.exports = async (axios, name, canary) => {

    const postData = `canary=${encodeURIComponent(canary)}&action=RemoveAlias&aliasName=${encodeURIComponent(name)}&displayName=${encodeURIComponent(name)}`;

    const response = await axios.post(
        "https://account.live.com/names/manage",
        postData,
        {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            maxRedirects: 0,
            validateStatus: (status) => status >= 200 && status < 400
        }
    );

    if (response.data.includes("Note_AssociatedIdRemoved")) {
        console.log(`Removed ${name} alias successfully`);
        return true
    } else {
        console.log(`Failed to remove ${name} alias`);
        return false
    }
};