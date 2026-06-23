export interface ChatAvatar {
  initials: string;
  color: string;
}

export interface Chat {
  id: string;
  type: 'saved' | 'direct' | 'group' | 'channel';
  title: string;
  avatar: ChatAvatar;
  peerId?: string;
  participantIds: string[];
  unreadCount: number;
  isOnline: boolean;
  isPinned: boolean;
  isMuted: boolean;
  mutedUntil: string | null;
  isContact: boolean;
  isIncomingRequest: boolean;
  isPotentialSpam: boolean;
  isSpamReported: boolean;
  isBlocked?: boolean;
  createdAt: string;
  updatedAt: string;
}
