
const getsecretKey = require("./getsecretkey");
const generateotp = require("./codefromsecret");
const confirmtfa = require("./confirmtfa");


async function addzyger(axios, apiCanary) {
  try {

    let { secretKey, proof, rvtkn } = await getsecretKey(axios);
    

    if (!secretKey || !proof) {
      console.log("Missing secretKey or proof, sad fr");
      return { success: false, secretKey }; 
    }


    let code;


    let data = await generateotp(secretKey);
    if (data && data.otp) {
      code = data.otp; 
    }


    let tfaconfirmed = await confirmtfa(axios, code, proof, rvtkn, apiCanary);
    
    // this is barely possible but alr
    if (tfaconfirmed === "retry") {
      console.log("Not a valid otp, how tf, retrying");
      data = await generateotp(secretKey); 
      if (data && data.otp) {
        code = data.otp; 
      }
      tfaconfirmed = await confirmtfa(axios, code, proof, rvtkn, apiCanary);
    }
  

    if (tfaconfirmed === false) {
      console.log("TFA confirm failed");
      return { success: false, secretKey }; 
    }
    

    if (tfaconfirmed === true) {
      console.log("TFA confirmed successfully.");
      return { success: true, secretKey }; 
    }

  // No explicit fallback; let function return undefined on unexpected path

  } catch (error) {
    console.error("Error generating OTP:", error);
    throw error; 
  }
}


module.exports = addzyger;
