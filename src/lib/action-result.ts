/**
 * Uniform Server Action result. `error` and field error values are i18n keys
 * (see messages/*.json → "Validation"), never raw server messages, so nothing
 * internal leaks to the client and both languages are supported.
 */
export type ErrorCode =
  | 'validation'
  | 'unauthorized'
  | 'rateLimited'
  | 'notFound'
  | 'conflict'
  | 'unavailableSamples'
  | 'invalidOtp'
  | 'generic'

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: ErrorCode; fieldErrors?: Record<string, string[]> }

export const ok = <T>(data: T): ActionResult<T> => ({ ok: true, data })
export const fail = (error: ErrorCode, fieldErrors?: Record<string, string[]>): ActionResult<never> => ({
  ok: false,
  error,
  ...(fieldErrors && { fieldErrors }),
})
