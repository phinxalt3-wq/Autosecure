const { EmbedBuilder } = require("discord.js");
const modalBuilder = require("../../utils/modalBuilder");

module.exports = {
    name: "placeholder",
    callback: async (client, interaction) => {
        await interaction.deferReply({ ephemeral: true }); 
        
        let type = interaction.customId.split("|")[1];
        let embed = null
        if (type.startsWith("dm")) {
            embed = new EmbedBuilder()
                .setTitle("Placeholders")
                .setColor(8092543)
                .setDescription("(guildname) - Interaction Guild Server \n(verifymsg) Your set verify msg in /responses (default: verify)");
            await interaction.editReply({ embeds: [embed] });
            return;
        }


        
        if (type === "listaccount" || type === "statsmsg") {
            embed = new EmbedBuilder()
                .setTitle("Placeholders")
                .setColor(8092543)
                .addFields(
                {
                    name: "User Information",
                    value: "```\n%USER%\n%USERID%\n%OLDNAME%\n%NEWNAME%\n%HIDDENUSERNAME%\n```",
                    inline: true
                },
                {
                    name: "Email & Authentication",
                    value: "```\n%EMAIL%\n%OLDEMAIL%\n%HIDDENEMAIL%\n%SECURITY%\n%SECRETKEY%\n%RECOVERY%\n%PASSWORD%\n```",
                    inline: true
                },
                {
                    name: "Account Details",
                    value: "```\n%UID%\n%OWNSMC%\n%CAPES%\n%TIMETAKEN%\n%BAN%\n```",
                    inline: true
                },
                {
                    name: "Lunar Client",
                    value: "```\n%LUNARCOSMETICS%\n%LUNAREMOTES%\n%LUNARPLUSCOSMETICS%\n%LUNAREQUIPPEDCOSMETICS%\n%LUNAREQUIPPEDEMOTES%\n%LUNARRANK%\n```",
                    inline: true
                },
                {
                    name: "General Stats",
                    value: "```\n%RANK%\n%NWL%\n%GIFTED%\n%STATUS%\n%GAME%\n%PLUSCOLOR%\n```",
                    inline: true
                },
                {
                    name: "Skyblock Stats",
                    value: "```\n%NETWORTHTOTAL%\n%NETWORTHSOULBOUND%\n%NETWORTHUNSOULBOUND%\n%LIQUID%\n%SA%\n%SBLVL%\n%COOPSTATUS%\n%MINIONS%\n%UNIQUEMINIONS%\n```",
                    inline: true
                },
                {
                    name: "Skyblock Skills",
                    value: "```\n%MINING%\n%TAMING%\n%FORAGING%\n%FARMING%\n%COMBAT%\n%ALCHEMY%\n%ENCHANTING%\n%FISHING%\n%CARPENTRY%\n%RUNECRAFTING%\n%SOCIAL%\n```",
                    inline: true
                },
                {
                    name: "Dungeons & Slayers",
                    value: "```\n%DUNGEON%\n%ZOMBIE%\n%SVEN%\n%SPIDER%\n%ENDERMAN%\n%BLAZE%\n%VAMPIRE%\n```",
                    inline: true
                },
                {
                    name: "Mining",
                    value: "```\n%HOTMLEVEL%\n%MITHRIL%\n%GEMSTONE%\n%GLACITE%\n```",
                    inline: true
                },
                {
                    name: "Bedwars Stats",
                    value: "```\n%BEDWARSTARS%\n%BEDWARCOINS%\n%BEDWARKILLS%\n%BEDWARFINALKILLS%\n%BEDWARFINALDEATHS%\n%BEDWARFKDR%\n%BEDWARWINS%\n%BEDWARLOSSES%\n%BEDWARWLR%\n%BEDWARBROKENBEDS%\n%BEDWARLOSTBEDS%\n%BEDWARBBLR%\n```",
                    inline: true
                },
                {
                    name: "Skywars Stats",
                    value: "```\n%SKYWARLEVELS%\n%SKYWARCOINS%\n%SKYWARASSISTS%\n%SKYWARKILLS%\n%SKYWARDEATHS%\n%SKYWARKDR%\n%SKYWARWINS%\n%SKYWARLOSSES%\n%SKYWARWINRATE%\n```",
                    inline: true
                },
                {
                    name: "Duels Stats",
                    value: "```\n%DUELTITLE%\n%DUELGAMESPLAYED%\n%DUELCOINS%\n%DUELKILLS%\n%DUELDEATHS%\n%DUELKLR%\n%DUELWINS%\n%DUELLOSSES%\n%DUELWINRATE%\n```",
                    inline: true
                }
            );

            await interaction.editReply({ embeds: [embed] });
        }


        if (type === "invalidated") {
            embed = new EmbedBuilder()
            .setTitle("Placeholders")
            .setDescription(`%USERNAME% - Username they entered`)
            await interaction.editReply({ content: `These placeholders only work on this embed right now!`, embeds: [embed] });
        }
    },
};