export interface Message {
  id: string;
  type: 'SIGNING_REQUEST' | 'RELEASE_NOTICE' | 'PLAYOFF_UPDATE' | 'GAME_SUMMARY';
  title: string;
  content: string;
  fromUserId: string;
  toUserId: string;
  createdAt: string;
  read: boolean;
  actionRequired: boolean;
  relatedEntityId?: string; // Could be gameId, clubId, etc.
}

export interface MessagesState {
  messages: Message[];
  unreadCount: number;
} 