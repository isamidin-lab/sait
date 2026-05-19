/*
  # Create Initial Admin Users and Seed Answers

  1. Admin Users
    - Create 2 admin users via auth.users
    - Add corresponding admin_profiles entries
    - Admin 1: admin@zaynul.ru / Admin2024!
    - Admin 2: moderator@zaynul.ru / Moderator2024!

  2. Answers
    - Add answers to all 5 published questions
    - Set published_at timestamps

  3. Important Notes
    - Passwords are hashed using crypt() with gen_salt
    - Email confirmation is bypassed
    - These are seed accounts for initial setup
*/

-- Create admin user 1
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@zaynul.ru',
  crypt('Admin2024!', gen_salt('bf')),
  now(),
  now(),
  now(),
  '',
  '',
  '',
  ''
);

-- Create admin user 2
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'moderator@zaynul.ru',
  crypt('Moderator2024!', gen_salt('bf')),
  now(),
  now(),
  now(),
  '',
  '',
  '',
  ''
);

-- Get the admin user IDs and create admin profiles
DO $$
DECLARE
  admin1_id uuid;
  admin2_id uuid;
  q1_id uuid;
  q2_id uuid;
  q3_id uuid;
  q4_id uuid;
  q5_id uuid;
BEGIN
  SELECT id INTO admin1_id FROM auth.users WHERE email = 'admin@zaynul.ru' LIMIT 1;
  SELECT id INTO admin2_id FROM auth.users WHERE email = 'moderator@zaynul.ru' LIMIT 1;

  -- Create admin profiles
  INSERT INTO admin_profiles (id, display_name) VALUES
    (admin1_id, 'Главный администратор'),
    (admin2_id, 'Модератор')
  ON CONFLICT (id) DO NOTHING;

  -- Get published question IDs
  SELECT id INTO q1_id FROM questions WHERE question_text LIKE '%основные принципы%' LIMIT 1;
  SELECT id INTO q2_id FROM questions WHERE question_text LIKE '%историческом наследии%' LIMIT 1;
  SELECT id INTO q3_id FROM questions WHERE question_text LIKE '%книги рекомендуются%' LIMIT 1;
  SELECT id INTO q4_id FROM questions WHERE question_text LIKE '%ежедневную практику%' LIMIT 1;
  SELECT id INTO q5_id FROM questions WHERE question_text LIKE '%связаться с администрацией%' LIMIT 1;

  -- Add answers to published questions
  IF q1_id IS NOT NULL THEN
    INSERT INTO answers (question_id, admin_id, answer_text, published_at, created_at, updated_at)
    VALUES (q1_id, admin1_id,
      'Наша организация руководствуется принципами честности, открытости и служения обществу. Основные направления нашей работы включают образовательную деятельность, сохранение культурного наследия и оказание помощи нуждающимся. Мы стремимся к тому, чтобы каждый обратившийся к нам получил квалифицированную помощь и поддержку.

В своей деятельности мы опираемся на многовековые традиции, адаптируя их к современным реалиям. Наша команда состоит из опытных специалистов, которые постоянно совершенствуют свои знания и навыки.',
      now() - interval '6 days', now() - interval '6 days', now() - interval '6 days'
    ) ON CONFLICT (question_id) DO NOTHING;
  END IF;

  IF q2_id IS NOT NULL THEN
    INSERT INTO answers (question_id, admin_id, answer_text, published_at, created_at, updated_at)
    VALUES (q2_id, admin1_id,
      'Историческое наследие Зейнуль Абидина имеет глубокое значение для понимания духовных и интеллектуальных традиций нашего народа. Его труды и наставления на протяжении веков служили источником мудрости и руководством для многих поколений.

Для современности это наследие ценно тем, что оно предлагает универсальные принципы нравственного развития, которые не теряют актуальности независимо от эпохи. Изучение исторического контекста позволяет лучше понять истоки многих традиций и ценностей, которые мы разделяем сегодня.',
      now() - interval '4 days', now() - interval '4 days', now() - interval '4 days'
    ) ON CONFLICT (question_id) DO NOTHING;
  END IF;

  IF q3_id IS NOT NULL THEN
    INSERT INTO answers (question_id, admin_id, answer_text, published_at, created_at, updated_at)
    VALUES (q3_id, admin2_id,
      'Для начинающих мы рекомендуем следующий порядок изучения:

1. Начните с базовых текстов, которые дают общее представление об основных принципах и ценностях. Это позволит сформировать правильное понимание фундаментальных концепций.

2. После освоения основ переходите к более специализированным трудам, углубляющим понимание конкретных тем. Рекомендуем обращаться к проверенным изданиям с комментариями квалифицированных специалистов.

3. Параллельно с чтением рекомендуется вести записи и обсуждать прочитанное с единомышленниками — это значительно ускоряет процесс усвоения материала.

Полный список рекомендованной литературы можно получить, обратившись к нам напрямую.',
      now() - interval '3 days', now() - interval '3 days', now() - interval '3 days'
    ) ON CONFLICT (question_id) DO NOTHING;
  END IF;

  IF q4_id IS NOT NULL THEN
    INSERT INTO answers (question_id, admin_id, answer_text, published_at, created_at, updated_at)
    VALUES (q4_id, admin1_id,
      'Организация ежедневной практики требует дисциплины и последовательности. Вот основные рекомендации:

1. Установите регулярное время для занятий — лучше всего раннее утро, когда ум свеж и спокоен.

2. Начинайте с небольших объемов — 15-20 минут в день для начинающих, постепенно увеличивая продолжительность.

3. Важнейшие наставления, которых стоит придерживаться: искренность намерений, постоянство в усилиях и смирение перед знанием. Без этих качеств даже самое усердное изучение может не принести желаемых плодов.

4. Не пренебрегайте физическим здоровьем — правильное питание, достаточный сон и умеренная физическая активность создают необходимую основу для интеллектуальной и духовной работы.',
      now() - interval '2 days', now() - interval '2 days', now() - interval '2 days'
    ) ON CONFLICT (question_id) DO NOTHING;
  END IF;

  IF q5_id IS NOT NULL THEN
    INSERT INTO answers (question_id, admin_id, answer_text, published_at, created_at, updated_at)
    VALUES (q5_id, admin2_id,
      'Связаться с администрацией можно несколькими способами:

1. Через форму «Задать вопрос» на нашем сайте — это наиболее удобный способ для общих вопросов. Мы стараемся отвечать в течение 2-3 рабочих дней.

2. По электронной почте — для более личных или конфиденциальных вопросов вы можете написать нам напрямую.

3. Для срочных вопросов, требующих немедленного внимания, рекомендуем использовать форму на сайте с пометкой «Срочно» в теме вопроса.

Мы гарантируем конфиденциальность всех обращений и стремимся предоставить максимально полные и полезные ответы.',
      now() - interval '1 day', now() - interval '1 day', now() - interval '1 day'
    ) ON CONFLICT (question_id) DO NOTHING;
  END IF;
END $$;
