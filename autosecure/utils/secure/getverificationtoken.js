module.exports = async function getverificationtoken(axios){
    const tokendata = await axios.get('https://account.microsoft.com/profile', {
        noproxy: true,
    });
    const match = tokendata.data.match(/<input[^>]*name="__RequestVerificationToken"[^>]*value="([^"]+)"[^>]*>/);
    const token = match ? match[1] : null;
    return token;
}