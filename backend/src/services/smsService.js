// ANMOL STORE - Multi-Provider SMS Service (DLT & Indian Telecom Compliant)
import { normalizePhone } from '../utils/otpHelper.js';

// Development & Test registry for automated testing without live SMS credits
const devOtpRegistry = new Map();

class SmsService {
  constructor() {
    this.provider = (process.env.SMS_PROVIDER || 'auto').toLowerCase();
  }

  /**
   * Returns the active provider based on environment variables.
   */
  getActiveProvider() {
    if (process.env.MSG91_AUTH_KEY) return 'msg91';
    if (process.env.TWOFACTOR_API_KEY) return 'twofactor';
    if (process.env.FAST2SMS_API_KEY) return 'fast2sms';
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) return 'twilio';
    return 'console';
  }

  /**
   * Sends an OTP via the configured transactional SMS provider.
   *
   * @param {string} rawPhone - Recipient 10-digit Indian mobile number
   * @param {string} otp - 6-digit verification code
   * @param {string} purpose - 'signup' | 'login' | 'checkout'
   * @returns {Promise<{ success: boolean, provider: string, messageId?: string }>}
   */
  async sendOtp(rawPhone, otp, purpose = 'verification') {
    const { isValid, normalized10, e164, masked } = normalizePhone(rawPhone);
    if (!isValid) {
      throw new Error('Invalid Indian mobile number. Please provide a valid 10-digit number starting with 6, 7, 8, or 9.');
    }

    const provider = this.provider !== 'auto' ? this.provider : this.getActiveProvider();

    // In automated test or development without credentials, register and mock dispatch
    if (process.env.NODE_ENV === 'test' || provider === 'console') {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('Production SMS service is not configured. Please set SMS provider credentials in environment variables.');
      }

      devOtpRegistry.set(normalized10, {
        otp,
        purpose,
        sentAt: new Date(),
        expiresAt: new Date(Date.now() + 5 * 60 * 1000)
      });

      console.log(`[SMS:${provider.toUpperCase()}] ✉️ OTP sent to ${masked} for [${purpose}]. Code: [MASKED]. (Dev/Test Environment)`);
      return {
        success: true,
        provider: 'console',
        messageId: `dev-${Date.now()}`,
        maskedPhone: masked
      };
    }

    // 1. MSG91 Integration
    if (provider === 'msg91') {
      return await this._sendViaMsg91(normalized10, otp, purpose, masked);
    }

    // 2. 2Factor.in Integration (India DLT Compliant)
    if (provider === 'twofactor') {
      return await this._sendViaTwoFactor(normalized10, otp, purpose, masked);
    }

    // 3. Fast2SMS Integration
    if (provider === 'fast2sms') {
      return await this._sendViaFast2Sms(normalized10, otp, purpose, masked);
    }

    // 4. Twilio Integration
    if (provider === 'twilio') {
      return await this._sendViaTwilio(e164, otp, purpose, masked);
    }

    throw new Error(`Unsupported or unconfigured SMS provider: ${provider}`);
  }

  /**
   * MSG91 API Dispatch
   */
  async _sendViaMsg91(phone10, otp, purpose, masked) {
    const authKey = process.env.MSG91_AUTH_KEY;
    const templateId = process.env.MSG91_TEMPLATE_ID;
    const senderId = process.env.MSG91_SENDER_ID || 'ANMOLS';

    if (!authKey || !templateId) {
      throw new Error('MSG91 configuration incomplete: MSG91_AUTH_KEY and MSG91_TEMPLATE_ID required.');
    }

    const url = new URL('https://control.msg91.com/api/v5/otp');
    url.searchParams.append('template_id', templateId);
    url.searchParams.append('mobile', `91${phone10}`);
    url.searchParams.append('authkey', authKey);
    url.searchParams.append('otp', otp);
    if (senderId) url.searchParams.append('sender', senderId);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal
      });
      clearTimeout(timeout);

      const data = await response.json();
      if (!response.ok || data.type === 'error') {
        console.error('[SMS:MSG91] Rejection:', data);
        throw new Error(data.message || 'SMS delivery failed via MSG91.');
      }

      console.log(`[SMS:MSG91] ✓ OTP successfully delivered to ${masked}`);
      return { success: true, provider: 'msg91', messageId: data.message || `msg91-${Date.now()}` };
    } catch (err) {
      clearTimeout(timeout);
      throw new Error(`MSG91 Error: ${err.message}`);
    }
  }

  /**
   * 2Factor.in API Dispatch
   */
  async _sendViaTwoFactor(phone10, otp, purpose, masked) {
    const apiKey = process.env.TWOFACTOR_API_KEY;
    const templateName = process.env.TWOFACTOR_TEMPLATE_NAME || 'ANMOL_OTP';

    if (!apiKey) {
      throw new Error('2Factor configuration incomplete: TWOFACTOR_API_KEY required.');
    }

    const endpoint = `https://2factor.in/API/V1/${encodeURIComponent(apiKey)}/SMS/${phone10}/${otp}/${encodeURIComponent(templateName)}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        signal: controller.signal
      });
      clearTimeout(timeout);

      const data = await response.json();
      if (data.Status !== 'Success') {
        console.error('[SMS:2Factor] Rejection:', data);
        throw new Error(data.Details || 'SMS delivery rejected by 2Factor provider.');
      }

      console.log(`[SMS:2Factor] ✓ OTP successfully delivered to ${masked}`);
      return { success: true, provider: 'twofactor', messageId: data.Details };
    } catch (err) {
      clearTimeout(timeout);
      throw new Error(`2Factor Error: ${err.message}`);
    }
  }

  /**
   * Fast2SMS API Dispatch
   */
  async _sendViaFast2Sms(phone10, otp, purpose, masked) {
    const apiKey = process.env.FAST2SMS_API_KEY;
    if (!apiKey) {
      throw new Error('Fast2SMS configuration incomplete: FAST2SMS_API_KEY required.');
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          authorization: apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          variables_values: otp,
          route: 'otp',
          numbers: phone10
        }),
        signal: controller.signal
      });
      clearTimeout(timeout);

      const data = await response.json();
      if (!data.return) {
        console.error('[SMS:Fast2SMS] Rejection:', data);
        throw new Error(data.message?.[0] || 'SMS delivery rejected by Fast2SMS.');
      }

      console.log(`[SMS:Fast2SMS] ✓ OTP successfully delivered to ${masked}`);
      return { success: true, provider: 'fast2sms', messageId: data.request_id };
    } catch (err) {
      clearTimeout(timeout);
      throw new Error(`Fast2SMS Error: ${err.message}`);
    }
  }

  /**
   * Twilio API Dispatch
   */
  async _sendViaTwilio(e164, otp, purpose, masked) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_FROM_NUMBER;

    if (!accountSid || !authToken || !fromNumber) {
      throw new Error('Twilio configuration incomplete: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_FROM_NUMBER required.');
    }

    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const bodyParams = new URLSearchParams({
      To: e164,
      From: fromNumber,
      Body: `Your ANMOL STORE verification code is ${otp}. Valid for 5 minutes. Do not share this OTP with anyone.`
    });

    const authHeader = 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: bodyParams.toString(),
        signal: controller.signal
      });
      clearTimeout(timeout);

      const data = await response.json();
      if (!response.ok || data.error_code) {
        console.error('[SMS:Twilio] Rejection:', data);
        throw new Error(data.message || 'SMS delivery failed via Twilio.');
      }

      console.log(`[SMS:Twilio] ✓ OTP successfully delivered to ${masked}`);
      return { success: true, provider: 'twilio', messageId: data.sid };
    } catch (err) {
      clearTimeout(timeout);
      throw new Error(`Twilio Error: ${err.message}`);
    }
  }

  /**
   * Test helper to retrieve the last dispatched OTP in dev/test mode.
   * Strictly disabled in production.
   */
  getDevLastOtp(phone) {
    if (process.env.NODE_ENV === 'production') return null;
    const { normalized10 } = normalizePhone(phone);
    const entry = devOtpRegistry.get(normalized10);
    return entry ? entry.otp : null;
  }

  /**
   * Clears the dev OTP registry.
   */
  clearDevRegistry() {
    devOtpRegistry.clear();
  }
}

export const smsService = new SmsService();
