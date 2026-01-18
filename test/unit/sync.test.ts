import { describe, it, expect } from 'vitest'
import { getDefaultMeta, isStaleSync, SERVER_ID, SYNC_TIMEOUT } from '../../server/utils/sync'

describe('getDefaultMeta', () => {
  it('returns correct default values', () => {
    const meta = getDefaultMeta()

    expect(meta).toEqual({
      lastSync: null,
      isRunning: false,
      startedAt: null,
      totalModules: 0,
      syncedModules: 0,
      duration: null,
      error: null,
    })
  })
})

describe('isStaleSync', () => {
  it('returns not stale when sync is not running', () => {
    const meta = {
      ...getDefaultMeta(),
      isRunning: false,
    }

    expect(isStaleSync(meta)).toEqual({ stale: false })
  })

  it('returns stale when serverId is missing', () => {
    const meta = {
      ...getDefaultMeta(),
      isRunning: true,
      startedAt: new Date().toISOString(),
      // no serverId
    }

    const result = isStaleSync(meta)
    expect(result.stale).toBe(true)
    expect(result.reason).toContain('missing serverId')
  })

  it('returns stale when serverId differs (server restart)', () => {
    const meta = {
      ...getDefaultMeta(),
      isRunning: true,
      startedAt: new Date().toISOString(),
      serverId: 'different-server-id',
    }

    const result = isStaleSync(meta)
    expect(result.stale).toBe(true)
    expect(result.reason).toContain('server restarted')
  })

  it('returns stale when sync timed out', () => {
    const longAgo = new Date(Date.now() - SYNC_TIMEOUT - 60000).toISOString()
    const meta = {
      ...getDefaultMeta(),
      isRunning: true,
      startedAt: longAgo,
      serverId: SERVER_ID,
    }

    const result = isStaleSync(meta)
    expect(result.stale).toBe(true)
    expect(result.reason).toContain('timed out')
  })

  it('returns not stale when sync is healthy', () => {
    const meta = {
      ...getDefaultMeta(),
      isRunning: true,
      startedAt: new Date().toISOString(),
      serverId: SERVER_ID,
    }

    expect(isStaleSync(meta)).toEqual({ stale: false })
  })
})
