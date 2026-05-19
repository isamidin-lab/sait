/*
  # Replace resources with products table

  1. New Table
    - `products` — Courses and products for monetization
      - `id` (uuid, PK)
      - `title` (text, not null) — e.g. "Интенсив по арабскому языку"
      - `description` (text) — product description
      - `price` (text, not null) — e.g. "5 000 ₽" or "Бесплатно"
      - `action_url` (text) — Telegram link or contact form URL
      - `action_label` (text, default 'Узнать подробнее') — button text
      - `image_url` (text, nullable) — cover image
      - `sort_order` (int, default 0)
      - `is_active` (boolean, default true) — visibility toggle
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on products
    - Anyone can read active products, only admins can insert/update/delete

  3. Important Notes
    - Drops the old resources table
    - Seeds 3 sample products
*/

-- Drop old resources table and its policies
DROP TABLE IF EXISTS resources CASCADE;

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  price text NOT NULL DEFAULT '',
  action_url text NOT NULL DEFAULT '',
  action_label text DEFAULT 'Узнать подробнее',
  image_url text,
  sort_order int DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Products policies
CREATE POLICY "Anyone can read active products"
  ON products FOR SELECT
  TO authenticated, anon
  USING (is_active = true);

CREATE POLICY "Admins can read all products"
  ON products FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can insert products"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update products"
  ON products FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete products"
  ON products FOR DELETE
  TO authenticated
  USING (is_admin());

-- Index
CREATE INDEX IF NOT EXISTS idx_products_sort ON products(sort_order);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);

-- Seed products
INSERT INTO products (title, description, price, action_url, action_label, image_url, sort_order) VALUES
  ('Интенсив по арабскому языку', 'Глубокое погружение в арабский язык за 4 недели. Занятия в мини-группах с опытным преподавателем. Разговорная практика, грамматика и чтение оригинальных текстов.', '5 000 ₽', 'https://t.me/zaynul_abidin', 'Записаться', 'https://images.pexels.com/photos/374631/pexels-photo-374631.jpeg?auto=compress&cs=tinysrgb&w=400', 1),
  ('Индивидуальная консультация', 'Персональная консультация по вопросам духовного развития, изучения текстов и наставлений. Формат видеозвонка продолжительностью 60 минут.', '3 000 ₽', 'https://t.me/zaynul_abidin', 'Записаться', 'https://images.pexels.com/photos/694666/pexels-photo-694666.jpeg?auto=compress&cs=tinysrgb&w=400', 2),
  ('Курс: Основы духовного развития', 'Бесплатный вводный курс из 12 уроков. Идеально подходит для тех, кто начинает свой путь. Включает видеолекции, практические задания и доступ к закрытому чату.', 'Бесплатно', 'https://t.me/zaynul_abidin', 'Узнать подробнее', 'https://images.pexels.com/photos/290595/pexels-photo-290595.jpeg?auto=compress&cs=tinysrgb&w=400', 3);
