import Pusher from 'pusher'

let pusherInstance: Pusher | null = null

function getRequiredEnv(name: string): string | null {
  const value = process.env[name]
  return value && value.trim().length > 0 ? value : null
}

export function getPusherServer(): Pusher | null {
  if (pusherInstance) return pusherInstance

  const appId = getRequiredEnv('PUSHER_APP_ID')
  const key = getRequiredEnv('PUSHER_KEY')
  const secret = getRequiredEnv('PUSHER_SECRET')
  const cluster = getRequiredEnv('PUSHER_CLUSTER')

  if (!appId || !key || !secret || !cluster) {
    return null
  }

  pusherInstance = new Pusher({
    appId,
    key,
    secret,
    cluster,
    useTLS: true,
  })

  return pusherInstance
}

export function sectionChannelName(workId: string, sectionId: string): string {
  return `private-work-${workId}-section-${sectionId}`
}

export async function publishSectionEvent(
  workId: string,
  sectionId: string,
  eventName: string,
  payload: Record<string, unknown>
) {
  const pusher = getPusherServer()
  if (!pusher) return

  await pusher.trigger(sectionChannelName(workId, sectionId), eventName, payload)
}
