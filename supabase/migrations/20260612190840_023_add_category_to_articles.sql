/*
  Add denormalized category text column to articles table.
  Same pattern as questions — allows simple reads without joins.
*/

ALTER TABLE articles ADD COLUMN IF NOT EXISTS category text DEFAULT 'Другое';

-- Backfill category names from categories table
UPDATE articles a
SET category = c.name
FROM categories c
WHERE a.category_id = c.id;
