const { editbotmsg } = require("../../utils/responses/editbotmessage");
const { queryParams } = require("../../../db/database");
const { autosecureMap } = require("../../../mainbot/handlers/botHandler");
const { EmbedBuilder } = require("discord.js");

module.exports = {
    name: "botstatus_modal",
    editbot: true,
    callback: async (client, interaction) => {
        try {
            await interaction.deferUpdate();

            let activityType = interaction.fields.getTextInputValue('activity_type');
            let activityText = interaction.fields.getTextInputValue('activity_text');
            const activityvisibility = interaction.fields.getTextInputValue("activity_visibility");

            // Clean up inputs
            if (!activityType || activityType.trim() === '') activityType = null;
            if (!activityText || activityText.trim() === '') activityText = null;
            
            // Validate required field
            if (!activityvisibility || activityvisibility.trim() === '') {
                const errorEmbed = new EmbedBuilder()
                    .setColor(16711710)
                    .setTitle('Visibility is required! Please enter: Online, Idle, Dnd, or Invisible');
                return interaction.followUp({ 
                    embeds: [errorEmbed], 
                    ephemeral: true 
                });
            }

            if (activityType !== null) {
                const validActivities = ['playing', 'streaming', 'listening', 'watching', 'competing'];
                const lowerType = activityType.toLowerCase();

                if (!validActivities.some(activity => lowerType.includes(activity))) {
                    const errorEmbed = new EmbedBuilder()
                        .setColor(16711710)
                        .setTitle('Please enter a valid activity type: Playing, Streaming, Listening, Watching, Competing');
                    return interaction.followUp({
                        embeds: [errorEmbed],
                        ephemeral: true
                    });
                }
            }

            if (!["online", "dnd", "idle", "invisible"].includes(activityvisibility.toLowerCase())) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(16711710)
                    .setTitle('Invalid visibility! Use: Online, Idle, Dnd, Invisible');
                return interaction.followUp({ 
                    embeds: [errorEmbed], 
                    ephemeral: true 
                });
            }

            const [_, userId, botnumber] = interaction.customId.split('|');

            const activityData = JSON.stringify({
                type: activityType,
                text: activityText,
                visibility: activityvisibility.toLowerCase()
            });

            await queryParams(
                'UPDATE autosecure SET activity = ? WHERE user_id = ? AND botnumber = ?',
                [activityData, userId, botnumber]
            );

            const key = `${userId}|${botnumber}`;
            const c = autosecureMap.get(key);

            if (c) {
                try {
                    let activityTypeNum = 0;
                    if (activityType !== null) {
                        const lowerType = activityType.toLowerCase();
                        if (lowerType.includes('playing')) activityTypeNum = 0;
                        else if (lowerType.includes('streaming')) activityTypeNum = 1;
                        else if (lowerType.includes('listening')) activityTypeNum = 2;
                        else if (lowerType.includes('watching')) activityTypeNum = 3;
                        else if (lowerType.includes('competing')) activityTypeNum = 5;
                    }

                    await c.user.setActivity(activityText || '', { type: activityTypeNum });
                    await c.user.setStatus(activityvisibility.toLowerCase());

                    let msg = await editbotmsg(client, interaction, botnumber, userId);
                    return interaction.editReply(msg);
                } catch (err) {
                    console.error("Error setting bot presence:", err);
                    const errorEmbed = new EmbedBuilder()
                        .setColor(16711710)
                        .setTitle('Error updating bot status!');
                    return interaction.followUp({ 
                        embeds: [errorEmbed], 
                        ephemeral: true 
                    });
                }
            } else {
                const successEmbed = new EmbedBuilder()
                    .setColor(65280)
                    .setTitle('Status saved! It will apply when the bot comes online.');
                return interaction.followUp({
                    embeds: [successEmbed],
                    ephemeral: true
                });
            }
        } catch (error) {
            console.error("Error in botstatus modal:", error);
            const errorEmbed = new EmbedBuilder()
                .setColor(16711710)
                .setTitle('An error occurred while updating bot status.');
            await interaction.followUp({
                embeds: [errorEmbed],
                ephemeral: true
            });
        }
    }
};
