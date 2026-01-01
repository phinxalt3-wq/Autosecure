const { EmbedBuilder } = require("discord.js");
const validEmail = require("../emails/validEmail");
const checklocked = require("../secure/checklocked");
const { codeblock } = require("../process/helpers");

module.exports = async function checklockedmsg(email) {
  if (!validEmail(email)) {
    return {
      embeds: [new EmbedBuilder()
        .setTitle("❌ Invalid Email")
        .setDescription(`The email \`${email}\` is not valid.`)
        .setColor(0xff4757)
        .setThumbnail('https://cdn.pfps.gg/pfps/59339-erwan-meunier.gif')
        .addFields({
          name: '💡 What to do?',
          value: '• Make sure the email format is correct\n• Check for typos in the email address\n• Use a valid email format (e.g., user@example.com)',
          inline: false
        })
        .setFooter({ text: 'Account Checker • Autosecure' })
        .setTimestamp()],
      ephemeral: true,
    };
  }

  let islockedobj = await checklocked(email);

  if (islockedobj.locked === "error") {
    let errortext = codeblock(islockedobj.reason || "Unknown error");
    const errorEmbed = new EmbedBuilder()
      .setTitle("⚠️ Account Check Error")
      .setDescription("An error occurred while checking the account status.")
      .setColor(0xffa502)
      .setThumbnail('https://cdn.pfps.gg/pfps/59339-erwan-meunier.gif')
      .addFields([
        {
          name: "🔧 Error Details",
          value: errortext
        },
        {
          name: "💡 What to do?",
          value: "Please report this if the error above seems incorrect.",
          inline: false
        }
      ])
      .setFooter({ text: 'Account Checker • Autosecure' })
      .setTimestamp();
    return { embeds: [errorEmbed], ephemeral: true };
  }

  let reason = null;
  let permanent = "Unknown";

  if (islockedobj.reason) {
    if (islockedobj.reason.toLowerCase() === "override") {
      reason = "Phone locked (likely)";
      permanent = "Maybe";
    } else {
      reason = islockedobj.reason;
      permanent = "No";
    }
  }

  const embed = new EmbedBuilder()
    .setTitle(`🔍 Account Status Check`)
    .setDescription(`**${email}** account information`)
    .setColor(islockedobj.locked ? 0xff4757 : 0x2ed573)
    .setThumbnail('https://cdn.pfps.gg/pfps/59339-erwan-meunier.gif')
    .addFields(
      { name: "📧 Email", value: `\`${email}\``, inline: false },
      { name: "🔒 Locked", value: islockedobj.locked ? "❌ **Yes**" : "✅ **No**", inline: true },
      { name: "⚠️ Compromised", value: islockedobj.compromised ? "❌ **Yes**" : "✅ **No**", inline: true },
      { name: "🚫 Blocked", value: islockedobj.blocked ? "❌ **Yes**" : "✅ **No**", inline: true },
      { name: "🔐 2FA Enabled", value: islockedobj.tsvEnabled ? "✅ **Yes**" : "❌ **No**", inline: true },
      { name: "🟢 Active", value: islockedobj.active ? "✅ **Yes**" : "❌ **No**", inline: true },
      { name: "📬 Email Verified", value: islockedobj.emailVerified ? "✅ **Yes**" : "❌ **No**", inline: true },
      { name: "📝 Reason", value: `\`${reason || "None"}\``, inline: true }
    )
    .setFooter({
      text: "Don't spam this command for the same email. It may show unlocked falsely in this case. • Autosecure"
    })
    .setTimestamp()


  if (islockedobj.locked) {
    embed.addFields({ name: "🔓 Unlockable (Excluding support)", value: `\`${permanent}\``, inline: true });
  }

  return { embeds: [embed], ephemeral: true };
};
