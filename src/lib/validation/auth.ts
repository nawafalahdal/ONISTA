import { z } from 'zod'
import { email } from './common'

export const loginSchema = z.object({
  email,
  // TODO(before launch): raise the minimum again (preview phase allows short
  // admin passwords). The upper bound prevents bcrypt DoS with huge inputs.
  password: z.string().min(1).max(128),
})
