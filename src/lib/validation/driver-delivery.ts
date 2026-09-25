import { z } from 'zod'
import { MSG, id } from './common'

export const OTP_LENGTH = 6

export const deliveryPickupSchema = z.object({ deliveryId: id })

export const deliveryConfirmSchema = z.object({
  deliveryId: id,
  // Digits only: the café reads a 6-digit code off its dashboard.
  otpCode: z
    .string()
    .trim()
    .regex(new RegExp(`^\\d{${OTP_LENGTH}}$`), { error: MSG.invalid }),
})
