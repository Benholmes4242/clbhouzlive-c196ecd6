-- Add mock reviews for testing Course Details page UI
-- 5 reviews for Pine Valley Golf Course
-- 5 reviews for Royal County Down Golf Club

-- Pine Valley reviews
INSERT INTO course_ratings (
  course_id,
  user_id,
  rating,
  review,
  design_score,
  condition_score,
  clubhouse_score,
  facilities_score,
  review_date,
  created_at
) VALUES
-- Pine Valley Review 1: 9/10 - Long detailed review
(
  'e0ddbda4-ddad-4ce9-bf1b-018109102cde',
  'f8285928-d21b-4605-a1c9-88894ca3661f',
  9.0,
  'Absolutely stunning course. The layout is masterful and every hole presents a unique challenge. The conditions were impeccable, and the staff made us feel incredibly welcome. The clubhouse has a rich history that you can feel in every corner. Only minor point is the facilities could use a small update, but honestly it doesn''t detract from the overall experience. This is a bucket list course for any serious golfer.',
  9.5,
  9.0,
  8.5,
  8.0,
  NOW() - INTERVAL '15 days',
  NOW() - INTERVAL '15 days'
),
-- Pine Valley Review 2: 8/10 - Medium review
(
  'e0ddbda4-ddad-4ce9-bf1b-018109102cde',
  '6b2a1a1c-8dcc-4317-aa0c-a0fdbbfb65ea',
  8.5,
  'A truly world-class golf experience. The course design is phenomenal and the conditioning is top-notch. Some of the best greens I''ve ever putted on. The only reason I''m not giving it a perfect 10 is the price point, but you definitely get what you pay for here.',
  9.0,
  9.5,
  8.0,
  8.5,
  NOW() - INTERVAL '42 days',
  NOW() - INTERVAL '42 days'
),
-- Pine Valley Review 3: 8/10 - Short review
(
  'e0ddbda4-ddad-4ce9-bf1b-018109102cde',
  'e0f59f5b-32e4-4284-abba-45d930211a5e',
  8.0,
  'Fantastic course with challenging holes and beautiful scenery. Worth every penny!',
  8.5,
  8.0,
  7.5,
  8.0,
  NOW() - INTERVAL '67 days',
  NOW() - INTERVAL '67 days'
),
-- Pine Valley Review 4: 6/10 - Medium critical review
(
  'e0ddbda4-ddad-4ce9-bf1b-018109102cde',
  '4cad4585-ba86-43f3-af37-d765204b4785',
  6.5,
  'The course itself is beautiful and well-maintained, but I felt the overall experience didn''t quite live up to the hype. Some holes felt repetitive and the pace of play was slower than expected. Clubhouse is nice but showing its age. Good course, but there are better options in the area for the price.',
  7.0,
  7.5,
  6.0,
  6.0,
  NOW() - INTERVAL '89 days',
  NOW() - INTERVAL '89 days'
),
-- Pine Valley Review 5: 4/10 - Short negative review
(
  'e0ddbda4-ddad-4ce9-bf1b-018109102cde',
  'f1900dd7-e546-4709-afbf-df8279f216d2',
  4.5,
  'Overrated and overpriced. The course is fine but nothing special. Expected much more for what you pay.',
  5.0,
  6.0,
  4.0,
  4.0,
  NOW() - INTERVAL '120 days',
  NOW() - INTERVAL '120 days'
),

-- Royal County Down reviews
-- Review 1: 9.5/10 - Long enthusiastic review
(
  '29b33f45-7dd0-468b-ab29-046a0bda9832',
  '80c2759e-cd45-4d55-8b37-1d4b750eb53b',
  9.5,
  'One of the finest links courses in the world, and it lives up to every bit of the reputation. The views of the Mourne Mountains are breathtaking, and the course routing is absolutely brilliant. The conditioning was perfect despite challenging weather. Traditional clubhouse with excellent service and hospitality. The back nine is particularly spectacular. This is links golf at its absolute finest. Cannot recommend highly enough!',
  10.0,
  9.0,
  9.0,
  9.0,
  NOW() - INTERVAL '8 days',
  NOW() - INTERVAL '8 days'
),
-- Review 2: 8.5/10 - Medium positive review
(
  '29b33f45-7dd0-468b-ab29-046a0bda9832',
  'e44b8cbe-1d40-48d3-978f-1fa5e250ddde',
  8.5,
  'Incredible links experience with stunning mountain backdrop. The course is challenging but fair, with amazing natural features. The greens were running beautifully. Clubhouse is charming and historic. Only minor complaint is limited practice facilities, but that''s being picky.',
  9.0,
  8.5,
  8.0,
  7.5,
  NOW() - INTERVAL '28 days',
  NOW() - INTERVAL '28 days'
),
-- Review 3: 8/10 - Medium review
(
  '29b33f45-7dd0-468b-ab29-046a0bda9832',
  'cd539b83-313c-406c-932e-914b5cb44f1e',
  8.0,
  'A must-play for any links golf enthusiast. The natural landscape is used brilliantly in the routing. Blind shots add to the challenge and adventure. Some of the best par 3s I''ve ever played. Weather can be brutal but that''s part of the charm.',
  8.5,
  8.0,
  7.5,
  7.5,
  NOW() - INTERVAL '55 days',
  NOW() - INTERVAL '55 days'
),
-- Review 4: 7/10 - Short positive review
(
  '29b33f45-7dd0-468b-ab29-046a0bda9832',
  'ff440932-9609-4b0b-bca2-af6d0e6e8981',
  7.5,
  'Beautiful traditional links course. Challenging layout with fantastic views. A bit pricey but worth it for the experience.',
  8.0,
  7.5,
  7.0,
  7.0,
  NOW() - INTERVAL '78 days',
  NOW() - INTERVAL '78 days'
),
-- Review 5: 5/10 - Critical review
(
  '29b33f45-7dd0-468b-ab29-046a0bda9832',
  '6a5bcbb9-c22c-4655-ad8e-088b2858ca3e',
  5.5,
  'Overhyped in my opinion. Yes the views are nice but the course itself is nothing groundbreaking. Wind made it almost unplayable when we visited. Clubhouse facilities are dated. For the price and travel required, I expected more.',
  6.0,
  6.5,
  5.0,
  5.0,
  NOW() - INTERVAL '105 days',
  NOW() - INTERVAL '105 days'
);