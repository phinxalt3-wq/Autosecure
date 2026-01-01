module.exports = async (httpClient) => {
  try {

    /// email isn't needed

    const firstUrl =
      'https://login.live.com/oauth20_authorize.srf?client_id=81feaced-5ddd-41e7-8bef-3e20a2689bb7' +
      '&state=H4sIAAAAAAAEAAXBy4JrMAAA0H-ZrUVppa7FLGjqUSLiFezEI6pVLor26-ecH3dlVEotUAQnd7sIRPIu-76xjgdAjGBPl2W40TgSvl8UCOR2tVc5Cy15V2QPB8Kew8N6X-4Ta2J1JaXyoOKzW-sqYCOJuTzZmfGOJEnyNd3vxGgdHouabAfFrvPHADq7Q5Jus4uohMAkV5h9MDOBeXdmiAsUMlNsSXQc08wvw4IkU52HaazydcDg7XeTQr3K8JEBljy3oOOIxygq2dobI3BzzeXu2C11e0OqvHlnI5tHuJjvV39Q0Ye6xMB-HHLgnEoi_bcWu7BbJ1V3PIu6f8eD7kQVlfMmaLXyyj_M3pcnFDZaEbgrycyTY6Px6_nJs2l642pDlRg9rJE1wTHBIJwn_2V5nnEx-go4uHVT7QvPSVxs_9L3SlM9q-MAvrSguSH3hIqM7sahRGOv1Qn__f35A4kvtzCaAQAA' +
      '&prompt=none' +
      '&x-client-SKU=MSAL.Desktop' +
      '&x-client-Ver=4.66.1.0' +
      '&uaid=dfe79bae5ce44a78ab9863eb1872a312' +
      '&msproxy=1' +
      '&issuer=mso' +
      '&tenant=consumers' +
      '&ui_locales=fr-FR' +
      '&client_info=1' +
      '&epct=PAQABDgEAAABVrSpeuWamRam2jAF1XRQEx_vCgDrsE7QLNIDjlfkrvKNJs7CsadJHHly66g0a8ZZew4ENgv3Uux_0Ik742wEBtY5K71uHlkD6PcM44Qps1LcTzaklupgrNTn3PtAN74_tllxtL-osWZjjRfgsRNjsf87UswDwCiPk-zxq7L8vYHGM0IZvR4BUD_k4bvgBOGrGrfFDdx7SAJX4S70dIY_CgFIM-SYZ_iG7ECRuk2qqkyAA' +
      '&jshs=0' +
      '&scope=service%3a%3aaccount.microsoft.com%3a%3aMBI_SSL+openid+profile+offline_access' +
      '&redirect_uri=https%3a%2f%2faccount.microsoft.com%2fauth%2fcomplete-signin-oauth' +
      '&response_type=code';

    const firstHeaders = {
      'Cache-Control': 'max-age=0',
      'Accept-Language': 'fr-FR,fr;q=0.9',
      'Upgrade-Insecure-Requests': '1',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'Sec-Fetch-Site': 'cross-site',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Dest': 'document',
      'Sec-Ch-Ua': '"Not A(Brand";v="8", "Chromium";v="132"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"Windows"',
      'Referer': 'https://login.live.com/',
      'Accept-Encoding': 'gzip, deflate, br',
      'Priority': 'u=0, i',
      'Connection': 'keep-alive'
    };

   // console.log("Sending first GET request...");
    const firstResponse = await httpClient.get(firstUrl, { headers: firstHeaders });
   // console.log("First response status:", firstResponse.status);

    if (!firstResponse.headers.location) {
      console.log("Redirect location not found in first response.");
      return false;
    }

    const redirectUrl = firstResponse.headers.location;
 //   console.log("Redirect URL found:", redirectUrl);

    const secondHeaders = {
      'Cache-Control': 'max-age=0',
      'Accept-Language': 'fr-FR,fr;q=0.9',
      'Upgrade-Insecure-Requests': '1',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'Sec-Fetch-Site': 'cross-site',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Dest': 'document',
      'Sec-Ch-Ua': '"Not A(Brand";v="8", "Chromium";v="132"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"Windows"',
      'Referer': 'https://login.live.com/',
      'Accept-Encoding': 'gzip, deflate, br',
      'Priority': 'u=0, i',
      'Connection': 'keep-alive'
    };

  //  console.log("Sending second GET request to redirect URL...");
    const secondResponse = await httpClient.get(redirectUrl, { headers: secondHeaders });
   // console.log("Second response status:", secondResponse.status);

    const jwt = httpClient.getCookie("AMCSecAuthJWT");
 //   console.log("JWT Cookie:", jwt ? jwt.slice(0, 30) + "..." : "Not found");

    return jwt || false;
  } catch (err) {
    console.error("Error in getAMCSecAuthJWT:", err.message);
    return false;
  }
};
