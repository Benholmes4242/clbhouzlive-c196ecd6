-- Set hero images to the #1 course per region according to Clbhouz ratings
-- GB&I: Royal County Down (Championship)
UPDATE explore_regions 
SET hero_image_url = 'https://media.clbhouz.co.uk/courses/1751019826333-fvps9vadl5.jpg'
WHERE slug = 'uk-ireland';

-- Continental Europe: Morfontaine (Grand Parcours)
UPDATE explore_regions 
SET hero_image_url = 'https://media.clbhouz.co.uk/6a5bcbb9-c22c-4655-ad8e-088b2858ca3e/clbhouz-course-images/1764577838083-7xnmvqr74d4.jpg'
WHERE slug = 'continental-europe';

-- USA: Cypress Point Club
UPDATE explore_regions 
SET hero_image_url = 'https://media.clbhouz.co.uk/8c240997-b6a1-408c-a953-794bc17ee35c/clbhouz-course-images/1770889790439-lsipy8ag5de.jpeg'
WHERE slug = 'usa';

-- Rest of World: Cypress Point (global #1)
UPDATE explore_regions 
SET hero_image_url = 'https://media.clbhouz.co.uk/8c240997-b6a1-408c-a953-794bc17ee35c/clbhouz-course-images/1770889790439-lsipy8ag5de.jpeg'
WHERE slug = 'rest-of-world';