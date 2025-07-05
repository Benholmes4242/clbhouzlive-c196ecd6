-- Delete existing logos to make way for the new logo
DELETE FROM logos WHERE category IN ('app_logo_light', 'app_logo_dark');

-- Insert the new clbhouz logo
INSERT INTO logos (category, file_name, file_url, mime_type, file_size)
VALUES 
  ('app_logo_light', 'clbhouz-new-logo.png', '/lovable-uploads/4e825850-f4fd-4fed-90ac-429e1b988009.png', 'image/png', 0),
  ('app_logo_dark', 'clbhouz-new-logo-white.png', '/lovable-uploads/4e825850-f4fd-4fed-90ac-429e1b988009.png', 'image/png', 0);