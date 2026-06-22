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
  createDirectChat,
  loadMessagingState,
  saveMessagingState,
} from '../repository/messagingRepository';

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
  createChat: (name: string, color: string) => Chat;
  clearChat: (chatId: string) => void;
  deleteChat: (chatId: string) => void;
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
    if (!chat || !normalizedText) {
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

  const createChat: MessagingStore['createChat'] = useCallback((name, color) => {
    const chat = createDirectChat(name, color);
    const initialMessage = createTextMessage({
      chatId: chat.id,
      senderId: chat.peerId ?? `peer:${chat.id}`,
      text: `Диалог с ${chat.title} создан. Напишите первое сообщение.`,
      isOutgoing: false,
      sentAt: chat.createdAt,
    });
    setState((current) => ({
      chats: [...current.chats, chat],
      messages: [...current.messages, initialMessage],
    }));
    return chat;
  }, []);

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

  return useMemo(() => ({
    state,
    openChat,
    sendMessage,
    editMessage,
    deleteMessage,
    reactToMessage,
    saveMessage,
    createChat,
    clearChat,
    deleteChat,
  }), [
    clearChat,
    createChat,
    deleteChat,
    deleteMessage,
    editMessage,
    openChat,
    reactToMessage,
    saveMessage,
    sendMessage,
    state,
  ]);
}
