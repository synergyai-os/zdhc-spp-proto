// Re-export Convex types for cleaner imports
export type { Id } from '../convex/_generated/dataModel';

// Re-export commonly used Convex API
export { api } from '../convex/_generated/api';

// Re-export status utilities for cleaner imports
export * from '../convex/model/status';

// Re-export pricing utilities for cleaner imports
export {
	calculateServicePricing,
	calculateServicePricingTotal,
	type ServicePricing,
	type PricingResult
} from '../convex/pricing';