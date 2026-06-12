/*
  Add denormalized columns to questions for simpler queries.
  - category (text) — human-readable category name, synced from categories table
  - answer_text (text) — latest answer text, duplicated from answers table
  - answer_updated_at (timestamptz) — when the answer was last updated

  This allows the public Q&A section to read from a single table
  while keeping the normalized answers table for admin history.
*/

-- Add category text column (denormalized from categories)
ALTER TABLE questions ADD COLUMN IF NOT EXISTS category text DEFAULT 'Другое';

-- Add answer columns (denormalized from answers)
ALTER TABLE questions ADD COLUMN IF NOT EXISTS answer_text text;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS answer_updated_at timestamptz;

-- Backfill category names from categories table
UPDATE questions q
SET category = c.name
FROM categories c
WHERE q.category_id = c.id AND q.category = 'Другое';

-- Backfill answer_text from the latest published answer
UPDATE questions q
SET
  answer_text = a.answer_text,
  answer_updated_at = COALESCE(a.updated_at, a.published_at, a.created_at)
FROM (
  SELECT DISTINCT ON (question_id)
    question_id, answer_text, updated_at, published_at, created_at
  FROM answers
  WHERE published_at IS NOT NULL
  ORDER BY question_id, created_at DESC
) a
WHERE q.id = a.question_id AND q.answer_text IS NULL;
