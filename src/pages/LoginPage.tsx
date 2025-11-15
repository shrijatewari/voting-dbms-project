import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSelector from '../components/LanguageSelector';

export default function LoginPage({ setUser, setIsAdmin }: any) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // For demo purposes - in production, use actual JWT auth
    if (formData.email && formData.password) {
      const userData = {
        id: 1,
        email: formData.email,
        name: 'Demo User',
        role: formData.email.includes('admin') ? 'admin' : 'citizen',
      };
      
      localStorage.setItem('auth_token', 'demo_token');
      localStorage.setItem('user_data', JSON.stringify(userData));
      setUser(userData);
      setIsAdmin(userData.role === 'admin');
      
      navigate(userData.role === 'admin' ? '/admin' : '/dashboard');
    } else {
      setError('Please enter email and password');
    }
  };

  return (
    <div className="min-h-screen bg-gray-light flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="card">
          <div className="text-center mb-8">
            <div className="flex justify-end mb-2">
              <LanguageSelector compact={true} showLabel={false} />
            </div>
            <div className="w-16 h-16 bg-primary-navy rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-2xl">V</span>
            </div>
            <h1 className="text-2xl font-heading font-bold text-gray-800">{t('login')}</h1>
            <p className="text-gray-600 mt-2">Access your voter dashboard</p>
          </div>

          {error && (
            <div className="bg-danger/10 border border-danger text-danger px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                className="input-field"
                placeholder="your.email@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                className="input-field"
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>

            <button type="submit" className="btn-primary w-full">
              {t('login')}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            <p>Demo: Use any email/password</p>
            <p className="mt-2">For admin: use email containing "admin"</p>
          </div>

          <div className="mt-6 text-center">
            <Link to="/" className="text-primary-royal hover:underline">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

