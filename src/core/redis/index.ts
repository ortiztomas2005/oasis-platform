import 'server-only';
import { Redis } from '@upstash/redis';

export const isRedisConfigured = !!(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
);

if (!isRedisConfigured) {
  // En modo desarrollo local (o mientras no se configure Upstash) avisamos
  // una vez; core/security/rate-limit.ts usa isRedisConfigured para caer a
  // un limitador en memoria en vez de romper.
  console.warn('⚠️ Variables de Upstash Redis no configuradas en .env.local — el rate limiting usa memoria local en su lugar.');
}

export const redis = isRedisConfigured
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;
