import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { profileService, voterService } from '../services/api';

interface ProfileCompletionModalProps {
  voterId: number;
  onComplete?: () => void;
}

export default function ProfileCompletionModal({ voterId, onComplete }: ProfileCompletionModalProps) {
  const navigate = useNavigate();
  const [completion, setCompletion] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [voterData, setVoterData] = useState<any>(null);

  const fetchVoterData = async () => {
    try {
      const response = await voterService.getById(voterId);
      const voter = response.data?.data || response.data;
      setVoterData(voter);
    } catch (error) {
      console.warn('Failed to fetch voter data for modal:', error);
    }
  };

  const checkCompletion = async () => {
    // Check if user is admin before making request
    const userData = localStorage.getItem('user_data');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        const role = (user.role || 'citizen').toLowerCase();
        if (role !== 'citizen') {
          // Admin users don't have voter profiles - skip check
          setLoading(false);
          return;
        }
      } catch (e) {
        // Continue if parsing fails
      }
    }
    
    try {
      const response = await profileService.getCompletionStatus(voterId);
      
      // Handle admin users or users without profiles
      if (response.data?.success && response.data?.data && response.data.data.completionPercentage !== undefined) {
        const completionData = response.data.data;
        // Ensure checkpoints exists
        if (!completionData.checkpoints) {
          completionData.checkpoints = {};
        }
        setCompletion(completionData);
        
        // Show modal if completion is less than 100% (always show for incomplete profiles)
        if (completionData.completionPercentage < 100) {
          setShowModal(true);
        }
      } else {
        // Admin user or no profile - don't show modal
        setLoading(false);
        return;
      }
    } catch (error: any) {
      // Silently handle errors - don't log or show modal
      // Profile endpoints return 200 with null for admin users, so errors here are expected
      const status = error.response?.status;
      const errorMsg = error.response?.data?.error || error.message || '';
      
      // Don't show modal or log errors for:
      // - Admin users (200 with null data)
      // - 401/403 (handled by interceptor, but shouldn't happen for profile endpoints)
      // - Any other errors (network issues, etc.)
      if (status === 200 || status === 401 || status === 403 || 
          errorMsg.includes('Admin users') || errorMsg.includes('No voter profile')) {
        setLoading(false);
        return;
      }
      
      // Only log unexpected errors
      console.warn('Profile completion check failed:', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Don't check completion if no voterId provided
    if (!voterId) {
      setLoading(false);
      return;
    }
    
    // Check if user dismissed the modal
    const dismissedKey = `profile_modal_dismissed_${voterId}`;
    const dismissed = localStorage.getItem(dismissedKey);
    if (dismissed === 'true') {
      setLoading(false);
      return;
    }
    
    checkCompletion();
    fetchVoterData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voterId]);

  const getCompletionColor = (percentage: number) => {
    if (percentage < 50) return 'text-red-600';
    if (percentage < 80) return 'text-yellow-600';
    return 'text-green-600';
  };

  if (loading || !showModal || !completion) {
    return null;
  }

  const mandatoryCheckpoints = [
    { key: 'aadhaar_otp', label: 'Aadhaar OTP Verification', required: true },
    { key: 'email_otp', label: 'Email Verification', required: true },
    { key: 'mobile_otp', label: 'Mobile Verification', required: true },
    { key: 'address_doc', label: 'Address Document Upload', required: true },
    { key: 'personal_info', label: 'Personal Information', required: true },
    { key: 'biometrics', label: 'Biometric Registration', required: true },
  ];

  const checkpoints = completion.checkpoints || {};
  const incompleteMandatory = mandatoryCheckpoints.filter(
    cp => !checkpoints[cp.key]
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-navy to-primary-royal text-white p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2">Complete Profile Now</h2>
              <p className="text-white/90">Complete mandatory verification steps to access all features</p>
            </div>
            <div className="flex items-center gap-6">
              {/* Aadhaar and Application Info */}
              <div className="text-right bg-white/10 rounded-lg px-4 py-2">
                {voterData?.aadhaar_number && (
                  <div className="text-sm">
                    <span className="text-white/80">Aadhaar: </span>
                    <span className="font-semibold text-white">
                      XXXX-XXXX-{voterData.aadhaar_number.substring(8)}
                    </span>
                  </div>
                )}
                {voterData?.application_id && (
                  <div className="text-sm mt-1">
                    <span className="text-white/80">Application: </span>
                    <span className="font-semibold text-white">
                      {voterData.application_id}
                    </span>
                  </div>
                )}
              </div>
              <div className="text-right">
                <div className={`text-4xl font-bold ${getCompletionColor(completion.completionPercentage)}`}>
                  {completion.completionPercentage}%
                </div>
                <p className="text-sm text-white/80">Complete</p>
              </div>
              {/* Close Button */}
              <button
                onClick={() => {
                  const dismissedKey = `profile_modal_dismissed_${voterId}`;
                  localStorage.setItem(dismissedKey, 'true');
                  setShowModal(false);
                }}
                className="text-white hover:text-gray-200 transition-colors p-2"
                aria-label="Close"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="p-6 border-b">
          <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden mb-2">
            <div
              className={`h-full transition-all ${
                completion.completionPercentage < 50
                  ? 'bg-red-500'
                  : completion.completionPercentage < 80
                  ? 'bg-yellow-500'
                  : 'bg-green-500'
              }`}
              style={{ width: `${completion.completionPercentage}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 text-center">
            {completion.completionPercentage < 50
              ? '🔴 Critical: Profile is incomplete'
              : completion.completionPercentage < 80
              ? '🟡 Warning: Some details missing'
              : '🟢 Good: Profile is mostly complete'}
          </p>
        </div>

        {/* Mandatory Checkpoints */}
        <div className="p-6">
          <h3 className="font-bold text-gray-800 mb-4">Mandatory Requirements:</h3>
          <div className="space-y-3 mb-6">
            {mandatoryCheckpoints.map((cp) => {
              const isCompleted = checkpoints[cp.key];
              return (
                <div
                  key={cp.key}
                  className={`flex items-center justify-between p-3 rounded-lg border-2 ${
                    isCompleted
                      ? 'bg-green-50 border-green-200'
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{isCompleted ? '✅' : '❌'}</span>
                    <span className="font-medium text-gray-800">{cp.label}</span>
                  </div>
                  {!isCompleted && (
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">Required</span>
                  )}
                </div>
              );
            })}
          </div>

          {incompleteMandatory.length > 0 && (
            <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-700">
                <strong>⚠️ Action Required:</strong> You must complete all mandatory requirements
                to access all features of the portal.
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-6 border-t bg-gray-50 rounded-b-xl">
          <div className="flex gap-3">
            <button
              onClick={() => {
                setShowModal(false);
                if (onComplete) onComplete();
                // Navigate to update profile page
                navigate('/update-profile');
              }}
              className="flex-1 btn-primary text-center"
            >
              Complete Profile Now →
            </button>
            <button
              onClick={() => {
                const dismissedKey = `profile_modal_dismissed_${voterId}`;
                localStorage.setItem(dismissedKey, 'true');
                setShowModal(false);
              }}
              className="btn-secondary px-4"
            >
              Continue Later
            </button>
          </div>
          <p className="text-xs text-gray-500 text-center mt-3">
            You can update your profile anytime from the dashboard. Note: Sensitive activities like voting require complete profile.
          </p>
        </div>
      </div>
    </div>
  );
}

