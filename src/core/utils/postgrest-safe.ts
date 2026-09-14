/**
 * Varias rutas arman un filtro `.or("col.eq.<valor>,...")` de PostgREST
 * interpolando texto que viene directo del usuario (código de ticket, slug,
 * DNI). Si ese texto trae una coma, un paréntesis o un punto, puede inyectar
 * condiciones extra en el filtro en vez de compararse como valor literal.
 *
 * Esta whitelist deja pasar solo lo que un código, UUID, slug o DNI legítimo
 * puede tener. Cualquier otra cosa se rechaza antes de tocar la base.
 */
export function isSafeFilterValue(value: unknown): value is string {
  return typeof value === 'string' && /^[a-zA-Z0-9_-]+$/.test(value);
}
