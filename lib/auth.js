import crypto from 'crypto'

export function verifyUpdatePassword(providedPassword) {
  const expectedPassword = process.env.UPDATE_PASSWORD

  if (!expectedPassword) {
    throw new Error('Missing UPDATE_PASSWORD environment variable.')
  }

  if (typeof providedPassword !== 'string') {
    return false
  }

  const providedBuffer = Buffer.from(providedPassword)
  const expectedBuffer = Buffer.from(expectedPassword)

  if (providedBuffer.length !== expectedBuffer.length) {
    return false
  }

  return crypto.timingSafeEqual(providedBuffer, expectedBuffer)
}
