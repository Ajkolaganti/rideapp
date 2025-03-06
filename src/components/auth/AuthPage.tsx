import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Car } from 'lucide-react';
import { useAuth } from './AuthProvider';

export function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState<'driver' | 'rider'>('rider');
  const [error, setError] = useState('');
  
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      if (isSignUp) {
        await signUp(email, password, userType);
        navigate(userType === 'driver' ? '/driver-dashboard' : '/find-ride');
      } else {
        await signIn(email, password);
        navigate('/');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  return (
    <div 
      className="min-h-screen w-full bg-cover bg-center flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8"
      style={{
        backgroundImage: 'url("https://images.unsplash.com/photo-1451187580459-43490279c0fa?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80")',
      }}
    >
      <div className="absolute inset-0 bg-deep-space/80 backdrop-blur-sm" />
      
      <div className="relative w-full max-w-md">
        <div className="glass-card p-8 rounded-2xl shadow-2xl">
          <div className="flex justify-center mb-8">
            <div className="p-3 rounded-full bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-xl">
              <Car className="w-10 h-10 text-neon-blue animate-pulse" />
            </div>
          </div>
          
          <h2 className="text-3xl font-bold text-center mb-8 gradient-text">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="auth-input"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="auth-input"
                placeholder="••••••••"
              />
            </div>

            {isSignUp && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  I want to
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setUserType('rider')}
                    className={`auth-button-alt ${
                      userType === 'rider' ? 'auth-button-alt-active' : ''
                    }`}
                  >
                    Find Rides
                  </button>
                  <button
                    type="button"
                    onClick={() => setUserType('driver')}
                    className={`auth-button-alt ${
                      userType === 'driver' ? 'auth-button-alt-active' : ''
                    }`}
                  >
                    Offer Rides
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="text-red-400 text-sm bg-red-900/20 p-3 rounded-lg">
                {error}
              </div>
            )}

            <button type="submit" className="auth-button">
              {isSignUp ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="mt-6 w-full text-center text-sm text-gray-400 hover:text-neon-blue transition-colors"
          >
            {isSignUp
              ? 'Already have an account? Sign in'
              : "Don't have an account? Sign up"}
          </button>
        </div>
      </div>
    </div>
  );
} 