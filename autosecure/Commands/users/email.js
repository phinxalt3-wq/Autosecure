const { EmbedBuilder, ApplicationCommandOptionType } = require('discord.js');
const { queryParams } = require('../../../db/database');
const validEmail = require('../../../autosecure/utils/emails/validEmail');
const config = require("../../../config.json");
const emailMsg = require("../../../autosecure/utils/emails/emailMsg");
const isOwner = require("../../../db/isOwner");

module.exports = {
    name: "mail",
    mail: true,
    description: "Open, register or see email(s)",
    options: [
        {
            name: "inbox",
            description: "Open a specific inbox or list all emails",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "email",
                    description: "The email inbox to open",
                    type: ApplicationCommandOptionType.String,
                    required: true
                }
            ]
        },
        {
            name: "register",
            description: "Create your own email on my domain",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "email",
                    description: "Type in an email with my domain to be registered",
                    type: ApplicationCommandOptionType.String,
                    required: true
                }
            ]
        },
        {
            name: "list",
            description: "List all your registered and notification emails",
            type: ApplicationCommandOptionType.Subcommand
        }
    ],
    callback: async (client, interaction) => {
        try {
            const subcommand = interaction.options.getSubcommand();
            const userId = interaction.user.id;
            const userIsOwner = await isOwner(userId);

            if (subcommand === "inbox") {
                const email = interaction.options.getString("email");
                
                if (!validEmail(email)) {
                    return interaction.reply({
                        embeds: [{
                            title: `Error :x:`,
                            description: `Invalid Email.`,
                            color: 0xff0000
                        }],
                        ephemeral: true
                    });
                }

                let settings = await queryParams(`SELECT * FROM autosecure WHERE user_id=?`, [userId]);
                settings = settings[0]; // Access the first element of the array

                let secureconfig = await queryParams(`SELECT * from secureconfig WHERE user_id=?`, [userId])
                secureconfig = secureconfig[0]

                const domain = email.split("@")[1];

                if (
                    domain === "outlook.com" ||
                    domain === "gmail.com" ||
                    domain === "yahoo.com" ||
                    domain === "hotmail.com" ||
                    domain === "icloud.com"
                ) {
                    return interaction.reply({
                        embeds: [{
                            title: `Error :x:`,
                            description: `This is meant for security email that for example end in: ${config.domains[0]}. You likely entered the primary email. Use the security email to receive codes/messages`,
                            color: 0xff0000
                        }],
                        ephemeral: true
                    });
                }

   
                // Check if this email is registered by someone else (unless user is owner)
                if (!userIsOwner) {
                    const registeredEmail = await queryParams('SELECT user_id FROM registeredemails WHERE email = ?', [email]);
                    if (registeredEmail.length > 0 && registeredEmail[0].user_id !== userId) {
                        return interaction.reply({
                            embeds: [{
                                title: `Error :x:`,
                                description: `This email is registered and you cannot access it! Make a ticket incase needed.`,
                                color: 0xff0000
                            }],
                            ephemeral: true
                        });
                    }
                }

                try {
                    const msg = await emailMsg(email, userId, 1);
                    return interaction.reply({
                        embeds: msg.embeds,
                        components: msg.components,
                        ephemeral: true
                    });
                } catch (err) {
                    console.error("Error with emailMsg:", err);
                    return interaction.reply({
                        embeds: [{
                            title: `Error :x:`,
                            description: `Failed to load email inbox.`,
                            color: 0xff0000
                        }],
                        ephemeral: true
                    });
                }
            } else if (subcommand === "register") {
    const email = interaction.options.getString("email");
    const domain = email.split("@")[1];

    if (!validEmail(email)) {
        return interaction.reply({
            embeds: [{
                title: `Error :x:`,
                description: `Please try again with a valid email!`,
                color: 0xff0000
            }],
            ephemeral: true
        });
    }

    const existingEmail = await queryParams('SELECT * FROM registeredemails WHERE email = ?', [email]);
    if (existingEmail.length > 0) {
        return interaction.reply({
            embeds: [{
                title: `Error :x:`,
                description: `This email is already registered!`,
                color: 0xff0000
            }],
            ephemeral: true
        });
    }

    const secureconfig = await queryParams("SELECT * FROM secureconfig WHERE user_id = ?", [userId]);
    const autosecureList = await queryParams("SELECT * FROM autosecure WHERE user_id = ?", [userId]);

    if (!secureconfig || secureconfig.length === 0) {
        return interaction.reply({
            embeds: [{
                title: `Error :x:`,
                description: `Unexpected error occurred!`,
                color: 0xff0000
            }],
            ephemeral: true
        });
    }

    let isValidDomain = false;
    const secureDomain = secureconfig[0].domain;

    if (config.domains.includes(domain) || domain === secureDomain) {
        isValidDomain = true;
    }

    if (!isValidDomain && autosecureList.length > 0) {
        for (const record of autosecureList) {
            if (record.domain && domain === record.domain) {
                isValidDomain = true;
                break;
            }
        }
    }

    if (!userIsOwner && !isValidDomain) {
        return interaction.reply({
            embeds: [{
                title: `Error :x:`,
                description: `You can only register emails on any of your own domain(s) set in Bot or Secure settings (or mine)!`,
                color: 0xff0000
            }],
            ephemeral: true
        });
    }

    await queryParams('INSERT INTO registeredemails (user_id, email) VALUES (?, ?)', [userId, email]);
    return interaction.reply({
        embeds: [{
            title: `Success`,
            description: `Your email ${email} has been successfully registered!`,
            color: 0x00ff00
        }],
        ephemeral: true
    });
}

else if (subcommand === "list") {
                await listUserEmails(client, interaction, userId);
            }
        } catch (error) {
            console.error('Error processing mail command:', error);
            await interaction.reply({
                embeds: [{
                    title: `Error :x:`,
                    description: 'There was an error processing your request. Please try again.',
                    color: 0xff0000
                }],
                ephemeral: true,
            });
        }
    }
};

async function listUserEmails(client, interaction, userId) {
    try {
        const userIsOwner = await isOwner(userId);
        let rows, registeredRows;
        
        if (userIsOwner) {
            rows = await queryParams('SELECT email FROM email_notifier');
            registeredRows = await queryParams('SELECT email FROM registeredemails');
        } else {
            rows = await queryParams('SELECT email FROM email_notifier WHERE user_id = ?', [userId]);
            registeredRows = await queryParams('SELECT email FROM registeredemails WHERE user_id = ?', [userId]);
        }
        
        const allEmails = [...rows, ...registeredRows];
        
        if (allEmails.length === 0) {
            return interaction.reply({
                embeds: [{
                    title: `No Emails Found`,
                    description: userIsOwner ? 'There are no registered emails in the system.' : 'You do not have any registered emails.',
                    color: 0xff0000
                }],
                ephemeral: true,
            });
        }
        
        const emailList = allEmails.map((row, index) => `* (${index + 1}) ${row.email}`).join('\n');
        
        const embed = new EmbedBuilder()
            .setTitle(userIsOwner ? 'All Registered Emails' : 'Your Registered Emails')
            .setDescription(`${allEmails.length} email(s):\n${emailList}`)
            .setColor('#c6d2dd');
            
        return interaction.reply({
            embeds: [embed],
            ephemeral: true,
        });
    } catch (error) {
        console.error('Error fetching emails:', error);
        return interaction.reply({
            embeds: [{
                title: `Error :x:`,
                description: 'There was an error fetching emails.',
                color: 0xff0000
            }],
            ephemeral: true,
        });
    }
}