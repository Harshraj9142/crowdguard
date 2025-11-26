import { create } from 'zustand';
import { Incident, User } from './types';
import { MOCK_INCIDENTS, MOCK_USERS } from './constants';

interface AppState {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  incidents: Incident[];
  addIncident: (incident: Incident) => void;
  currentUser: User;
  sosActive: boolean;
  setSosActive: (active: boolean) => void;
}

export const useStore = create<AppState>((set) => ({
  theme: 'dark',
  toggleTheme: () => set((state) => {
    const newTheme = state.theme === 'light' ? 'dark' : 'light';
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    return { theme: newTheme };
  }),
  incidents: MOCK_INCIDENTS,
  addIncident: (incident) => set((state) => ({ incidents: [incident, ...state.incidents] })),
  currentUser: MOCK_USERS[0],
  sosActive: false,
  setSosActive: (active) => set({ sosActive: active }),
}));
