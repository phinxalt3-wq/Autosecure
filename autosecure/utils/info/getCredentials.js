const HttpClient = require("../process/HttpClient");

module.exports = async (email, sendotp = true) => {
  let ppft = null;
  let axios = new HttpClient();

  // PPFT extraction
  async function extractPPFT() {
    try {
      const loginPage = await axios.get("https://login.live.com/login.srf", {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        }
      });

      const html = loginPage.data;

      const extractors = [
        () => {
          const match = html.match(/var ServerData = ({.*?});/s);
          if (match) {
            try {
              const serverData = JSON.parse(match[1]);
              const ppftMatch = serverData.sFTTag?.match(/value="([^"]*)"/);
              return ppftMatch?.[1];
            } catch (e) {
              return null;
            }
          }
        },
        () => html.match(/name="PPFT"[^>]*value="([^"]*)"/)?.[1],
        () => html.match(/value="([^"]*)"[^>]*name="PPFT"/)?.[1],
        () => html.match(/<input[^>]*name="PPFT"[^>]*value="([^"]*)"[^>]*>/)?.[1],
        () => html.match(/<input[^>]*value="([^"]*)"[^>]*name="PPFT"[^>]*>/)?.[1]
      ];

      for (const extractor of extractors) {
        try {
          const token = extractor();
          if (token && token.length > 10) {
            return token;
          }
        } catch (e) { 
          continue; 
        }
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  // Trigger OTP delivery using realistic login simulation
  async function sendOTPToRecoveryEmail(email, ppft, recoveryProof) {
    try {
      // Method 1: Force OTP by simulating password failure which triggers alternative auth options
      const loginHeaders = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Referer": "https://login.live.com/login.srf",
        "Origin": "https://login.live.com",
        "Cache-Control": "max-age=0"
      };

      // Step 1: Attempt login with wrong password to trigger security options
      const wrongPasswordPayload = `PPFT=${ppft}&login=${encodeURIComponent(email)}&passwd=invalid_password_trigger_otp&LoginOptions=1&type=11&PPSX=Pa`;

      try {
        const loginResponse = await axios.post(
          "https://login.live.com/ppsecure/post.srf",
          wrongPasswordPayload,
          { 
            headers: loginHeaders,
            maxRedirects: 0,
            validateStatus: (status) => status < 400 || status === 302
          }
        );

        // Check if response indicates OTP options are available
        if (loginResponse.data) {
          const responseText = loginResponse.data;
          
          // Look for OTP/alternative auth indicators
          const otpIndicators = [
            /single.*use.*code/gi,
            /alternative.*way/gi,
            /different.*way/gi,
            /verify.*identity/gi,
            /security.*code/gi,
            /verification.*code/gi,
            /authenticate.*app/gi,
            /text.*message/gi,
            /email.*code/gi
          ];

          const hasOtpOption = otpIndicators.some(pattern => pattern.test(responseText));
          
          if (hasOtpOption) {
            // Step 2: Extract new PPFT from the response for OTP request
            const newPpftMatch = responseText.match(/name="PPFT"[^>]*value="([^"]*)"/);
            const newPpft = newPpftMatch?.[1] || ppft;
            
            // Step 3: Request OTP by choosing alternative authentication
            const otpRequestPayload = `PPFT=${newPpft}&login=${encodeURIComponent(email)}&type=28&PPSX=Pa&purpose=eOTT&otc=1`;
            
            const otpResponse = await axios.post(
              "https://login.live.com/ppsecure/post.srf",
              otpRequestPayload,
              { 
                headers: loginHeaders,
                maxRedirects: 0,
                validateStatus: (status) => status < 400 || status === 302
              }
            );

            if (otpResponse.status === 200 || otpResponse.status === 302) {
              const otpResponseText = otpResponse.data || '';
              
              // Check for OTP sent confirmation
              const sentPatterns = [
                /code.*sent/gi,
                /sent.*code/gi,
                /check.*email/gi,
                /enter.*code/gi,
                /verification.*code/gi
              ];

              const otpSent = sentPatterns.some(pattern => pattern.test(otpResponseText));
              
              if (otpSent || otpResponse.status === 302) {
                return {
                  success: true,
                  method: 'login_simulation',
                  message: 'OTP triggered via simulated failed login',
                  data: { 
                    status: 'sent', 
                    endpoint: 'ppsecure/post.srf',
                    httpStatus: otpResponse.status,
                    hasConfirmation: otpSent
                  }
                };
              }
            }
          }
        }
      } catch (loginError) {
        // Try alternative approach if login simulation fails
      }

      // Method 2: Direct OTC request using the proof data
      try {
        const otcHeaders = {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Content-Type": "application/x-www-form-urlencoded",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Referer": "https://login.live.com/login.srf",
          "Origin": "https://login.live.com"
        };

        // Use the actual proof data to request OTC
        const otcPayload = `PPFT=${ppft}&login=${encodeURIComponent(email)}&type=28&purpose=eOTT&proof=${encodeURIComponent(recoveryProof.data || recoveryProof)}&PPSX=Pa`;

        const otcResponse = await axios.post(
          "https://login.live.com/ppsecure/post.srf",
          otcPayload,
          { headers: otcHeaders }
        );

        if (otcResponse.status === 200) {
          const responseText = otcResponse.data;
          
          const successPatterns = [
            /code.*sent/gi,
            /sent.*verification/gi,
            /check.*email/gi,
            /enter.*code/gi
          ];
          
          const hasSuccess = successPatterns.some(pattern => pattern.test(responseText));
          
          if (hasSuccess) {
            return {
              success: true,
              method: 'direct_otc_request',
              message: 'OTP sent via direct OTC request',
              data: { status: 'sent', endpoint: 'ppsecure/post.srf' }
            };
          }
        }
      } catch (otcError) {
        // Continue to recovery method
      }

      // Method 3: Account recovery as last resort
      try {
        const recoveryPage = await axios.get("https://account.live.com/acsr", {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          }
        });

        const recoveryHtml = recoveryPage.data;
        const recoveryPpftMatch = recoveryHtml.match(/name="PPFT"[^>]*value="([^"]*)"/);
        const recoveryPpft = recoveryPpftMatch?.[1];

        if (recoveryPpft) {
          const recoverySubmit = await axios.post("https://account.live.com/acsr", 
            `PPFT=${recoveryPpft}&usersignup=${encodeURIComponent(email)}&action=submit`,
            {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Content-Type': 'application/x-www-form-urlencoded',
                'Referer': 'https://account.live.com/acsr',
                'Origin': 'https://account.live.com'
              }
            }
          );

          if (recoverySubmit.status === 200) {
            const responseText = recoverySubmit.data;
            
            const successPatterns = [
              /we.*sent.*code/gi,
              /verification.*code/gi,
              /check.*email/gi,
              /security.*code/gi,
              /enter.*code/gi
            ];
            
            const hasSuccessPattern = successPatterns.some(pattern => pattern.test(responseText));
            
            if (hasSuccessPattern) {
              return { 
                success: true, 
                method: 'recovery_flow',
                message: 'OTP sent via account recovery flow',
                data: { status: 'sent', endpoint: 'account.live.com/acsr' }
              };
            }
          }
        }
      } catch (recoveryError) {
        // All methods failed
      }

      return { 
        success: false, 
        message: 'All OTP delivery methods failed - Microsoft may require additional verification steps',
        attempts: ['login_simulation', 'direct_otc_request', 'recovery_flow'],
        note: 'Consider using Microsoft official authentication flow or Graph API for production use'
      };
      
    } catch (error) {
      return { 
        success: false, 
        error: error.message, 
        status: error.response?.status 
      };
    }
  }

  // Enhanced credential type check with better proof detection
  async function directOTCCheck(email, ppft) {
    const headers = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Content-Type": "application/json",
      "Accept": "application/json",
      "Referer": "https://login.live.com/login.srf",
      "Origin": "https://login.live.com",
      "X-Requested-With": "XMLHttpRequest"
    };

    const payload = {
      checkPhones: true,
      federationFlags: 3,
      flowToken: ppft,
      isOtherIdpSupported: true,
      isRemoteConnectSupported: false,
      isRemoteNGCSupported: true,
      isFidoSupported: true,
      isCookieBannerShown: false,
      isExternalFederationDisallowed: false,
      otclogindisallowed: false,
      isSignup: false,
      username: email,
      originalRequest: "",
      country: "US",
      uaid: ""
    };

    try {
      const response = await axios.post(
        "https://login.live.com/GetCredentialType.srf",
        payload,
        { headers }
      );

      // Account doesn't exist
      if (response.data.IfExistsResult !== 0) {
        return null;
      }

      const result = {
        ...response.data,
        _hasSecurityEmail: false,
        _securityEmails: [],
        _emailCount: 0,
        _hasPhone: false,
        _phoneCount: 0,
        _totalSecurityMethods: 0,
        _otcSent: false
      };

      // Check for credentials and proofs
      if (response.data.Credentials) {
        const creds = response.data.Credentials;

        // More comprehensive proof detection
        let allProofs = [];
        
        // Check all possible proof locations
        const proofSources = [
          'OtcLoginEligibleProofs',
          'Proofs', 
          'OtcExperimentProofs',
          'SamlRequestInfo',
          'FederationRedirectUrl'
        ];

        for (const source of proofSources) {
          if (creds[source] && Array.isArray(creds[source])) {
            allProofs = allProofs.concat(creds[source]);
          }
        }

        // Also check for nested proof structures
        if (creds.OtcEligibility && creds.OtcEligibility.Proofs) {
          allProofs = allProofs.concat(creds.OtcEligibility.Proofs);
        }


        if (allProofs.length > 0) {
          const emailProofs = [];
          const phoneProofs = [];

          for (const proof of allProofs) {

            // Enhanced email detection - check multiple fields
            const isEmail = (
              proof.display && proof.display.includes('@') ||
              proof.type === 1 ||
              proof.type === 'email' ||
              proof.data && typeof proof.data === 'string' && proof.data.includes('@') ||
              proof.phoneNumber && proof.phoneNumber.includes('@') || // Sometimes stored here
              (proof.clearDigits && proof.display && proof.display.includes('@'))
            );

            // Enhanced phone detection
            const isPhone = (
              proof.type === 2 ||
              proof.type === 'phone' ||
              proof.type === 'PhoneAppOTC' ||
              (proof.display && /[\d\-\+\(\)\s]{7,}/.test(proof.display) && !proof.display.includes('@')) ||
              (proof.phoneNumber && !proof.phoneNumber.includes('@') && /[\d\-\+\(\)\s]{7,}/.test(proof.phoneNumber)) ||
              (proof.clearDigits && !proof.display?.includes('@'))
            );

            if (isEmail) {
              const emailProof = {
                display: proof.display || proof.data || '[HIDDEN EMAIL]',
                type: proof.type,
                isDefault: proof.isDefault || false,
                otcEnabled: proof.otcEnabled || true,
                data: proof.data ? '[HIDDEN]' : null,
                proof: proof // Store full proof for OTP sending
              };
              emailProofs.push(emailProof);
            } else if (isPhone) {
              phoneProofs.push({
                display: proof.display || proof.phoneNumber || '[HIDDEN PHONE]',
                type: proof.type,
                isDefault: proof.isDefault || false,
                otcEnabled: proof.otcEnabled || true,
                data: proof.data ? '[HIDDEN]' : null
              });
            }
          }


          if (emailProofs.length > 0) {
            result._hasSecurityEmail = true;
            result._securityEmails = emailProofs;
            result._emailCount = emailProofs.length;

            // If sendotp is true, attempt to send OTP to the first recovery email
            if (sendotp && emailProofs[0].proof) {
              const otpResult = await sendOTPToRecoveryEmail(email, ppft, emailProofs[0].proof);
              if (otpResult && otpResult.success) {
                result._otcSent = true;
                result._otpResponse = otpResult;
              } else if (otpResult) {
                result._otcSent = false;
                result._otpError = otpResult;
              }
            }
          }

          if (phoneProofs.length > 0) {
            result._hasPhone = true;
            result._phoneCount = phoneProofs.length;
          }

          result._totalSecurityMethods = emailProofs.length + phoneProofs.length;
        }

        // Check for additional credential indicators
        if (creds.HasPassword !== undefined) {
          result._hasPassword = creds.HasPassword;
        }
        
        if (creds.SamlUrl) {
          result._hasSaml = true;
        }

        if (creds.EstsProperties && creds.EstsProperties.UserTenantBranding) {
          result._isWorkAccount = true;
        }
      }

      return result;

    } catch (error) {
      return null;
    }
  }

  // Alternative approach - try to trigger password reset to detect recovery methods
  async function passwordResetApproach(email, ppft) {
    try {
      const headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Referer": "https://passwordreset.microsoftonline.com/",
        "Origin": "https://passwordreset.microsoftonline.com"
      };

      const payload = {
        username: email,
        flowToken: ppft,
        isOtherIdpSupported: true,
        isAccessPassSupported: true
      };

      const response = await axios.post(
        "https://passwordreset.microsoftonline.com/GetCredentialType.srf",
        payload,
        { headers }
      );

      if (response.data && response.data.Credentials) {
        return response.data;
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  // Enhanced fallback check
  async function enhancedFallback(email) {
    try {
      // Try multiple endpoints
      const endpoints = [
        {
          url: "https://login.microsoftonline.com/common/GetCredentialType",
          method: "POST",
          data: {
            Username: email,
            isOtherIdpSupported: true,
            checkPhones: true,
            isRemoteNGCSupported: true,
            isCookieBannerShown: false,
            isFidoSupported: true,
            originalRequest: "",
            country: "US",
            forceotclogin: sendotp,
            flowToken: ppft || ""
          }
        },
        {
          url: `https://account.live.com/API/CheckAvailableSigninMethods?username=${encodeURIComponent(email)}`,
          method: "GET"
        }
      ];

      for (const endpoint of endpoints) {
        try {
          let response;
          
          if (endpoint.method === "POST") {
            response = await axios.post(endpoint.url, endpoint.data, {
              headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
              }
            });
          } else {
            response = await axios.get(endpoint.url, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
              }
            });
          }

          if (response.data) {
            // Check if account exists and has recovery methods
            if (response.data.IfExistsResult === 0 || response.data.Username) {
              return {
                ...response.data,
                _hasSecurityEmail: false,
                _fallbackMethod: true,
                exists: true
              };
            }
          }
        } catch (endpointError) {
          continue;
        }
      }
    } catch (error) {
    }

    return null;
  }

  // Main logic
  try {
    ppft = await extractPPFT();
    if (!ppft) {
      return await enhancedFallback(email);
    }

    let result = await directOTCCheck(email, ppft);
    
    // If no recovery methods found but account exists, try password reset approach
    if (result && result.IfExistsResult === 0 && result._totalSecurityMethods === 0) {
      const resetResult = await passwordResetApproach(email, ppft);
      if (resetResult && resetResult.Credentials) {
        // Merge results
        result.Credentials = { ...result.Credentials, ...resetResult.Credentials };
        // Re-process with the new credentials
        result = await directOTCCheck(email, ppft);
      }
    }
    
    if (result) {
      return result;
    }

    return await enhancedFallback(email);

  } catch (error) {
    return await enhancedFallback(email);
  }
};