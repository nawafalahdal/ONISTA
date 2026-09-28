/** Onista delivers within Jeddah only — used to pin the city field on every address form. */
export const JEDDAH: Record<string, string> = { ar: 'جدة', en: 'Jeddah' }

/**
 * The two windows a café can pick for a drop-off, stored on
 * Delivery.timeWindow. Arrival within the window is approximate — traffic
 * moves it around, which is what Schedule.timeWindowNotice tells the café.
 */
export const DELIVERY_WINDOWS = ['04:00-08:00', '14:00-16:00'] as const
export type DeliveryWindow = (typeof DELIVERY_WINDOWS)[number]
