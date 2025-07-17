-- Fix all golf course URLs that are using the wrong domain
UPDATE golf_courses 
SET thumbnail_image = REPLACE(thumbnail_image, 'https://golf-courses.clbhouz.co.uk/', 'https://courses.clbhouz.co.uk/')
WHERE thumbnail_image LIKE 'https://golf-courses.clbhouz.co.uk/%';