import { z } from 'zod'
import { MSG, id } from './common'

export const OTP_LENGTH = 6

/**
 * How long a proof-of-delivery code stays valid after the kitchen mints it.
 * Re-marking a drop ready refreshes `preparedAt`, which renews the window
 * without changing the digits the café is already looking at.
 */
export const OTP_TTL_MS = 24 * 60 * 60 * 1000

export const deliveryPickupSchema = z.object({ deliveryId: id })

export const deliveryConfirmSchema = z.object({
  deliveryId: id,
  // Digits only: the café reads a 6-digit code off its dashboard.
  otpCode: z
    .string()
    .trim()
    .regex(new RegExp(`^\\d{${OTP_LENGTH}}$`), { error: MSG.invalid }),
})
