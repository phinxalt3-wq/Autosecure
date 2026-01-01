const countries = require('i18n-iso-countries');
const listSettings = require("../../../autosecure/utils/settings/listSettings.js");
const listConfiguration = require('../../../autosecure/utils/settings/listConfiguration.js');
const { getCountryCode2 } = require('../../../autosecure/utils/process/helpers.js');

module.exports = {
    name: "changedob",
    userOnly: true,
    callback: async (client, interaction) => {
        try {
            const day = interaction.fields.getTextInputValue('day');
            const month = interaction.fields.getTextInputValue('month');
            const year = interaction.fields.getTextInputValue('year');
            const countryInput = interaction.fields.getTextInputValue('country');
            const splitId = interaction.customId.split('|');
            const isSecureConfig = splitId[1] === "true";
            const table = isSecureConfig ? 'secureconfig' : 'autosecure';

            let msg = isSecureConfig 
                ? await listConfiguration(interaction.user.id)
                : await listSettings(client, interaction.user.id, true);

            if (!day || !month || !year || !countryInput) {
                await client.queryParams(
                    `UPDATE ${table} SET dob = NULL WHERE user_id = ?`,
                    [interaction.user.id]
                );
                msg.content = "Changed back to default since you didn't set a value!";
                return await interaction.update(msg);
            }

            const numericDay = parseInt(day, 10);
            const numericMonth = parseInt(month, 10);
            const numericYear = parseInt(year, 10);

            if (
                isNaN(numericDay) || isNaN(numericMonth) || isNaN(numericYear) ||
                numericMonth < 1 || numericMonth > 12 ||
                numericYear < 1933 || numericYear > 2007
            ) {
                msg.content = "❌ Invalid day, month, or year provided.";
                return await interaction.update(msg);
            }

            const daysInMonth = {
                1: 31,
                2: 28,
                3: 31,
                4: 30,
                5: 31,
                6: 30,
                7: 31,
                8: 31,
                9: 30,
                10: 31,
                11: 30,
                12: 31
            };

            if (numericDay < 1 || numericDay > daysInMonth[numericMonth]) {
                msg.content = `❌ Invalid day for the selected month.`;
                return await interaction.update(msg);
            }
            
            console.log(`Checking ISO from changedobmodal: ${countryInput}`)
            let isoCountry = getCountryCode2(countryInput)
            console.log(`isoCountry: ${isoCountry}`)
            if (!isoCountry) {
                msg.content = "❌ Invalid country name or code.";
                return await interaction.update(msg);
            }

            const dob = `${numericDay}|${numericMonth}|${numericYear}|${isoCountry}`;

            await client.queryParams(
                `UPDATE ${table} SET dob = ? WHERE user_id = ?`,
                [dob, interaction.user.id]
            );

            const updatedMsg = isSecureConfig 
                ? await listConfiguration(interaction.user.id) 
                : await listSettings(client, interaction.user.id, true);

            updatedMsg.content = null;
            await interaction.update(updatedMsg);

        } catch (error) {
            console.log(`e: ${error}`)
            if (!interaction.replied && !interaction.deferred) {
                const splitId = interaction.customId.split('|');
                const isSecureConfig = splitId[2] === "true";

                const msg = isSecureConfig 
                    ? await listConfiguration(interaction.user.id) 
                    : await listSettings(client, interaction.user.id, true);

                msg.content = "An error occurred while processing your DOB change.";
                await interaction.update(msg);
            }
        }
    }
};
