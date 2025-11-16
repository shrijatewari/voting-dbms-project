import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { profileService } from '../services/api';

interface ProfileCompletionModalProps {
  voterId: number;
  onComplete?: () => void;
}

export default function ProfileCompletionModal({ voterId, onComplete }: ProfileCompletionModalProps) {
  const [completion, setCompletion] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    checkCompletion();
  }, [voterId]);

  const checkCompletion = async () => {
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
        
        // Show modal if completion is less than 80%
        if (completionData.completionPercentage < 80) {
          setShowModal(true);
        }
      } else {
        // Admin user or no profile - don't show modal
        setLoading(false);
        return;
      }
    } catch (error: any) {
      console.error('Failed to check completion:', error);
      // Don't show modal on error - might be admin user or network issue
      const errorMsg = error.response?.data?.error || error.message || '';
      const status = error.response?.status;
      
      // Don't show modal for:
      // - Admin users (200 with null data)
      // - Network errors (might be temporary)
      // - 401/403 (session expired - will be handled by interceptor)
      if (status === 401 || status === 403) {
        // Session expired - don't show modal, let interceptor handle it
        setLoading(false);
        return;
      }
      
      if (!errorMsg.includes('Admin users') && !errorMsg.includes('No voter profile') && status !== 200) {
        // Only log actual errors, not admin user cases or successful null responses
        console.warn('Profile completion check failed:', errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

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
            <div>
              <h2 className="text-2xl font-bold mb-2">⚠️ Profile Incomplete</h2>
              <p className="text-white/90">Please complete your profile to continue</p>
            </div>
            <div className="text-right">
              <div className={`text-4xl font-bold ${getCompletionColor(completion.completionPercentage)}`}>
                {completion.completionPercentage}%
              </div>
              <p className="text-sm text-white/80">Complete</p>
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
            <Link
              to="/update-profile"
              onClick={() => {
                setShowModal(false);
                if (onComplete) onComplete();
              }}
              className="flex-1 btn-primary text-center"
            >
              Complete Profile Now
            </Link>
            {completion.completionPercentage >= 50 && (
              <button
                onClick={() => {
                  setShowModal(false);
                  if (onComplete) onComplete();
                }}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
              >
                Continue Later
              </button>
            )}
          </div>
          <p className="text-xs text-gray-500 text-center mt-3">
            You can update your profile anytime from the dashboard
          </p>
        </div>
      </div>
    </div>
  );
}

