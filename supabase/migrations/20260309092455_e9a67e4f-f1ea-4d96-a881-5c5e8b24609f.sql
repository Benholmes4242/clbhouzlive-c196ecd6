-- Reorder explore regions: USA, GB&I, Europe, Rest of World
UPDATE explore_regions SET sort_order = 1 WHERE slug = 'usa';
UPDATE explore_regions SET sort_order = 2 WHERE slug = 'uk-ireland';
UPDATE explore_regions SET sort_order = 3 WHERE slug = 'continental-europe';
UPDATE explore_regions SET sort_order = 4 WHERE slug = 'rest-of-world';