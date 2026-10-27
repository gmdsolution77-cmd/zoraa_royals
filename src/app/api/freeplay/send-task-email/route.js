import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { getSessionUser } from '@/lib/auth';
import { sendEmail } from '@/lib/email';

export async function POST(req) {
  try {
    const session = await getSessionUser();
    const body = await req.json().catch(() => ({}));
    const { email, name, gameTitle = 'Selected Game' } = body;

    const targetEmail = (session?.email || email || '').toLowerCase().trim();
    if (!targetEmail || !targetEmail.includes('@')) {
      return NextResponse.json(
        { success: false, message: 'Valid email address is required to dispatch verification task.' },
        { status: 400 }
      );
    }

    const db = await getDb();
    const settingsDoc = await db.collection('system_settings').findOne({ key: 'general' });
    if (settingsDoc?.freeplayActive === false) {
      return NextResponse.json(
        { success: false, message: 'Freeplay promotions are currently paused or inactive.' },
        { status: 400 }
      );
    }

    const configuredAmount = settingsDoc?.freeplayAmountSC !== undefined 
      ? Number(settingsDoc.freeplayAmountSC) 
      : (settingsDoc?.signupBonusAmount !== undefined ? Number(settingsDoc.signupBonusAmount) : 5.0);

    const taskId = `FP-${Math.floor(100000 + Math.random() * 900000)}`;

    // Log preliminary verification email dispatch
    await db.collection('freeplay_tasks').insertOne({
      taskId,
      email: targetEmail,
      username: session?.username || name || targetEmail.split('@')[0],
      gameTitle,
      amount: configuredAmount,
      status: 'email_dispatched',
      createdAt: new Date(),
    }).catch(err => console.error('Error logging freeplay task:', err));

    const htmlTemplate = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Zorra Royals Freeplay Verification Task</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #05060b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #05060b;">
          <tr>
            <td align="center" style="padding: 30px 15px;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 580px; background: #0c0e18; border: 1px solid rgba(212, 175, 55, 0.4); border-radius: 20px; overflow: hidden; box-shadow: 0 15px 50px rgba(0,0,0,0.8);">
                
                <!-- Header Banner -->
                <tr>
                  <td align="center" style="padding: 35px 20px 25px 20px; background: radial-gradient(circle at center, #1b170c 0%, #0c0e18 100%); border-bottom: 1px solid rgba(212, 175, 55, 0.25);">
                    <div style="font-size: 26px; font-weight: 900; letter-spacing: 3px; color: #ffffff; text-transform: uppercase;">
                      ZORRA <span style="color: #ffd700;">ROYALS</span>
                    </div>
                    <div style="font-size: 11px; letter-spacing: 2px; color: #d4af37; margin-top: 5px; text-transform: uppercase; font-weight: 700;">
                      VIP Sweepstakes &amp; Royal Gaming Lounge
                    </div>
                  </td>
                </tr>

                <!-- Content Body -->
                <tr>
                  <td style="padding: 30px 25px 25px 25px; text-align: center;">
                    
                    <!-- Gold Badge -->
                    <div style="display: inline-block; background: rgba(212, 175, 55, 0.15); border: 1px solid rgba(255, 215, 0, 0.5); color: #ffd700; font-size: 11px; font-weight: 800; padding: 6px 18px; border-radius: 20px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 16px;">
                      🎁 $${configuredAmount.toFixed(0)} Freeplay Bonus Task • #${taskId}
                    </div>

                    <h2 style="font-size: 22px; font-weight: 900; color: #ffffff; margin: 0 0 12px 0;">
                      Claim Your Freeplay for ${gameTitle}
                    </h2>

                    <p style="font-size: 14px; line-height: 1.6; color: #cbd5e1; margin: 0 0 22px 0; text-align: left;">
                      Hello ${session?.username || name ? `<strong>${session?.username || name}</strong>` : 'Player'},<br><br>
                      To claim your <strong>$${configuredAmount.toFixed(0)} Freeplay Bonus Credits</strong> for <strong>${gameTitle}</strong>, please complete this simple 30-second verification task:
                    </p>

                    <!-- Instruction Card -->
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background: rgba(255,255,255,0.03); border: 1px solid rgba(212, 175, 55, 0.3); border-radius: 14px; margin-bottom: 22px; text-align: left;">
                      <tr>
                        <td style="padding: 18px 16px;">
                          <div style="margin-bottom: 12px; display: flex; align-items: flex-start;">
                            <span style="display: inline-block; background: #ffd700; color: #000; font-weight: 900; font-size: 12px; width: 22px; height: 22px; line-height: 22px; text-align: center; border-radius: 50%; margin-right: 10px; flex-shrink: 0;">1</span>
                            <span style="font-size: 13.5px; color: #ffffff; line-height: 1.4;">
                              If this email landed in your <strong>Spam / Junk folder</strong>, click <strong style="color: #10b981;">&quot;Report Not Spam&quot;</strong> or <strong>&quot;Move to Inbox&quot;</strong>.
                            </span>
                          </div>

                          <div style="margin-bottom: 12px; display: flex; align-items: flex-start;">
                            <span style="display: inline-block; background: #ffd700; color: #000; font-weight: 900; font-size: 12px; width: 22px; height: 22px; line-height: 22px; text-align: center; border-radius: 50%; margin-right: 10px; flex-shrink: 0;">2</span>
                            <span style="font-size: 13.5px; color: #ffffff; line-height: 1.4;">
                              Open your <strong>Primary Inbox</strong> and take a screenshot showing this Zorra Royals verification email inside your Inbox.
                            </span>
                          </div>

                          <div style="display: flex; align-items: flex-start;">
                            <span style="display: inline-block; background: #ffd700; color: #000; font-weight: 900; font-size: 12px; width: 22px; height: 22px; line-height: 22px; text-align: center; border-radius: 50%; margin-right: 10px; flex-shrink: 0;">3</span>
                            <span style="font-size: 13.5px; color: #ffffff; line-height: 1.4;">
                              Return to <strong>Zorra Royals</strong>, upload your inbox screenshot in the Freeplay Task window, and submit!
                            </span>
                          </div>
                        </td>
                      </tr>
                    </table>

                    <!-- Privacy Note -->
                    <div style="background: rgba(212, 175, 55, 0.08); border: 1px dashed rgba(212, 175, 55, 0.35); border-radius: 10px; padding: 10px 14px; margin-bottom: 22px; text-align: left;">
                      <p style="font-size: 12px; color: #ffd700; margin: 0; line-height: 1.5;">
                        🔒 <strong>Privacy Tip:</strong> You may blur out or draw lines over any other personal emails visible in your inbox screenshot.
                      </p>
                    </div>

                    <!-- Task ID Box -->
                    <div style="background: #05060b; border: 1px solid rgba(255,215,0,0.3); border-radius: 12px; padding: 12px 18px; display: inline-block; margin-bottom: 20px;">
                      <span style="font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; display: block;">Task Reference ID</span>
                      <strong style="font-size: 18px; color: #ffd700; font-family: monospace; letter-spacing: 2px;">${taskId}</strong>
                    </div>

                    <p style="font-size: 12px; color: #94a3b8; line-height: 1.5; margin: 0;">
                      Our 24/7 royal staff will verify your Inbox screenshot and credit your $${configuredAmount.toFixed(0)} Freeplay credentials immediately!
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td align="center" style="padding: 20px; background: #05060b; border-top: 1px solid rgba(255, 255, 255, 0.06); font-size: 11px; color: #64748b; line-height: 1.6;">
                    <p style="margin: 0 0 6px 0; color: #cbd5e1; font-weight: 600;">
                      Zorra Royals • 24/7 Palace VIP Sweepstakes Gaming Lounge
                    </p>
                    <p style="margin: 0;">
                      Sent to ${targetEmail} from verified@zoraaroyal.com
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const textTemplate = `
Zorra Royals - $${configuredAmount.toFixed(0)} Freeplay Bonus Task (Task #${taskId})
=========================================================

Hello ${session?.username || name || 'Player'},

To claim your $${configuredAmount.toFixed(0)} Freeplay Bonus for ${gameTitle}, please complete this quick verification task:

1. If this email landed in your Spam/Junk folder, click "Report Not Spam" or "Move to Inbox".
2. Open your Primary Inbox and take a screenshot showing this email inside your Inbox.
3. You can blur out or draw lines over any other personal emails visible in your screenshot.
4. Return to Zorra Royals and upload your screenshot in the Freeplay Task window to get your Freeplay approved!

Task Reference: ${taskId}
Official Sender: verified@zoraaroyal.com
    `;

    const sendRes = await sendEmail({
      to: targetEmail,
      subject: `Zorra Royals: $${configuredAmount.toFixed(0)} Freeplay Verification & Inbox Task 🎁 [${taskId}]`,
      text: textTemplate,
      html: htmlTemplate,
    });

    return NextResponse.json({
      success: true,
      message: `Freeplay task email sent to ${targetEmail}! Please check your Spam / Inbox.`,
      taskId,
      simulated: sendRes?.simulated || false,
    });
  } catch (error) {
    console.error('Freeplay Task Email dispatch error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to send verification task email. Please try again.' },
      { status: 500 }
    );
  }
}
