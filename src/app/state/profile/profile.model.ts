export interface UserProfile {
  id: string;
  name: string;
  email: string;
  positions: string[];
  handedness: 'left' | 'right';
  location: string;
  bio: string;
  isManager: boolean;
  clubId?: string;
} 