import 'server-only'
import bcrypt from 'bcryptjs'

const COST = 12

export const hashPassword = (plain: string) => bcrypt.hash(plain, COST)

// Compared against when the account does not exist, so the response time does
// not reveal whether an e-mail is registered (user enumeration).
const DUMMY_HASH = bcrypt.hashSync('onista-timing-equaliser', COST)

export async function verifyPassword(plain: string, hash: string | null | undefined) {
  const ok = await bcrypt.compare(plain, hash ?? DUMMY_HASH)
  return ok && Boolean(hash)
}
