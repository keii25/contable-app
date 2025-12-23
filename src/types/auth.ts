export interface User {
  id: string;
  username: string;
  role: 'admin' | 'editor' | 'lector';
}

export interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}