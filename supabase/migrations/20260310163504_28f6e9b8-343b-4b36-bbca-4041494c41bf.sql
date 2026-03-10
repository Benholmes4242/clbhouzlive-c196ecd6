ALTER TABLE posts DROP CONSTRAINT posts_actor_type_check;
ALTER TABLE posts ADD CONSTRAINT posts_actor_type_check CHECK (actor_type = ANY (ARRAY['personal'::text, 'business'::text, 'system'::text]));