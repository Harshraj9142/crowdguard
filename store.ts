import { create } from 'zustand';
import { Incident, User, Comment, NewsItem } from './types';
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
  filters: Record<string, boolean>;
  toggleFilter: (type: string) => void;
  comments: Record<string, Comment[]>;
  fetchComments: (incidentId: string) => Promise<void>;
  addComment: (comment: Comment) => Promise<void>;
  receiveComment: (comment: Comment) => void;
  selectedIncidentId: string | null;
  selectIncident: (id: string | null) => void;
  leaderboardUsers: User[];
  fetchLeaderboard: () => Promise<void>;
  news: NewsItem[];
  fetchNews: (latitude?: number, longitude?: number) => Promise<void>;
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
  filters: {
    theft: true,
    assault: true,
    accident: true,
    suspicious: true,
    harassment: true,
    other: true
  },
  toggleFilter: (type) => set((state) => ({
    filters: { ...state.filters, [type]: !state.filters[type] }
  })),
  comments: {},
  fetchComments: async (incidentId) => {
    try {
      const res = await fetch(`http://localhost:4000/api/incidents/${incidentId}/comments`);
      const data = await res.json();
      set((state) => ({
        comments: { ...state.comments, [incidentId]: data }
      }));
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    }
  },
  addComment: async (comment) => {
    // Optimistic update
    set((state) => ({
      comments: {
        ...state.comments,
        [comment.incidentId]: [comment, ...(state.comments[comment.incidentId] || [])]
      }
    }));
    try {
      await fetch(`http://localhost:4000/api/incidents/${comment.incidentId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(comment)
      });
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  },
  receiveComment: (comment) => {
    set((state) => {
      const existing = state.comments[comment.incidentId] || [];
      if (existing.some(c => c.id === comment.id)) return state;
      return {
        comments: {
          ...state.comments,
          [comment.incidentId]: [comment, ...existing]
        }
      };
    });
  },
  selectedIncidentId: null,
  selectIncident: (id) => set({ selectedIncidentId: id }),
  leaderboardUsers: [],
  fetchLeaderboard: async () => {
    try {
      const res = await fetch('http://localhost:4000/api/leaderboard');
      const data = await res.json();
      set({ leaderboardUsers: data });
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    }
  },
  news: [],
  fetchNews: async (lat, lon) => {
    // In a real application, you would use a service like NewsAPI.org
    // const API_KEY = 'YOUR_API_KEY';
    // const url = `https://newsapi.org/v2/everything?q=safety&lat=${lat}&lon=${lon}&apiKey=${API_KEY}`;

    // Mock implementation for demo purposes
    // Simulating API delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const mockNews: NewsItem[] = [
      {
        title: "Police Increase Patrols in Downtown Area Following Recent Reports",
        description: "Local law enforcement has announced a 20% increase in foot patrols in the downtown district after a series of theft reports.",
        source: "City Gazette",
        url: "#",
        publishedAt: new Date().toISOString(),
        imageUrl: "https://images.unsplash.com/photo-1520697830682-bbb6e85e2b0b?auto=format&fit=crop&q=80&w=300"
      },
      {
        title: "Community Watch Program Launches New Mobile App Integration",
        description: "The neighborhood watch has partnered with CrowdGuard to streamline incident reporting and improve response times.",
        source: "Daily News",
        url: "#",
        publishedAt: new Date(Date.now() - 86400000).toISOString(),
        imageUrl: "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?auto=format&fit=crop&q=80&w=300"
      },
      {
        title: "Traffic Advisory: Main St. Construction to Cause Delays",
        description: "Major roadwork on Main St. begins this Monday. Commuters are advised to seek alternate routes.",
        source: "Traffic Alert",
        url: "#",
        publishedAt: new Date(Date.now() - 172800000).toISOString()
      },
      {
        title: "Fire Safety Workshop Scheduled for Next Weekend",
        description: "The local fire department is hosting a free workshop on home fire safety and emergency preparedness.",
        source: "Community Bulletin",
        url: "#",
        publishedAt: new Date(Date.now() - 259200000).toISOString(),
        imageUrl: "https://images.unsplash.com/photo-1599233669146-511244e83793?auto=format&fit=crop&q=80&w=300"
      }
    ];
    set({ news: mockNews });
  }
}));
