import { ChangePasswordForm } from './change-password-form'

export default function ChangePasswordPage() {
  return (
    <main className="grain relative grid min-h-screen place-items-center overflow-hidden px-5">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[80vmax] w-[80vmax] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,var(--c-glow),transparent_60%)]" />
      <ChangePasswordForm />
    </main>
  )
}
