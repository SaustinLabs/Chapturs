type SchedulerLogLevel = 'info' | 'warn' | 'error'
type SchedulerLogMeta = Record<string, unknown>

function emit(level: SchedulerLogLevel, event: string, meta?: SchedulerLogMeta) {
  const payload = {
    ts: new Date().toISOString(),
    domain: 'scheduler',
    event,
    ...(meta ?? {}),
  }
  if (level === 'error') {
    console.error('[SCHEDULER]', JSON.stringify(payload))
    return
  }
  if (level === 'warn') {
    console.warn('[SCHEDULER]', JSON.stringify(payload))
    return
  }
  console.log('[SCHEDULER]', JSON.stringify(payload))
}

export function logSchedulerInfo(event: string, meta?: SchedulerLogMeta) {
  emit('info', event, meta)
}

export function logSchedulerWarn(event: string, meta?: SchedulerLogMeta) {
  emit('warn', event, meta)
}

export function logSchedulerError(event: string, meta?: SchedulerLogMeta) {
  emit('error', event, meta)
}
