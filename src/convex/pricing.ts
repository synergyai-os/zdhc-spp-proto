/**
 * SINGLE SOURCE OF TRUTH for pricing calculations
 * Used by both frontend (src/lib/, src/routes/) and backend (Convex functions)
 * 
 * Pricing Rules:
 * - 1 service: €250
 * - 2 services: €400 total (€200 per service)
 * - 3 services: €600 total (€150 per service)
 * - 4 services: €600 total (€150 per service)
 * - 5+ services: €150 per service
 */

export interface ServicePricing {
	serviceNumber: number;
	basePrice: number;
	discount: number;
	finalPrice: number;
	discountPercentage: number;
}

export interface PricingResult {
	total: number;
	breakdown: ServicePricing[];
	savings: number;
}

/**
 * Calculate full pricing breakdown for a given number of service assignments
 * Returns detailed breakdown with per-service pricing, discounts, and totals
 * Used by frontend for displaying pricing details
 */
export function calculateServicePricing(serviceCount: number): PricingResult {
	if (serviceCount === 0) {
		return { total: 0, breakdown: [], savings: 0 };
	}
	
	const basePrice = 250;
	const breakdown: ServicePricing[] = [];
	let total = 0;
	
	// New pricing model:
	// 1 service: €250
	// 2 services: €400 total (€200 per service)
	// 3+ services: €150 per service
	if (serviceCount === 1) {
		const finalPrice = 250;
		total = finalPrice;
		breakdown.push({
			serviceNumber: 1,
			basePrice,
			discount: 0,
			finalPrice,
			discountPercentage: 0
		});
	} else if (serviceCount === 2) {
		const finalPrice = 200;
		total = 400;
		for (let i = 1; i <= 2; i++) {
			breakdown.push({
				serviceNumber: i,
				basePrice,
				discount: 0.2, // 20% off from €250
				finalPrice,
				discountPercentage: 20
			});
		}
	} else {
		// 3+ services: €150 per service
		const finalPrice = 150;
		for (let i = 1; i <= serviceCount; i++) {
			const discount = 1 - (finalPrice / basePrice); // 40% off from €250
			breakdown.push({
				serviceNumber: i,
				basePrice,
				discount,
				finalPrice,
				discountPercentage: 40
			});
			total += finalPrice;
		}
	}
	
	const fullPrice = serviceCount * basePrice;
	const savings = fullPrice - total;
	
	return { total, breakdown, savings };
}

/**
 * Calculate total payment amount only (simplified version for backend)
 * Uses the same pricing logic as calculateServicePricing but returns just the total
 */
export function calculateServicePricingTotal(serviceCount: number): number {
	const result = calculateServicePricing(serviceCount);
	return result.total;
}

