export interface Incident {
  id: string;
  type: 'theft' | 'assault' | 'harassment' | 'accident' | 'suspicious' | 'other';
  latitude: number;
  longitude: number;
  description: string;
  address?: string;
  timestamp: string;
  verified: boolean;
  reporterId: string;
  upvotes: number;
  severity?: number;
}

export interface User {
  id: string;
  name: string;
  rank: number;
  points: number;
  badges: string[];
  avatar: string;
}

export interface SafetyTip {
  title: string;
  content: string;
  category: 'general' | 'earthquake' | 'fire' | 'medical';
}

export interface SOSResponder {
  id: string;
  name: string;
  distance: string;
  type: 'police' | 'medical' | 'volunteer';
  eta: string;
}

export enum AppRoute {
  HOME = '/',
  DASHBOARD = '/dashboard',
  REPORT = '/report',
  SOS = '/sos',
  LEADERBOARD = '/leaderboard'
}
