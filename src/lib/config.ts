/**
 * Centralized configuration for hardcoded values
 * 
 * This file contains all the hardcoded IDs and values used throughout the application.
 * Change values here to update them everywhere.
 */

// ==========================================
// ORGANIZATION CONFIGURATION
// ==========================================

/**
 * Default organization ID for development/testing
 * Change this value to switch to a different organization
 */
// Test Org 1: export const DEFAULT_ORG_ID = 'j975t878dn66x7br1076wb7ey17skxyg';
export const DEFAULT_ORG_ID = 'j97b4b01nyqmntkwyskrdgnc517sjbp7';
/**
 * Default expert ID for testing (if needed)
 */
export const DEFAULT_EXPERT_ID = 'jd7516kvax1aqcydbq4y540p3d7snf5q';

// ==========================================
// DEVELOPMENT CONFIGURATION
// ==========================================

/**
 * Development mode flag
 */
export const IS_DEVELOPMENT = true;

/**
 * Enable debug logging
 */
export const DEBUG_MODE = true;

// ==========================================
// PAYMENT CONFIGURATION
// ==========================================

/**
 * Payment expiration period in milliseconds
 * Currently set to 1 year (365 days)
 */
export const PAYMENT_EXPIRY_PERIOD_MS = 365 * 24 * 60 * 60 * 1000; // 1 year in milliseconds


// ==========================================
// FUTURE CONFIGURATION
// ==========================================

/**
 * Add more configuration values here as needed:
 * - API endpoints
 * - Feature flags
 * - Default values
 * - Environment-specific settings
 */
