const { AttachmentBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('../../../config.json');
const { createTranscript } = require('discord-html-transcripts');

module.exports = {
    name: "close",
    callback: async (client, interaction) => {
        try {
            const channel = interaction.channel;
            const parts = interaction.customId.split('|');
            const userId = parts[1];
            const reason = parts[2] || "No reason provided";

            if (!channel) {
                return await interaction.reply({ 
                    content: "❌ Channel not found!", 
                    ephemeral: true 
                });
            }

            await interaction.deferReply();

            // Get creator info
            let creator = "Unknown";
            let creatorTag = "Unknown";
            let creatorId = userId;
            try {
                const user = await client.users.fetch(userId);
                creator = user.username;
                creatorTag = user.tag;
                creatorId = user.id;
            } catch (error) {
                console.error('Error fetching user:', error);
            }

            // Get channel statistics
            let messageCount = 0;
            let duration = 0;
            try {
                const messages = await channel.messages.fetch({ limit: 1 });
                if (messages.size > 0) {
                    // Get all messages to count
                    const allMessages = await channel.messages.fetch({ limit: 100 });
                    messageCount = allMessages.size;
                    
                    // Calculate duration
                    const firstMessage = allMessages.last();
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
            const transcript = await createTranscript(channel, {
                limit: -1,
                fileName: `ticket-${channel.name}-${Date.now()}.html`,
                returnBuffer: false,
                saveImages: true,
                poweredBy: false,
                footerText: `Ticket closed by ${interaction.user.tag} | ${new Date().toLocaleString()}`,
                hydrate: true
            });

            // Create enhanced transcript embed
            const transcriptEmbed = new EmbedBuilder()
                .setColor(0xc8a2c8)
                .setTitle('📋 Ticket Transcript')
                .setDescription(`**\`${channel.name}\`** has been closed and archived`)
                .addFields(
                    { name: '👤 Creator', value: `${creatorTag} (${creatorId})`, inline: true },
                    { name: '🔒 Closed by', value: `${interaction.user.tag} (${interaction.user.id})`, inline: true },
                    { name: '📝 Reason', value: reason.length > 1024 ? reason.substring(0, 1021) + '...' : reason, inline: false },
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
                        value: `**ID:** \`${channel.id}\`\n**Type:** ${channel.type === 0 ? 'Text Channel' : 'Thread'}`,
                        inline: true
                    }
                )
                .setFooter({ 
                    text: `Transcript generated at ${new Date().toLocaleString()}`,
                    iconURL: interaction.user.displayAvatarURL()
                })
                .setTimestamp();


            const tempDir = path.join(__dirname, '../../../temp');
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }

            const transcriptPath = path.join(tempDir, transcript.name);
            fs.writeFileSync(transcriptPath, transcript.attachment);


            if (config.transcripts) {
                const transcriptsChannel = await client.channels.fetch(config.transcripts).catch(() => null);
                if (transcriptsChannel) {
                    await transcriptsChannel.send({
                        embeds: [transcriptEmbed],
                        files: [new AttachmentBuilder(transcriptPath)]
                    });
                }
            }


            await interaction.editReply({
                content: `✅ Successfully closed ticket \`${channel.name}\``
            });


            if (client.tickets && client.tickets.has(userId)) {
                client.tickets.delete(userId);
            }


            setTimeout(() => {
                if (fs.existsSync(transcriptPath)) {
                    fs.unlinkSync(transcriptPath);
                }
            }, 30000);


            await channel.delete().catch(error => {
                console.error('Error deleting channel:', error);
            });
            
        } catch (error) {
            console.error('Close Error:', error);
            await interaction.editReply({ 
                content: "❌ Failed to close the ticket. Please try again or contact support.", 
                ephemeral: true 
            });
        }
    }
};