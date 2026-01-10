import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Email "from" address - doit être vérifié dans Resend
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@renderz.ch';
const APP_NAME = 'RENDERZ';

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({ to, subject, html, text }: SendEmailOptions) {
  try {
    const { data, error } = await resend.emails.send({
      from: `${APP_NAME} <${FROM_EMAIL}>`,
      to,
      subject,
      html,
      text,
    });

    if (error) {
      console.error('Error sending email:', error);
      throw error;
    }

    console.log('Email sent successfully:', data?.id);
    return data;
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
}

// Template pour la vérification d'email
export function getVerificationEmailHtml(url: string, userName?: string) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify your email</title>
</head>
<body style="margin: 0; padding: 0; background-color: #000000; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #000000; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="500" cellpadding="0" cellspacing="0" style="max-width: 500px;">
          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom: 32px;">
              <h1 style="margin: 0; font-size: 32px; font-weight: bold; letter-spacing: -0.05em; color: #ffffff;">RENDERZ</h1>
            </td>
          </tr>
          
          <!-- Card -->
          <tr>
            <td style="background-color: #111111; border: 1px solid #222222; padding: 40px;">
              <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600; color: #ffffff;">
                Verify your email
              </h2>
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #888888;">
                ${userName ? `Hi ${userName},` : 'Hi,'}<br><br>
                Click the button below to verify your email address and activate your RENDERZ account.
              </p>
              
              <!-- Button -->
              <table cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                <tr>
                  <td style="background-color: #ffffff; padding: 12px 24px;">
                    <a href="${url}" style="color: #000000; text-decoration: none; font-size: 14px; font-weight: 600; font-family: monospace;">
                      VERIFY EMAIL
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0; font-size: 12px; color: #666666;">
                If you didn't create an account, you can safely ignore this email.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top: 24px;">
              <p style="margin: 0; font-size: 12px; color: #444444;">
                © ${new Date().getFullYear()} RENDERZ. All rights reserved.
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
}

// Template pour le reset de mot de passe
export function getResetPasswordEmailHtml(url: string, userName?: string) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset your password</title>
</head>
<body style="margin: 0; padding: 0; background-color: #000000; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #000000; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="500" cellpadding="0" cellspacing="0" style="max-width: 500px;">
          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom: 32px;">
              <h1 style="margin: 0; font-size: 32px; font-weight: bold; letter-spacing: -0.05em; color: #ffffff;">RENDERZ</h1>
            </td>
          </tr>
          
          <!-- Card -->
          <tr>
            <td style="background-color: #111111; border: 1px solid #222222; padding: 40px;">
              <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600; color: #ffffff;">
                Reset your password
              </h2>
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #888888;">
                ${userName ? `Hi ${userName},` : 'Hi,'}<br><br>
                We received a request to reset your password. Click the button below to choose a new one.
              </p>
              
              <!-- Button -->
              <table cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                <tr>
                  <td style="background-color: #ffffff; padding: 12px 24px;">
                    <a href="${url}" style="color: #000000; text-decoration: none; font-size: 14px; font-weight: 600; font-family: monospace;">
                      RESET PASSWORD
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0 0 16px 0; font-size: 12px; color: #666666;">
                This link will expire in 1 hour.
              </p>
              <p style="margin: 0; font-size: 12px; color: #666666;">
                If you didn't request a password reset, you can safely ignore this email.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top: 24px;">
              <p style="margin: 0; font-size: 12px; color: #444444;">
                © ${new Date().getFullYear()} RENDERZ. All rights reserved.
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
}

// Template pour l'invitation
export function getInvitationEmailHtml(appUrl: string, recipientName?: string) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You're invited to RENDERZ!</title>
</head>
<body style="margin: 0; padding: 0; background-color: #000000; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #000000; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="500" cellpadding="0" cellspacing="0" style="max-width: 500px;">
          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom: 32px;">
              <h1 style="margin: 0; font-size: 32px; font-weight: bold; letter-spacing: -0.05em; color: #ffffff;">RENDERZ</h1>
            </td>
          </tr>
          
          <!-- Card -->
          <tr>
            <td style="background-color: #111111; border: 1px solid #222222; padding: 40px;">
              <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600; color: #ffffff;">
                🎨 You're invited!
              </h2>
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #888888;">
                ${recipientName ? `Hi ${recipientName},` : 'Hi there,'}<br><br>
                You've been invited to join <strong style="color: #ffffff;">RENDERZ</strong> — the AI-powered image generation and upscaling platform.
              </p>
              
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #888888;">
                With RENDERZ, you can:
              </p>
              <ul style="margin: 0 0 24px 0; padding-left: 20px; font-size: 14px; line-height: 1.8; color: #888888;">
                <li>Generate stunning AI images from your photos</li>
                <li>Upscale images to 4K quality</li>
                <li>Choose from multiple aspect ratios</li>
              </ul>
              
              <!-- Button -->
              <table cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                <tr>
                  <td style="background-color: #ffffff; padding: 12px 24px;">
                    <a href="${appUrl}" style="color: #000000; text-decoration: none; font-size: 14px; font-weight: 600; font-family: monospace;">
                      GET STARTED
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0; font-size: 12px; color: #666666;">
                Create your free account and start generating amazing renders today!
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top: 24px;">
              <p style="margin: 0; font-size: 12px; color: #444444;">
                © ${new Date().getFullYear()} RENDERZ. All rights reserved.
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
}
