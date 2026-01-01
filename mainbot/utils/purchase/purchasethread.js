const config = require("../../../config.json");
const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionsBitField,
  AttachmentBuilder
} = require('discord.js');
const { fetchLtcPrice } = require("./combined");
const { createTranscript } = require('discord-html-transcripts');
const fs = require('fs');
const path = require('path');
const { logPurchase } = require('../activityLogger');

async function purchasethread(client, interaction, mode) {
  try {
    if (!['slot', 'license'].includes(mode)) {
      return interaction.reply({
        content: "Invalid purchase mode.",
        ephemeral: true
      });
    }

    // Get crypto address from config
    const cryptoAddress = config.cryptoAddress || config.mainltc;
    if (!cryptoAddress) {
      return interaction.reply({
        content: "❌ Crypto address not configured. Please contact an administrator.",
        ephemeral: true
      });
    }

    // Fetch LTC price
    const ltcPrice = await fetchLtcPrice();
    if (ltcPrice <= 0 || ltcPrice === "failed") {
      return interaction.reply({
        content: "❌ Could not fetch LTC price. Please try again later.",
        ephemeral: true
      });
    }

    // Set prices (you can customize these in config.json)
    const usdPrice = mode === 'slot' ? (config.slotPrice || 0.05) : (config.licensePrice || 0.05);
    if (isNaN(usdPrice) || usdPrice <= 0) {
      return interaction.reply({
        content: "❌ Invalid price configuration.",
        ephemeral: true
      });
    }

    const ltcAmount = usdPrice / ltcPrice;

    // Get the category for purchase channels (use ticket category or create in same category as interaction)
    const categoryId = config.ticketcategory || interaction.channel.parentId;
    const guild = interaction.guild;

    // Validate and fetch category channel
    let categoryChannel = null;
    if (categoryId) {
      try {
        const fetchedCategory = await guild.channels.fetch(categoryId).catch(() => null);
        if (fetchedCategory && fetchedCategory.type === ChannelType.GuildCategory) {
          categoryChannel = fetchedCategory;
        } else {
          console.warn(`[PURCHASE] Category ${categoryId} is not a valid category channel`);
        }
      } catch (err) {
        console.warn(`[PURCHASE] Could not fetch category ${categoryId}:`, err.message);
      }
    }

    // Create channel name
    const channelName = `${mode === 'slot' ? 'slot' : 'license'}-purchase-${interaction.user.username.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

    // Build permission overwrites
    const permissionOverwrites = [
      {
        id: guild.id,
        deny: [PermissionsBitField.Flags.ViewChannel]
      },
      {
        id: interaction.user.id,
        allow: [
          PermissionsBitField.Flags.ViewChannel,
          PermissionsBitField.Flags.SendMessages,
          PermissionsBitField.Flags.ReadMessageHistory,
          PermissionsBitField.Flags.AttachFiles
        ]
      }
    ];

    // Add owners from config
    if (config.owners && Array.isArray(config.owners)) {
      for (const ownerId of config.owners) {
        // Validate owner ID (must be valid Discord snowflake)
        if (typeof ownerId === 'string' && /^\d{17,19}$/.test(ownerId)) {
          try {
            const ownerMember = await guild.members.fetch(ownerId).catch(() => null);
            if (ownerMember) {
              permissionOverwrites.push({
                id: ownerId,
                allow: [
                  PermissionsBitField.Flags.ViewChannel,
                  PermissionsBitField.Flags.SendMessages,
                  PermissionsBitField.Flags.ReadMessageHistory,
                  PermissionsBitField.Flags.ManageMessages,
                  PermissionsBitField.Flags.AttachFiles
                ]
              });
            }
          } catch (err) {
            // Ignore errors adding owners
          }
        }
      }
    }

    // Build channel creation options
    const channelOptions = {
      name: channelName,
      type: ChannelType.GuildText,
      permissionOverwrites: permissionOverwrites,
      reason: `${mode} purchase transaction for ${interaction.user.tag}`
    };

    // Only add parent if category is valid
    if (categoryChannel) {
      channelOptions.parent = categoryChannel;
    }

    // Create the channel
    const channel = await guild.channels.create(channelOptions);

    await sendPaymentMessage(channel, interaction.user, cryptoAddress, ltcAmount, usdPrice, mode);

    // Log purchase activity
    await logPurchase(
      client,
      interaction.user.id,
      interaction.user.tag,
      mode === 'slot' ? 'Bot Slot' : 'License',
      `$${usdPrice.toFixed(2)} (${ltcAmount.toFixed(8)} LTC)`,
      true
    ).catch(() => {});

    return interaction.reply({
      content: `✅ Purchase channel created: <#${channel.id}>`,
      ephemeral: true
    });

  } catch (error) {
    console.error('Error creating purchase channel:', error);
    return interaction.reply({
      content: '❌ An error occurred while creating the purchase channel.',
      ephemeral: true
    });
  }
}

async function sendPaymentMessage(channel, user, address, ltcAmount, usdPrice, mode) {
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=litecoin:${address}?amount=${ltcAmount.toFixed(8)}`;

  const embed = new EmbedBuilder()
    .setTitle(`${mode === 'slot' ? 'Bot Slot' : 'License'} Purchase`)
    .setDescription(`Please send **${ltcAmount.toFixed(8)} LTC** ($${usdPrice.toFixed(2)} USD) to the address below.\n\nAfter payment, please wait for manual verification. You will receive your ${mode === 'slot' ? 'bot slot' : 'license key'} once payment is confirmed.`)
    .addFields(
      { name: 'LTC Address', value: `\`${address}\``, inline: false },
      { name: 'Amount', value: `${ltcAmount.toFixed(8)} LTC`, inline: true },
      { name: 'USD Value', value: `$${usdPrice.toFixed(2)}`, inline: true },
      { name: 'Product', value: mode === 'slot' ? 'Bot Slot' : 'License', inline: true }
    )
    .setColor('#F7931A')
    .setThumbnail(qrCodeUrl)
    .setFooter({ text: 'Payment will be manually verified. Please be patient.' });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`purchaseclose|${channel.id}`)
      .setLabel('Close Channel')
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId(`purchasecopy|${address}|${ltcAmount.toFixed(8)}`)
      .setLabel('Copy Details')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setURL(`https://blockchair.com/litecoin/address/${address}`)
      .setLabel('View on Explorer')
      .setStyle(ButtonStyle.Link)
  );

  await channel.send({
    content: `${user}, here are your payment details:`,
    embeds: [embed],
    components: [row],
    files: [{
      attachment: qrCodeUrl,
      name: 'qrcode.png'
    }]
  });
}

async function handleCopyButton(interaction, params) {
  try {
    const [address, amount] = params.split('|');
    
    if (!address || !amount) {
      return interaction.reply({
        content: '❌ Invalid payment details.',
        ephemeral: true
      });
    }

    return interaction.reply({
      content: `💳 Send exactly ${amount} LTC to:\n\`${address}\``,
      ephemeral: true
    });
  } catch (error) {
    console.error('Error handling copy button:', error);
    return interaction.reply({
      content: '❌ Failed to fetch payment details.',
      ephemeral: true
    });
  }
}

async function handleCloseButton(interaction, channelId) {
  try {
    const channel = interaction.channel;
    
    if (!channel) {
      return interaction.reply({
        content: '❌ Channel not found.',
        ephemeral: true
      });
    }

    // Check if user has permission to close (moderator or channel member)
    const hasPermission = interaction.member?.permissions.has('ManageChannels') || 
                         channel.permissionsFor(interaction.member)?.has('ViewChannel');
    
    if (!hasPermission) {
      return interaction.reply({
        content: '❌ Only channel members or moderators can close this channel.',
        ephemeral: true
      });
    }

    await interaction.deferReply();

    // Get creator info - try multiple methods
    let creator = "Unknown";
    let creatorTag = "Unknown";
    let creatorId = "Unknown";
    try {
      // Method 1: Try to find from channel permissions (user who can view)
      const permissions = channel.permissionOverwrites.cache;
      for (const [id, overwrite] of permissions) {
        if (overwrite.type === 1 && overwrite.allow.has('ViewChannel')) { // Type 1 = member
          try {
            const user = await interaction.client.users.fetch(id);
            if (user && !user.bot) {
              creator = user.username;
              creatorTag = user.tag;
              creatorId = user.id;
              break;
            }
          } catch (err) {
            // Continue searching
          }
        }
      }
      
      // Method 2: Try to find from first message mentions
      if (creator === "Unknown") {
        const messages = await channel.messages.fetch({ limit: 10 });
        for (const [id, msg] of messages) {
          if (msg.mentions.users.size > 0) {
            const mentionedUser = msg.mentions.users.first();
            if (mentionedUser && !mentionedUser.bot) {
              creator = mentionedUser.username;
              creatorTag = mentionedUser.tag;
              creatorId = mentionedUser.id;
              break;
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching creator info:', error);
    }

    // Get channel statistics
    let messageCount = 0;
    let duration = 0;
    let purchaseType = "Unknown";
    try {
      const messages = await channel.messages.fetch({ limit: 100 });
      messageCount = messages.size;
      
      // Find purchase type from channel name or first message
      if (channel.name.includes('slot')) {
        purchaseType = "Bot Slot";
      } else if (channel.name.includes('license')) {
        purchaseType = "License";
      }
      
      // Calculate duration
      if (messages.size > 0) {
        const firstMessage = messages.last();
        if (firstMessage) {
          duration = Math.floor((Date.now() - firstMessage.createdTimestamp) / 1000);
        }
      }
    } catch (error) {
      console.error('Error fetching channel stats:', error);
    }

    // Format duration
    const durationFormatted = duration > 0 
      ? `${Math.floor(duration / 3600)}h ${Math.floor((duration % 3600) / 60)}m ${duration % 60}s`
      : "N/A";

    // Generate transcript with better options
    try {
      const transcript = await createTranscript(channel, {
        limit: -1,
        fileName: `purchase-${channel.name}-${Date.now()}.html`,
        returnBuffer: false,
        saveImages: true,
        poweredBy: false,
        footerText: `Purchase channel closed by ${interaction.user.tag} | ${new Date().toLocaleString()}`,
        hydrate: true
      });

      // Create enhanced transcript embed
      const transcriptEmbed = new EmbedBuilder()
        .setColor(0xF7931A)
        .setTitle('💳 Purchase Channel Transcript')
        .setDescription(`**\`${channel.name}\`** has been closed and archived`)
        .addFields(
          { name: '👤 Creator', value: `${creatorTag} (${creatorId})`, inline: true },
          { name: '🔒 Closed by', value: `${interaction.user.tag} (${interaction.user.id})`, inline: true },
          { name: '🛒 Purchase Type', value: purchaseType, inline: true },
          { 
            name: '📊 Statistics', 
            value: `**Messages:** ${messageCount}\n**Duration:** ${durationFormatted}`,
            inline: true 
          },
          { 
            name: '⏰ Timestamps', 
            value: `**Created:** <t:${Math.floor(channel.createdTimestamp / 1000)}:F>\n**Closed:** <t:${Math.floor(Date.now() / 1000)}:F>`,
            inline: true 
          },
          {
            name: '📎 Channel Info',
            value: `**ID:** \`${channel.id}\`\n**Type:** Text Channel`,
            inline: true
          }
        )
        .setFooter({ 
          text: `Transcript generated at ${new Date().toLocaleString()}`,
          iconURL: interaction.user.displayAvatarURL()
        })
        .setTimestamp();

      // Save transcript to temp directory
      const tempDir = path.join(__dirname, '../../../temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const transcriptPath = path.join(tempDir, transcript.name);
      fs.writeFileSync(transcriptPath, transcript.attachment);

      // Send transcript to transcripts channel
      if (config.transcripts) {
        const transcriptsChannel = await interaction.client.channels.fetch(config.transcripts).catch(() => null);
        if (transcriptsChannel) {
          await transcriptsChannel.send({
            embeds: [transcriptEmbed],
            files: [new AttachmentBuilder(transcriptPath)]
          });
        }
      }

      // Clean up temp file
      setTimeout(() => {
        try {
          if (fs.existsSync(transcriptPath)) {
            fs.unlinkSync(transcriptPath);
          }
        } catch (err) {
          console.error('Error deleting temp transcript file:', err);
        }
      }, 5000);

    } catch (transcriptError) {
      console.error('Error generating transcript:', transcriptError);
      // Continue with closing even if transcript fails
    }

    // Send closing message
    await channel.send({
      embeds: [
        new EmbedBuilder()
          .setTitle('Channel Closed')
          .setDescription(`This purchase channel was closed by ${interaction.user}`)
          .setColor('#FF0000')
      ]
    }).catch(() => {
      // Ignore if we can't send message
    });
    
    // Delete the channel after a short delay
    setTimeout(async () => {
      try {
        await channel.delete();
      } catch (deleteError) {
        console.error('Error deleting channel:', deleteError);
      }
    }, 2000);
    
    return interaction.editReply({
      content: '✅ Channel closed successfully. Transcript has been saved.',
    });

  } catch (error) {
    console.error('Error closing channel:', error);
    return interaction.reply({
      content: '❌ Failed to close channel.',
      ephemeral: true
    });
  }
}

module.exports = {
  purchasethread,
  handleCopyButton,
  handleCloseButton
};
