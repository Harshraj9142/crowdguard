import { create } from 'zustand';
import { Incident, User } from './types';
import { MOCK_INCIDENTS, MOCK_USERS } from './constants';

interface AppState {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  incidents: Incident[];
  fetchIncidents: () => Promise<void>;
  addIncident: (incident: Incident) => Promise<void>;
  upvoteIncident: (id: string) => Promise<void>;
  receiveIncident: (incident: Incident) => void;
  updateIncident: (incident: Incident) => void;
  currentUser: User;
  userLocation: [number, number] | null;
  setUserLocation: (location: [number, number] | null) => void;
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
  incidents: [],
  fetchIncidents: async () => {
    try {
      const response = await fetch('http://localhost:4000/api/incidents');
      const data = await response.json();
      set({ incidents: data });
    } catch (error) {
      console.error('Failed to fetch incidents:', error);
    }
  },
  addIncident: async (incident) => {
    // Optimistic update
    set((state) => ({ incidents: [incident, ...state.incidents] }));
    try {
      await fetch('http://localhost:4000/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(incident)
      });
    } catch (error) {
      console.error('Failed to add incident:', error);
    }
  },
  upvoteIncident: async (id) => {
    try {
      const res = await fetch(`http://localhost:4000/api/incidents/${id}/upvote`, {
        method: 'POST',
      });
      const updatedIncident = await res.json();
      set((state) => ({
        incidents: state.incidents.map((inc) => (inc.id === id ? updatedIncident : inc)),
      }));
    } catch (error) {
      console.error('Failed to upvote incident:', error);
    }
  },
  receiveIncident: (incident) => {
    set((state) => {
      // Avoid duplicates
      if (state.incidents.some(i => i.id === incident.id)) return state;
      return { incidents: [incident, ...state.incidents] };
    });
  },
  updateIncident: (incident) => {
    set((state) => ({
      incidents: state.incidents.map((inc) => (inc.id === incident.id ? incident : inc)),
    }));
  },
  currentUser: MOCK_USERS[0],
  userLocation: null,
  setUserLocation: (location) => set({ userLocation: location }),
  sosActive: false,
  setSosActive: (active) => set({ sosActive: active }),
}));
