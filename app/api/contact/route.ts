import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone, message } = body;

    // Validation
    if (!name || !email || !phone || !message) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Validation de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Template HTML pour l'email de contact
    const contactEmailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nouveau message de contact</title>
</head>
<body style="margin: 0; padding: 0; background-color: #000000; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #000000; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="600" cellpadding="0" cellspacing="0" style="max-width: 600px;">
          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom: 32px;">
              <h1 style="margin: 0; font-size: 32px; font-weight: bold; letter-spacing: -0.05em; color: #ffffff;">RENDERZ</h1>
            </td>
          </tr>
          
          <!-- Card -->
          <tr>
            <td style="background-color: #111111; border: 1px solid #222222; padding: 40px;">
              <h2 style="margin: 0 0 24px 0; font-size: 20px; font-weight: 600; color: #ffffff;">
                Nouveau message de contact
              </h2>
              
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
                <tr>
                  <td style="padding-bottom: 12px;">
                    <strong style="color: #ffffff; font-size: 14px;">Nom:</strong>
                    <p style="margin: 4px 0 0 0; font-size: 14px; color: #888888;">${name}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 12px;">
                    <strong style="color: #ffffff; font-size: 14px;">Email:</strong>
                    <p style="margin: 4px 0 0 0; font-size: 14px; color: #888888;">${email}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 12px;">
                    <strong style="color: #ffffff; font-size: 14px;">Phone:</strong>
                    <p style="margin: 4px 0 0 0; font-size: 14px; color: #888888;">${phone}</p>
                  </td>
                </tr>
                <tr>
                  <td>
                    <strong style="color: #ffffff; font-size: 14px;">Message:</strong>
                    <p style="margin: 4px 0 0 0; font-size: 14px; line-height: 1.6; color: #888888; white-space: pre-wrap;">${message}</p>
                  </td>
                </tr>
              </table>
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

    // Envoyer l'email à info@renderz.ch
    await sendEmail({
      to: 'info@renderz.ch',
      subject: `Nouveau message de contact de ${name}`,
      html: contactEmailHtml,
      text: `New contact message\n\nName: ${name}\nEmail: ${email}\nPhone: ${phone}\n\nMessage:\n${message}`,
    });

    return NextResponse.json(
      { message: 'Message sent successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error sending contact email:', error);
    return NextResponse.json(
      { error: 'Error sending message' },
      { status: 500 }
    );
  }
}
