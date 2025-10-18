/**
 * Simple pricing calculation for service assignments
 * 
 * Pricing Rules:
 * - 1st service: €250 (no discount)
 * - 2nd service: €200 (20% off)
 * - 3rd service: €175 (30% off)
 * - 4th service: €150 (40% off)
 * - 5th+ services: €125 (50% off max)
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

export function calculateServicePricing(serviceCount: number): PricingResult {
	if (serviceCount === 0) {
		return { total: 0, breakdown: [], savings: 0 };
	}
	
	const basePrice = 250;
	const breakdown: ServicePricing[] = [];
	let total = 0;
	
	for (let i = 1; i <= serviceCount; i++) {
		let discount = 0;
		
		if (i === 1) {
			discount = 0;
		} else if (i === 2) {
			discount = 0.2; // 20% off
		} else if (i === 3) {
			discount = 0.3; // 30% off
		} else if (i === 4) {
			discount = 0.4; // 40% off
		} else {
			discount = 0.5; // 50% off (max)
		}
		
		const finalPrice = basePrice * (1 - discount);
		total += finalPrice;
		
		breakdown.push({
			serviceNumber: i,
			basePrice,
			discount,
			finalPrice,
			discountPercentage: Math.round(discount * 100)
		});
	}
	
	const fullPrice = serviceCount * basePrice;
	const savings = fullPrice - total;
	
	return { total, breakdown, savings };
}
