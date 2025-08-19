/**
 * Feature flags configuration
 * Allows enabling/disabling features via environment variables
 */

export const featureFlags = {
  autoLoadGroceries: process.env.FEATURE_AUTO_LOAD_GROCERIES === 'true',
  // Add more feature flags here as needed
  // exampleFeature: process.env.FEATURE_EXAMPLE === 'true',
} as const;

export type FeatureFlag = keyof typeof featureFlags;

/**
 * Check if a feature flag is enabled
 * @param flag - The feature flag to check
 * @returns true if the feature is enabled, false otherwise
 */
export function isFeatureEnabled(flag: FeatureFlag): boolean {
  return featureFlags[flag];
}