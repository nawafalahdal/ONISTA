import { z } from 'zod'
import { email } from './common'

export const loginSchema = z.object({
  email,
  // Upper bound prevents bcrypt DoS with huge inputs (bcrypt uses 72 bytes).
  password: z.string().min(8).max(128),
})
