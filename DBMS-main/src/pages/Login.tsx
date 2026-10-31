import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import {
  Activity,
  Lock,
  Mail,
  ArrowRight,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export default function Login({ onLogin }: { onLogin: () => void }) {
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) onLogin();
    });
  }, [onLogin]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        toast.success('Registration successful. Please sign in.');
        setIsSignUp(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success('Signed in successfully');
        onLogin();
      }
    } catch (error: any) {
      toast.error(error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F8F6] flex flex-col lg:flex-row font-sans">
      {/* Left Hero Panel (Desktop) */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#091A15] text-white p-12 lg:p-16 flex-col justify-between border-r border-[#16382E]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-sm">
            <Activity className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-xl tracking-tight text-white">
              CareFlow
            </span>
            <span className="text-[11px] font-bold tracking-wider px-2 py-0.5 rounded-sm bg-emerald-500/20 text-emerald-400">
              HMS
            </span>
          </div>
        </div>

        <div className="max-w-md my-auto">
          <h1 className="text-3xl font-extrabold text-white tracking-tight leading-snug">
            Hospital Operations & Clinical Management
          </h1>
          <p className="text-emerald-300/80 text-sm mt-3 leading-relaxed">
            Centralized administration for inpatient admissions, outpatient scheduling,
            pharmacy inventory, and automated billing.
          </p>
        </div>

        <div className="text-xs text-emerald-400/60">
          Hospital Information System
        </div>
      </div>

      {/* Right Authentication Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-10 lg:p-16">
        <div className="w-full max-w-sm">
          {/* Mobile Logo Branding */}
          <div className="lg:hidden flex items-center gap-2.5 mb-8 justify-center">
            <div className="w-9 h-9 rounded-lg bg-emerald-700 text-white flex items-center justify-center shadow-xs">
              <Activity className="w-5 h-5 stroke-[2.5]" />
            </div>
            <span className="font-extrabold text-lg text-slate-900">CareFlow HMS</span>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-8">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                {isSignUp ? 'Create Account' : 'Sign In'}
              </h2>
            </div>

            <form onSubmit={handleAuth} className="space-y-4">
              <Input
                label="Email"
                type="email"
                placeholder="doctor@hospital.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                leftIcon={<Mail className="w-4 h-4" />}
              />

              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                leftIcon={<Lock className="w-4 h-4" />}
              />

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  className="w-full"
                  isLoading={loading}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  {loading ? 'Please wait...' : isSignUp ? 'Register' : 'Sign In'}
                </Button>
              </div>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-100 text-center">
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition-colors cursor-pointer"
              >
                {isSignUp
                  ? 'Already have an account? Sign In'
                  : 'Need an account? Register'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
