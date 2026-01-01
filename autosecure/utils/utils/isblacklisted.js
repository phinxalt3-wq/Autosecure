module.exports = async function isvictimblacklisted(client, interaction, email) {
  // console.log(`got email: ${email}`)
    try {
      const isUserBlacklisted = await client.queryParams(
        `SELECT * FROM blacklisted WHERE client_id = ? AND user_id = ?`,
        [client.username, interaction.user.id]
      );
  
      let isEmailBlacklisted = false;
      if (email) {
        // console.log(`checking email blacklisted!`)
        const emailCheck = await client.queryParams(
          `SELECT * FROM blacklistedemails WHERE client_id = ? AND email = ?`,
          [client.username, email]
        );
        // console.log(emailCheck)
        isEmailBlacklisted = emailCheck.length > 0;
      }

      if (isUserBlacklisted.length > 0 || isEmailBlacklisted) {
        return true;
      }
  
  
      return false;
    } catch (error) {
      console.error('Error checking if victim is blacklisted:', error);
      return false; 
    }
  };
  