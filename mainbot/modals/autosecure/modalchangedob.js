const countries = require("i18n-iso-countries");
countries.registerLocale(require("i18n-iso-countries/langs/en.json"));
const { queryParams } = require("../../../db/database");
const editautosecuremsg = require('../../../autosecure/utils/embeds/editautosecuremsg.js');
const { getCountryCode2 } = require("../../../autosecure/utils/process/helpers.js");

function getCountryCode(input) {
    if (!input) return null;

    input = input.trim();

    if (input.length === 2) {
        const upperInput = input.toUpperCase();
        if (countries.isValid(upperInput)) return upperInput;
    }

    const codeFromName = countries.getAlpha2Code(input, 'en');
    if (codeFromName) return codeFromName;

    const codeFromNameUpper = countries.getAlpha2Code(input.toUpperCase(), 'en');
    if (codeFromNameUpper) return codeFromNameUpper;

    const codeFromNameLower = countries.getAlpha2Code(input.toLowerCase(), 'en');
    if (codeFromNameLower) return codeFromNameLower;

    return null;
}

module.exports = {
    name: "modalchangedob",
    editautosecure: true,
    callback: async (client, interaction) => {
        try {
            const day = interaction.fields.getTextInputValue('day');
            const month = interaction.fields.getTextInputValue('month');
            const year = interaction.fields.getTextInputValue('year');
            const countryInput = interaction.fields.getTextInputValue('country');
            let [t, botnumber, ownerid] = interaction.customId.split("|");

            if (!day || !month || !year || !countryInput) {
                await queryParams(
                    `UPDATE autosecure SET dob = NULL WHERE user_id = ? AND botnumber = ?`,
                    [ownerid, botnumber]
                );
                const msg = await editautosecuremsg(botnumber, ownerid);
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
                const msg = await editautosecuremsg(botnumber, ownerid);
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
                const msg = await editautosecuremsg(botnumber, ownerid);
                msg.content = "❌ Invalid day for the selected month.";
                return await interaction.update(msg);
            }

            const isoCountry = getCountryCode2(countryInput);

            if (!isoCountry) {
                const msg = await editautosecuremsg(botnumber, ownerid);
                msg.content = "❌ Invalid country name or code.";
                return await interaction.update(msg);
            }

            const dob = `${numericDay}|${numericMonth}|${numericYear}|${isoCountry}`;

            await queryParams(
                `UPDATE autosecure SET dob = ? WHERE user_id = ? AND botnumber = ?`,
                [dob, ownerid, botnumber]
            );

            const updatedMsg = await editautosecuremsg(botnumber, ownerid);
            updatedMsg.content = null;
            await interaction.update(updatedMsg);

        } catch (error) {
            console.error("Error in modalchangedob:", error);
            if (!interaction.replied && !interaction.deferred) {
                try {
                    let [t, botnumber, ownerid] = interaction.customId.split("|");
                    const msg = await editautosecuremsg(botnumber, ownerid);
                    msg.content = "An error occurred while processing your DOB change.";
                    await interaction.update(msg);
                } catch (err) {
                    console.error("Error handling error:", err);
                }
            }
        }
    }
};
