import { z } from 'zod'
import { text } from './common'

export const siteContentSchema = z.object({
  aboutBodyAr: text({ min: 10, max: 2000, multiline: true }),
  aboutBodyEn: text({ min: 10, max: 2000, multiline: true }),
  statSinceYear: text({ min: 1, max: 20 }),
  statPartnerCafes: text({ min: 1, max: 20 }),
  statOnTimeRate: text({ min: 1, max: 20 }),
  heroTaglineAr: text({ min: 1, max: 200 }),
  heroTaglineEn: text({ min: 1, max: 200 }),
})
export type SiteContentInput = z.input<typeof siteContentSchema>
