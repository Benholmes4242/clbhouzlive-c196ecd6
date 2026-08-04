import {
  wantsPreview,
  restSelect,
  metaDocument,
  genericDocument,
  canonicalUrl,
  isUuid,
} from '../_lib/og.js';

export async function onRequest(context) {
  const { request, params, next } = context;
  if (!wantsPreview(request)) return next();

  const courseId = String(params.courseId || '');
  if (!isUuid(courseId)) return genericDocument(request);

  const rows = await restSelect(
    `golf_courses?select=name,region,sub_country,country,thumbnail_image&id=eq.${courseId}&limit=1`,
  );
  const course = rows[0];
  if (!course || !course.name) return genericDocument(request);

  const ratings = await restSelect(
    `course_ratings?select=rating&course_id=eq.${courseId}&limit=1000`,
  );
  const values = ratings.map((r) => Number(r.rating)).filter((n) => Number.isFinite(n) && n > 0);

  const place = [course.region, course.sub_country || course.country]
    .filter((part) => part && String(part).trim())
    .filter((part, i, arr) => arr.indexOf(part) === i)
    .join(', ');

  const facts = [];
  if (place) facts.push(place);
  if (values.length > 0) {
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    facts.push(
      `${avg.toFixed(1)} from ${values.length} ${values.length === 1 ? 'review' : 'reviews'}`,
    );
  }

  return metaDocument({
    title: course.name,
    description: facts.length ? facts.join(' - ') : undefined,
    image: course.thumbnail_image || undefined,
    type: 'website',
    url: canonicalUrl(request),
  });
}
