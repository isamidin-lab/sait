/*
  Re-seed questions and answers for the Q&A section.
  Uses the denormalized category/answer_text columns.
*/

DO $$
DECLARE
  cat_aqida uuid;
  cat_fiqh uuid;
  cat_history uuid;
  cat_books uuid;
  cat_practice uuid;
  cat_other uuid;
  admin1_id uuid;
  admin2_id uuid;
  q1 uuid; q2 uuid; q3 uuid; q4 uuid; q5 uuid; q6 uuid; q7 uuid;
BEGIN
  SELECT id INTO cat_aqida FROM categories WHERE slug = 'aqida' LIMIT 1;
  SELECT id INTO cat_fiqh FROM categories WHERE slug = 'fiqh' LIMIT 1;
  SELECT id INTO cat_history FROM categories WHERE slug = 'history' LIMIT 1;
  SELECT id INTO cat_books FROM categories WHERE slug = 'books' LIMIT 1;
  SELECT id INTO cat_practice FROM categories WHERE slug = 'practice' LIMIT 1;
  SELECT id INTO cat_other FROM categories WHERE slug = 'other' LIMIT 1;

  SELECT id INTO admin1_id FROM auth.users WHERE email = 'isamidinsabirov@gmail.com' LIMIT 1;
  SELECT id INTO admin2_id FROM auth.users WHERE email = 'zeynulaabidin@gmail.com' LIMIT 1;
  IF admin1_id IS NULL THEN admin1_id := gen_random_uuid(); END IF;
  IF admin2_id IS NULL THEN admin2_id := admin1_id; END IF;

  -- Published Q1
  INSERT INTO questions (id, category_id, category, author_name, author_email, question_text, status, answer_text, answer_updated_at, created_at, views, likes)
  VALUES (gen_random_uuid(), cat_aqida, 'Акида', 'Ахмад', NULL,
    'Какие основные принципы вероучения являются фундаментальными?',
    'published',
    'Фундаментальные принципы вероучения включают веру в Единство Всевышнего (таухид), веру в ангелов, священные писания, пророков, Судный день и предопределение. Каждый из этих столпов имеет глубокое смысловое значение и формирует основу правильного понимания религии.

Для начинающих изучение рекомендуется начинать с таухида — центрального принципа, объединяющего все остальные аспекты вероучения.',
    now() - interval '6 days', now() - interval '7 days', 45, 12)
  RETURNING id INTO q1;

  -- Published Q2
  INSERT INTO questions (id, category_id, category, author_name, author_email, question_text, status, answer_text, answer_updated_at, created_at, views, likes)
  VALUES (gen_random_uuid(), cat_history, 'История', 'Фатима', 'fatima@example.com',
    'Какое значение имеет историческое наследие Зейнуль Абидина для современности?',
    'published',
    'Историческое наследие Зейнуль Абидина имеет глубокое значение для понимания духовных и интеллектуальных традиций нашего народа. Его труды и наставления на протяжении веков служили источником мудрости и руководством для многих поколений.

Для современности это наследие ценно тем, что оно предлагает универсальные принципы нравственного развития, которые не теряют актуальности независимо от эпохи.',
    now() - interval '4 days', now() - interval '5 days', 32, 8)
  RETURNING id INTO q2;

  -- Published Q3
  INSERT INTO questions (id, category_id, category, author_name, author_email, question_text, status, answer_text, answer_updated_at, created_at, views, likes)
  VALUES (gen_random_uuid(), cat_books, 'Книги и рукописи', 'Мухаммад', NULL,
    'Какие книги рекомендуются для начинающих изучение?',
    'published',
    'Для начинающих мы рекомендуем следующий порядок изучения:

1. Начните с базовых текстов, которые дают общее представление об основных принципах и ценностях.

2. После освоения основ переходите к более специализированным трудам, углубляющим понимание конкретных тем. Рекомендуем обращаться к проверенным изданиям с комментариями квалифицированных специалистов.

3. Параллельно с чтением рекомендуется вести записи и обсуждать прочитанное с единомышленниками — это значительно ускоряет процесс усвоения материала.',
    now() - interval '3 days', now() - interval '4 days', 28, 6)
  RETURNING id INTO q3;

  -- Published Q4
  INSERT INTO questions (id, category_id, category, author_name, author_email, question_text, status, answer_text, answer_updated_at, created_at, views, likes)
  VALUES (gen_random_uuid(), cat_practice, 'Практика', 'Аиша', 'aisha@example.com',
    'Как правильно организовать ежедневную практику?',
    'published',
    'Организация ежедневной практики требует дисциплины и последовательности. Вот основные рекомендации:

1. Установите регулярное время для занятий — лучше всего раннее утро, когда ум свеж и спокоен.

2. Начинайте с небольших объемов — 15-20 минут в день для начинающих, постепенно увеличивая продолжительность.

3. Важнейшие наставления: искренность намерений, постоянство в усилиях и смирение перед знанием.

4. Не пренебрегайте физическим здоровьем — правильное питание, достаточный сон и умеренная физическая активность создают необходимую основу для интеллектуальной и духовной работы.',
    now() - interval '2 days', now() - interval '3 days', 56, 15)
  RETURNING id INTO q4;

  -- Published Q5
  INSERT INTO questions (id, category_id, category, author_name, author_email, question_text, status, answer_text, answer_updated_at, created_at, views, likes)
  VALUES (gen_random_uuid(), cat_other, 'Другое', 'Омар', NULL,
    'Как связаться с администрацией?',
    'published',
    'Связаться с администрацией можно несколькими способами:

1. Через форму «Задать вопрос» на нашем сайте — это наиболее удобный способ для общих вопросов. Мы стараемся отвечать в течение 2-3 рабочих дней.

2. По электронной почте — для более личных или конфиденциальных вопросов вы можете написать нам напрямую.

3. Для срочных вопросов используйте форму на сайте с пометкой «Срочно».

Мы гарантируем конфиденциальность всех обращений и стремимся предоставить максимально полные и полезные ответы.',
    now() - interval '1 day', now() - interval '2 days', 67, 20)
  RETURNING id INTO q5;

  -- Pending Q6 (for admin testing)
  INSERT INTO questions (id, category_id, category, author_name, author_email, question_text, status, created_at, views, likes)
  VALUES (gen_random_uuid(), cat_fiqh, 'Фикх', 'Юсуф', 'yusuf@example.com',
    'В чём разница между различными школами фикха и можно ли переходить между ними?',
    'pending', now(), 0, 0)
  RETURNING id INTO q6;

  -- Pending Q7
  INSERT INTO questions (id, category_id, category, author_name, author_email, question_text, status, created_at, views, likes)
  VALUES (gen_random_uuid(), cat_aqida, 'Акида', 'Зайнаб', NULL,
    'Что такое иман и в чём отличие от ислама?',
    'pending', now() - interval '1 hour', 0, 0)
  RETURNING id INTO q7;

  -- Insert corresponding answers in the normalized answers table
  INSERT INTO answers (question_id, admin_id, answer_text, published_at, created_at, updated_at) VALUES
    (q1, admin1_id, 'Фундаментальные принципы вероучения включают веру в Единство Всевышнего (таухид), веру в ангелов, священные писания, пророков, Судный день и предопределение. Каждый из этих столпов имеет глубокое смысловое значение и формирует основу правильного понимания религии.

Для начинающих изучение рекомендуется начинать с таухида — центрального принципа, объединяющего все остальные аспекты вероучения.',
      now() - interval '6 days', now() - interval '7 days', now() - interval '6 days'),
    (q2, admin2_id, 'Историческое наследие Зейнуль Абидина имеет глубокое значение для понимания духовных и интеллектуальных традиций нашего народа. Его труды и наставления на протяжении веков служили источником мудрости и руководством для многих поколений.

Для современности это наследие ценно тем, что оно предлагает универсальные принципы нравственного развития, которые не теряют актуальности независимо от эпохи.',
      now() - interval '4 days', now() - interval '5 days', now() - interval '4 days'),
    (q3, admin1_id, 'Для начинающих мы рекомендуем следующий порядок изучения:

1. Начните с базовых текстов, которые дают общее представление об основных принципах и ценностях.

2. После освоения основ переходите к более специализированным трудам, углубляющим понимание конкретных тем.

3. Параллельно с чтением рекомендуется вести записи и обсуждать прочитанное с единомышленниками.',
      now() - interval '3 days', now() - interval '4 days', now() - interval '3 days'),
    (q4, admin2_id, 'Организация ежедневной практики требует дисциплины и последовательности. Вот основные рекомендации:

1. Установите регулярное время для занятий — лучше всего раннее утро, когда ум свеж и спокоен.

2. Начинайте с небольших объемов — 15-20 минут в день для начинающих, постепенно увеличивая продолжительность.

3. Важнейшие наставления: искренность намерений, постоянство в усилиях и смирение перед знанием.

4. Не пренебрегайте физическим здоровьем.',
      now() - interval '2 days', now() - interval '3 days', now() - interval '2 days'),
    (q5, admin1_id, 'Связаться с администрацией можно несколькими способами:

1. Через форму «Задать вопрос» на нашем сайте — это наиболее удобный способ для общих вопросов.

2. По электронной почте — для более личных или конфиденциальных вопросов.

3. Для срочных вопросов используйте форму на сайте с пометкой «Срочно».

Мы гарантируем конфиденциальность всех обращений.',
      now() - interval '1 day', now() - interval '2 days', now() - interval '1 day');
END $$;
