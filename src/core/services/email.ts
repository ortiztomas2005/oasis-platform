import 'server-only';
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
  // Personalización por productora (todos opcionales — si no vienen, se
  // usa la identidad default de Live Experience). El remitente real sigue
  // siendo el dominio verificado de Live Experience: ningún proveedor deja
  // mandar "desde" el email de un tercero sin que verifique su propio
  // dominio. replyToEmail es lo que sí logra que, si el cliente responde
  // el mail, le llegue directo a la productora.
  producerDisplayName?: string | null;
  replyToEmail?: string | null;
  logoUrl?: string | null;
  brandColor?: string | null;
  footerText?: string | null;
  extraInfo?: string | null;
}

// El logo, el pie y la "información importante" los escribe la productora
// y van directo al HTML del mail — sin escapar esto, una productora podría
// inyectar markup/links arbitrarios en un mail que sale a nombre de Live
// Experience.
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeHtmlMultiline(value: string): string {
  return escapeHtml(value).replace(/\r\n|\r|\n/g, '<br/>');
}

const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/;

export async function sendTicketConfirmationEmail({
  toEmail,
  customerName,
  customerDni,
  eventName,
  eventDate,
  eventVenue,
  tierName,
  authCode,
  producerDisplayName,
  replyToEmail,
  logoUrl,
  brandColor,
  footerText,
  extraInfo,
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

    const accent = brandColor && HEX_COLOR_RE.test(brandColor) ? brandColor : '#facc15';
    const cleanProducerName = producerDisplayName ? String(producerDisplayName).trim() : '';
    const fromName = cleanProducerName ? `${cleanProducerName} vía Live Experience` : 'Live Experience';
    const cleanLogoUrl = logoUrl ? String(logoUrl).trim() : '';
    const cleanFooter = footerText ? String(footerText).trim() : '';
    const cleanExtraInfo = extraInfo ? String(extraInfo).trim() : '';
    const cleanReplyTo = replyToEmail ? String(replyToEmail).trim() : '';

    const brandBlock = cleanLogoUrl
      ? `<img src="${escapeHtml(cleanLogoUrl)}" alt="${escapeHtml(cleanProducerName || 'Live Experience')}" style="max-height: 48px; max-width: 220px; margin-bottom: 20px;" />`
      : `<div style="font-size: 18px; font-weight: 900; letter-spacing: 2px; color: ${accent}; margin-bottom: 20px;">● LIVE EXPERIENCE</div>`;

    const extraInfoBlock = cleanExtraInfo
      ? `
              <div style="background-color: #000000; border: 1px solid #262626; border-radius: 16px; padding: 16px; margin-bottom: 20px; text-align: left; font-size: 12px; line-height: 1.7; color: #d4d4d4;">
                <div style="color: #a3a3a3; font-weight: 700; text-transform: uppercase; font-size: 10px; letter-spacing: 1px; margin-bottom: 6px;">Información importante</div>
                ${escapeHtmlMultiline(cleanExtraInfo)}
              </div>`
      : '';

    const footerBlock = cleanFooter
      ? `<p style="font-size: 11px; color: #737373; line-height: 1.5; margin: 10px 0 0 0;">${escapeHtmlMultiline(cleanFooter)}</p>`
      : '';

    // 2. Enviar email con acción directa de Wallet y Bóveda
    const { data, error } = await resend.emails.send({
      from: `${fromName} <onboarding@resend.dev>`,
      to: [toEmail],
      ...(cleanReplyTo ? { replyTo: cleanReplyTo } : {}),
      subject: `🎟 Tu entrada oficial para ${eventName} - Live Experience`,
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
              ${brandBlock}

              <span style="display: inline-block; background-color: ${accent}; color: #000000; font-weight: 800; font-size: 11px; padding: 4px 14px; border-radius: 100px; text-transform: uppercase; margin-bottom: 12px;">
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
${extraInfoBlock}
              <div style="margin-bottom: 20px;">
                <a href="${baseUrl}/my-tickets" style="display: block; width: 100%; box-sizing: border-box; background-color: ${accent}; color: #000000; font-weight: 900; font-size: 12px; text-transform: uppercase; padding: 12px; border-radius: 12px; text-decoration: none; margin-bottom: 10px;">
                  Ver Ticket en Bóveda Oficial →
                </a>
              </div>

              <p style="font-size: 11px; color: #737373; line-height: 1.5; margin: 0;">
                Presentá este código QR en la puerta desde tu celular o con tu DNI físico.
              </p>
              ${footerBlock}
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
