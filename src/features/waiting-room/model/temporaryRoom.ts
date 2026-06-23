import {
  createTextMessage,
  ForayMessage,
  getMessageText,
  MessageReplyReference,
} from '../../messaging/model/message';

export interface TemporaryTranscriptEntry {
  id: string;
  text: string;
  isOutgoing: boolean;
  sentAt: string;
}

export function formatRoomCountdown(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

export function createTemporaryReplyReference(message: ForayMessage): MessageReplyReference {
  return {
    chatId: message.chatId,
    messageId: message.id,
    senderId: message.sender.id,
    previewText: getMessageText(message),
  };
}

export function temporaryMessagesToTranscript(
  messages: ForayMessage[],
): TemporaryTranscriptEntry[] {
  return messages.map((message) => ({
    id: message.id,
    text: getMessageText(message),
    isOutgoing: message.isOutgoing,
    sentAt: message.sentAt,
  }));
}

export function normalizeTemporaryMessage(
  value: unknown,
  roomId: string,
): ForayMessage | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const candidate = value as Partial<ForayMessage> & Partial<TemporaryTranscriptEntry>;
  if (candidate.content?.type === 'text' && typeof candidate.content.text === 'string') {
    return candidate as ForayMessage;
  }
  if (
    typeof candidate.id === 'string'
    && typeof candidate.text === 'string'
    && typeof candidate.isOutgoing === 'boolean'
    && typeof candidate.sentAt === 'string'
  ) {
    return createTextMessage({
      id: candidate.id,
      chatId: roomId,
      senderId: candidate.isOutgoing ? 'self' : `peer:${roomId}`,
      text: candidate.text,
      isOutgoing: candidate.isOutgoing,
      deliveryState: 'read',
      sentAt: candidate.sentAt,
    });
  }

  return null;
}
