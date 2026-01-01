module.exports = async (axios, id) => {
    const consentData = await axios.get(`https://account.live.com/consent/Edit?client_id=${id}`, {
        headers: { "X-Requested-With": "XMLHttpRequest" }
    });
    
    let canary = consentData?.data.match(/<input[^>]+name=["']canary["'][^>]+value=["']([^"']+)["']/)?.[1];
    
    if (canary) {
        const response = await axios.post(`https://account.live.com/consent/Edit?client_id=${id}`, `canary=${encodeURIComponent(canary)}`, {
            headers: {
                "X-Requested-With": "XMLHttpRequest",
                "Content-Type": "application/x-www-form-urlencoded",
            }
        });
       
        if (response.status === 302 && response.headers.location.includes("Manage")) {
            return true;
        }
    }
    return false;
}