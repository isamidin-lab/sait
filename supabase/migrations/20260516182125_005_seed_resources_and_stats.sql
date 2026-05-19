/*
  # Seed resources and update question stats

  1. Resources
    - Add 4 sample resources (books, articles)
    - Cover icons use Pexels stock photo URLs

  2. Question Stats
    - Update existing published questions with sample view and like counts
*/

-- Seed resources
INSERT INTO resources (title, description, url, icon_url, sort_order) VALUES
  ('Основы духовного развития', 'Фундаментальное руководство по принципам самосовершенствования и внутреннего роста. Рекомендуется для начинающих.', 'https://example.com/books/spiritual-basics', 'https://images.pexels.com/photos/290595/pexels-photo-290595.jpeg?auto=compress&cs=tinysrgb&w=400', 1),
  ('История исламской мысли', 'Подробный обзор развития интеллектуальных традиций от ранних веков до современности. Включает библиографию и хронологию.', 'https://example.com/books/islamic-thought-history', 'https://images.pexels.com/photos/374631/pexels-photo-374631.jpeg?auto=compress&cs=tinysrgb&w=400', 2),
  ('Практические наставления', 'Сборник ежедневных практик и рекомендаций для тех, кто стремится к систематическому подходу в обучении.', 'https://example.com/articles/practical-guidance', 'https://images.pexels.com/photos/694666/pexels-photo-694666.jpeg?auto=compress&cs=tinysrgb&w=400', 3),
  ('Библиотека рукописей', 'Каталог оцифрованных рукописей с возможностью полнотекстового поиска и аннотациями на нескольких языках.', 'https://example.com/resources/manuscript-library', 'https://images.pexels.com/photos/2041540/pexels-photo-2041540.jpeg?auto=compress&cs=tinysrgb&w=400', 4);

-- Update published questions with sample stats
UPDATE questions SET views = 142, likes = 23 WHERE question_text LIKE '%основные принципы%';
UPDATE questions SET views = 98, likes = 17 WHERE question_text LIKE '%историческом наследии%';
UPDATE questions SET views = 215, likes = 31 WHERE question_text LIKE '%книги рекомендуются%';
UPDATE questions SET views = 167, likes = 28 WHERE question_text LIKE '%ежедневную практику%';
UPDATE questions SET views = 89, likes = 12 WHERE question_text LIKE '%связаться с администрацией%';
