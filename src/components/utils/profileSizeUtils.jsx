/**
 * Centralized profile size classification — SINGLE SOURCE OF TRUTH.
 * 
 * profile_size is derived from the LARGEST platform (max followers),
 * NOT the sum, to avoid distortions.
 *
 * Ranges (market standard):
 *   nano:  0 – 10,000
 *   micro: 10,001 – 50,000
 *   mid:   50,001 – 500,000
 *   macro: 500,001 – 1,000,000
 *   mega:  1,000,001+
 */

export const PROFILE_SIZE_RANGES = [
  { value: 'nano',  label: 'Nano',  max: 10000,    desc: 'Até 10K seguidores' },
  { value: 'micro', label: 'Micro', max: 50000,    desc: '10K – 50K seguidores' },
  { value: 'mid',   label: 'Mid',   max: 500000,   desc: '50K – 500K seguidores' },
  { value: 'macro', label: 'Macro', max: 1000000,  desc: '500K – 1M seguidores' },
  { value: 'mega',  label: 'Mega',  max: Infinity,  desc: '1M+ seguidores' },
];

/**
 * Returns the profile_size string for a given follower count.
 * Use with getMaxFollowers() for correct classification.
 */
export function getProfileSize(followers) {
  const n = Number(followers) || 0;
  if (n <= 10000) return 'nano';
  if (n <= 50000) return 'micro';
  if (n <= 500000) return 'mid';
  if (n <= 1000000) return 'macro';
  return 'mega';
}

/**
 * Get the MAX followers from a platforms array (largest platform).
 * This is the correct way to classify — NOT sum.
 */
export function getMaxFollowers(platforms) {
  if (!platforms || !Array.isArray(platforms) || platforms.length === 0) return 0;
  return Math.max(...platforms.map(p => Number(p.followers) || 0));
}

/**
 * Get total followers from a platforms array (for display only).
 */
export function getTotalFollowers(platforms) {
  if (!platforms || !Array.isArray(platforms)) return 0;
  return platforms.reduce((sum, p) => sum + (Number(p.followers) || 0), 0);
}

/**
 * Compute profile_size from platforms array (convenience).
 */
export function computeProfileSize(platforms) {
  return getProfileSize(getMaxFollowers(platforms));
}

/**
 * Format follower count for display.
 */
export function formatFollowers(num) {
  const n = Number(num) || 0;
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return String(n);
}

/**
 * Follower range options for platform selects (onboarding & profile).
 * Each range maps to a midpoint value stored in DB.
 */
export const FOLLOWER_RANGES = [
  { label: '0 – 100',       value: '50',      midpoint: 50 },
  { label: '100 – 1K',      value: '500',     midpoint: 500 },
  { label: '1K – 5K',       value: '3000',    midpoint: 3000 },
  { label: '5K – 10K',      value: '7500',    midpoint: 7500 },
  { label: '10K – 50K',     value: '30000',   midpoint: 30000 },
  { label: '50K – 100K',    value: '75000',   midpoint: 75000 },
  { label: '100K – 500K',   value: '300000',  midpoint: 300000 },
  { label: '500K – 1M',     value: '750000',  midpoint: 750000 },
  { label: '1M+',           value: '2000000', midpoint: 2000000 },
];

/**
 * Get the label for a profile_size value.
 */
export function getProfileSizeLabel(size) {
  const found = PROFILE_SIZE_RANGES.find(r => r.value === size);
  return found ? `${found.label} (${found.desc})` : size || '—';
}