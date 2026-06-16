/**
 * Optional feature banner image (developer setting).
 *
 * To use a custom photo:
 * 1. Add the image to `public/` (e.g. `public/feature-hero.jpg`)
 * 2. Set `FEATURE_HERO_IMAGE` below to that path (e.g. '/feature-hero.jpg')
 *
 * The banner will resize to match your image's aspect ratio at full width.
 * Leave as '' to show the default banner (headline, subtext, and illustrated cards).
 * You can also set `VITE_FEATURE_HERO_IMAGE` in `.env.local` instead of editing this file.
 */
const FEATURE_HERO_IMAGE_FROM_CONFIG = '';

export const FEATURE_HERO_IMAGE = (
  import.meta.env.VITE_FEATURE_HERO_IMAGE || FEATURE_HERO_IMAGE_FROM_CONFIG
).trim();

export const FEATURE_HERO_IMAGE_ALT = 'Featured highlight';
