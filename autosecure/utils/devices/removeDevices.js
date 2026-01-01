const cheerio = require('cheerio');

module.exports = async (axios) => {

    const baseHeaders = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:134.0) Gecko/20100101 Firefox/134.0',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'X-Requested-With': 'XMLHttpRequest',
        'Cookie': 'display-culture=en-US'
    };

    try {
     //   console.log("[*] Starting remove devices...");

        const html = await axios.get('https://account.microsoft.com/devices', {
            headers: { ...baseHeaders, 'Accept': 'text/html' }
        });
        const $ = cheerio.load(html.data);
        const token = $('input[name="__RequestVerificationToken"]').val();
        if (!token) {
            console.log("[-] Failed to fetch token.");
            return 0;
        }

        const res = await axios.get('https://account.microsoft.com/devices/api/devices?getAll=false', {
            headers: baseHeaders
        });
        const devices = res.data.devices || [];
        if (!devices.length) {
            console.log("[-] No devices found.");
            return 0;
        }

        console.log(`[*] Fetched ${devices.length} devices`);

        let removedCount = 0;

        await Promise.all(devices.map(async (device) => {
            const deviceId = device.info?.id;
            if (!deviceId) return;

            const headers = {
                ...baseHeaders,
                'Content-Type': 'application/json',
                '__RequestVerificationToken': token,
                'Origin': 'https://account.microsoft.com',
                'Referer': `https://account.microsoft.com/devices/device?deviceId=${encodeURIComponent(deviceId)}`
            };
            const payload = { deviceId };

            try {
                await axios.post('https://account.microsoft.com/devices/api/disclaim', payload, { headers });
                await axios.put('https://account.microsoft.com/devices/api/app-device/deauthorize', payload, { headers });
                await axios.put('https://account.microsoft.com/devices/api/offline-play/deauthorize', payload, { headers });
                await axios.delete(
                'https://account.microsoft.com/devices/api/offline-play/deauthorize',
                null,
                { headers }
                );
                removedCount++;
                console.log(`[*] Removed device ${deviceId} successfully`);
            } catch (e) {
                console.log(`[-] Failed to remove device ${deviceId}: ${e.response?.status || e.message}`);
            }
        }));

        console.log("[*] Remove finished.");
        return removedCount;
    } catch (err) {
        console.error("[-] Unexpected error:", err.message);
        return 0;
    }
};
