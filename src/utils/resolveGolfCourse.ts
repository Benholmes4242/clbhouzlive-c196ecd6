/**
 * Canonical helper to resolve golf course data from a post.
 * 
 * Resolution priority:
 * 1. posts.course_id (direct FK) - preferred, used by newer posts
 * 2. post_tags with entity_type === 'golf_club' - legacy tagging system
 * 3. Content parsing (optional fallback) - very old posts
 * 
 * This ensures consistent golf course resolution across all surfaces.
 */

export interface ResolvedGolfCourse {
  id: string;
  name: string;
  country?: string;
  region?: string;
  sub_country?: string;
}

interface PostTag {
  entity_type?: string;
  entity_id?: string;
  name?: string;
  tagged_entity?: {
    entity_type?: string;
    entity_id?: string;
    name?: string;
  };
  taggable_entities?: {
    entity_type?: string;
    entity_id?: string;
    name?: string;
  };
}

interface PostWithCourseData {
  course_id?: string | null;
  post_tags?: PostTag[];
  content?: string | null;
}

interface CourseDetails {
  id: string;
  name: string;
  country?: string | null;
  region?: string | null;
  sub_country?: string | null;
}

/**
 * Resolves golf course from a post using the canonical priority order.
 * 
 * @param post - The post object containing course_id and/or post_tags
 * @param courseMap - Optional map of course IDs to full course details (for enrichment)
 * @returns Resolved golf course or null if none found
 */
export function resolveGolfCourse(
  post: PostWithCourseData,
  courseMap?: Map<string, CourseDetails>
): ResolvedGolfCourse | null {
  const isDev = import.meta.env.DEV;
  
  // Priority 1: Direct course_id FK (preferred for newer posts)
  if (post.course_id) {
    const fullCourse = courseMap?.get(post.course_id);
    if (fullCourse) {
      return {
        id: fullCourse.id,
        name: fullCourse.name,
        country: fullCourse.country || undefined,
        region: fullCourse.region || undefined,
        sub_country: fullCourse.sub_country || undefined,
      };
    }
    
    // Contract test: course_id exists but not in courseMap
    if (isDev && courseMap && courseMap.size > 0) {
      console.warn(
        `[resolveGolfCourse] ⚠️ post.course_id "${post.course_id}" exists but not found in courseMap (size: ${courseMap.size}). ` +
        `Returning minimal course data. Check if course was fetched.`
      );
    }
    
    // Return minimal info if we have the ID but no enrichment
    return {
      id: post.course_id,
      name: '', // Will need to be fetched
    };
  }

  // Priority 2: post_tags with golf_club entity type
  const golfClubTag = findGolfClubTag(post.post_tags);
  if (golfClubTag) {
    const courseId = golfClubTag.entityId;
    const fullCourse = courseMap?.get(courseId);
    
    if (fullCourse) {
      return {
        id: fullCourse.id,
        name: fullCourse.name,
        country: fullCourse.country || undefined,
        region: fullCourse.region || undefined,
        sub_country: fullCourse.sub_country || undefined,
      };
    }
    
    // Contract test: tag exists but course not in courseMap
    if (isDev && courseMap && courseMap.size > 0) {
      console.warn(
        `[resolveGolfCourse] ⚠️ golf_club tag found with entity_id "${courseId}" but not in courseMap (size: ${courseMap.size}). ` +
        `Returning tag data. Check if course was fetched.`
      );
    }
    
    return {
      id: courseId,
      name: golfClubTag.name || '',
    };
  }

  return null;
}

/**
 * Check if a post has any golf course reference (for UI safety net).
 * Use this to show "Played at" row even if full resolution fails.
 */
export function hasGolfCourseReference(post: PostWithCourseData): boolean {
  if (post.course_id) return true;
  return !!findGolfClubTag(post.post_tags);
}

/**
 * Get the raw course ID from a post without full resolution.
 * Useful for UI fallback when courseMap lookup fails.
 */
export function getRawCourseId(post: PostWithCourseData): string | null {
  if (post.course_id) return post.course_id;
  const tag = findGolfClubTag(post.post_tags);
  return tag?.entityId || null;
}

/**
 * Extract course ID from a post for batch fetching.
 * Returns the course_id or the first golf_club tag entity_id.
 */
export function extractCourseId(post: PostWithCourseData): string | null {
  // Priority 1: Direct FK
  if (post.course_id) {
    return post.course_id;
  }
  
  // Priority 2: Tag
  const golfClubTag = findGolfClubTag(post.post_tags);
  return golfClubTag?.entityId || null;
}

/**
 * Collect all course IDs from an array of posts for batch fetching.
 */
export function collectCourseIds(posts: PostWithCourseData[]): string[] {
  const ids = new Set<string>();
  
  for (const post of posts) {
    const courseId = extractCourseId(post);
    if (courseId) {
      ids.add(courseId);
    }
  }
  
  return Array.from(ids);
}

/**
 * Find golf club tag from various tag formats.
 * Handles: taggable_entities, tagged_entity, and direct entity_type fields.
 */
function findGolfClubTag(tags?: PostTag[]): { entityId: string; name?: string } | null {
  if (!tags || tags.length === 0) return null;
  
  for (const tag of tags) {
    // Format 1: taggable_entities (most common in joins)
    if (tag.taggable_entities?.entity_type === 'golf_club' && tag.taggable_entities.entity_id) {
      return {
        entityId: tag.taggable_entities.entity_id,
        name: tag.taggable_entities.name,
      };
    }
    
    // Format 2: tagged_entity (some legacy formats)
    if (tag.tagged_entity?.entity_type === 'golf_club' && tag.tagged_entity.entity_id) {
      return {
        entityId: tag.tagged_entity.entity_id,
        name: tag.tagged_entity.name,
      };
    }
    
    // Format 3: Direct entity_type on tag (flattened format)
    if (tag.entity_type === 'golf_club' && tag.entity_id) {
      return {
        entityId: tag.entity_id,
        name: tag.name,
      };
    }
  }
  
  return null;
}
