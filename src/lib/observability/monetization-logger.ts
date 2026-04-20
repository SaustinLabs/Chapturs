type MonetizationLogLevel = 'info' | 'warn' | 'error'

type MonetizationLogMeta = Record<string, unknown>

function emit(level: MonetizationLogLevel, event: string, meta?: MonetizationLogMeta) {
  const payload = {
    ts: new Date().toISOString(),
    domain: 'monetization',
    event,
    ...(meta ?? {}),
  }

  if (level === 'error') {
    console.error('[MONETIZATION]', JSON.stringify(payload))
    return
  }
  if (level === 'warn') {
    console.warn('[MONETIZATION]', JSON.stringify(payload))
    return
  }
  console.log('[MONETIZATION]', JSON.stringify(payload))
}

export function logMonetizationInfo(event: string, meta?: MonetizationLogMeta) {
  emit('info', event, meta)
}

export function logMonetizationWarn(event: string, meta?: MonetizationLogMeta) {
  emit('warn', event, meta)
}

export function logMonetizationError(event: string, meta?: MonetizationLogMeta) {
  emit('error', event, meta)
}
