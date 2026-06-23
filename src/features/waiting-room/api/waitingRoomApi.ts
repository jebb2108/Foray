import {
  ApiMatchCandidate,
  ApiMatchFinalConsent,
  ApiMatchRoomToken,
  ApiTemporaryRoomMessage,
} from '../../../shared/api/contracts';
import { apiRequest } from '../../../shared/api/httpClient';
import { MessageReplyReference } from '../../messaging/model/message';

export interface QueueStatusResponse {
  inQueue: boolean;
  queueSize?: number;
}

export interface InitialMatchDecisionRequest {
  matchId: string;
  accepted: boolean;
}

export interface SendTemporaryRoomMessageRequest {
  text: string;
  replyTo?: MessageReplyReference;
}

export const waitingRoomApi = {
  joinQueue(userId: string) {
    return apiRequest<QueueStatusResponse, { userId: string }>('/matchmaking/queue', {
      method: 'POST',
      body: { userId },
    });
  },

  leaveQueue(userId: string) {
    return apiRequest<QueueStatusResponse, { userId: string }>('/matchmaking/queue/leave', {
      method: 'POST',
      body: { userId },
    });
  },

  getCandidate(matchId: string) {
    return apiRequest<ApiMatchCandidate>(`/matchmaking/matches/${encodeURIComponent(matchId)}`);
  },

  confirmInitialMatch(payload: InitialMatchDecisionRequest) {
    return apiRequest<{ ready: boolean; token?: ApiMatchRoomToken }, InitialMatchDecisionRequest>(
      `/matchmaking/matches/${encodeURIComponent(payload.matchId)}/initial-decision`,
      {
        method: 'POST',
        body: payload,
      },
    );
  },

  getActiveRoomToken() {
    return apiRequest<ApiMatchRoomToken | null>('/matchmaking/rooms/active-token');
  },

  validateRoomToken(tokenId: string) {
    return apiRequest<ApiMatchRoomToken>(
      `/matchmaking/rooms/tokens/${encodeURIComponent(tokenId)}`,
    );
  },

  leaveRoom(tokenId: string) {
    return apiRequest<{ ok: true }>(
      `/matchmaking/rooms/tokens/${encodeURIComponent(tokenId)}/leave`,
      { method: 'POST' },
    );
  },

  listRoomMessages(tokenId: string) {
    return apiRequest<ApiTemporaryRoomMessage[]>(
      `/matchmaking/rooms/tokens/${encodeURIComponent(tokenId)}/messages`,
    );
  },

  sendRoomMessage(tokenId: string, payload: SendTemporaryRoomMessageRequest) {
    return apiRequest<ApiTemporaryRoomMessage, SendTemporaryRoomMessageRequest>(
      `/matchmaking/rooms/tokens/${encodeURIComponent(tokenId)}/messages`,
      {
        method: 'POST',
        body: payload,
      },
    );
  },

  editRoomMessage(tokenId: string, messageId: string, text: string) {
    return apiRequest<ApiTemporaryRoomMessage, { text: string }>(
      `/matchmaking/rooms/tokens/${encodeURIComponent(tokenId)}/messages/${encodeURIComponent(messageId)}`,
      {
        method: 'PATCH',
        body: { text },
      },
    );
  },

  deleteRoomMessage(tokenId: string, messageId: string) {
    return apiRequest<{ ok: true }>(
      `/matchmaking/rooms/tokens/${encodeURIComponent(tokenId)}/messages/${encodeURIComponent(messageId)}`,
      { method: 'DELETE' },
    );
  },

  submitFinalConsent(tokenId: string, accepted: boolean) {
    return apiRequest<ApiMatchFinalConsent, { accepted: boolean }>(
      `/matchmaking/rooms/tokens/${encodeURIComponent(tokenId)}/final-consent`,
      {
        method: 'POST',
        body: { accepted },
      },
    );
  },

  createPermanentChat(tokenId: string) {
    return apiRequest<{ chatId: string }, { tokenId: string }>('/matchmaking/rooms/permanent-chat', {
      method: 'POST',
      body: { tokenId },
    });
  },

  reportRoom(tokenId: string) {
    return apiRequest<{ ok: true }, { reason: 'abuse' }>(
      `/matchmaking/rooms/tokens/${encodeURIComponent(tokenId)}/report`,
      {
        method: 'POST',
        body: { reason: 'abuse' },
      },
    );
  },
};
