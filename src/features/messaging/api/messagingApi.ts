import {
  ApiChat,
  ApiChatParticipant,
  ApiMessage,
  ApiReaction,
  ApiSpamReport,
} from '../../../shared/api/contracts';
import { apiRequest } from '../../../shared/api/httpClient';
import { MessageReplyReference } from '../model/message';

export interface CreateChatRequest {
  type: Exclude<ApiChat['type'], 'saved'>;
  title: string;
  participantIds?: string[];
}

export interface SendMessageRequest {
  text: string;
  replyTo?: MessageReplyReference;
}

export const messagingApi = {
  listChats() {
    return apiRequest<ApiChat[]>('/messaging/chats');
  },

  createChat(payload: CreateChatRequest) {
    return apiRequest<ApiChat, CreateChatRequest>('/messaging/chats', {
      method: 'POST',
      body: payload,
    });
  },

  deleteChat(chatId: string) {
    return apiRequest<{ ok: true }>(`/messaging/chats/${encodeURIComponent(chatId)}`, {
      method: 'DELETE',
    });
  },

  listMessages(chatId: string) {
    return apiRequest<ApiMessage[]>(`/messaging/chats/${encodeURIComponent(chatId)}/messages`);
  },

  sendMessage(chatId: string, payload: SendMessageRequest) {
    return apiRequest<ApiMessage, SendMessageRequest>(
      `/messaging/chats/${encodeURIComponent(chatId)}/messages`,
      {
        method: 'POST',
        body: payload,
      },
    );
  },

  editMessage(chatId: string, messageId: string, text: string) {
    return apiRequest<ApiMessage, { text: string }>(
      `/messaging/chats/${encodeURIComponent(chatId)}/messages/${encodeURIComponent(messageId)}`,
      {
        method: 'PATCH',
        body: { text },
      },
    );
  },

  deleteMessage(chatId: string, messageId: string) {
    return apiRequest<{ ok: true }>(
      `/messaging/chats/${encodeURIComponent(chatId)}/messages/${encodeURIComponent(messageId)}`,
      { method: 'DELETE' },
    );
  },

  reactToMessage(chatId: string, messageId: string, emoji: string) {
    return apiRequest<ApiReaction, { emoji: string }>(
      `/messaging/chats/${encodeURIComponent(chatId)}/messages/${encodeURIComponent(messageId)}/reaction`,
      {
        method: 'PUT',
        body: { emoji },
      },
    );
  },

  saveMessage(messageId: string) {
    return apiRequest<ApiMessage, { messageId: string }>('/messaging/saved/messages', {
      method: 'POST',
      body: { messageId },
    });
  },

  inviteParticipants(chatId: string, participantIds: string[]) {
    return apiRequest<ApiChatParticipant[], { participantIds: string[] }>(
      `/messaging/chats/${encodeURIComponent(chatId)}/participants`,
      {
        method: 'POST',
        body: { participantIds },
      },
    );
  },

  blockUser(userId: string) {
    return apiRequest<{ ok: true }>(`/messaging/users/${encodeURIComponent(userId)}/block`, {
      method: 'POST',
    });
  },

  reportSpam(chatId: string) {
    return apiRequest<ApiSpamReport, { reason: 'spam' }>(
      `/messaging/chats/${encodeURIComponent(chatId)}/spam-report`,
      {
        method: 'POST',
        body: { reason: 'spam' },
      },
    );
  },
};
