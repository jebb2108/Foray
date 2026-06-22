import { Chat } from './chat';
import { ForayMessage } from './message';

export interface MessagingState {
  chats: Chat[];
  messages: ForayMessage[];
}
