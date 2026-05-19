/*
  # Rename default category from 'Общие вопросы' to 'Все вопросы'

  1. Changes
    - Update the 'general' category name from 'Общие вопросы' to 'Все вопросы'
    - This category now serves as the default tab showing all published answers
*/

UPDATE categories
SET name = 'Все вопросы'
WHERE slug = 'general';
