const { getEmailDescription } = require("../utils/getEmailDescription");

module.exports = async (axios) => {
const securityMethodsData = await axios.get('https://account.live.com/proofs/manage/additional', {
  headers: {
    "X-Requested-With": "XMLHttpRequest"
  }
});
  const secMatch = securityMethodsData?.data?.match(/var\s+t0\s*=\s*({[^;]+})/)?.[1];
  if (!secMatch) {
    console.log(`didn't find any sec data, tf?`);
    return false;
  }

  const obj = JSON.parse(secMatch);
  const data = obj?.WLXAccount?.manageProofs;
  const firstemail = obj?.displayMemberName || obj?.email;

  const emails = data?.emailProofs || [];
  const passKeys = data?.passKeys || [];
  const unverifiedEmails = emails.filter(e => e.isVerified !== 1);

  if (unverifiedEmails.length > 0) {
    console.log('Found Unverified Emails:', unverifiedEmails.map(e => e.displayProofName));
  } else {
    console.log("No unverified emails found");
  }

  if (unverifiedEmails.length > 0) {
    const unv = unverifiedEmails[0];
    console.log(`fixing: netid: ${unv.encryptedNetId} and sec: ${unv.displayProofName}`);

    const send = await axios.post(
      'https://account.live.com/API/Proofs/SendOtt',
      {
        actionSpecificNetId: unv.encryptedNetId,
        destination: unv.encryptedProofId,
        proofId: unv.proofId,
        channel: "Email",
        proofCountry: "",
        proofCountryCode: "",
        action: "VerifyProof",
        uiflvr: 1001,
        uaid: "a21cad66e4b04bb8bcd89093468f0bf5",
        scid: 100109,
        hpgid: 201030
      },
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:138.0) Gecko/20100101 Firefox/138.0',
          'Accept': 'application/json',
          'Accept-Language': 'nl,en-US;q=0.7,en;q=0.3',
          'Accept-Encoding': 'gzip, deflate, br, zstd',
          'Referer': 'https://account.live.com/proofs/manage/additional/',
          'Content-Type': 'application/json; charset=UTF-8',
          'x-ms-apiVersion': '2',
          'x-ms-apiTransport': 'xhr',
          'uiflvr': '1001',
          'scid': '100109',
          'hpgid': '201030',
          'uaid': 'a21cad66e4b04bb8bcd89093468f0bf5',
          'X-Requested-With': 'XMLHttpRequest',
          'Origin': 'https://account.live.com',
          'Connection': 'keep-alive',
          'Sec-Fetch-Dest': 'empty',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'same-origin'
        }
      }
    );

    console.log(send.data);
    const sendottcanary = send?.data?.apiCanary;


    // Skip the 10-second email wait for faster verification flow
    // Just return the security options immediately
    const sec = {
      email: firstemail,
      netId: data?.encryptedNetId,
      apppasswords: data?.appPassword?.hasAppPassword,
      secoptions: {
        authApp: JSON.stringify(data?.msAuthApp),
        phoneNumbers: JSON.stringify(data?.smsProofs),
        emails: JSON.stringify(emails),
        passKeys: JSON.stringify(passKeys)
      }
    };
    return sec;
  }

  const sec = {
    email: firstemail,
    netId: data?.encryptedNetId,
    apppasswords: data?.appPassword?.hasAppPassword,
    secoptions: {
      authApp: JSON.stringify(data?.msAuthApp),
      phoneNumbers: JSON.stringify(data?.smsProofs),
      emails: JSON.stringify(emails),
      passKeys: JSON.stringify(passKeys)
    }
  };

  return sec;
};
