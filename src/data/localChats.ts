const CHATS_STORAGE_KEY = 'foray.local-chats.v1';

export function createLocalId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export interface LocalMessage {
  id: string;
  text: string;
  sender: 'me' | 'other';
  createdAt: string;
  reaction?: string;
  status?: 'sent' | 'read';
  replyTo?: {
    id: string;
    text: string;
    sender: 'me' | 'other';
  };
}

export interface LocalChat {
  id: string;
  name: string;
  initials: string;
  color: string;
  isSaved?: boolean;
  unread: number;
  messages: LocalMessage[];
}

const message = (
  id: string,
  text: string,
  sender: LocalMessage['sender'],
  minutesAgo: number,
): LocalMessage => ({
  id,
  text,
  sender,
  createdAt: new Date(Date.now() - minutesAgo * 60_000).toISOString(),
});

const DEFAULT_CHATS: LocalChat[] = [
  {
    id: 'saved',
    name: 'Избранное',
    initials: '★',
    color: '#607a52',
    isSaved: true,
    unread: 0,
    messages: [
      message('saved-welcome', 'Сохраняйте здесь важные сообщения и заметки.', 'other', 1),
    ],
  },
  {
    id: 'anna',
    name: 'Анна',
    initials: 'А',
    color: '#9a7654',
    unread: 2,
    messages: [
      message('anna-1', 'Привет! Кажется, у нас совпали интересы.', 'other', 54),
      message('anna-2', 'Да, я тоже люблю путешествия.', 'me', 50),
      message('anna-3', 'Да, давай обсудим путешествия', 'other', 46),
    ],
  },
  {
    id: 'max',
    name: 'Максим',
    initials: 'М',
    color: '#697b88',
    unread: 0,
    messages: [
      message('max-1', 'Какой фильм тебя впечатлил в последнее время?', 'other', 1_440),
      message('max-2', 'Тоже люблю авторское кино', 'other', 1_420),
    ],
  },
  {
    id: 'sofia',
    name: 'София',
    initials: 'С',
    color: '#8a6f7e',
    unread: 0,
    messages: [
      message('sofia-1', 'Отправила фотографию', 'other', 4_200),
    ],
  },
];

export function loadLocalChats(): LocalChat[] {
  try {
    const value = localStorage.getItem(CHATS_STORAGE_KEY);
    const storedChats = value ? (JSON.parse(value) as Partial<LocalChat>[]) : DEFAULT_CHATS;
    const chats: LocalChat[] = storedChats
      .filter((chat): chat is Partial<LocalChat> & Pick<LocalChat, 'id' | 'name'> =>
        typeof chat.id === 'string' && typeof chat.name === 'string')
      .map((chat) => {
        const normalizedChat: LocalChat = {
          id: chat.id,
          name: chat.name,
          initials: chat.initials || chat.name.slice(0, 1).toUpperCase(),
          color: chat.color || '#607a52',
          unread: Number.isFinite(chat.unread) ? Number(chat.unread) : 0,
          messages: Array.isArray(chat.messages)
            ? chat.messages.map((storedMessage) => ({
                ...storedMessage,
                status: storedMessage.sender === 'me'
                  ? (storedMessage.status ?? 'read')
                  : undefined,
              }))
            : [],
        };

        if (chat.id === 'saved' || chat.isSaved) {
          normalizedChat.isSaved = true;
        }

        return normalizedChat;
      });

    if (!chats.some((chat) => chat.id === 'saved')) {
      chats.unshift(DEFAULT_CHATS[0]);
    }

    return chats;
  } catch {
    return DEFAULT_CHATS.map((chat) => ({
      ...chat,
      messages: [...chat.messages],
    }));
  }
}

export function saveLocalChats(chats: LocalChat[]): void {
  localStorage.setItem(CHATS_STORAGE_KEY, JSON.stringify(chats));
}

export function createLocalChat(name: string, color: string): LocalChat {
  return {
    id: `${name.toLowerCase().replace(/\s+/g, '-')}-${createLocalId()}`,
    name,
    initials: name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join(''),
    color,
    unread: 0,
    messages: [
      message(
        createLocalId(),
        `Диалог с ${name} создан. Напишите первое сообщение.`,
        'other',
        0,
      ),
    ],
  };
}
