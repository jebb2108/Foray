import { ForayMessage } from '../../messaging/model/message';
import { normalizeTemporaryMessage } from '../model/temporaryRoom';

const roomMessagesById = new Map<string, ForayMessage[]>();

export function readTemporaryRoomMessages(roomId: string): ForayMessage[] {
  return [...(roomMessagesById.get(roomId) ?? [])];
}

export function writeTemporaryRoomMessages(roomId: string, messages: ForayMessage[]): void {
  roomMessagesById.set(roomId, messages.map((message) =>
    normalizeTemporaryMessage(message, roomId)).filter((message): message is ForayMessage =>
    message !== null));
}

export function removeTemporaryRoomMessages(roomId: string | null): void {
  if (!roomId) {
    return;
  }
  roomMessagesById.delete(roomId);
}
