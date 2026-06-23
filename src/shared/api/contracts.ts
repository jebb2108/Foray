export interface ApiUserProfile {
  id: string;
  name: string;
  username: string;
  birthDate: string;
  city: string;
  bio: string;
  interestIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ApiInterest {
  id: string;
  groupId: string;
  subgroupId: string;
  name: string;
}

export interface ApiChat {
  id: string;
  type: 'saved' | 'direct' | 'group' | 'channel';
  title: string;
  peerId?: string;
  participantIds: string[];
  unreadCount: number;
  isOnline: boolean;
  isContact: boolean;
  isIncomingRequest: boolean;
  isBlocked: boolean;
  isSpamReported: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderType: 'user' | 'system';
  text: string;
  sentAt: string;
  editedAt?: string;
  deliveryState: 'pending' | 'sent' | 'read' | 'failed';
  replyTo?: {
    chatId: string;
    messageId: string;
    senderId: string;
    previewText: string;
  };
}

export interface ApiReaction {
  chatId: string;
  messageId: string;
  emoji: string;
}

export interface ApiChatParticipant {
  userId: string;
  role: 'owner' | 'admin' | 'member' | 'subscriber';
  joinedAt: string;
}

export interface ApiSpamReport {
  id: string;
  chatId: string;
  reporterId: string;
  reportedUserId: string;
  reason: 'spam';
  createdAt: string;
}

export interface ApiMatchCandidate {
  id: string;
  name: string;
  age: number;
  bio: string;
  city: string;
  color: string;
  isOnline: boolean;
  interestIds: string[];
}

export interface ApiMatchRoomToken {
  id: string;
  roomId: string;
  candidateId: string;
  expiresAt: string;
  active: boolean;
  partnerOnline: boolean;
}

export interface ApiTemporaryRoomMessage extends ApiMessage {
  roomId: string;
}

export interface ApiMatchFinalConsent {
  roomTokenId: string;
  userId: string;
  accepted: boolean;
  decidedAt: string;
}

export interface ApiChatPreferences {
  chatId: string;
  isPinned: boolean;
  isMuted: boolean;
  mutedUntil: string | null;
}
