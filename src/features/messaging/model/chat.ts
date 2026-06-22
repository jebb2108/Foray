export interface ChatAvatar {
  initials: string;
  color: string;
}

export interface Chat {
  id: string;
  type: 'saved' | 'direct';
  title: string;
  avatar: ChatAvatar;
  peerId?: string;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}
