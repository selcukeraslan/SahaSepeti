import { z } from 'zod'

/**
 * Postgres `uuid` tipiyle uyumlu, gevşek UUID biçim doğrulaması.
 *
 * Zod'un `.uuid()`'i RFC 9562-katıdır (sürüm nibble 1-8 + variant nibble 8/9/a/b
 * ŞART); bu yüzden seed/demo UUID'lerini (ör. `a0000000-0000-0000-0000-000000000001`)
 * Postgres kabul etse bile REDDEDER. Bu kimlikler kullanıcıdan değil DB'den geldiği
 * için istemcide yalnızca 8-4-4-4-12 hex biçim kontrolü yeterli ve doğrudur.
 */
export const UUID_REGEX =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/

export function uuid(message = 'Geçersiz kimlik') {
  return z.string().regex(UUID_REGEX, message)
}
