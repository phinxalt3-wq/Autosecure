const { EmbedBuilder } = require('discord.js');
const { queryParams } = require('../../../db/database');

module.exports = {
  name: 'hideleaderboard',
  callback: async (client, interaction) => {
    const user_id = interaction.user.id;

    await interaction.deferReply({ ephemeral: true });

    let row = await queryParams(
      `SELECT showleaderboard FROM settings WHERE user_id = ?`,
      [user_id]
    );

    let current = row?.[0]?.showleaderboard;

    if (current === undefined) {
      await queryParams(
        `INSERT INTO settings (user_id, showleaderboard) VALUES (?, 1)`,
        [user_id]
      );
      current = 1;
    }

    current = Number(current);
    const newValue = current === 1 ? 0 : 1;

    await queryParams(
      `UPDATE settings SET showleaderboard = ? WHERE user_id = ?`,
      [newValue, user_id]
    );

    const lbshown = newValue === 1
      ? "Set to: Shown \nYou won't be hidden on leaderboard anymore!"
      : "Set to: Hidden \nYou'll now be shown as Hidden User! (The next time the leaderboard refreshes)";

    const embed = new EmbedBuilder()
      .setColor(0xADD8E6)
      .setTitle('✅ Leaderboard visibility updated')
      .setDescription(lbshown);

    await interaction.editReply({ embeds: [embed] });
  }
};
