import {
  wantsPreview,
  restSelect,
  metaDocument,
  genericDocument,
  canonicalUrl,
  clip,
  isUuid,
} from '../_lib/og.js';

function pickImage(media) {
  const list = (media || [])
    .slice()
    .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
  for (const item of list) {
    if (item.media_type === 'image' && item.media_url) return item.media_url;
    if (item.poster_url) return item.poster_url;
  }
  return null;
}

function formatDate(value) {
  if (!value) return '';
  try {
    return new Date(value).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

export async function onRequest(context) {
  const { request, params, next } = context;
  if (!wantsPreview(request)) return next();

  const postId = String(params.postId || '');
  if (!isUuid(postId)) return genericDocument(request);

  const select =
    'id,content,course_id,user_id,created_at,whs_score_id,post_media(media_url,poster_url,media_type,display_order)';
  const rows = await restSelect(
    `posts?select=${encodeURIComponent(select)}&id=eq.${postId}&limit=1`,
  );
  const post = rows[0];
  if (!post) return genericDocument(request);


  const [authors, courses] = await Promise.all([
    post.user_id
      ? restSelect(`public_profiles?select=display_name,username&id=eq.${post.user_id}&limit=1`)
      : Promise.resolve([]),
    post.course_id
      ? restSelect(`golf_courses?select=name,thumbnail_image&id=eq.${post.course_id}&limit=1`)
      : Promise.resolve([]),
  ]);

  const author = authors[0] || null;
  const course = courses[0] || null;
  const authorName = (author && (author.display_name || author.username)) || '';
  const courseName = (course && course.name) || '';

  let title = '';
  if (authorName && courseName) title = `${authorName} at ${courseName}`;
  else if (courseName) title = courseName;
  else if (authorName) title = authorName;

  let description = clip(post.content, 160);
  if (!description) {
    const date = formatDate(post.created_at);
    if (courseName && date) description = `${courseName} - ${date}`;
    else if (courseName) description = courseName;
    else if (date) description = `Posted on clbhouz - ${date}`;
  }

  // A round post with a generated share card leads the chain; anything else
  // keeps the existing behaviour (first media, then the course thumbnail).
  const roundCard = post.whs_score_id ? await roundShareCardUrl(post.id) : null;
  const image =
    roundCard || pickImage(post.post_media) || (course && course.thumbnail_image) || null;


  if (!title && !description && !image) return genericDocument(request);

  return metaDocument({
    title: title || undefined,
    description: description || undefined,
    image: image || undefined,
    type: 'article',
    url: canonicalUrl(request),
  });
}
