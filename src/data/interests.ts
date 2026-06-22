export interface InterestTopic {
  id: string;
  name: string;
}

export interface InterestSubgroup {
  id: string;
  name: string;
  topics: InterestTopic[];
}

export interface InterestGroup {
  id: string;
  name: string;
  subgroups: InterestSubgroup[];
}

const topic = (groupId: string, subgroupId: string, id: string, name: string): InterestTopic => ({
  id: `${groupId}:${subgroupId}:${id}`,
  name,
});

export const INTEREST_GROUPS: InterestGroup[] = [
  {
    id: 'music',
    name: '🎵 Музыка',
    subgroups: [
      {
        id: 'genres',
        name: 'Жанры',
        topics: [
          topic('music', 'genres', 'rock', '🎸 Рок'),
          topic('music', 'genres', 'pop', '🎤 Поп'),
          topic('music', 'genres', 'jazz', '🎷 Джаз'),
          topic('music', 'genres', 'metal', '🤘 Метал'),
          topic('music', 'genres', 'hiphop', '🎧 Хип-хоп'),
          topic('music', 'genres', 'classical', '🎻 Классика'),
          topic('music', 'genres', 'electronic', '🕹️ Электронная'),
        ],
      },
      {
        id: 'activities',
        name: 'Деятельность',
        topics: [
          topic('music', 'activities', 'singing', '🎙️ Пение'),
          topic('music', 'activities', 'djing', '🎛️ Диджеинг'),
          topic('music', 'activities', 'beatmaking', '🥁 Битмейкинг'),
          topic('music', 'activities', 'instrument', '🎹 Музицирование'),
        ],
      },
      {
        id: 'live',
        name: 'Концерты и фестивали',
        topics: [
          topic('music', 'live', 'concerts', '🎫 Концерты'),
          topic('music', 'live', 'festivals', '🏕️ Фестивали'),
          topic('music', 'live', 'clubbing', '💃 Ночные клубы'),
        ],
      },
    ],
  },
  {
    id: 'sports',
    name: '⚽ Спорт',
    subgroups: [
      {
        id: 'team',
        name: 'Командные',
        topics: [
          topic('sports', 'team', 'football', '⚽ Футбол'),
          topic('sports', 'team', 'hockey', '🏒 Хоккей'),
          topic('sports', 'team', 'volleyball', '🏐 Волейбол'),
          topic('sports', 'team', 'basketball', '🏀 Баскетбол'),
        ],
      },
      {
        id: 'individual',
        name: 'Индивидуальные',
        topics: [
          topic('sports', 'individual', 'golf', '⛳ Гольф'),
          topic('sports', 'individual', 'tennis', '🎾 Теннис'),
          topic('sports', 'individual', 'boxing', '🥊 Бокс и ММА'),
          topic('sports', 'individual', 'athletics', '🏃 Лёгкая атлетика'),
        ],
      },
      {
        id: 'extreme',
        name: 'Экстремальные',
        topics: [
          topic('sports', 'extreme', 'surfing', '🏄 Сёрфинг'),
          topic('sports', 'extreme', 'snowboarding', '🏂 Сноуборд'),
          topic('sports', 'extreme', 'climbing', '🧗 Скалолазание'),
          topic('sports', 'extreme', 'skateboarding', '🛹 Скейтбординг'),
        ],
      },
      {
        id: 'fitness',
        name: 'Фитнес и здоровье',
        topics: [
          topic('sports', 'fitness', 'running', '🏃‍♂️ Бег'),
          topic('sports', 'fitness', 'yoga', '🧘 Йога'),
          topic('sports', 'fitness', 'swimming', '🏊 Плавание'),
          topic('sports', 'fitness', 'cycling', '🚴 Велоспорт'),
          topic('sports', 'fitness', 'gym', '🏋️ Тренажёрный зал'),
        ],
      },
    ],
  },
  {
    id: 'technology',
    name: '💻 Технологии',
    subgroups: [
      {
        id: 'hardware',
        name: 'Железо',
        topics: [
          topic('technology', 'hardware', 'drones', '🚁 Дроны'),
          topic('technology', 'hardware', 'vr_ar', '🥽 VR и AR'),
          topic('technology', 'hardware', 'pc_building', '🖥️ Сборка ПК'),
          topic('technology', 'hardware', 'smartphones', '📱 Смартфоны'),
          topic('technology', 'hardware', 'robotics', '🤖 Робототехника'),
        ],
      },
      {
        id: 'software',
        name: 'Программирование',
        topics: [
          topic('technology', 'software', 'data_science', '📊 Data Science'),
          topic('technology', 'software', 'web_dev', '🌐 Веб-разработка'),
          topic('technology', 'software', 'cybersecurity', '🔒 Кибербезопасность'),
          topic('technology', 'software', 'mobile_dev', '📲 Мобильные приложения'),
        ],
      },
      {
        id: 'new_frontiers',
        name: 'Новые рубежи',
        topics: [
          topic('technology', 'new_frontiers', 'ai_ml', '🧠 ИИ и ML'),
          topic('technology', 'new_frontiers', 'blockchain', '⛓️ Блокчейн'),
          topic('technology', 'new_frontiers', 'biotech', '🧬 Биотехнологии'),
          topic('technology', 'new_frontiers', 'iot', '🏠 Интернет вещей'),
          topic('technology', 'new_frontiers', 'quantum', '⚛️ Квантовые вычисления'),
        ],
      },
      {
        id: 'digital_culture',
        name: 'Цифровая культура',
        topics: [
          topic('technology', 'digital_culture', 'modding', '🛠️ Моддинг'),
          topic('technology', 'digital_culture', 'it_news', '📰 IT-новости'),
          topic('technology', 'digital_culture', 'tech_podcasts', '🎙️ Техподкасты'),
          topic('technology', 'digital_culture', 'retro_computers', '💾 Ретро-компьютеры'),
        ],
      },
    ],
  },
  {
    id: 'travel',
    name: '✈️ Путешествия',
    subgroups: [
      {
        id: 'trip_types',
        name: 'Типы поездок',
        topics: [
          topic('travel', 'trip_types', 'mountains', '🏔️ Горный'),
          topic('travel', 'trip_types', 'beach', '🏖️ Пляжный'),
          topic('travel', 'trip_types', 'city', '🏙️ Городской'),
          topic('travel', 'trip_types', 'eco', '🌿 Экотуризм'),
          topic('travel', 'trip_types', 'gastro', '🍜 Гастротуризм'),
        ],
      },
      {
        id: 'format',
        name: 'Формат',
        topics: [
          topic('travel', 'format', 'cruises', '🚢 Круизы'),
          topic('travel', 'format', 'rv', '🚐 Автодом'),
          topic('travel', 'format', 'camping', '🏕️ Кемпинг'),
          topic('travel', 'format', 'luxury', '✨ Люкс-туры'),
          topic('travel', 'format', 'backpacking', '🎒 Бэкпекинг'),
        ],
      },
      {
        id: 'activities',
        name: 'Активности',
        topics: [
          topic('travel', 'activities', 'trekking', '🥾 Трекинг'),
          topic('travel', 'activities', 'diving', '🤿 Дайвинг'),
          topic('travel', 'activities', 'photography', '📸 Фотография'),
          topic('travel', 'activities', 'volunteering', '🤝 Волонтёрство'),
          topic('travel', 'activities', 'language_learning', '🗣️ Изучение языков'),
        ],
      },
      {
        id: 'planning',
        name: 'Планирование',
        topics: [
          topic('travel', 'planning', 'flight_hacks', '✈️ Авиахаки'),
          topic('travel', 'planning', 'travel_blogs', '📝 Тревел-блоги'),
          topic('travel', 'planning', 'digital_nomad', '💻 Цифровой кочевник'),
        ],
      },
    ],
  },
  {
    id: 'movies',
    name: '🎬 Кино',
    subgroups: [
      {
        id: 'genres',
        name: 'Жанры',
        topics: [
          topic('movies', 'genres', 'drama', '🎭 Драма'),
          topic('movies', 'genres', 'horror', '👻 Ужасы'),
          topic('movies', 'genres', 'comedy', '😂 Комедия'),
          topic('movies', 'genres', 'action', '💥 Боевики'),
          topic('movies', 'genres', 'arthouse', '🎨 Артхаус'),
          topic('movies', 'genres', 'thriller', '🔪 Триллеры'),
          topic('movies', 'genres', 'sci_fi', '👽 Фантастика'),
          topic('movies', 'genres', 'documentary', '🎥 Документальное'),
        ],
      },
      {
        id: 'universes_directors',
        name: 'Вселенные и режиссёры',
        topics: [
          topic('movies', 'universes_directors', 'nolan', '⏳ Нолан'),
          topic('movies', 'universes_directors', 'tarantino', '🔫 Тарантино'),
          topic('movies', 'universes_directors', 'marvel_dc', '🦸 Marvel и DC'),
          topic('movies', 'universes_directors', 'ghibli', '🏯 Studio Ghibli'),
          topic('movies', 'universes_directors', 'asian_cinema', '🍿 Азиатское кино'),
        ],
      },
      {
        id: 'viewing_experience',
        name: 'Опыт просмотра',
        topics: [
          topic('movies', 'viewing_experience', 'imax', '🎬 IMAX'),
          topic('movies', 'viewing_experience', 'festivals', '🏆 Фестивали'),
          topic('movies', 'viewing_experience', 'marathons', '🍿 Киномарафоны'),
          topic('movies', 'viewing_experience', 'night_shows', '🌙 Ночные показы'),
          topic('movies', 'viewing_experience', 'home_theater', '📺 Домашний кинотеатр'),
        ],
      },
      {
        id: 'related_hobbies',
        name: 'Связанные увлечения',
        topics: [
          topic('movies', 'related_hobbies', 'reviews', '✍️ Кинорецензии'),
          topic('movies', 'related_hobbies', 'posters', '🖼️ Постеры фильмов'),
          topic('movies', 'related_hobbies', 'screenplay_analysis', '📜 Анализ сценариев'),
          topic('movies', 'related_hobbies', 'filmmaking', '🎥 Любительское видео'),
        ],
      },
    ],
  },
  {
    id: 'games',
    name: '🎮 Игры',
    subgroups: [
      {
        id: 'platforms',
        name: 'Платформы',
        topics: [
          topic('games', 'platforms', 'pc', '🖥️ PC'),
          topic('games', 'platforms', 'xbox', '🎮 Xbox'),
          topic('games', 'platforms', 'nintendo', '🎮 Nintendo'),
          topic('games', 'platforms', 'mobile', '📱 Мобильные'),
          topic('games', 'platforms', 'playstation', '🎮 PlayStation'),
          topic('games', 'platforms', 'retro', '👾 Ретро-аркады'),
        ],
      },
      {
        id: 'genres',
        name: 'Жанры',
        topics: [
          topic('games', 'genres', 'rpg', '🐉 RPG'),
          topic('games', 'genres', 'shooters', '🔫 Шутеры'),
          topic('games', 'genres', 'strategy', '♟️ Стратегии'),
          topic('games', 'genres', 'indie', '🎲 Инди-игры'),
          topic('games', 'genres', 'simulators', '✈️ Симуляторы'),
          topic('games', 'genres', 'puzzle', '🧩 Головоломки'),
          topic('games', 'genres', 'visual_novels', '📖 Визуальные новеллы'),
        ],
      },
      {
        id: 'social',
        name: 'Социальное вокруг игр',
        topics: [
          topic('games', 'social', 'streaming', '📺 Стриминг'),
          topic('games', 'social', 'letsplays', '🎥 Летсплеи'),
          topic('games', 'social', 'esports', '🏆 Киберспорт'),
          topic('games', 'social', 'modding_games', '🛠️ Моддинг игр'),
        ],
      },
      {
        id: 'tabletop_rpg',
        name: 'Настольные и ролевые',
        topics: [
          topic('games', 'tabletop_rpg', 'dnd', '🐉 D&D'),
          topic('games', 'tabletop_rpg', 'larp', '🗡️ LARP'),
          topic('games', 'tabletop_rpg', 'wargames', '⚔️ Варгеймы'),
          topic('games', 'tabletop_rpg', 'tcg', '🃏 Карточные игры'),
        ],
      },
    ],
  },
  {
    id: 'creativity',
    name: '🎨 Творчество',
    subgroups: [
      {
        id: 'food',
        name: 'Еда и напитки',
        topics: [
          topic('creativity', 'food', 'baking', '🎂 Выпечка'),
          topic('creativity', 'food', 'cooking', '🍳 Кулинария'),
          topic('creativity', 'food', 'restaurants', '🍽️ Рестораны'),
          topic('creativity', 'food', 'coffee_tea', '☕ Кофе и чай'),
          topic('creativity', 'food', 'wine_beer', '🍷 Вино и пиво'),
          topic('creativity', 'food', 'food_blogging', '📝 Фуд-блогинг'),
        ],
      },
      {
        id: 'literature',
        name: 'Литература',
        topics: [
          topic('creativity', 'literature', 'fiction', '📖 Проза'),
          topic('creativity', 'literature', 'poetry', '📜 Поэзия'),
          topic('creativity', 'literature', 'fantasy_scifi', '🐉 Фэнтези'),
          topic('creativity', 'literature', 'nonfiction', '📚 Нон-фикшн'),
          topic('creativity', 'literature', 'comics_manga', '📚 Комиксы и манга'),
        ],
      },
      {
        id: 'art_design',
        name: 'Изобразительное искусство',
        topics: [
          topic('creativity', 'art_design', 'painting', '🎨 Живопись'),
          topic('creativity', 'art_design', 'sculpture', '🗿 Скульптура'),
          topic('creativity', 'art_design', 'photography', '📸 Фотография'),
          topic('creativity', 'art_design', 'architecture', '🏛️ Архитектура'),
          topic('creativity', 'art_design', 'digital_art', '🎨 Цифровой арт'),
          topic('creativity', 'art_design', 'graphic_design', '✏️ Графический дизайн'),
        ],
      },
      {
        id: 'crafts_diy',
        name: 'Ремёсла и DIY',
        topics: [
          topic('creativity', 'crafts_diy', 'sewing', '🪡 Шитьё'),
          topic('creativity', 'crafts_diy', 'ceramics', '🏺 Керамика'),
          topic('creativity', 'crafts_diy', '3d_printing', '🖨️ 3D-печать'),
          topic('creativity', 'crafts_diy', 'restoration', '🔧 Реставрация'),
          topic('creativity', 'crafts_diy', 'modeling', '✈️ Моделирование'),
          topic('creativity', 'crafts_diy', 'woodworking', '🪵 Работа по дереву'),
        ],
      },
    ],
  },
];

export const INTEREST_TOPICS = INTEREST_GROUPS.flatMap((group) =>
  group.subgroups.flatMap((subgroup) => subgroup.topics),
);

export const INTEREST_TOPIC_BY_ID = new Map(
  INTEREST_TOPICS.map((interestTopic) => [interestTopic.id, interestTopic]),
);
