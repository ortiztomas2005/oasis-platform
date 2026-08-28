import { Resend } from 'resend';
import QRCode from 'qrcode';

export interface SendTicketEmailParams {
  toEmail: string;
  customerName: string;
  customerDni: string;
  eventName: string;
  eventDate?: string;
  eventVenue?: string;
  tierName: string;
  authCode: string;
}

export async function sendTicketConfirmationEmail({
  toEmail,
  customerName,
  customerDni,
  eventName,
  eventDate,
  eventVenue,
  tierName,
  authCode,
}: SendTicketEmailParams) {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey || apiKey.startsWith('re_test')) {
      console.log(`[EMAIL DEV MOCK] No hay RESEND_API_KEY real configurada. Para: ${toEmail}`);
      return { success: true, mocked: true };
    }

    const resend = new Resend(apiKey);
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    // 1. Generar la imagen del QR en Base64
    const qrDataUrl = await QRCode.toDataURL(authCode, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 300,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    });

    const qrBase64 = qrDataUrl.split(',')[1];

    const formattedDate = eventDate
      ? new Date(eventDate).toLocaleDateString('es-AR', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : 'Fecha a confirmar';

    // 2. Enviar email con acción directa de Wallet y Bóveda
    const { data, error } = await resend.emails.send({
      from: 'OASIS Tickets <onboarding@resend.dev>',
      to: [toEmail],
      subject: `🎟 Tu entrada oficial para ${eventName} - OASIS`,
      attachments: [
        {
          filename: 'ticket-qr.png',
          content: qrBase64,
        },
      ],
      html: `
        <!DOCTYPE html>
        <html>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0a0a0a; color: #ffffff; padding: 20px; margin: 0;">
            <div style="max-width: 480px; margin: 0 auto; background-color: #141414; border: 1px solid #262626; border-radius: 24px; padding: 28px; text-align: center;">
              <div style="font-size: 18px; font-weight: 900; letter-spacing: 2px; color: #facc15; margin-bottom: 20px;">● OASIS PLATFORM</div>
              
              <span style="display: inline-block; background-color: #facc15; color: #000000; font-weight: 800; font-size: 11px; padding: 4px 14px; border-radius: 100px; text-transform: uppercase; margin-bottom: 12px;">
                ${tierName}
              </span>
              
              <h1 style="font-size: 22px; font-weight: 900; text-transform: uppercase; margin: 4px 0 8px 0; color: #ffffff;">
                ${eventName}
              </h1>
              <p style="color: #a3a3a3; font-size: 12px; margin: 0 0 20px 0;">
                ${formattedDate} • ${eventVenue || 'Ubicación Central'}
              </p>

              <div style="background-color: #ffffff; padding: 14px; border-radius: 18px; display: inline-block; margin: 0 auto 20px auto;">
                <img src="${qrDataUrl}" alt="QR de Entrada" width="200" height="200" style="display: block; border-radius: 4px;" />
              </div>

              <div style="background-color: #000000; border: 1px solid #262626; border-radius: 16px; padding: 16px; margin-bottom: 20px; text-align: left; font-size: 12px; line-height: 1.8;">
                <div><strong style="color: #a3a3a3;">Titular:</strong> ${customerName}</div>
                <div><strong style="color: #a3a3a3;">DNI / Doc:</strong> ${customerDni}</div>
                <div><strong style="color: #a3a3a3;">Email:</strong> ${toEmail}</div>
                <div style="font-size: 10px; color: #737373; word-break: break-all; margin-top: 6px;">
                  <strong style="color: #a3a3a3;">Hash:</strong> ${authCode}
                </div>
              </div>

              <div style="margin-bottom: 20px;">
                <a href="${baseUrl}/my-tickets" style="display: block; width: 100%; box-sizing: border-box; background-color: #facc15; color: #000000; font-weight: 900; font-size: 12px; text-transform: uppercase; padding: 12px; border-radius: 12px; text-decoration: none; margin-bottom: 10px;">
                  Ver Ticket en Bóveda Oficial →
                </a>
              </div>

              <p style="font-size: 11px; color: #737373; line-height: 1.5; margin: 0;">
                Presentá este código QR en la puerta desde tu celular o con tu DNI físico.
              </p>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('[RESEND API ERROR]', error);
      return { success: false, error };
    }

    console.log('[RESEND SUCCESS] Email enviado ID:', data?.id);
    return { success: true, data };
  } catch (err) {
    console.error('[EMAIL UNCAUGHT ERROR]', err);
    return { success: false, error: err };
  }
}