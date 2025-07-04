-- Delete the old green and black logos
DELETE FROM logos WHERE id IN (
  '80879005-6383-49a5-a725-588277dc25b7', -- Old light mode logo
  'd6880faa-8f58-4396-9fea-39a54cd13160'  -- Old dark mode logo
);