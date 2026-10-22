import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.hostinger.com',
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: process.env.SMTP_SECURE === 'false' ? false : true,
  auth: {
    user: process.env.SMTP_USER || 'verified@zoraaroyal.com',
    pass: process.env.SMTP_PASS || '0761071Na@',
  },
});

export async function sendEmail({ to, subject, html }) {
  const smtpUser = process.env.SMTP_USER || 'verified@zoraaroyal.com';
  const smtpPass = process.env.SMTP_PASS || '0761071Na@';

  if (!smtpUser || !smtpPass) {
    console.log(`[SMTP SIMULATED] To: ${to} | Subject: ${subject}`);
    return { success: true, simulated: true };
  }

  try {
    const fromAddress = process.env.SMTP_FROM || `"Zorra Royals" <${smtpUser}>`;
    const info = await transporter.sendMail({
      from: fromAddress,
      to,
      subject,
      html,
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email sending error:', error);
    return { success: false, error: error.message };
  }
}

export function getWelcomeEmailTemplate(username) {
  return `
    <div style="background-color: #08090C; color: #FFFFFF; padding: 40px 24px; font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 540px; margin: auto; border-radius: 16px; border: 1px solid rgba(212, 175, 55, 0.4); text-align: center;">
      <img src="https://zoraaroyal.com/apple-touch-icon.png" alt="Zorra Royals" style="height: 56px; margin-bottom: 8px;" />
      <h1 style="color: #D4AF37; margin: 0; font-size: 24px; font-weight: 900; letter-spacing: 2px;">ZORRA ROYALS</h1>
      <p style="color: #F59E0B; font-size: 11px; margin: 4px 0 20px 0; letter-spacing: 2px; text-transform: uppercase;">VIP PALACE &amp; HIGH ROLLERS LOUNGE</p>
      <div style="background: #11131A; border: 1px solid rgba(212, 175, 55, 0.2); border-radius: 12px; padding: 22px; text-align: left; margin: 20px 0;">
        <h2 style="font-size: 18px; color: #FFFFFF; margin: 0 0 10px 0;">Welcome to the Royal Palace, ${username}!</h2>
        <p style="font-size: 14px; color: #CBD5E1; line-height: 1.6; margin: 0 0 14px 0;">
          Your official Zorra Royals account is active. Instant deposits, fast cashouts, and VIP game platforms await you.
        </p>
        <div style="background: rgba(212, 175, 55, 0.1); border-left: 3px solid #D4AF37; padding: 12px; border-radius: 4px;">
          <p style="margin: 0; font-size: 13px; color: #FFD700; font-weight: bold;">Exclusive 100% First Deposit Match</p>
          <p style="margin: 4px 0 0 0; font-size: 12px; color: #E2E8F0;">Load coins today to receive royal bonuses and instant credits.</p>
        </div>
      </div>
      <a href="https://zoraaroyal.com" style="display: inline-block; background: linear-gradient(135deg, #FFD700 0%, #D4AF37 70%, #997B24 100%); color: #08090C; font-weight: 900; padding: 14px 32px; border-radius: 9999px; text-decoration: none; font-size: 14px; letter-spacing: 0.5px; box-shadow: 0 0 20px rgba(212, 175, 55, 0.4);">
        ACCESS VIP LOBBY
      </a>
      <p style="margin-top: 28px; font-size: 11px; color: #64748B;">
        Official Zorra Royals Broadcast • 24/7 VIP Concierge Support
      </p>
    </div>
  `;
}

export function getOtpEmailTemplate(otp, purpose = 'Account Verification') {
  return `
    <div style="background-color: #08090C; color: #FFFFFF; padding: 40px 24px; font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 520px; margin: auto; border-radius: 16px; border: 1px solid rgba(212, 175, 55, 0.4); text-align: center; box-shadow: 0 20px 50px rgba(0,0,0,0.85);">
      <div style="margin-bottom: 20px;">
        <img src="https://zoraaroyal.com/apple-touch-icon.png" alt="Zorra Royals" style="height: 56px; margin-bottom: 8px;" />
        <h1 style="color: #D4AF37; margin: 0; font-size: 22px; font-weight: 900; letter-spacing: 2px;">ZORRA ROYALS</h1>
        <p style="color: #F59E0B; font-size: 11px; margin: 4px 0 0 0; text-transform: uppercase; letter-spacing: 2px;">Royal Security Verification</p>
      </div>
      <div style="background: #11131A; border: 1px solid rgba(212, 175, 55, 0.2); border-radius: 12px; padding: 24px; text-align: center;">
        <h2 style="font-size: 17px; margin: 0 0 10px 0; color: #FFFFFF;">${purpose} Code</h2>
        <p style="font-size: 13px; color: #94A3B8; margin: 0 0 22px 0; line-height: 1.5;">
          Use the 6-digit one-time security code below to complete your action. This code will expire in <strong>10 minutes</strong>.
        </p>
        <div style="display: inline-block; background: rgba(212, 175, 55, 0.1); border: 2px dashed #D4AF37; padding: 14px 28px; border-radius: 12px; font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #FFD700; font-family: monospace;">
          ${otp}
        </div>
      </div>
      <p style="margin-top: 24px; font-size: 11px; color: #64748B; text-align: center; line-height: 1.5;">
        If you did not request this security code, please ignore this email or reach out to 24/7 VIP Live Support.
      </p>
    </div>
  `;
}

