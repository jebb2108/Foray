import { normalizeIsoDate, nowIso } from '../../../shared/lib/date';
import {
  asArray,
  asBoolean,
  asNonNegativeInteger,
  asString,
  asTrimmedString,
  isRecord,
} from '../../../shared/lib/guards';
import { createId } from '../../../shared/lib/id';
import {
  createEnvelope,
  readJsonStorage,
  writeJsonStorage,
} from '../../../shared/storage/jsonStorage';
import { applyChatPreferences } from './chatPreferencesRepository';
import { Chat } from '../model/chat';
import {
  createTextMessage,
  ForayMessage,
  MessageDeliveryState,
  MessageReaction,
  MessageReplyReference,
} from '../model/message';
import { MessagingState } from '../model/messagingState';

const STORAGE_KEY = 'foray.messaging.v2';
const LEGACY_STORAGE_KEY = 'foray.local-chats.v1';
const SCHEMA_VERSION = 2;

// Начальные данные используются только при отсутствии сохранённой истории
function defaultState(selfUserId: string): MessagingState {
  const now = Date.now();
  const at = (minutesAgo: number) =>
    new Date(now - minutesAgo * 60_000).toISOString();

  const chats: Chat[] = [
    createChat('saved', 'saved', 'Избранное', '★', '#607a52', at(1)),
    createChat('anna', 'direct', 'Анна', 'А', '#9a7654', at(46), 2),
    createChat('max', 'direct', 'Максим', 'М', '#697b88', at(1_420)),
    createChat('sofia', 'direct', 'София', 'С', '#8a6f7e', at(4_200)),
  ];

  const messages: ForayMessage[] = [
    createTextMessage({
      id: 'message:saved-welcome',
      chatId: 'saved',
      senderId: 'system',
      senderType: 'system',
      text: 'Сохраняйте здесь важные сообщения и заметки.',
      isOutgoing: false,
      deliveryState: 'read',
      sentAt: at(1),
    }),
    createTextMessage({
      id: 'message:anna-1',
      chatId: 'anna',
      senderId: 'peer:anna',
      text: 'Привет! Кажется, у нас совпали интересы.',
      isOutgoing: false,
      sentAt: at(54),
    }),
    createTextMessage({
      id: 'message:anna-2',
      chatId: 'anna',
      senderId: selfUserId,
      text: 'Да, я тоже люблю путешествия.',
      isOutgoing: true,
      deliveryState: 'read',
      sentAt: at(50),
    }),
    createTextMessage({
      id: 'message:anna-3',
      chatId: 'anna',
      senderId: 'peer:anna',
      text: 'Да, давай обсудим путешествия',
      isOutgoing: false,
      sentAt: at(46),
    }),
    createTextMessage({
      id: 'message:max-1',
      chatId: 'max',
      senderId: 'peer:max',
      text: 'Какой фильм тебя впечатлил в последнее время?',
      isOutgoing: false,
      sentAt: at(1_440),
    }),
    createTextMessage({
      id: 'message:max-2',
      chatId: 'max',
      senderId: 'peer:max',
      text: 'Тоже люблю авторское кино',
      isOutgoing: false,
      sentAt: at(1_420),
    }),
    createTextMessage({
      id: 'message:sofia-1',
      chatId: 'sofia',
      senderId: 'peer:sofia',
      text: 'Отправила фотографию',
      isOutgoing: false,
      sentAt: at(4_200),
    }),
  ];

  return { chats, messages };
}

function createChat(
  id: string,
  type: Chat['type'],
  title: string,
  initials: string,
  color: string,
  updatedAt: string,
  unreadCount = 0,
): Chat {
  return {
    id,
    type,
    title,
    avatar: { initials, color },
    peerId: type === 'direct' ? `peer:${id}` : undefined,
    participantIds: [],
    unreadCount,
    isOnline: type === 'direct' && (id === 'anna' || id === 'sofia'),
    isPinned: false,
    isMuted: false,
    mutedUntil: null,
    isContact: type !== 'direct' || id !== 'anna',
    isIncomingRequest: type === 'direct' && id === 'anna',
    isPotentialSpam: false,
    isSpamReported: false,
    isBlocked: false,
    createdAt: updatedAt,
    updatedAt,
  };
}

function normalizeReaction(value: unknown): MessageReaction | null {
  if (!isRecord(value)) {
    return null;
  }

  const emoji = asTrimmedString(value.emoji);
  if (!emoji) {
    return null;
  }

  return {
    emoji,
    count: Math.max(1, asNonNegativeInteger(value.count, 1)),
    isSelectedByMe: asBoolean(value.isSelectedByMe),
  };
}

function normalizeReactions(value: unknown): MessageReaction[] {
  const reactionsByEmoji = new Map<string, MessageReaction>();
  let hasSelectedReaction = false;

  // Одна реакция пользователя может быть выбрана только у одного эмодзи
  asArray(value)
    .map(normalizeReaction)
    .filter((reaction): reaction is MessageReaction => reaction !== null)
    .forEach((reaction) => {
      const current = reactionsByEmoji.get(reaction.emoji);
      const isSelectedByMe = reaction.isSelectedByMe && !hasSelectedReaction;
      if (isSelectedByMe) {
        hasSelectedReaction = true;
      }

      reactionsByEmoji.set(reaction.emoji, {
        emoji: reaction.emoji,
        count: Math.max(current?.count ?? 0, reaction.count),
        isSelectedByMe: current?.isSelectedByMe || isSelectedByMe,
      });
    });

  return [...reactionsByEmoji.values()];
}

function normalizeReply(value: unknown, fallbackChatId: string): MessageReplyReference | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const messageId = asTrimmedString(value.messageId ?? value.id);
  if (!messageId) {
    return undefined;
  }

  return {
    chatId: asTrimmedString(value.chatId, fallbackChatId),
    messageId,
    senderId: asTrimmedString(
      value.senderId,
      value.sender === 'me' ? 'self' : 'peer:unknown',
    ),
    previewText: asString(value.previewText ?? value.text).trim(),
    quote: asString(value.quote).trim() || undefined,
  };
}

function normalizeCanonicalMessage(value: unknown): ForayMessage | null {
  if (!isRecord(value)) {
    return null;
  }

  const id = asTrimmedString(value.id);
  const chatId = asTrimmedString(value.chatId);
  const sender = isRecord(value.sender) ? value.sender : {};
  const content = isRecord(value.content) ? value.content : {};
  const text = asString(content.text).trim();
  if (!id || !chatId || !text) {
    return null;
  }

  const isOutgoing = asBoolean(value.isOutgoing);
  const delivery = isRecord(value.delivery) ? value.delivery : {};
  const rawDeliveryState = asString(delivery.state);
  const deliveryState: MessageDeliveryState =
    rawDeliveryState === 'pending'
    || rawDeliveryState === 'sent'
    || rawDeliveryState === 'read'
    || rawDeliveryState === 'failed'
      ? rawDeliveryState
      : 'read';

  // Повреждённые и отсутствующие поля заменяются безопасными значениями
  return {
    id,
    chatId,
    sender: {
      type: sender.type === 'system' ? 'system' : 'user',
      id: asTrimmedString(sender.id, isOutgoing ? 'self' : `peer:${chatId}`),
    },
    isOutgoing,
    sentAt: normalizeIsoDate(value.sentAt),
    editedAt: value.editedAt ? normalizeIsoDate(value.editedAt) : undefined,
    delivery: {
      state: deliveryState,
      errorCode: asString(delivery.errorCode).trim() || undefined,
      canRetry: typeof delivery.canRetry === 'boolean' ? delivery.canRetry : undefined,
    },
    content: { type: 'text', text },
    replyTo: normalizeReply(value.replyTo, chatId),
    reactions: normalizeReactions(value.reactions),
    permissions: {
      canBeEdited: isRecord(value.permissions)
        ? asBoolean(value.permissions.canBeEdited, isOutgoing)
        : isOutgoing,
      canBeDeleted: isRecord(value.permissions)
        ? asBoolean(value.permissions.canBeDeleted, isOutgoing)
        : isOutgoing,
      canBeSaved: isRecord(value.permissions)
        ? asBoolean(value.permissions.canBeSaved, true)
        : true,
    },
  };
}

function normalizeCanonicalChat(value: unknown): Chat | null {
  if (!isRecord(value)) {
    return null;
  }

  const id = asTrimmedString(value.id);
  const title = asTrimmedString(value.title);
  const avatar = isRecord(value.avatar) ? value.avatar : {};
  if (!id || !title) {
    return null;
  }

  const updatedAt = normalizeIsoDate(value.updatedAt);
  const type: Chat['type'] =
    value.type === 'saved'
    || value.type === 'group'
    || value.type === 'channel'
      ? value.type
      : 'direct';
  const rawMutedUntil = asTrimmedString(value.mutedUntil);
  const mutedUntilTimestamp = rawMutedUntil ? Date.parse(rawMutedUntil) : Number.NaN;
  const mutedUntil = Number.isFinite(mutedUntilTimestamp)
    ? new Date(mutedUntilTimestamp).toISOString()
    : null;
  const isMuted = asBoolean(value.isMuted)
    && (mutedUntil === null || mutedUntilTimestamp > Date.now());

  return {
    id,
    type,
    title,
    avatar: {
      initials: asTrimmedString(avatar.initials, title.slice(0, 1).toUpperCase()),
      color: asTrimmedString(avatar.color, '#607a52'),
    },
    peerId: type === 'direct'
      ? asTrimmedString(value.peerId, `peer:${id}`)
      : undefined,
    participantIds: [...new Set(
      asArray(value.participantIds)
        .filter((participantId): participantId is string =>
          typeof participantId === 'string')
        .map((participantId) => participantId.trim())
        .filter(Boolean),
    )],
    unreadCount: asNonNegativeInteger(value.unreadCount),
    isOnline: type === 'direct' && asBoolean(
      value.isOnline,
      id === 'anna' || id === 'sofia' || id.startsWith('chat:'),
    ),
    isPinned: asBoolean(value.isPinned),
    isMuted,
    mutedUntil: isMuted ? mutedUntil : null,
    isContact: type !== 'direct' || asBoolean(value.isContact, true),
    isIncomingRequest: type === 'direct' && asBoolean(value.isIncomingRequest),
    isPotentialSpam: type === 'direct' && asBoolean(value.isPotentialSpam),
    isSpamReported: type === 'direct' && asBoolean(value.isSpamReported),
    isBlocked: type === 'direct' && asBoolean(value.isBlocked),
    createdAt: normalizeIsoDate(value.createdAt, updatedAt),
    updatedAt,
  };
}

function normalizeCanonicalState(value: unknown): MessagingState | null {
  if (!isRecord(value)) {
    return null;
  }

  const chatsById = new Map<string, Chat>();

  // Дубликаты чатов удаляются по идентификатору
  asArray(value.chats)
    .map(normalizeCanonicalChat)
    .filter((chat): chat is Chat => chat !== null)
    .forEach((chat) => {
      if (!chatsById.has(chat.id)) {
        chatsById.set(chat.id, chat);
      }
    });
  const chats = [...chatsById.values()];
  const chatIds = new Set(chats.map((chat) => chat.id));
  const messagesById = new Map<string, ForayMessage>();

  // Сообщения без существующего чата и дубликаты не попадают в состояние
  asArray(value.messages)
    .map(normalizeCanonicalMessage)
    .filter((message): message is ForayMessage =>
      message !== null && chatIds.has(message.chatId))
    .forEach((message) => {
      const key = `${message.chatId}:${message.id}`;
      if (!messagesById.has(key)) {
        messagesById.set(key, message);
      }
    });
  const messages = [...messagesById.values()]
    .sort((left, right) => left.sentAt.localeCompare(right.sentAt));

  return chats.length > 0 ? { chats, messages } : null;
}

function migrateLegacyState(value: unknown, selfUserId: string): MessagingState | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const chats: Chat[] = [];
  const messages: ForayMessage[] = [];

  // Старые вложенные сообщения переводятся в общий массив
  value.forEach((legacyChat, chatIndex) => {
    if (!isRecord(legacyChat)) {
      return;
    }

    const id = asTrimmedString(legacyChat.id, `legacy-${chatIndex}`);
    const title = asTrimmedString(legacyChat.name, 'Чат');
    const legacyMessages = asArray(legacyChat.messages);
    const lastLegacyMessage = legacyMessages[legacyMessages.length - 1];
    const lastSentAt = isRecord(lastLegacyMessage)
      ? normalizeIsoDate(lastLegacyMessage.createdAt)
      : nowIso();
    const type: Chat['type'] = id === 'saved' || asBoolean(legacyChat.isSaved)
      ? 'saved'
      : 'direct';

    chats.push({
      id,
      type,
      title,
      avatar: {
        initials: asTrimmedString(legacyChat.initials, title.slice(0, 1).toUpperCase()),
        color: asTrimmedString(legacyChat.color, '#607a52'),
      },
      peerId: type === 'direct' ? `peer:${id}` : undefined,
      participantIds: [],
      unreadCount: asNonNegativeInteger(legacyChat.unread),
      isOnline: false,
      isPinned: false,
      isMuted: false,
      mutedUntil: null,
      isContact: type !== 'direct',
      isIncomingRequest: false,
      isPotentialSpam: false,
      isSpamReported: false,
      isBlocked: false,
      createdAt: lastSentAt,
      updatedAt: lastSentAt,
    });

    legacyMessages.forEach((legacyMessage, messageIndex) => {
      if (!isRecord(legacyMessage)) {
        return;
      }

      const text = asString(legacyMessage.text).trim();
      if (!text) {
        return;
      }

      const isOutgoing = legacyMessage.sender === 'me';
      const message = createTextMessage({
        id: asTrimmedString(
          legacyMessage.id,
          createId(`legacy-message-${chatIndex}-${messageIndex}`),
        ),
        chatId: id,
        senderId: isOutgoing
          ? selfUserId
          : (type === 'saved' ? 'system' : `peer:${id}`),
        senderType: !isOutgoing && type === 'saved' ? 'system' : 'user',
        text,
        isOutgoing,
        deliveryState: isOutgoing
          ? (legacyMessage.status === 'sent' ? 'sent' : 'read')
          : 'read',
        sentAt: normalizeIsoDate(legacyMessage.createdAt),
        replyTo: normalizeReply(legacyMessage.replyTo, id),
      });

      const reaction = asString(legacyMessage.reaction).trim();
      if (reaction) {
        message.reactions = [{ emoji: reaction, count: 1, isSelectedByMe: true }];
      }
      messages.push(message);
    });
  });

  return normalizeCanonicalState({ chats, messages });
}

export function loadMessagingState(selfUserId: string): MessagingState {
  const stored = readJsonStorage(STORAGE_KEY);
  if (isRecord(stored) && stored.schemaVersion === SCHEMA_VERSION) {
    const state = normalizeCanonicalState(stored.data);
    if (state) {
      saveMessagingState(state);
      return { ...state, chats: applyChatPreferences(state.chats) };
    }
  }

  // Старый формат читается один раз и сохраняется в текущей версии
  const migrated = migrateLegacyState(readJsonStorage(LEGACY_STORAGE_KEY), selfUserId);
  const state = migrated ?? defaultState(selfUserId);
  saveMessagingState(state);
  return { ...state, chats: applyChatPreferences(state.chats) };
}

export function saveMessagingState(state: MessagingState): void {
  const serverBackedState: MessagingState = {
    ...state,
    chats: state.chats.map((chat) => ({
      ...chat,
      isPinned: false,
      isMuted: false,
      mutedUntil: null,
    })),
  };
  writeJsonStorage(STORAGE_KEY, createEnvelope(SCHEMA_VERSION, serverBackedState));
}

export function createNewChat(
  name: string,
  color: string,
  type: Exclude<Chat['type'], 'saved'> = 'direct',
  participantIds: string[] = [],
): Chat {
  const timestamp = nowIso();
  const id = createId('chat');
  return {
    id,
    type,
    title: name.trim(),
    avatar: {
      initials: name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join(''),
      color,
    },
    peerId: type === 'direct' ? `peer:${id}` : undefined,
    participantIds: type === 'direct'
      ? []
      : [...new Set(participantIds.map((participantId) => participantId.trim()).filter(Boolean))],
    unreadCount: 0,
    isOnline: type === 'direct',
    isPinned: false,
    isMuted: false,
    mutedUntil: null,
    isContact: type !== 'direct',
    isIncomingRequest: false,
    isPotentialSpam: false,
    isSpamReported: false,
    isBlocked: false,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}
