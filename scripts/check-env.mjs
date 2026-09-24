// Runs first in `vercel-build`: fail fast with a readable list of missing
// variables instead of an obscure Prisma or Auth.js error later.
const required = ['DATABASE_URL', 'AUTH_SECRET', 'IP_HASH_SECRET', 'BUSINESS_WHATSAPP_NUMBER']
const missing = required.filter((k) => !process.env[k])
if (!process.env.AUTH_URL && process.env.AUTH_TRUST_HOST !== 'true') missing.push('AUTH_URL or AUTH_TRUST_HOST=true')

if (missing.length) {
  console.error('\n❌ Missing environment variables (Vercel → Settings → Environment Variables):')
  for (const k of missing) console.error(`   - ${k}`)
  console.error('\nSee .env.example for descriptions.\n')
  process.exit(1)
}
console.log('✓ Environment variables present')
