/**
 * Centralized profile size classification based on total followers.
 * 
 * Ranges (market standard):
 *   nano:  0 – 10,000
 *   micro: 10,001 – 50,000
 *   mid:   50,001 – 100,000
 *   macro: 100,001 – 500,000
 *   mega:  500,001+
 */

export const PROFILE_SIZE_RANGES = [
  { value: 'nano',  label: 'Nano',  max: 10000,  desc: 'Até 10K seguidores' },
  { value: 'micro', label: 'Micro', max: 50000,  desc: '10K – 50K seguidores' },
  { value: 'mid',   label: 'Mid',   max: 100000, desc: '50K – 100K seguidores' },
  { value: 'macro', label: 'Macro', max: 500000, desc: '100K – 500K seguidores' },
  { value: 'mega',  label: 'Mega',  max: Infinity, desc: '500K+ seguidores' },
];

/**
 * Returns the profile_size string for a given total follower count.
 */
export function getProfileSize(totalFollowers) {
  const n = Number(totalFollowers) || 0;
  if (n <= 10000) return 'nano';
  if (n <= 50000) return 'micro';
  if (n <= 100000) return 'mid';
  if (n <= 500000) return 'macro';
  return 'mega';
}

/**
 * Get total followers from a platforms array.
 */
export function getTotalFollowers(platforms) {
  if (!platforms || !Array.isArray(platforms)) return 0;
  return platforms.reduce((sum, p) => sum + (Number(p.followers) || 0), 0);
}

/**
 * Format follower count for display.
 */
export function formatFollowers(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return String(num);
}

/**
 * Follower range options for onboarding select (UX improvement).
 * Each range has a label, a representative midpoint for storage, and min/max.
 */
export const FOLLOWER_RANGES = [
  { label: '0 – 100',       min: 0,       max: 100,     midpoint: 50 },
  { label: '101 – 500',     min: 101,     max: 500,     midpoint: 300 },
  { label: '501 – 1K',      min: 501,     max: 1000,    midpoint: 750 },
  { label: '1K – 5K',       min: 1000,    max: 5000,    midpoint: 3000 },
  { label: '5K – 10K',      min: 5000,    max: 10000,   midpoint: 7500 },
  { label: '10K – 50K',     min: 10000,   max: 50000,   midpoint: 30000 },
  { label: '50K – 100K',    min: 50000,   max: 100000,  midpoint: 75000 },
  { label: '100K – 500K',   min: 100000,  max: 500000,  midpoint: 300000 },
  { label: '500K – 1M',     min: 500000,  max: 1000000, midpoint: 750000 },
  { label: '+1M',           min: 1000000, max: Infinity, midpoint: 2000000 },
];

/**
 * Find the follower range label for a given number.
 */
export function getFollowerRangeLabel(followers) {
  const n = Number(followers) || 0;
  for (const range of FOLLOWER_RANGES) {
    if (n >= range.min && n <= range.max) return range.label;
  }
  return FOLLOWER_RANGES[FOLLOWER_RANGES.length - 1].label;
}