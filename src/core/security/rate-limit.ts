import 'server-only';
import { redis, isRedisConfigured } from '@/core/redis';

/**
 * Limitador de intentos por ventana fija (ej: "máximo 5 por 10 minutos"),
 * pensado para rutas sensibles a fuerza bruta o abuso (login, registro,
 * checkout, cortesías). Usa Upstash Redis si está configurado — así el
 * conteo es real entre instancias/despliegues — y si no, cae a un mapa en
 * memoria del propio proceso: sirve igual para un solo servidor (que es el
 * caso mientras no haya Upstash), pero no se comparte entre instancias
 * serverless separadas, así que conviene configurar Upstash antes de un
 * despliegue con múltiples instancias.
 */

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetInSeconds: number;
}

const memoryStore = new Map<string, { count: number; resetAt: number }>();

// Poda periódica del mapa en memoria para que no crezca sin límite en un
// proceso de larga vida (cada IP/clave distinta deja una entrada).
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of memoryStore) {
    if (entry.resetAt <= now) memoryStore.delete(key);
  }
}, 5 * 60 * 1000).unref?.();

async function checkMemory(key: string, limit: number, windowSeconds: number): Promise<RateLimitResult> {
  const now = Date.now();
  const entry = memoryStore.get(key);

  if (!entry || entry.resetAt <= now) {
    memoryStore.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    return { allowed: true, remaining: limit - 1, resetInSeconds: windowSeconds };
  }

  entry.count += 1;
  const resetInSeconds = Math.max(0, Math.ceil((entry.resetAt - now) / 1000));
  return { allowed: entry.count <= limit, remaining: Math.max(0, limit - entry.count), resetInSeconds };
}

async function checkRedis(key: string, limit: number, windowSeconds: number): Promise<RateLimitResult> {
  const redisKey = `ratelimit:${key}`;
  const count = await redis!.incr(redisKey);
  if (count === 1) {
    await redis!.expire(redisKey, windowSeconds);
  }
  const ttl = await redis!.ttl(redisKey);
  const resetInSeconds = ttl > 0 ? ttl : windowSeconds;
  return { allowed: count <= limit, remaining: Math.max(0, limit - count), resetInSeconds };
}

/**
 * `key` debería identificar quién está pegándole a la ruta (normalmente
 * "nombre-de-la-ruta:ip", ver getClientIp más abajo) — no alcanza con el
 * nombre de la ruta solo, o un solo abusador bloquearía a todo el mundo.
 */
export async function checkRateLimit(
  key: string,
  { limit, windowSeconds }: { limit: number; windowSeconds: number }
): Promise<RateLimitResult> {
  try {
    if (isRedisConfigured && redis) {
      return await checkRedis(key, limit, windowSeconds);
    }
  } catch (err) {
    console.error('Error consultando Upstash Redis para rate limiting, usando memoria local:', err);
  }
  return checkMemory(key, limit, windowSeconds);
}

/** IP del cliente a partir de los headers que pone el proxy/CDN delante de Next.js. */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.headers.get('x-real-ip') || 'unknown';
}
