const config = require("../../config.json");

module.exports = async function checkroles(client) {
 // console.log(`Checking roles!`)
  const currentTime = Date.now();
  const activeLicenses = await client.queryParams(
    "SELECT * FROM usedLicenses WHERE expiry > ?",
    [currentTime.toString()]
  );

  let rolesAssigned = 0;
  let rolesRemoved = 0;
  let ownerRolesAssigned = 0;
  let ownerRolesRemoved = 0;

  let guild;
  try {
    guild = await client.guilds.fetch(config.guildid);
    if (!guild) return;
  } catch {
    return;
  }

  const membersWithRole = await guild.members.fetch().catch(() => new Map());

  for (const [userId, member] of membersWithRole) {
    const hasActiveLicense = activeLicenses.some(license => license.user_id === userId);
    
    if (!hasActiveLicense && member.roles.cache.has(config.roleid)) {
      try {
        await member.roles.remove(config.roleid);
        rolesRemoved++;
      } catch {}
    }

    if (!config.owners.includes(userId) && member.roles.cache.has(config.ownerrole)) {
      try {
        await member.roles.remove(config.ownerrole);
        ownerRolesRemoved++;
      } catch {}
    }
  }

  for (const license of activeLicenses) {
    const userId = license.user_id;

    try {
      const member = await guild.members.fetch(userId);

      if (!member.roles.cache.has(config.roleid)) {
        await member.roles.add(config.roleid);
        rolesAssigned++;
      }
    } catch {}
  }

  for (const ownerId of config.owners) {
    try {
      const member = await guild.members.fetch(ownerId);

      if (!member.roles.cache.has(config.ownerrole)) {
        await member.roles.add(config.ownerrole);
        ownerRolesAssigned++;
      }
    } catch {}
  }

  return {
    rolesAssigned,
    rolesRemoved,
    ownerRolesAssigned,
    ownerRolesRemoved
  };
};
