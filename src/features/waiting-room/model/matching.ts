export type MatchingStatus =
  | 'idle'
  | 'searching'
  | 'found'
  | 'candidate'
  | 'waiting'
  | 'ready'
  | 'available-room'
  | 'room'
  | 'room-ended'
  | 'decision';

export interface MatchCandidate {
  id: string;
  name: string;
  age: number;
  bio: string;
  city: string;
  color: string;
  isOnline: boolean;
  interestIds: string[];
}

export interface MatchRoomToken {
  id: string;
  candidate: MatchCandidate;
  startedAt: string;
  expiresAt: string;
  active: boolean;
  partnerOnline: boolean;
  endedReason?: 'expired' | 'partner-left' | 'user-left';
}

export const MATCH_DECISION_SECONDS = 60;
export const MATCH_ROOM_SECONDS = 15 * 60;
export const MATCH_READY_SECONDS = 5;

export const MATCH_CANDIDATES: MatchCandidate[] = [
  {
    id: 'match:alisa',
    name: 'Алиса',
    age: 24,
    bio: 'Люблю живые концерты, небольшие поездки и долгие разговоры о кино.',
    city: 'Санкт-Петербург',
    color: '#8a6f7e',
    isOnline: true,
    interestIds: [
      'music:live:concerts',
      'travel:trip_types:city',
      'movies:genres:drama',
      'movies:viewing_experience:festivals',
    ],
  },
  {
    id: 'match:nikita',
    name: 'Никита',
    age: 27,
    bio: 'Разрабатываю приложения, катаюсь на велосипеде и иногда собираю киноклуб.',
    city: 'Москва',
    color: '#697b88',
    isOnline: true,
    interestIds: [
      'technology:software:web_dev',
      'technology:new_frontiers:ai_ml',
      'sports:fitness:cycling',
      'movies:genres:sci_fi',
    ],
  },
  {
    id: 'match:vera',
    name: 'Вера',
    age: 25,
    bio: 'Рисую, путешествую налегке и ищу людей, с которыми можно обмениваться идеями.',
    city: 'Казань',
    color: '#9a7654',
    isOnline: true,
    interestIds: [
      'creativity:art_design:painting',
      'travel:format:backpacking',
      'travel:activities:photography',
      'music:genres:jazz',
    ],
  },
  {
    id: 'match:roman',
    name: 'Роман',
    age: 29,
    bio: 'Люблю командные игры, технологии и спокойные встречи без лишней суеты.',
    city: 'Екатеринбург',
    color: '#6f8264',
    isOnline: true,
    interestIds: [
      'sports:team:football',
      'sports:team:basketball',
      'technology:hardware:pc_building',
      'technology:digital_culture:it_news',
    ],
  },
];
