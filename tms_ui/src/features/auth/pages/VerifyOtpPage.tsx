import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { authApi } from '../../../core/api/services/auth.api';
import { toast } from '../../../components/ui/Toast/toast.store';

export const VerifyOtpPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const initialEmail = useMemo(() => {
    const searchParams = new URLSearchParams(location.search);
    return searchParams.get('email') || '';
  }, [location.search]);

  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await authApi.verifyOtp({ email, otp });
      const fallbackPath = `/set-password?token=${encodeURIComponent(response.verification_token)}&email=${encodeURIComponent(email)}`;
      const redirectTarget = response.set_password_url || fallbackPath;
      toast.success('OTP verified. Please set your password.');
      if (redirectTarget.startsWith('http://') || redirectTarget.startsWith('https://')) {
        window.location.href = redirectTarget;
        return;
      }
      navigate(redirectTarget, { replace: true });
    } catch (error: any) {
      toast.error(error.message || 'Invalid OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Verify Your OTP</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Enter the OTP sent to your email to continue registration
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Email address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#006A4E] disabled:opacity-50"
          />
        </div>

        <div>
          <label htmlFor="otp" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            OTP code
          </label>
          <input
            id="otp"
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            required
            minLength={6}
            maxLength={6}
            disabled={isLoading}
            className="w-full px-3 py-2 tracking-widest border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#006A4E] disabled:opacity-50"
            placeholder="123456"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#006A4E] text-white font-medium rounded-lg hover:bg-[#00553f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Verifying...
            </>
          ) : (
            <>
              <ShieldCheck className="w-4 h-4" />
              Verify OTP
            </>
          )}
        </button>
      </form>
    </div>
  );
};