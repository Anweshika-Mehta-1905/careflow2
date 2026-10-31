import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { supabase } from './lib/supabase';

import { AppSidebar } from './components/layout/AppSidebar';
import { AppHeader } from './components/layout/AppHeader';

import Dashboard from './pages/Dashboard';
import Departments from './pages/Departments';
import Doctors from './pages/Doctors';
import Patients from './pages/Patients';
import Appointments from './pages/Appointments';
import Admissions from './pages/Admissions';
import Pharmacy from './pages/Pharmacy';
import Billing from './pages/Billing';
import Login from './pages/Login';

function AuthenticatedLayout({
  children,
  onLogout,
  userEmail,
}: {
  children: React.ReactNode;
  onLogout: () => void;
  userEmail?: string;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F4F8F6] text-slate-900 flex flex-col lg:flex-row font-sans">
      {/* Sidebar Navigation */}
      <AppSidebar
        onLogout={onLogout}
        isMobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        userEmail={userEmail}
      />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-60 flex flex-col min-h-screen">
        <AppHeader
          onMobileOpen={() => setMobileOpen(true)}
          userEmail={userEmail}
        />
        <main className="flex-1 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}

function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F4F8F6]">
        <div className="w-12 h-12 rounded-2xl bg-emerald-700 flex items-center justify-center text-white shadow-lg animate-pulse mb-4">
          <svg className="w-6 h-6 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
        <p className="text-sm font-semibold text-slate-800 tracking-wide">CareFlow HMS</p>
        <p className="text-xs text-slate-500 mt-1">Authenticating session...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <>
        <Login onLogin={() => {}} />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#0D241C',
              color: '#F4F8F6',
              border: '1px solid #183F33',
              fontSize: '13px',
              borderRadius: '10px',
            },
          }}
        />
      </>
    );
  }

  return (
    <Router>
      <AuthenticatedLayout onLogout={handleLogout} userEmail={session?.user?.email}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/departments" element={<Departments />} />
          <Route path="/doctors" element={<Doctors />} />
          <Route path="/patients" element={<Patients />} />
          <Route path="/appointments" element={<Appointments />} />
          <Route path="/admissions" element={<Admissions />} />
          <Route path="/pharmacy" element={<Pharmacy />} />
          <Route path="/billing" element={<Billing />} />
        </Routes>
      </AuthenticatedLayout>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#0D241C',
            color: '#F4F8F6',
            border: '1px solid #183F33',
            fontSize: '13px',
            borderRadius: '10px',
          },
        }}
      />
    </Router>
  );
}

export default App;
