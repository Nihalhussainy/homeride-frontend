export const PRICING_CONSTANTS = {
    BASE_FARE: 50.0,
    RATE_PER_KM_SHORT: 2.2,      // < 100km
    RATE_PER_KM_MEDIUM: 2.0,     // 100-300km
    RATE_PER_KM_LONG: 1.8,       // > 300km
    MIN_RECOMMENDED_PRICE: 50.0,
    MIN_ABSOLUTE_PRICE: 50.0,
    MIN_SEGMENT_PRICE: 30.0,
    TOTAL_MIN_FACTOR: 0.6,
    TOTAL_MAX_FACTOR: 1.7,
    SEGMENT_MIN_FACTOR: 0.5,
    SEGMENT_MAX_FACTOR: 2.0,
    MIN_RANGE_PRICE: 100.0,
    MIN_SEGMENT_RANGE_PRICE: 50.0,
};

const roundToNearest10 = (price) => Math.round(price / 10.0) * 10.0;

/**
 * Calculate recommended price based on DISTANCE ONLY
 * No hardcoded routes, completely dynamic
 */
const calculateRecommendedPrice = (distanceKm) => {
    if (!distanceKm || distanceKm <= 0) return PRICING_CONSTANTS.MIN_RECOMMENDED_PRICE;

    let rate;
    if (distanceKm < 100) {
        rate = PRICING_CONSTANTS.RATE_PER_KM_SHORT;
    } else if (distanceKm <= 300) {
        rate = PRICING_CONSTANTS.RATE_PER_KM_MEDIUM;
    } else {
        rate = PRICING_CONSTANTS.RATE_PER_KM_LONG;
    }

    const calculatedPrice = PRICING_CONSTANTS.BASE_FARE + (distanceKm * rate);
    return Math.max(PRICING_CONSTANTS.MIN_RECOMMENDED_PRICE, roundToNearest10(calculatedPrice));
};

/**
 * Get total price range for entire ride
 * Based ONLY on total distance, completely dynamic
 */
export const getTotalPriceRange = (totalDistanceKm) => {
    const recommended = calculateRecommendedPrice(totalDistanceKm);
    let minPrice = roundToNearest10(recommended * PRICING_CONSTANTS.TOTAL_MIN_FACTOR);
    minPrice = Math.max(PRICING_CONSTANTS.MIN_ABSOLUTE_PRICE, minPrice);
    let maxPrice = roundToNearest10(recommended * PRICING_CONSTANTS.TOTAL_MAX_FACTOR);
    maxPrice = Math.max(minPrice + PRICING_CONSTANTS.MIN_RANGE_PRICE, maxPrice);

    console.log(`Total Price Range for ${totalDistanceKm}km: Min=${minPrice}, Rec=${recommended}, Max=${maxPrice}`);
    return { recommendedPrice: recommended, minPrice, maxPrice };
};

/**
 * Get segment price range for ONE segment
 * Based ONLY on segment distance, completely dynamic
 */
export const getSegmentPriceRange = (segmentDistanceKm) => {
    const recommended = calculateRecommendedPrice(segmentDistanceKm);
    let minPrice = roundToNearest10(recommended * PRICING_CONSTANTS.SEGMENT_MIN_FACTOR);
    minPrice = Math.max(PRICING_CONSTANTS.MIN_SEGMENT_PRICE, minPrice);
    let maxPrice = roundToNearest10(recommended * PRICING_CONSTANTS.SEGMENT_MAX_FACTOR);
    maxPrice = Math.max(minPrice + PRICING_CONSTANTS.MIN_SEGMENT_RANGE_PRICE, maxPrice);

    console.log(`Segment Price Range for ${segmentDistanceKm}km: Min=${minPrice}, Rec=${recommended}, Max=${maxPrice}`);
    return { recommendedPrice: recommended, minPrice, maxPrice };
};