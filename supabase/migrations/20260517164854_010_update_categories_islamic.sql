/*
  # Update categories to Islamic studies topics

  1. Changes
    - Replace generic categories with proper Islamic studies categories in Russian
    - Categories: Все вопросы, Акида, Фикх, История, Книги и рукописи, Практика, Другое
    - Update sort_order for proper display
*/

-- Delete old categories and re-insert
DELETE FROM categories;

INSERT INTO categories (id, name, slug, description, sort_order) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Все вопросы', 'general', 'Полная лента опубликованных ответов', 0),
  ('00000000-0000-0000-0000-000000000002', 'Акида', 'aqida', 'Вопросы вероубеждения', 1),
  ('00000000-0000-0000-0000-000000000003', 'Фикх', 'fiqh', 'Вопросы фикха и правоведения', 2),
  ('00000000-0000-0000-0000-000000000004', 'История', 'history', 'Исторические вопросы', 3),
  ('00000000-0000-0000-0000-000000000005', 'Книги и рукописи', 'books', 'Книги, рукописи и источники', 4),
  ('00000000-0000-0000-0000-000000000006', 'Практика', 'practice', 'Практические вопросы и наставления', 5),
  ('00000000-0000-0000-0000-000000000007', 'Другое', 'other', 'Другие вопросы', 6);

-- Update existing questions to point to 'general' category if they reference a deleted one
UPDATE questions SET category_id = '00000000-0000-0000-0000-000000000001'
WHERE category_id NOT IN (SELECT id FROM categories);
