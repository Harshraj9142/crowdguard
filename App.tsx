import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { useStore } from './store';
import { Navbar, Footer, AssistantFab } from './components/Layout';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Badge } from './components/ui/common';
import MapComponent from './components/Map';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, AlertTriangle, Users, Award, Bell, Camera, MapPin, CheckCircle, Navigation } from 'lucide-react';
import { MOCK_INCIDENTS, MOCK_USERS, MOCK_RESPONDERS } from './constants';
import { Incident } from './types';

// --- Page Components ---

const LandingPage = () => {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 md:pt-24 lg:pt-32 pb-16">
        <div className="container px-4 md:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center text-center space-y-6 max-w-3xl mx-auto"
          >
            <Badge variant="outline" className="px-4 py-1 text-sm border-primary/50 text-primary">v2.0 Now Live</Badge>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl bg-clip-text text-transparent bg-gradient-to-r from-primary to-trust-500">
              Safety in Numbers. <br /> Power in Community.
            </h1>
            <p className="text-xl text-muted-foreground max-w-[42rem]">
              Real-time crowdsourced safety alerts, immediate SOS response, and a community looking out for each other.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              <Button size="lg" className="h-12 px-8 text-lg" onClick={() => navigate('/dashboard')}>
                View Live Map
              </Button>
              <Button size="lg" variant="outline" className="h-12 px-8 text-lg" onClick={() => navigate('/report')}>
                Report Incident
              </Button>
            </div>
          </motion.div>
        </div>

        {/* Abstract Background Elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-primary/10 blur-[100px] rounded-full -z-10 pointer-events-none" />
      </section>

      {/* Stats / Impact */}
      <section className="py-12 bg-muted/50 border-y">
        <div className="container px-4 md:px-8 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { label: 'Active Users', value: '12K+' },
            { label: 'Incidents Resolved', value: '8.5K' },
            { label: 'Avg Response', value: '< 2min' },
            { label: 'Cities', value: '14' },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex flex-col items-center"
            >
              <span className="text-3xl font-bold text-foreground">{stat.value}</span>
              <span className="text-sm text-muted-foreground uppercase tracking-wider">{stat.label}</span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-20 container px-4 md:px-8">
        <h2 className="text-3xl font-bold text-center mb-12">Why CrowdGuard?</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <FeatureCard
            icon={<MapPin className="text-trust-500" size={32} />}
            title="Real-Time Intelligence"
            desc="Live map updates with verified incident reports from trusted community members."
          />
          <FeatureCard
            icon={<AlertTriangle className="text-safety-500" size={32} />}
            title="Instant SOS"
            desc="One-tap emergency alerts that notify nearby responders and emergency services."
          />
          <FeatureCard
            icon={<Award className="text-alert-500" size={32} />}
            title="Gamified Citizenship"
            desc="Earn reputation points and badges for verifying reports and helping others."
          />
        </div>
      </section>
    </div>
  );
};

const FeatureCard = ({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) => (
  <Card className="hover:shadow-lg transition-shadow bg-card/50 backdrop-blur">
    <CardHeader>
      <div className="mb-4 p-3 bg-background w-fit rounded-lg border shadow-sm">{icon}</div>
      <CardTitle>{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-muted-foreground">{desc}</p>
    </CardContent>
  </Card>
);

const DashboardPage = () => {
  const { incidents, upvoteIncident } = useStore();
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="flex-1 relative">
        <MapComponent />

        {/* Overlay Filters */}
        <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
          <Card className="w-48 bg-background/90 backdrop-blur border-none shadow-xl">
            <CardContent className="p-3">
              <p className="text-xs font-semibold text-muted-foreground mb-2">FILTERS</p>
              <div className="space-y-2">
                {['Theft', 'Assault', 'Accident', 'Suspicious'].map(type => (
                  <label key={type} className="flex items-center space-x-2 text-sm cursor-pointer hover:opacity-80">
                    <input type="checkbox" defaultChecked className="rounded border-primary text-primary focus:ring-primary" />
                    <span>{type}</span>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Live Feed Slide-in (Mobile hidden or collapsible) */}
        <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:top-4 md:bottom-auto md:w-80 z-10">
          <Card className="bg-background/95 backdrop-blur shadow-2xl max-h-[40vh] md:max-h-[60vh] overflow-hidden flex flex-col">
            <CardHeader className="p-4 border-b">
              <div className="flex justify-between items-center">
                <CardTitle className="text-sm">Nearby Alerts</CardTitle>
                <Badge variant="destructive" className="animate-pulse">LIVE</Badge>
              </div>
            </CardHeader>
            <div className="overflow-y-auto p-0">
              {incidents.map((inc) => (
                <div key={inc.id} className="p-4 border-b last:border-0 hover:bg-muted/50 transition-colors cursor-pointer">
                  <div className="flex justify-between items-start mb-1">
                    <Badge variant={inc.type === 'theft' ? 'outline' : 'secondary'} className="capitalize">{inc.type}</Badge>
                    <span className="text-xs text-muted-foreground">2m ago</span>
                  </div>
                  <p className="text-sm font-medium">{inc.description}</p>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CheckCircle size={12} className={inc.verified ? "text-eco-500" : "text-muted-foreground"} />
                      <span>{inc.upvotes} verifications</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        upvoteIncident(inc.id);
                      }}
                      className="text-xs bg-primary/10 text-primary px-2 py-1 rounded hover:bg-primary/20 transition-colors"
                    >
                      Verify
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

const ReportPage = () => {
  const { addIncident, currentUser, userLocation } = useStore();
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(false);
  const [type, setType] = React.useState('suspicious');
  const [description, setDescription] = React.useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const newIncident: Incident = {
      id: Date.now().toString(),
      type: type as any,
      latitude: userLocation ? userLocation[0] : 40.7128,
      longitude: userLocation ? userLocation[1] : -74.0060,
      description: description,
      timestamp: new Date().toISOString(),
      verified: false,
      reporterId: currentUser.id,
      upvotes: 0
    };

    await addIncident(newIncident);
    setLoading(false);
    navigate('/dashboard');
  };

  return (
    <div className="container max-w-lg py-12 px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Report Incident</CardTitle>
            <p className="text-sm text-muted-foreground">Help keep your community safe. Reports are anonymous.</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Incident Type</label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                >
                  <option value="suspicious">Suspicious Activity</option>
                  <option value="theft">Theft</option>
                  <option value="assault">Assault</option>
                  <option value="accident">Accident</option>
                  <option value="harassment">Harassment</option>
                  <option value="other">Infrastructure Hazard</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Location</label>
                <div className="flex gap-2">
                  <Input placeholder="Detecting location..." value={userLocation ? `${userLocation[0].toFixed(4)}, ${userLocation[1].toFixed(4)}` : "Detecting..."} readOnly />
                  <Button type="button" variant="outline" size="icon"><Navigation size={18} /></Button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <textarea
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Describe what you saw..."
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Evidence (Optional)</label>
                <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-muted-foreground cursor-pointer hover:bg-muted/50 transition-colors">
                  <Camera size={24} className="mb-2" />
                  <span className="text-xs">Tap to upload photo/video</span>
                </div>
              </div>

              <div className="pt-4">
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Submitting...' : 'Submit Report'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

const SOSPage = () => {
  const { sosActive, setSosActive } = useStore();

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 text-center">
      <motion.div
        animate={{ scale: sosActive ? [1, 1.1, 1] : 1 }}
        transition={{ repeat: sosActive ? Infinity : 0, duration: 1 }}
      >
        <button
          onClick={() => setSosActive(!sosActive)}
          className={`relative w-64 h-64 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 ${sosActive ? 'bg-safety-600 shadow-safety-500/50' : 'bg-safety-500 hover:bg-safety-600'}`}
        >
          {sosActive && (
            <>
              <span className="absolute inset-0 rounded-full border-4 border-white opacity-20 animate-ping"></span>
              <span className="absolute inset-[-20px] rounded-full border-2 border-safety-500 opacity-40 animate-ping" style={{ animationDelay: '0.2s' }}></span>
            </>
          )}
          <div className="flex flex-col items-center text-white">
            <AlertTriangle size={64} className="mb-2" />
            <span className="text-4xl font-black tracking-widest">{sosActive ? 'SENDING...' : 'SOS'}</span>
            <span className="text-sm mt-2 font-medium opacity-90">{sosActive ? 'Tap to Cancel' : 'Tap for Emergency'}</span>
          </div>
        </button>
      </motion.div>

      <AnimatePresence>
        {sosActive && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="mt-12 w-full max-w-md"
          >
            <Card className="border-safety-500 bg-background/95 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-safety-500 flex items-center gap-2">
                  <Bell className="animate-bounce" /> Responders Alerted
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {MOCK_RESPONDERS.map((res, i) => (
                  <div key={res.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
                        {res.type === 'police' ? '👮' : res.type === 'medical' ? '🚑' : '🛡️'}
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-sm">{res.name}</p>
                        <p className="text-xs text-muted-foreground">{res.type.toUpperCase()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-trust-500">{res.eta}</p>
                      <p className="text-xs text-muted-foreground">{res.distance}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const LeaderboardPage = () => {
  return (
    <div className="container max-w-2xl py-12 px-4">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold mb-2">Community Guardians</h2>
        <p className="text-muted-foreground">Top contributors keeping our neighborhood safe.</p>
      </div>

      <div className="space-y-4">
        {MOCK_USERS.map((user, index) => (
          <motion.div
            key={user.id}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className={`border-none shadow-md ${index === 0 ? 'bg-gradient-to-r from-alert-500/10 to-transparent border border-alert-500/50' : ''}`}>
              <div className="flex items-center p-4">
                <div className="w-8 font-bold text-lg text-muted-foreground">#{user.rank}</div>
                <img src={user.avatar} alt={user.name} className="w-12 h-12 rounded-full border-2 border-background shadow-sm mr-4" />
                <div className="flex-1">
                  <h3 className="font-bold">{user.name}</h3>
                  <div className="flex gap-1 mt-1">
                    {user.badges.map(b => (
                      <span key={b} className="px-1.5 py-0.5 text-[10px] uppercase font-bold rounded bg-muted text-muted-foreground">{b}</span>
                    ))}
                  </div>
                </div>
                <div className="text-right">
                  <span className="block font-bold text-xl text-primary">{user.points}</span>
                  <span className="text-xs text-muted-foreground">PTS</span>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// --- Main App Component ---

const App = () => {
  const { theme } = useStore();

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <HashRouter>
      <div className="min-h-screen bg-background text-foreground font-sans transition-colors duration-300">
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/report" element={<ReportPage />} />
            <Route path="/sos" element={<SOSPage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
          </Routes>
        </main>
        <Footer />
        <AssistantFab />
      </div>
    </HashRouter>
  );
};

export default App;