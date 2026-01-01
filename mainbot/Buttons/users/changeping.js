
const editclaimmsg = require("../../../autosecure/utils/responses/editclaimmsg");
const { queryParams } = require("../../../db/database");

module.exports = {
    name: "changeping",
    editclaiming: true,
    callback: async (client, interaction) => {
        await interaction.deferUpdate();
        const [t, botnumber, ownerid] = interaction.customId.split("|");

        const check = await queryParams(
            `SELECT * FROM autosecure WHERE user_id = ? AND botnumber = ? LIMIT 1`,
            [ownerid, botnumber]
        );

        if (!check.length) return;

        const current = check[0].ping || "None";
        const order = ["@here", "@everyone", "None"];

        const nextIndex = (order.indexOf(current) + 1) % order.length;
        const nextPing = order[nextIndex];

        await queryParams(
            `UPDATE autosecure SET ping = ? WHERE user_id = ? AND botnumber = ?`,
            [nextPing, ownerid, botnumber]
        );

        const msg = await editclaimmsg(botnumber, ownerid);
        interaction.editReply(msg);
    }
};
