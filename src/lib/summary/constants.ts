/**
 * Character budgets for social-media post building.
 * These are shared between the summary fallback chain and the social-post
 * builders so both layers enforce the same constraints.
 *
 * X (Twitter):
 *   - 280 character hard limit per post.
 *   - Links always consume 23 characters (t.co fixed length), regardless of
 *     the actual URL length.
 *   - X_TEXT_BUDGET = 280 − 23 (link) − 1 (space before link)
 *
 * LinkedIn:
 *   - No hard character limit, but the "See more" truncation kicks in at
 *     roughly 210 characters for the first visible paragraph.
 *   - LINKEDIN_HOOK_TARGET is the practical target, not a hard limit.
 */

/** X/Twitter total character limit per post. */
export const X_CHAR_LIMIT = 280;

/** Fixed length X applies to every link (t.co shortener). */
export const X_LINK_RESERVED = 23;

/** Characters available for hook text on X (total − link − space). */
export const X_TEXT_BUDGET = X_CHAR_LIMIT - X_LINK_RESERVED - 1;

/**
 * Practical target for the LinkedIn hook — the visible-before-"see more"
 * threshold. Not a hard limit; LinkedIn allows longer posts.
 */
export const LINKEDIN_HOOK_TARGET = 210;
