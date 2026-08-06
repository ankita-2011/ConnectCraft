/**
 * emailService.js
 * Sends transactional emails via a Google Apps Script Web App URL.
 * The GAS script must accept POST requests with JSON body: { email, subject, html }
 */

export const sendEmail = async ({ email, subject, html }) => {
  const GAS_URL = process.env.GOOGLE_APPS_SCRIPT_URL;

  if (!GAS_URL) {
    console.error('[EMAIL] GOOGLE_APPS_SCRIPT_URL is not set in environment variables.');
    throw new Error('Email service is not configured. Please contact support.');
  }

  const response = await fetch(GAS_URL, {
    method: 'POST',
    body: JSON.stringify({ email, subject, html }),
    redirect: 'follow', // GAS URLs redirect 302 to googleusercontent.com
  });

  if (!response.ok) {
    console.error(`[EMAIL] GAS responded with status ${response.status}`);
    throw new Error('Failed to send email. Please try again later.');
  }

  return response;
};

/**
 * Sends a styled OTP email using the ConnectCraft brand design.
 * @param {string} toEmail  - Recipient email address
 * @param {string} otp      - 6-digit OTP code
 * @param {'verification'|'reset'} type - Determines email content
 */
export const sendOtpEmail = async (toEmail, otp, type = 'verification') => {
  const isReset = type === 'reset';

  // Natural subject line without spam trigger words like 'OTP' or 'Password Reset'
  const subject = isReset
    ? `${otp} is your ConnectCraft account recovery code`
    : `${otp} is your ConnectCraft confirmation code`;

  const heading = isReset ? 'Account Security Code' : 'Welcome to ConnectCraft';

  const bodyText = isReset
    ? 'Use the security code below to recover your ConnectCraft account password. Do not share this code with anyone.'
    : 'Thank you for joining ConnectCraft! Enter the code below to complete your registration.';

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background-color:#FAFAF9;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:520px;margin:40px auto;background-color:#FFFFFF;border-radius:18px;overflow:hidden;box-shadow:0 8px 32px rgba(28,25,23,0.10);">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#0F766E 0%,#115E59 100%);padding:32px 40px;text-align:center;">
      <h1 style="color:#FFFFFF;margin:0;font-size:26px;font-weight:800;letter-spacing:-0.5px;">ConnectCraft</h1>
      <p style="color:rgba(255,255,255,0.75);margin:6px 0 0;font-size:13px;letter-spacing:0.5px;">Connect. Learn. Collaborate. Grow.</p>
    </div>

    <!-- Body -->
    <div style="padding:40px;">
      <h2 style="color:#1C1917;font-size:20px;font-weight:700;margin:0 0 12px;">${heading}</h2>
      <p style="color:#57534E;font-size:15px;line-height:1.7;margin:0 0 28px;">${bodyText}</p>

      <!-- OTP Box -->
      <div style="background:#F0FDFA;border:2px dashed #0F766E;border-radius:14px;padding:28px 24px;text-align:center;margin-bottom:28px;">
        <p style="color:#57534E;font-size:12px;margin:0 0 10px;text-transform:uppercase;letter-spacing:2px;font-weight:600;">Your One-Time Password</p>
        <div style="font-size:46px;font-weight:800;letter-spacing:14px;color:#0F766E;font-family:'Courier New',Courier,monospace;line-height:1;">${otp}</div>
      </div>

      <!-- Expiry Warning -->
      <div style="background:#FEF3C7;border-left:4px solid #F59E0B;border-radius:8px;padding:12px 16px;margin-bottom:24px;">
        <p style="color:#92400E;font-size:13px;font-weight:600;margin:0;">⏱&nbsp; This OTP is valid for <strong>5 minutes</strong> only.</p>
      </div>

      <p style="color:#78716C;font-size:13px;line-height:1.7;margin:0;">
        If you did not request this, you can safely ignore this email. Your account will not be affected.
      </p>
    </div>

    <!-- Footer -->
    <div style="background:#F5F5F4;padding:20px 40px;text-align:center;border-top:1px solid #E7E5E4;">
      <p style="color:#A8A29E;font-size:12px;margin:0;">&copy; 2025 ConnectCraft. All rights reserved.</p>
    </div>

  </div>
</body>
</html>
  `.trim();

  return sendEmail({ email: toEmail, subject, html });
};
