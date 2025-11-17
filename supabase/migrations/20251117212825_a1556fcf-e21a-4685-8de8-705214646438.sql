-- Add studio_edits column to post_media for storing filter and future editing metadata
alter table post_media
add column studio_edits jsonb null;

comment on column post_media.studio_edits is 'Stores Studio editing metadata like filters, crops, etc. Example: {"filter": "vivid"}';