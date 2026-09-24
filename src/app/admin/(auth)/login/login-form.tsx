'use client'

import { useActionState } from 'react'
import { login } from '@/server/actions/auth'

export function LoginForm({ callbackUrl }: { callbackUrl?: string }) {
  const [state, action, pending] = useActionState(login, null)
  return (
    <form action={action} className="flex max-w-sm flex-col gap-3">
      <input type="hidden" name="callbackUrl" value={callbackUrl ?? ''} />
      <input name="email" type="email" autoComplete="username" required placeholder="Email" />
      <input name="password" type="password" autoComplete="current-password" required minLength={8} placeholder="Password" />
      {state?.error && <p role="alert">{state.error}</p>}
      <button type="submit" disabled={pending}>Sign in</button>
    </form>
  )
}
