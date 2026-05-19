/*
  # Seed Data for Zaynul Abidin Q&A Platform

  1. Categories
    - Общие вопросы (general)
    - История (history)
    - Книги и рукописи (books)
    - Практика (practice)
    - Другое (other)

  2. Test Questions
    - 5 published questions (answers will be added after admin creation)
    - 2 pending questions awaiting admin response

  3. Important Notes
    - Answers require admin user IDs which will be created through auth
    - Published questions will get answers after first admin signs up
*/

-- Seed categories
INSERT INTO categories (name, slug, description, sort_order) VALUES
  ('Общие вопросы', 'general', 'Общие вопросы о деятельности и принципах', 1),
  ('История', 'history', 'Вопросы об исторических событиях и личностях', 2),
  ('Книги и рукописи', 'books', 'Вопросы о литературных произведениях и рукописях', 3),
  ('Практика', 'practice', 'Практические вопросы и наставления', 4),
  ('Другое', 'other', 'Вопросы, не вошедшие в другие категории', 5)
ON CONFLICT (slug) DO NOTHING;

-- Seed published questions (one at a time to avoid multi-row RETURNING issues)
INSERT INTO questions (category_id, author_name, question_text, status, created_at)
SELECT id, 'Аноним', 'Каковы основные принципы работы вашей организации и чем вы руководствуетесь в своей деятельности?', 'published', now() - interval '7 days'
FROM categories WHERE slug = 'general';

INSERT INTO questions (category_id, author_name, question_text, status, created_at)
SELECT id, 'Ахмад', 'Расскажите подробнее об историческом наследии Зейнуль Абидина и его значении для современности.', 'published', now() - interval '5 days'
FROM categories WHERE slug = 'history';

INSERT INTO questions (category_id, author_name, question_text, status, created_at)
SELECT id, 'Фатима', 'Какие книги рекомендуются для начинающего изучения, и с чего лучше начать?', 'published', now() - interval '4 days'
FROM categories WHERE slug = 'books';

INSERT INTO questions (category_id, author_name, question_text, status, created_at)
SELECT id, 'Аноним', 'Как правильно организовать ежедневную практику и какие наставления считаются наиболее важными?', 'published', now() - interval '3 days'
FROM categories WHERE slug = 'practice';

INSERT INTO questions (category_id, author_name, question_text, status, created_at)
SELECT id, 'Ибрагим', 'Как можно связаться с администрацией для получения консультации по личному вопросу?', 'published', now() - interval '2 days'
FROM categories WHERE slug = 'other';

-- Pending questions
INSERT INTO questions (category_id, author_name, author_email, question_text, status, created_at)
SELECT id, 'Мария', 'maria@example.com', 'Есть ли планы по расширению деятельности и открытию новых направлений работы?', 'pending', now() - interval '1 day'
FROM categories WHERE slug = 'general';

INSERT INTO questions (category_id, author_name, question_text, status, created_at)
SELECT id, 'Аноним', 'Подскажите, как правильно подойти к изучению текстов, если я только начинаю свой путь?', 'pending', now()
FROM categories WHERE slug = 'practice';
