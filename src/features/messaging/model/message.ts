import { nowIso } from '../../../shared/lib/date';
import { createId } from '../../../shared/lib/id';

export type MessageDeliveryState = 'pending' | 'sent' | 'read' | 'failed';

export interface MessageSender {
  type: 'user' | 'system';
  id: string;
}

export interface TextMessageContent {
  type: 'text';
  text: string;
}

export type MessageContent = TextMessageContent;

export interface MessageReplyReference {
  chatId: string;
  messageId: string;
  senderId: string;
  previewText: string;
  quote?: string;
}

export interface MessageReaction {
  emoji: string;
  count: number;
  isSelectedByMe: boolean;
}

export interface MessageDelivery {
  state: MessageDeliveryState;
  errorCode?: string;
  canRetry?: boolean;
}

export interface MessagePermissions {
  canBeEdited: boolean;
  canBeDeleted: boolean;
  canBeSaved: boolean;
}

export interface ForayMessage {
  id: string;
  chatId: string;
  sender: MessageSender;
  isOutgoing: boolean;
  sentAt: string;
  editedAt?: string;
  delivery: MessageDelivery;
  content: MessageContent;
  replyTo?: MessageReplyReference;
  reactions: MessageReaction[];
  permissions: MessagePermissions;
}

export interface CreateTextMessageInput {
  id?: string;
  chatId: string;
  senderId: string;
  text: string;
  isOutgoing: boolean;
  deliveryState?: MessageDeliveryState;
  replyTo?: MessageReplyReference;
  sentAt?: string;
  senderType?: MessageSender['type'];
}

export function createTextMessage(input: CreateTextMessageInput): ForayMessage {
  // Фабрика задаёт единые значения для всех текстовых сообщений
  return {
    id: input.id ?? createId('message'),
    chatId: input.chatId,
    sender: {
      type: input.senderType ?? 'user',
      id: input.senderId,
    },
    isOutgoing: input.isOutgoing,
    sentAt: input.sentAt ?? nowIso(),
    delivery: {
      state: input.deliveryState ?? (input.isOutgoing ? 'sent' : 'read'),
    },
    content: {
      type: 'text',
      text: input.text.trim(),
    },
    replyTo: input.replyTo,
    reactions: [],
    permissions: {
      canBeEdited: input.isOutgoing,
      canBeDeleted: input.isOutgoing,
      canBeSaved: true,
    },
  };
}

export function getMessageText(message: ForayMessage): string {
  return message.content.type === 'text' ? message.content.text : '';
}

export function getSelectedReaction(message: ForayMessage): string | undefined {
  return message.reactions.find((reaction) => reaction.isSelectedByMe)?.emoji;
}

export function toggleMessageReaction(
  message: ForayMessage,
  emoji: string,
): ForayMessage {
  const currentReaction = message.reactions.find((reaction) => reaction.isSelectedByMe);

  // Повторный выбор снимает текущую реакцию пользователя
  if (currentReaction?.emoji === emoji) {
    return {
      ...message,
      reactions: message.reactions.flatMap((reaction) => {
        if (reaction.emoji !== emoji) {
          return [reaction];
        }
        return reaction.count > 1
          ? [{ ...reaction, count: reaction.count - 1, isSelectedByMe: false }]
          : [];
      }),
    };
  }

  const targetReaction = message.reactions.find((reaction) => reaction.emoji === emoji);

  // При смене реакции сохраняются счётчики других пользователей
  const retainedReactions = message.reactions.flatMap((reaction) => {
    if (reaction.emoji === emoji) {
      return [];
    }
    if (!reaction.isSelectedByMe) {
      return [reaction];
    }
    return reaction.count > 1
      ? [{ ...reaction, count: reaction.count - 1, isSelectedByMe: false }]
      : [];
  });

  return {
    ...message,
    reactions: [
      ...retainedReactions,
      {
        emoji,
        count: (targetReaction?.count ?? 0) + 1,
        isSelectedByMe: true,
      },
    ],
  };
}
