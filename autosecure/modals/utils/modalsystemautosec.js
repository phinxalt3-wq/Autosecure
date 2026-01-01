const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const blacklistedmsg = require('../../../autosecure/utils/bot/blacklistedmsg');
const validID = require('../../../autosecure/utils/utils/validID');
const { queryParams } = require("../../../db/database")

module.exports = {
    name: "modalsystem",
    editblacklist: true,
    callback: async (client, interaction) => {
        await interaction.deferUpdate();
        
        const [_, db, currentPage, action, botnumber, ownerid] = interaction.customId.split('|');
        const entry = interaction.fields.getTextInputValue('entry_input');
        const userid = ownerid

        try {
            if (action === 'add') {
                const exists = await queryParams(
                    `SELECT 1 FROM ${db} WHERE client_id = ? AND botnumber = ? AND ${db === 'blacklisted' ? 'user_id = ?' : 'email = ?'}`,
                    [userid, botnumber, entry]
                );

                if (exists.length > 0) {
                    return interaction.editReply({
                        content: `This ${db === 'blacklisted' ? 'user ID' : 'email'} is already in your blacklist!`,
                        ephemeral: true
                    });
                }

                if (db === 'blacklisted') {
                    if (!await validID(entry)) {
                        return interaction.editReply({ 
                            content: 'Invalid ID.', 
                            ephemeral: true 
                        });
                    }
                    
                    await queryParams(
                        `INSERT INTO ${db} (client_id, user_id, botnumber) VALUES (?, ?, ?)`,
                        [userid, entry, botnumber]
                    );
                } else if (db === 'blacklistedemails') {
                    if (!entry.includes('@') || !entry.includes('.')) {
                        return interaction.editReply({ 
                            content: 'Invalid email format. Please provide a valid email address.', 
                            ephemeral: true 
                        });
                    }
                    
                    await queryParams(
                        `INSERT INTO ${db} (client_id, email, botnumber) VALUES (?, ?, ?)`,
                        [userid, entry, botnumber]
                    );
                }

                const countResult = await queryParams(
                    `SELECT COUNT(*) as count FROM ${db} WHERE client_id = ? AND botnumber = ?`,
                    [userid, botnumber]
                );
                const totalItems = countResult[0].count;
                
                const newPage = Math.ceil(totalItems / 10);
                const msg = await blacklistedmsg(botnumber, client, userid, db, newPage);
                msg.content = null;
                return interaction.editReply(msg);
            } 
            else if (action === 'remove') {
                if (db === 'blacklisted') {
                    const result = await queryParams(
                        `DELETE FROM ${db} WHERE client_id = ? AND botnumber = ? AND user_id = ?`,
                        [userid, botnumber, entry]
                    );
                    
                    if (result.affectedRows === 0) {
                        return interaction.editReply({
                            content: 'This user ID was not found in your blacklist!',
                            ephemeral: true
                        });
                    }
                } else if (db === 'blacklistedemails') {
                    const result = await queryParams(
                        `DELETE FROM ${db} WHERE client_id = ? AND botnumber = ? AND email = ?`,
                        [userid, botnumber, entry]
                    );
                    
                    if (result.affectedRows === 0) {
                        return interaction.editReply({
                            content: 'This email is not in your blacklist!',
                            ephemeral: true
                        });
                    }
                }

                const countResult = await queryParams(
                    `SELECT COUNT(*) as count FROM ${db} WHERE client_id = ? AND botnumber = ?`,
                    [userid, botnumber]
                );
                const totalItems = countResult[0].count;
                const itemsPerPage = 10;
                const maxPage = Math.ceil(totalItems / itemsPerPage);
                
                const adjustedPage = parseInt(currentPage) > maxPage ? maxPage : parseInt(currentPage);
                const msg = await blacklistedmsg(botnumber, client, userid, db, adjustedPage || 1); 
                msg.content = null;
                return interaction.editReply(msg);
            }
        } catch (error) {
            console.error(error);
            
            let errorMessage = 'An unknown error occurred.';
            
            await interaction.editReply({ 
                content: errorMessage, 
                ephemeral: true 
            });
        }
    }
};