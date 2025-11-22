import { beforeEach, describe, expect, it, vi } from 'vitest'

import worker, { type Env } from '../src/index'

vi.mock('cloudflare:email', () => {
  class EmailMessage {
    from: string
    to: string
    raw: string

    constructor(from: string, to: string, raw: string) {
      this.from = from
      this.to = to
      this.raw = raw
    }
  }

  return { EmailMessage }
})

function makeRequest(body: unknown, token = 'secret'): Request {
  return new Request('http://localhost/sendmail', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  })
}

describe('/sendmail API', () => {
  const sendMock = vi.fn()
  const baseEnv: Env = {
    SENDMAIL_API_KEY: 'secret',
    FROM_ADDRESS: 'from@example.com',
    TO_ADDRESS: 'to@example.com',
    EMAIL: { send: sendMock },
  }

  beforeEach(() => {
    sendMock.mockReset()
  })

  it('returns 404 for other paths', async () => {
    const res = await worker.fetch(new Request('http://localhost/health', { method: 'GET' }), baseEnv)
    expect(res.status).toBe(404)
  })

  it('rejects non-POST methods', async () => {
    const res = await worker.fetch(new Request('http://localhost/sendmail', { method: 'GET' }), baseEnv)
    expect(res.status).toBe(405)
  })

  it('rejects missing or invalid authorization', async () => {
    const res = await worker.fetch(makeRequest({ subject: 'Hi', body: 'Hello' }, 'wrong'), baseEnv)
    expect(res.status).toBe(401)
  })

  it('returns 400 for invalid payload', async () => {
    const res = await worker.fetch(makeRequest({ subject: ' ', body: '' }), baseEnv)
    expect(res.status).toBe(400)
  })

  it('sends email when authorized and payload is valid', async () => {
    const res = await worker.fetch(makeRequest({ subject: 'Hello', body: 'World' }), baseEnv)

    expect(res.status).toBe(200)
    expect(sendMock).toHaveBeenCalledTimes(1)

    const message = sendMock.mock.calls[0][0] as { raw: string }
    expect(message.raw).toContain('Subject: Hello')
    expect(message.raw).toContain('World')
  })
})
