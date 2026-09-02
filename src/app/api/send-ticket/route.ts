import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const { email, eventName, tierName, holderName, qrToken, pickupToken } = await request.json();

    if (!email) {
      return NextResponse.json({ success: false, error: 'Falta el correo electrónico.' }, { status: 400 });
    }

    // Transportador SMTP configurado con tu cuenta y contraseña de aplicación real
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'liveexperience123@gmail.com',
        pass: 'glzh yzvn vbkh tpmm',
      },
    });

    const htmlContent = `
      <div style="background-color: #0b0e14; color: #f8fafc; font-family: monospace; padding: 30px; border-radius: 16px;">
        <div style="max-width: 600px; margin: 0 auto; background: #131722; border: 1px solid #1f2937; padding: 24px; border-radius: 12px;">
          <h2 style="color: #a855f7; text-transform: uppercase; margin-top: 0; font-size: 20px;">LIVE EXPERIENCE · Pase Digital</h2>
          <p style="color: #94a3b8; font-size: 13px;">¡Hola, <strong>${holderName || 'Asistente'}</strong>! Tu entrada para el evento ya está disponible.</p>
          
          <div style="background: #181d2a; border: 1px solid #2d3748; padding: 16px; border-radius: 8px; margin: 20px 0; font-size: 13px;">
            <p style="margin: 6px 0;"><strong>Evento:</strong> <span style="color: #60a5fa;">${eventName}</span></p>
            <p style="margin: 6px 0;"><strong>Tanda:</strong> <span style="color: #34d399;">${tierName}</span></p>
            <p style="margin: 6px 0;"><strong>Código QR Acceso:</strong> <span style="color: #c084fc;">${qrToken}</span></p>
            ${pickupToken ? `<p style="margin: 6px 0;"><strong>Token de Barra:</strong> <span style="color: #fbbf24;">${pickupToken}</span></p>` : ''}
          </div>

          <p style="color: #64748b; font-size: 11px; text-align: center; margin-top: 30px;">
            Enviado oficialmente desde liveexperience123@gmail.com. Presentá este código en puerta.
          </p>
        </div>
      </div>
    `;

    // Archivos adjuntos simulados en buffer (PDF y Pass móvil APK)
    const pdfBuffer = Buffer.from(`Comprobante oficial PDF para ${eventName} - Titular: ${holderName} - QR: ${qrToken}`, 'utf-8');
    const apkBuffer = Buffer.from(`PK... [Archivo Pass Wallet / APK Móvil] ...QR:${qrToken}`, 'utf-8');

    await transporter.sendMail({
      from: '"Live Experience" <liveexperience123@gmail.com>',
      to: email,
      subject: `🎟️ Tu entrada oficial para ${eventName}`,
      html: htmlContent,
      attachments: [
        {
          filename: `Pase_${eventName.replace(/\s+/g, '_')}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
        {
          filename: `Pass_${eventName.replace(/\s+/g, '_')}.apk`,
          content: apkBuffer,
          contentType: 'application/vnd.android.package-archive',
        },
      ],
    });

    return NextResponse.json({ success: true, message: 'Correo real enviado con éxito.' });
  } catch (error: any) {
    console.error('Error SMTP:', error);
    return NextResponse.json({ success: false, error: error.message || 'Error al enviar.' }, { status: 500 });
  }
}