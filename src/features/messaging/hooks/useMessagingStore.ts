import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { nowIso } from '../../../shared/lib/date';
import { Chat } from '../model/chat';
import {
  createTextMessage,
  ForayMessage,
  getMessageText,
  MessageReplyReference,
  toggleMessageReaction,
} from '../model/message';
import { MessagingState } from '../model/messagingState';
import {
  createNewChat,
  loadMessagingState,
  saveMessagingState,
} from '../repository/messagingRepository';
import { updateChatPreference } from '../repository/chatPreferencesRepository';
import { messagingApi } from '../api/messagingApi';

export interface MessagingStore {
  state: MessagingState;
  openChat: (chatId: string) => void;
  sendMessage: (
    chatId: string,
    text: string,
    replyTo?: MessageReplyReference,
    messageId?: string,
  ) => ForayMessage | null;
  editMessage: (chatId: string, messageId: string, text: string) => void;
  deleteMessage: (chatId: string, messageId: string) => void;
  reactToMessage: (chatId: string, messageId: string, emoji: string) => void;
  saveMessage: (message: ForayMessage) => void;
  createChat: (
    name: string,
    color: string,
    type?: Exclude<Chat['type'], 'saved'>,
    participantIds?: string[],
  ) => Chat;
  createMatchedChat: (
    name: string,
    color: string,
    transcript: Array<{
      text: string;
      isOutgoing: boolean;
      sentAt: string;
    }>,
  ) => Chat;
  clearChat: (chatId: string) => void;
  deleteChat: (chatId: string) => void;
  blockChat: (chatId: string) => void;
  reportSpam: (chatId: string) => void;
  toggleChatPinned: (chatId: string) => void;
  muteChat: (chatId: string, durationMs?: number) => void;
  unmuteChat: (chatId: string) => void;
}

export function useMessagingStore(selfUserId: string): MessagingStore {
  const [state, setState] = useState<MessagingState>(() =>
    loadMessagingState(selfUserId));

  // Ссылка хранит последнее состояние для стабильных обработчиков
  const stateRef = useRef(state);
  stateRef.current = state;

  // Таймеры очищаются при размонтировании экрана
  const readTimers = useRef(new Map<string, number>());

  useEffect(() => {
    saveMessagingState(state);
  }, [state]);

  useEffect(() => () => {
    readTimers.current.forEach((timer) => window.clearTimeout(timer));
    readTimers.current.clear();
  }, []);

  useEffect(() => {
    const expirationTimes = state.chats
      .filter((chat) => chat.isMuted && chat.mutedUntil)
      .map((chat) => Date.parse(chat.mutedUntil as string))
      .filter((timestamp) => Number.isFinite(timestamp) && timestamp > Date.now());
    if (expirationTimes.length === 0) {
      return undefined;
    }

    const delay = Math.max(0, Math.min(...expirationTimes) - Date.now());
    const timer = window.setTimeout(() => {
      const now = Date.now();
      setState((current) => ({
        ...current,
        chats: current.chats.map((chat) =>
          chat.isMuted && chat.mutedUntil && Date.parse(chat.mutedUntil) <= now
            ? {
                ...chat,
                isMuted: false,
                mutedUntil: null,
              }
            : chat),
      }));
      stateRef.current.chats
        .filter((chat) => chat.isMuted && chat.mutedUntil && Date.parse(chat.mutedUntil) <= now)
        .forEach((chat) => updateChatPreference(chat.id, { isMuted: false, mutedUntil: null }));
    }, delay + 50);

    return () => window.clearTimeout(timer);
  }, [state.chats]);

  const openChat = useCallback((chatId: string) => {
    setState((current) => {
      const chat = current.chats.find((item) => item.id === chatId);
      if (!chat || chat.unreadCount === 0) {
        return current;
      }

      return {
        ...current,
        chats: current.chats.map((item) =>
          item.id === chatId ? { ...item, unreadCount: 0 } : item),
      };
    });
  }, []);

  const sendMessage: MessagingStore['sendMessage'] = useCallback((
    chatId,
    text,
    replyTo,
    messageId,
  ) => {
    const normalizedText = text.trim();
    const chat = stateRef.current.chats.find((item) => item.id === chatId);
    if (!chat || !normalizedText || chat.isBlocked) {
      return null;
    }

    const message = createTextMessage({
      id: messageId,
      chatId,
      senderId: selfUserId,
      text: normalizedText,
      isOutgoing: true,
      deliveryState: chat.type === 'saved' ? 'read' : 'sent',
      replyTo,
    });

    setState((current) => ({
      chats: current.chats.map((item) =>
        item.id === chatId ? { ...item, updatedAt: message.sentAt } : item),
      messages: [...current.messages, message],
    }));

    // Локально имитирует подтверждение прочтения собеседником
    if (chat.type !== 'saved') {
      const timer = window.setTimeout(() => {
        setState((current) => ({
          ...current,
          messages: current.messages.map((item) =>
            item.id === message.id
              ? { ...item, delivery: { state: 'read' } }
              : item),
        }));
        readTimers.current.delete(message.id);
      }, 1_200);
      readTimers.current.set(message.id, timer);
    }

    return message;
  }, [selfUserId]);

  const editMessage: MessagingStore['editMessage'] = useCallback((
    chatId,
    messageId,
    text,
  ) => {
    const normalizedText = text.trim();
    if (!normalizedText) {
      return;
    }

    setState((current) => ({
      ...current,
      messages: current.messages.map((message) =>
        message.chatId === chatId
        && message.id === messageId
        && message.permissions.canBeEdited
          ? {
              ...message,
              content: { type: 'text', text: normalizedText },
              editedAt: nowIso(),
            }
          : message),
    }));
  }, []);

  const deleteMessage: MessagingStore['deleteMessage'] = useCallback((
    chatId,
    messageId,
  ) => {
    setState((current) => ({
      ...current,
      messages: current.messages.filter((message) =>
        !(message.chatId === chatId
          && message.id === messageId
          && message.permissions.canBeDeleted)),
    }));
  }, []);

  const reactToMessage: MessagingStore['reactToMessage'] = useCallback((
    chatId,
    messageId,
    emoji,
  ) => {
    setState((current) => ({
      ...current,
      messages: current.messages.map((message) =>
        message.chatId === chatId && message.id === messageId
          ? toggleMessageReaction(message, emoji)
          : message),
    }));
  }, []);

  const saveMessage: MessagingStore['saveMessage'] = useCallback((sourceMessage) => {
    if (!sourceMessage.permissions.canBeSaved) {
      return;
    }

    const savedChat = stateRef.current.chats.find((chat) => chat.type === 'saved');
    if (!savedChat) {
      return;
    }

    // В Избранное сохраняется новая независимая копия текста
    sendMessage(savedChat.id, getMessageText(sourceMessage));
  }, [sendMessage]);

  const createChat: MessagingStore['createChat'] = useCallback((
    name,
    color,
    type,
    participantIds,
  ) => {
    const chat = createNewChat(name, color, type, participantIds);
    const participantSuffix = chat.participantIds.length > 0
      ? ` Участников: ${chat.participantIds.length}.`
      : '';
    const initialText = chat.type === 'group'
      ? `Группа «${chat.title}» создана.${participantSuffix}`
      : chat.type === 'channel'
        ? `Канал «${chat.title}» создан.${participantSuffix}`
        : `Диалог с ${chat.title} создан. Напишите первое сообщение.`;
    const initialMessage = createTextMessage({
      chatId: chat.id,
      senderId: chat.peerId ?? `peer:${chat.id}`,
      senderType: 'system',
      text: initialText,
      isOutgoing: false,
      sentAt: chat.createdAt,
    });
    setState((current) => ({
      chats: [...current.chats, chat],
      messages: [...current.messages, initialMessage],
    }));
    return chat;
  }, []);

  const createMatchedChat: MessagingStore['createMatchedChat'] = useCallback((
    name,
    color,
    transcript,
  ) => {
    const chat = createNewChat(name, color, 'direct');
    const firstTranscriptTime = transcript[0]?.sentAt;
    const welcomeSentAt = firstTranscriptTime
      ? new Date(Date.parse(firstTranscriptTime) - 1).toISOString()
      : chat.createdAt;
    const welcomeMessage = createTextMessage({
      chatId: chat.id,
      senderId: 'system',
      senderType: 'system',
      text: 'Вы продолжили общение после комнаты ожидания.',
      isOutgoing: false,
      deliveryState: 'read',
      sentAt: welcomeSentAt,
    });
    const transcriptMessages = transcript
      .filter((entry) => entry.text.trim())
      .map((entry) => createTextMessage({
        chatId: chat.id,
        senderId: entry.isOutgoing ? selfUserId : chat.peerId ?? `peer:${chat.id}`,
        text: entry.text,
        isOutgoing: entry.isOutgoing,
        deliveryState: 'read',
        sentAt: entry.sentAt,
      }));
    const updatedAt = transcriptMessages[transcriptMessages.length - 1]?.sentAt
      ?? chat.createdAt;
    const completedChat = { ...chat, updatedAt };

    setState((current) => ({
      chats: [...current.chats, completedChat],
      messages: [...current.messages, welcomeMessage, ...transcriptMessages],
    }));
    return completedChat;
  }, [selfUserId]);

  const clearChat: MessagingStore['clearChat'] = useCallback((chatId) => {
    setState((current) => ({
      ...current,
      messages: current.messages.filter((message) => message.chatId !== chatId),
    }));
  }, []);

  const deleteChat: MessagingStore['deleteChat'] = useCallback((chatId) => {
    setState((current) => {
      const chat = current.chats.find((item) => item.id === chatId);
      if (!chat || chat.type === 'saved') {
        return current;
      }
      return {
        chats: current.chats.filter((item) => item.id !== chatId),
        messages: current.messages.filter((message) => message.chatId !== chatId),
      };
    });
  }, []);

  const blockChat: MessagingStore['blockChat'] = useCallback((chatId) => {
    setState((current) => ({
      ...current,
      chats: current.chats.map((chat) =>
        chat.id === chatId && chat.type === 'direct'
          ? { ...chat, isBlocked: true, isOnline: false }
          : chat),
    }));
  }, []);

  const reportSpam: MessagingStore['reportSpam'] = useCallback((chatId) => {
    void messagingApi.reportSpam(chatId).catch(() => {
      // Пока backend не подключён, локальное состояние всё равно закрывает spam-плашку
    });
    setState((current) => ({
      ...current,
      chats: current.chats.map((chat) =>
        chat.id === chatId && chat.type === 'direct'
          ? {
              ...chat,
              isPotentialSpam: true,
              isSpamReported: true,
              isBlocked: true,
              isOnline: false,
            }
          : chat),
    }));
  }, []);

  const toggleChatPinned: MessagingStore['toggleChatPinned'] = useCallback((chatId) => {
    const currentChat = stateRef.current.chats.find((chat) => chat.id === chatId);
    updateChatPreference(chatId, { isPinned: !currentChat?.isPinned });
    setState((current) => ({
      ...current,
      chats: current.chats.map((chat) =>
        chat.id === chatId ? { ...chat, isPinned: !chat.isPinned } : chat),
    }));
  }, []);

  const muteChat: MessagingStore['muteChat'] = useCallback((chatId, durationMs) => {
    const mutedUntil = durationMs === undefined
      ? null
      : new Date(Date.now() + durationMs).toISOString();
    updateChatPreference(chatId, { isMuted: true, mutedUntil });
    setState((current) => ({
      ...current,
      chats: current.chats.map((chat) =>
        chat.id === chatId
          ? {
              ...chat,
              isMuted: true,
              mutedUntil,
            }
          : chat),
    }));
  }, []);

  const unmuteChat: MessagingStore['unmuteChat'] = useCallback((chatId) => {
    updateChatPreference(chatId, { isMuted: false, mutedUntil: null });
    setState((current) => ({
      ...current,
      chats: current.chats.map((chat) =>
        chat.id === chatId
          ? { ...chat, isMuted: false, mutedUntil: null }
          : chat),
    }));
  }, []);

  return useMemo(() => ({
    state,
    openChat,
    sendMessage,
    editMessage,
    deleteMessage,
    reactToMessage,
    saveMessage,
    createChat,
    createMatchedChat,
    clearChat,
    deleteChat,
    blockChat,
    reportSpam,
    toggleChatPinned,
    muteChat,
    unmuteChat,
  }), [
    blockChat,
    clearChat,
    createChat,
    createMatchedChat,
    deleteChat,
    deleteMessage,
    editMessage,
    openChat,
    reactToMessage,
    reportSpam,
    saveMessage,
    sendMessage,
    state,
    muteChat,
    toggleChatPinned,
    unmuteChat,
  ]);
}
