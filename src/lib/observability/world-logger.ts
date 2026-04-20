type WorldLogLevel = 'info' | 'warn' | 'error'
type WorldLogMeta = Record<string, unknown>

function emit(level: WorldLogLevel, event: string, meta?: WorldLogMeta) {
  const payload = {
    ts: new Date().toISOString(),
    domain: 'living-world',
    event,
    ...(meta ?? {}),
  }
  if (level === 'error') {
    console.error('[LIVING-WORLD]', JSON.stringify(payload))
    return
  }
  if (level === 'warn') {
    console.warn('[LIVING-WORLD]', JSON.stringify(payload))
    return
  }
  console.log('[LIVING-WORLD]', JSON.stringify(payload))
}

export function logWorldInfo(event: string, meta?: WorldLogMeta) {
  emit('info', event, meta)
}

export function logWorldWarn(event: string, meta?: WorldLogMeta) {
  emit('warn', event, meta)
}

export function logWorldError(event: string, meta?: WorldLogMeta) {
  emit('error', event, meta)
}
