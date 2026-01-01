const { TextInputStyle } = require("discord.js");
const { queryParams } = require("../../../db/database");
const modalBuilder = require("../../utils/modalBuilder");
const generate = require("../../utils/generate");

const dm = {
    name: "dm",
    usedmbuttons: true,
    callback: async (client, interaction) => {
        const userid = interaction.customId.split("|").slice(1).join("|");
        const rId = generate(32);

        await client.queryParams('INSERT INTO actions (id, action) VALUES (?, ?)', [rId, `senddm|${userid}`]);

        let presetNamesList = '';
        try {
            const results = await client.queryParams(
                'SELECT name FROM presets WHERE user_id = ? AND botnumber = ?',
                [client.username, client.botnumber]
            );

            if (results.length > 0) {
                presetNamesList = results
                    .map((preset, index) => `${index + 1}. ${preset.name}`)
                    .join('\n');

                if (presetNamesList.length > 3800) {
                    let cutoff = '';
                    for (const line of presetNamesList.split('\n')) {
                        if ((cutoff + line + '\n').length > 3800) break;
                        cutoff += line + '\n';
                    }
                    presetNamesList = cutoff.trim() + '\n...and more';
                }
            } else {
                presetNamesList = 'No presets found. Use /preset create';
            }
        } catch (e) {
            console.error('Error fetching presets:', e);
            presetNamesList = 'Error fetching presets';
        }

        try {
            await interaction.showModal(
                modalBuilder(`action|${rId}`, 'Enter the message to send', [
                    {
                        setCustomId: 'msg',
                        setMaxLength: 200,
                        setMinLength: 1,
                        setRequired: false,
                        setLabel: 'Enter message',
                        setPlaceholder: 'Ex: Please enter the code within 15 minutes!',
                        setStyle: TextInputStyle.Paragraph
                    },
                    {
                        setCustomId: 'preset',
                        setMaxLength: 100,
                        setMinLength: 1,
                        setRequired: false,
                        setLabel: 'Preset Name',
                        setPlaceholder: 'Make a preset using /bots > Edit Presets',
                        setStyle: TextInputStyle.Short
                    },
                    {
                        setCustomId: 'presetlist',
                        setMaxLength: 4000,
                        setMinLength: 1,
                        setRequired: false,
                        setLabel: 'Available Presets',
                        setValue: presetNamesList,
                        setStyle: TextInputStyle.Paragraph
                    }
                ])
            );
        } catch (e) {
            console.error('Error displaying modal:', e);
        }
    }
};

module.exports = dm;
