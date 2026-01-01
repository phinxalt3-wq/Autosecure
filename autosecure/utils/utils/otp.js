const axios = require("axios");
const otpmethod2 = require('./otp2');


async function otp(email) {
  await otpmethod2(email)
  try {
    const { data } = await axios.get(
      `https://login.live.com/oauth20_authorize.srf?client_id=4765445b-32c6-49b0-83e6-1d93765276ca&scope=openid&redirect_uri=https://www.office.com/landingv2&response_type=code&msproxy=1&username=${encodeURIComponent(email)}`
    );

 const match = data.match(/({"Username":.+?})(?=,loader:\{)/)?.[1] || data.match(/({"Username":.+?})(?=,loader:\{)/)?.[0];
if (!match) {
  return { sent: false, sec: null };
}

const credentialsJson = JSON.parse(match);
    console.log(`Credentials json: ${JSON.stringify(credentialsJson)}`)
    const secId = credentialsJson.Credentials.OtcLoginEligibleProofs?.[0]?.data;
    if (!secId) {
      return { sent: false, sec: null };
    }

    const postData = `login=${encodeURIComponent(email)}&flowtoken=-DvTDvmRgphmpW9oJRrYLB1YGD*aPHnUeOf3zvwQABaxrG8WwdFr6jD12imzrE3D2AhdfsKbazoW5G0AvCvO9Thz!9VzxnGUlAbtWqwft34nll3cx2ge2pRYsrK5Sq6BtZbObPlJ2tDiwu3gRDgBjzFldYn*rt9By5D!6QUKFoC8pFtKS949tDFokpG0BpT07ig$$&purpose=eOTT_OtcLogin&channel=Email&AltEmailE=${encodeURIComponent(secId)}`;

    const { data: otpData } = await axios({
      method: "post",
      url: "https://login.live.com/GetOneTimeCode.srf",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Cookie:
          "MSPRequ=id=N&lt=1710339166&co=1; uaid=c91a322ee1b4429680b0ea8f66c093a0; MSCC=197.120.88.59-EG; MSPOK=$uuid-146ab8a8-c9d0-4bb1-aa27-547da7d29c2e; OParams=11O.DtGQ6hN13OJzMvlgcsbk3K1MJr*X68!Ot3yO3k6RSI06blohFE2hyzV47ZO5tLXE6D0m99QK34YAxLCQDz3U1Nwyqy2Ov*hJkMvLwJXKbYUIjSGgHieTerUPAdR6FgtL0BzQq8XqFSgSdvzmclJqKpzC0GvHtf*jA5WjBZyVV5OSII6OIjJzM8v256KIa95Jzj14D1QDiteTtl5yjezcl!ntryM4c*L*FOCgYxrA8MD9oya8pFHntdG4l5NgaUHkKencTODUnk6EbqD0Scud3qYyArpTBs7ryxY7AUWiqHf1tEwSAEzpGdVVlnooi!h0*w$$; MicrosoftApplicationsTelemetryDeviceId=8d42cd67-e191-4485-b99f-61acde87e85c; ai_session=xgIvNnBy7/HaB8dU2XGZWs|1710339167277|1710339167277; MSFPC=GUID=254359f779a247ddb178d133b367ad82&HASH=2543&LV=202403&V=4&LU=1710339171328"
      },
      data: postData
    });

    return {
      sent: true,
      sec: secId
    };
  } catch (error) {
    console.error("Error in OTP process:", error.message);
    return { sent: false, sec: null };
  }
}

module.exports = otp;
