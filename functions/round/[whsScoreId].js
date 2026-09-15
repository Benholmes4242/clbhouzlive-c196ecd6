import { wantsPreview, genericDocument, isUuid } from '../_lib/og.js';
import { roundDocument } from '../_lib/round.js';

export async function onRequest(context) {
  const { request, params, next } = context;
  if (!wantsPreview(request)) return next();

  const scoreId = String(params.whsScoreId || '');
  if (!isUuid(scoreId)) return genericDocument(request);

  return roundDocument(request, scoreId);
}
