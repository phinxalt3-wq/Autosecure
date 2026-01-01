const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { 
    getUserBotNumbers, 
    saveBotConfig, 
    saveFullConfig, 
    importBotConfig, 
    clearBotConfig, 
    clearFullConfig,
    importConfig
} = require('../../../autosecure/utils/bot/configutils');
const showbotmsg = require('../../../autosecure/utils/bot/showbotmsg');
const { autosecureMap } = require("../../handlers/botHandler")

module.exports = {
    name: 'config',
    userOnly: true,
    description: 'Manage your bot config',
    options: [
        {
            name: 'action',
            description: 'Select what you want to do',
            type: 3, 
            required: true,
            choices: [
                { name: 'Show config', value: 'show' },
                { name: 'Load config', value: 'load' }
            ]
        },
        {
            name: 'mode',
            description: 'config mode (for show/load actions)',
            type: 3,
            required: false,
            choices: [
                { name: 'Full Config', value: 'full' },
                { name: 'Bot Config', value: 'bot' }
            ]
        },
        {
            name: 'botnumber',
            description: 'Bot number (for bot mode)',
            type: 4, 
            required: false,
            autocomplete: true
        },
        {
            name: 'file',
            description: 'Config file to load (for load action)',
            type: 11, 
            required: false
        }
    ],

    autocomplete: async (client, interaction) => {
        const focusedValue = interaction.options.getFocused();
        const choices = [];
        
        if (interaction.options.getString('action') === 'show' || 
            interaction.options.getString('action') === 'load') {
            const user_id = interaction.user.id;
            const botNumbers = await getUserBotNumbers(user_id);
        //    console.log(`numbers: ${botNumbers}`)


            for (const botNumber of botNumbers) {
                const result = autosecureMap.get(`${user_id}|${botNumber}`)
                const botStatus = result ? `(${result.user.tag})` : "(Offline/Open Slot)"
                choices.push({
                    name: `Bot ${botNumber} ${botStatus}`,
                    value: botNumber
                });
            }
        }
        
        const filtered = choices.filter(choice => 
            choice.name.toLowerCase().includes(focusedValue.toLowerCase()) ||
            choice.value.toString().includes(focusedValue)
        );
        
        await interaction.respond(filtered.slice(0, 25));
    },

    execute: async (client, interaction) => {
        await interaction.deferReply({ ephemeral: true });
        
        const action = interaction.options.getString('action');
        const mode = interaction.options.getString('mode');
        const botNumber = interaction.options.getInteger('botnumber');
        const file = interaction.options.getAttachment('file');
        const user_id = interaction.user.id;

        try {
            switch (action) {
                case 'show':
                    await handleShowConfig(client, interaction, user_id, mode, botNumber);
                    break;
                case 'load':
                    await handleLoadConfig(client, interaction, user_id, mode, botNumber, file);
                    break;
                default:
                    throw new Error('Invalid action selected');
            }
        } catch (error) {
         //   console.error(`Config command error: ${error}`);
            await interaction.editReply({
                content: `Error: ${error.message}`,
                ephemeral: true
            });
        }
    }
};

async function handleShowConfig(client, interaction, user_id, mode, botNumber) {
    if (!mode) throw new Error('Please select a config mode (full or bot)');
    
    let config, fileName, title;
    
    if (mode === 'full') {
        config = await saveFullConfig(user_id);
        fileName = 'full_config.json';
        title = 'Full config';
    } else if (mode === 'bot') {
        if (!botNumber) throw new Error('Please specify a bot number for bot mode');
        
        config = await saveBotConfig(user_id, botNumber);
        fileName = `bot${botNumber}_config.json`;
        title = `Bot ${botNumber} config`;
    } else {
        throw new Error('Invalid mode selected');
    }

    const configBuffer = Buffer.from(JSON.stringify(config, null, 2));
    const attachment = new AttachmentBuilder(configBuffer, { name: fileName });

    const embed = new EmbedBuilder()
        .setColor(0xADD8E6)
        .setTitle(`Here's your config in the attachment: \`${fileName}\`.`);

    await interaction.editReply({ 
        embeds: [embed], 
        files: [attachment],
        ephemeral: false
    });
}

async function handleLoadConfig(client, interaction, user_id, mode, botNumber, file) {
    if (!mode) throw new Error('Please select a config mode (full or bot)');
    if (!file?.url) throw new Error('Please attach a config file');

    try {
        const response = await fetch(file.url);
        if (!response.ok) throw new Error('Failed to download file');
        
        const configData = await response.json();
        
        if (mode === 'full') {
            await clearFullConfig(user_id);
            await importConfig(configData, user_id);
            const embed = new EmbedBuilder()
                .setColor(0xADD8E6)
                .setTitle(`Loaded config \`${file.name}\`.\nPlease do /bots to restart your bots.`);
            await interaction.editReply({ embeds: [embed] });
        } else if (mode === 'bot') {
            if (!botNumber) throw new Error('Please specify a bot number for bot mode');
            
            await clearBotConfig(user_id, botNumber);
            let d = await importBotConfig(configData, user_id, botNumber);
            
            const embed = new EmbedBuilder()
                .setColor(0xADD8E6)
                .setTitle(`Loaded bot \`${botNumber}\`.\nIf it's not started yet, please restart it using /bots.`)
                .addFields(
                    { name: 'User', value: interaction.user.tag, inline: true },
                    { name: 'Bot Number', value: botNumber.toString(), inline: true },
                    { name: 'Started', value: d ? "Yes" : "No (Restart on /bots)", inline: true }
                );
            let msg2 = await showbotmsg(interaction.user.id, botNumber, interaction.user.id, client);
           // console.log(JSON.stringify(msg2));
            await interaction.editReply({ embeds: [embed] });
            await interaction.followUp(msg2);
        }
    } catch (error) {
        console.error('Config load error:', error);
        throw new Error('Failed to load config. Please check the file format.');
    }
}


// Useless

async function handleListBots(client, interaction, user_id) {
    const botNumbers = await getUserBotNumbers(user_id);
    
    const embed = new EmbedBuilder()
        .setColor(0xADD8E6)
        .setTitle('Your Bot Numbers')
        .addFields(
            { name: 'Total Slots', value: botNumbers.length.toString(), inline: true }
        );

    await interaction.editReply({ embeds: [embed] });
}
