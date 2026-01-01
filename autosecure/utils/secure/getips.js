module.exports = async (axios) => {
  try {
    const now = new Date();
    const formatTime = (date) => {
      return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')} ` +
             `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
    };
    const utcNow = formatTime(now);

    const initialResponse = await axios.get('https://account.live.com/Activity', {
      params: {
        'mkt': 'en-GB',
        'refd': 'account.microsoft.com',
        'refp': 'security'
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'nsl,en-US;q=0.7,en;q=0.3',
        'Accept-Encoding': 'gzip, deflate, br, zstd',
        'Referer': 'https://account.microsoft.com/',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'cross-site',
        'Priority': 'u=0, i'
      }
    });

    const initialJsonMatch = initialResponse.data.match(/var jsonActivity = '(.+?)';/);
    if (!initialJsonMatch) {
            return null;
    }

    const initialActivityData = JSON.parse(
      initialJsonMatch[1].replace(/\\u([\dA-Fa-f]{4})/g,
        (_, grp) => String.fromCharCode(parseInt(grp, 16)))
    );

    const ipList = [];
    let initialIpCount = 0;

    const collectIPs = (items) => {
      if (!items) return;
      items.forEach(item => {
        if (item.ip) {
          ipList.push(item.ip);
          initialIpCount++;
        }
      });
    };

    collectIPs(initialActivityData.reportItems);
    collectIPs(initialActivityData.unusualReportItems);

    
    const apiResponse = await axios.post(
      'https://account.live.com/API/AccountActivity',
      {
        lastActivityTime: initialActivityData.lastActivityTime,
        utcNow: utcNow,
        uiflvr: 1001,
        uaid: "a7ba5b6d20c24f7289cd20b55c2f5956",
        scid: 100157,
        hpgid: 200158
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0'
        }
      }
    );

    if (apiResponse.data && apiResponse.data.reportItems) {
      
      apiResponse.data.reportItems.forEach((item, index) => {
        if (item.ip) {
                    ipList.push(item.ip);
        } else {
                  }
      });
    }

    const uniqueIPs = [...new Set(ipList)];
    
    const ipv4Only = uniqueIPs.filter(ip => /^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$/.test(ip));
    
    if (ipv4Only.length === 0) return null;
    return (ipv4Only)

  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('API Error:', {
        status: error.response.status,
        data: error.response.data
      });
    }
    return null;
  }
};
