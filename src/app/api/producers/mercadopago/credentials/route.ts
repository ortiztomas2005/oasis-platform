import { NextResponse } from 'next/server';
import { getOwnedProducerName } from '@/core/services/producers';
import { validateMpAccessToken, saveProducerManualMpCredentials, classifyMpCredential } from '@/core/services/mercadopago-connect';

export const dynamic = 'force-dynamic';

// Conectar Mercado Pago pegando a mano el Access Token + Public Key que
// cualquier cuenta de MP ya tiene en "Tus integraciones" > Credenciales —
// alternativa al flujo OAuth de /connect, que requiere que Live Experience
// tenga una aplicación propia dada de alta en el panel de desarrolladores.
export async function POST(req: Request) {
  const producerName = await getOwnedProducerName();
  if (!producerName) {
    return NextResponse.json(
      { error: 'Tenés que estar logueado y ser dueño de una productora para conectar Mercado Pago.' },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const accessToken = String(body.accessToken || '').trim();
    const publicKey = String(body.publicKey || '').trim();

    if (!accessToken) {
      return NextResponse.json({ error: 'Falta el Access Token.' }, { status: 400 });
    }
    if (!publicKey) {
      return NextResponse.json({ error: 'Falta la Public Key.' }, { status: 400 });
    }

    if (classifyMpCredential(accessToken) === 'test') {
      return NextResponse.json(
        { error: 'Ese Access Token es de PRUEBA (empieza con "TEST-"). Necesitás el de PRODUCCIÓN (empieza con "APP_USR-") para cobrar de verdad.' },
        { status: 400 }
      );
    }
    if (classifyMpCredential(publicKey) === 'test') {
      return NextResponse.json(
        { error: 'Esa Public Key es de PRUEBA (empieza con "TEST-"). Necesitás la de PRODUCCIÓN (empieza con "APP_USR-") para cobrar de verdad.' },
        { status: 400 }
      );
    }

    const result = await validateMpAccessToken(accessToken);
    if (!result) {
      return NextResponse.json(
        { error: 'Ese Access Token no es válido. Revisá que lo copiaste completo desde Mercado Pago.' },
        { status: 400 }
      );
    }

    await saveProducerManualMpCredentials(producerName, { accessToken, publicKey, userId: result.userId });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
