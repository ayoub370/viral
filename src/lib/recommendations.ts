import { supabase } from './api';

// All available video categories from Pixabay & Pexels
export const VIDEO_CATEGORIES = [
  'nature', 'travel', 'animals', 'city', 'beach', 'forest',
  'mountains', 'ocean', 'sunset', 'wildlife', 'landscape',
  'adventure', 'drone', 'aerial', 'waterfall', 'food',
  'architecture', 'people', 'sports', 'technology', 'cars',
  'fashion', 'music', 'dance', 'fitness', 'cooking', 'art',
  'space', 'flowers', 'snow', 'desert',
] as const;

export type VideoCategory = typeof VIDEO_CATEGORIES[number];

// Exploration ratio: 25% of the feed is non-preferred categories for discovery
const EXPLORATION_RATIO = 0.25;
// Min weight for any category (so nothing is fully excluded)
const MIN_WEIGHT = 0.02;

interface CategoryCount {
  category: string;
  count: number;
}

/**
 * Fetch the user's liked categories with their like counts.
 * Returns a map of category -> like count.
 */
export async function getUserCategoryPreferences(): Promise<Map<string, number>> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Map();

  const { data, error } = await supabase
    .from('liked_videos')
    .select('category')
    .eq('user_id', user.id)
    .not('category', 'is', null);

  if (error || !data) return new Map();

  const counts = new Map<string, number>();
  for (const row of data) {
    if (row.category) {
      counts.set(row.category, (counts.get(row.category) || 0) + 1);
    }
  }

  return counts;
}

/**
 * Build a weighted category distribution based on user preferences.
 * - Liked categories get weight proportional to their like count.
 * - All other categories get a minimum weight for exploration.
 * - Returns an array of categories, where preferred categories appear
 *   more frequently (for batch fetching).
 *
 * @param batchSize - Total number of category slots to generate
 * @returns Array of category strings to fetch videos for
 */
export function buildCategoryQueue(
  preferences: Map<string, number>,
  batchSize: number = 20
): string[] {
  const totalCategories = VIDEO_CATEGORIES.length;

  // Calculate raw weights
  const weights = new Map<string, number>();
  const totalLikes = Array.from(preferences.values()).reduce((sum, c) => sum + c, 0);

  for (const cat of VIDEO_CATEGORIES) {
    const likeCount = preferences.get(cat) || 0;
    if (likeCount > 0 && totalLikes > 0) {
      // Preferred category: weight proportional to likes, scaled to (1 - EXPLORATION_RATIO)
      const preferenceShare = likeCount / totalLikes;
      weights.set(cat, preferenceShare * (1 - EXPLORATION_RATIO));
    } else {
      // Non-preferred: distribute the exploration budget equally
      const nonPreferredCount = totalCategories - preferences.size;
      if (nonPreferredCount > 0) {
        weights.set(cat, EXPLORATION_RATIO / nonPreferredCount);
      } else {
        weights.set(cat, MIN_WEIGHT);
      }
    }
  }

  // Ensure minimum weight for all
  for (const cat of VIDEO_CATEGORIES) {
    if ((weights.get(cat) || 0) < MIN_WEIGHT) {
      weights.set(cat, MIN_WEIGHT);
    }
  }

  // Normalize weights
  const totalWeight = Array.from(weights.values()).reduce((sum, w) => sum + w, 0);

  // Build the queue using weighted random sampling
  const queue: string[] = [];
  for (let i = 0; i < batchSize; i++) {
    let r = Math.random() * totalWeight;
    for (const cat of VIDEO_CATEGORIES) {
      r -= (weights.get(cat) || 0);
      if (r <= 0) {
        queue.push(cat);
        break;
      }
    }
    // Fallback
    if (queue.length <= i) {
      queue.push(VIDEO_CATEGORIES[i % totalCategories]);
    }
  }

  return queue;
}

/**
 * Get the next category to fetch based on user preferences.
 * Uses a sliding window approach: maintains a queue and refills it
 * when it gets low, ensuring variety while prioritizing preferences.
 */
export class RecommendationEngine {
  private queue: string[] = [];
  private preferences: Map<string, number> = new Map();
  private loaded = false;
  private loading = false;

  async init() {
    if (this.loaded || this.loading) return;
    this.loading = true;
    this.preferences = await getUserCategoryPreferences();
    this.refillQueue();
    this.loaded = true;
    this.loading = false;
  }

  private refillQueue() {
    const newCategories = buildCategoryQueue(this.preferences, 30);
    this.queue.push(...newCategories);
  }

  /**
   * Get the next category. Refills the queue when it drops below 10.
   */
  nextCategory(): string {
    if (!this.loaded || this.queue.length === 0) {
      // Fallback: random category
      return VIDEO_CATEGORIES[Math.floor(Math.random() * VIDEO_CATEGORIES.length)];
    }

    if (this.queue.length < 10) {
      this.refillQueue();
    }

    return this.queue.shift()!;
  }

  /**
   * Record that the user liked a video from a given category.
   * Updates the in-memory preferences so future recommendations adapt.
   */
  recordLike(category: string) {
    if (!category) return;
    this.preferences.set(category, (this.preferences.get(category) || 0) + 1);
  }

  /**
   * Record that the user unliked a video from a given category.
   */
  recordUnlike(category: string) {
    if (!category) return;
    const current = this.preferences.get(category) || 0;
    if (current > 0) {
      this.preferences.set(category, current - 1);
    }
  }

  /**
   * Get the user's top preferred categories (for display/debugging).
   */
  getTopCategories(limit: number = 5): string[] {
    return Array.from(this.preferences.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([cat]) => cat);
  }

  isLoaded() {
    return this.loaded;
  }

  reset() {
    this.queue = [];
    this.preferences = new Map();
    this.loaded = false;
  }
}

export const recommendationEngine = new RecommendationEngine();
