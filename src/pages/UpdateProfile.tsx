import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { profileService } from '../services/api';
import BiometricCapture from '../components/BiometricCapture';
import OTPVerification from '../components/OTPVerification';
import DocumentUpload from '../components/DocumentUpload';
import { biometricService } from '../services/api';
import LanguageSelector from '../components/LanguageSelector';

interface ProfileData {
  name?: string;
  gender?: string;
  dob?: string;
  father_name?: string;
  mother_name?: string;
  guardian_name?: string;
  marital_status?: string;
  spouse_name?: string;
  mobile_number?: string;
  email?: string;
  alternate_mobile?: string;
  house_number?: string;
  street?: string;
  village_city?: string;
  district?: string;
  state?: string;
  pin_code?: string;
  pan_number?: string;
  ration_card_number?: string;
  driving_license_number?: string;
  passport_number?: string;
  education_level?: string;
  occupation?: string;
  disability_status?: boolean;
  income_range?: string;
  special_category?: string;
}

// Family Linking Component - defined before main component
function FamilyLinkingSection({ voterId }: { voterId?: number }) {
  const [relations, setRelations] = useState<any[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    relation_type: '',
    related_aadhaar: '',
    related_name: ''
  });

  useEffect(() => {
    if (voterId) {
      loadRelations();
    }
  }, [voterId]);

  const loadRelations = async () => {
    if (!voterId) return;
    try {
      const response = await profileService.getFamilyRelations(voterId);
      setRelations(response.data.data || []);
    } catch (error) {
      console.error('Failed to load family relations:', error);
    }
  };

  const handleAddRelation = async () => {
    if (!voterId || !formData.relation_type || !formData.related_aadhaar) {
      alert('Please fill all required fields');
      return;
    }
    try {
      await profileService.addFamilyRelation(voterId, formData);
      alert('Family relation added successfully!');
      setFormData({ relation_type: '', related_aadhaar: '', related_name: '' });
      setShowAddForm(false);
      loadRelations();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to add family relation');
    }
  };

  const handleRemoveRelation = async (relationId: number) => {
    if (!confirm('Are you sure you want to remove this relation?')) return;
    try {
      await profileService.removeFamilyRelation(relationId);
      alert('Family relation removed successfully!');
      loadRelations();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to remove family relation');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-gray-600">Link family members who are also registered voters</p>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn-primary"
        >
          {showAddForm ? 'Cancel' : '+ Add Family Member'}
        </button>
      </div>

      {showAddForm && (
        <div className="card bg-blue-50 border-2 border-blue-200">
          <h3 className="font-bold text-gray-800 mb-4">Add Family Relation</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Relation Type *</label>
              <select
                value={formData.relation_type}
                onChange={(e) => setFormData({ ...formData, relation_type: e.target.value })}
                className="input-field"
                required
              >
                <option value="">Select relation</option>
                <option value="father">Father</option>
                <option value="mother">Mother</option>
                <option value="spouse">Spouse</option>
                <option value="son">Son</option>
                <option value="daughter">Daughter</option>
                <option value="brother">Brother</option>
                <option value="sister">Sister</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Related Aadhaar *</label>
              <input
                type="text"
                value={formData.related_aadhaar}
                onChange={(e) => setFormData({ ...formData, related_aadhaar: e.target.value })}
                className="input-field"
                placeholder="12-digit Aadhaar"
                maxLength={12}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Related Name</label>
              <input
                type="text"
                value={formData.related_name}
                onChange={(e) => setFormData({ ...formData, related_name: e.target.value })}
                className="input-field"
                placeholder="Optional"
              />
            </div>
          </div>
          <button onClick={handleAddRelation} className="btn-primary mt-4">
            Add Relation
          </button>
        </div>
      )}

      <div className="space-y-3">
        {relations.map((relation: any) => (
          <div key={relation.relation_id} className="card flex justify-between items-center">
            <div>
              <p className="font-semibold text-gray-800 capitalize">{relation.relation_type}</p>
              <p className="text-sm text-gray-600">Aadhaar: {relation.related_aadhaar}</p>
              {relation.related_name && (
                <p className="text-sm text-gray-600">Name: {relation.related_name}</p>
              )}
            </div>
            <button
              onClick={() => handleRemoveRelation(relation.relation_id)}
              className="text-red-600 hover:text-red-800 font-medium"
            >
              Remove
            </button>
          </div>
        ))}
        {relations.length === 0 && (
          <p className="text-gray-500 text-center py-8">No family relations added yet</p>
        )}
      </div>
    </div>
  );
}

export default function UpdateProfile() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('personal');
  const [profile, setProfile] = useState<any>(null);
  const [formData, setFormData] = useState<ProfileData>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [completion, setCompletion] = useState<any>(null);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [otpType, setOtpType] = useState<'mobile' | 'email' | 'aadhaar'>('mobile');
  const [biometricData, setBiometricData] = useState<any>(null);
  const [lastSavedSection, setLastSavedSection] = useState<string | null>(null);
  const { t, i18n } = useTranslation();

  // Ensure i18n is ready and language is loaded
  useEffect(() => {
    if (!i18n.isInitialized) {
      i18n.init();
    }
    // Load saved language preference
    const savedLang = localStorage.getItem('i18nextLng');
    if (savedLang && i18n.language !== savedLang) {
      i18n.changeLanguage(savedLang);
    }
  }, [i18n]);

  useEffect(() => {
    // Check if user is admin - admins don't have voter profiles
    const userData = localStorage.getItem('user_data');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        const role = (user.role || 'citizen').toLowerCase();
        if (role !== 'citizen') {
          // Admin users don't have voter profiles
          setLoading(false);
          return;
        }
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      // Check if user is logged in
      const token = localStorage.getItem('auth_token');
      if (!token) {
        alert('Please log in to access your profile.');
        window.location.href = '/login';
        return;
      }

      // Check if user is admin - skip profile loading for admins
      const userData = localStorage.getItem('user_data');
      if (userData) {
        try {
          const user = JSON.parse(userData);
          const role = (user.role || 'citizen').toLowerCase();
          if (role !== 'citizen') {
            // Admin users don't have voter profiles - redirect to admin dashboard
            navigate('/admin');
            return;
          }
        } catch (e) {
          console.error('Error parsing user data:', e);
        }
      }

      // Get voter ID from user data - try multiple sources
      let voterId = null;
      if (userData) {
        try {
          const user = JSON.parse(userData);
          voterId = user.voter_id || user.id;
          
          // If voter_id not in user_data, try to get it from email lookup
          if (!voterId && user.email) {
            try {
              const { voterService } = require('../services/api');
              const votersRes = await voterService.getAll(1, 100);
              const voters = votersRes.data?.voters || votersRes.data?.data?.voters || [];
              const matchingVoter = voters.find((v: any) => v.email === user.email);
              if (matchingVoter) {
                voterId = matchingVoter.voter_id;
                // Update user_data with voter_id
                user.voter_id = voterId;
                localStorage.setItem('user_data', JSON.stringify(user));
              }
            } catch (e) {
              console.warn('Could not lookup voter by email:', e);
            }
          }
        } catch (e) {
          console.error('Error parsing user data:', e);
        }
      }
      
      const [profileRes, completionRes] = await Promise.all([
        voterId ? profileService.getProfile(voterId) : profileService.getProfile(),
        voterId ? profileService.getCompletionStatus(voterId) : profileService.getCompletionStatus()
      ]);
      
      console.log('Profile loaded:', profileRes.data);
      console.log('Completion status:', completionRes.data);
      
      // Handle admin users or users without voter profiles
      if (profileRes.data?.success) {
        if (profileRes.data?.data === null || profileRes.data?.message) {
          // Admin user or no voter profile - redirect to appropriate dashboard
          const userData = localStorage.getItem('user_data');
          if (userData) {
            try {
              const user = JSON.parse(userData);
              const role = (user.role || 'citizen').toLowerCase();
              if (role !== 'citizen') {
                navigate('/admin');
                return;
              }
            } catch (e) {}
          }
          // Citizen without profile - show empty form
          setProfile(null);
          setFormData({});
        } else {
          setProfile(profileRes.data.data);
          setFormData(profileRes.data.data);
        }
      } else {
        console.error('Profile data not found:', profileRes.data);
        const errorMsg = profileRes.data?.error || 'Failed to load profile. Please try logging in again.';
        // Don't show alert for admin users
        const userData = localStorage.getItem('user_data');
        if (userData) {
          try {
            const user = JSON.parse(userData);
            const role = (user.role || 'citizen').toLowerCase();
            if (role !== 'citizen') {
              navigate('/admin');
              return;
            }
          } catch (e) {}
        }
        if (!errorMsg.includes('Admin users') && !errorMsg.includes('No voter profile')) {
          alert(errorMsg);
        }
        if (errorMsg.includes('token') || errorMsg.includes('expired')) {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user_data');
          window.location.href = '/login';
        }
      }
      
      if (completionRes.data?.success && completionRes.data?.data) {
        const completionData = completionRes.data.data;
        // Ensure checkpoints exists
        if (!completionData.checkpoints) {
          completionData.checkpoints = {};
        }
        setCompletion(completionData);
      } else if (completionRes.data?.success && completionRes.data?.data === null) {
        // Admin user - set empty completion
        setCompletion({ completionPercentage: 0, checkpoints: {} });
      } else {
        // Default empty completion
        setCompletion({ completionPercentage: 0, checkpoints: {} });
      }
    } catch (error: any) {
      console.error('Failed to load profile:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Failed to load profile';
      
      // Check if user is admin - admins don't have voter profiles
      const userData = localStorage.getItem('user_data');
      if (userData) {
        try {
          const user = JSON.parse(userData);
          const role = (user.role || 'citizen').toLowerCase();
          if (role !== 'citizen') {
            // Admin users don't have voter profiles - redirect to admin dashboard
            navigate('/admin');
            return;
          }
        } catch (e) {
          console.error('Error parsing user data:', e);
        }
      }
      
      // Handle token expiration only for actual token errors
      if ((errorMsg.includes('token') || errorMsg.includes('expired') || error.response?.status === 401) && 
          !errorMsg.includes('Voter ID required') && !errorMsg.includes('Profile not found')) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
        alert('Your session has expired. Please log in again.');
        window.location.href = '/login';
        return;
      }
      
      // Don't show error for admin users trying to access profile
      if (errorMsg.includes('Voter ID required') || errorMsg.includes('Invalid or expired token')) {
        const userData = localStorage.getItem('user_data');
        if (userData) {
          try {
            const user = JSON.parse(userData);
            const role = (user.role || 'citizen').toLowerCase();
            if (role !== 'citizen') {
              navigate('/admin');
              return;
            }
          } catch (e) {}
        }
      }
      
      alert(`Error loading profile: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Name validation function (same as in VoterRegistration)
  const validateName = (name: string): { valid: boolean; reason?: string } => {
    if (!name || typeof name !== 'string') {
      return { valid: false, reason: 'Name is required' };
    }

    const trimmed = name.trim();
    
    if (trimmed.length < 3) {
      return { valid: false, reason: 'Name too short (minimum 3 characters)' };
    }

    if (/\d/.test(trimmed)) {
      return { valid: false, reason: 'Name cannot contain digits' };
    }

    if (/[^a-zA-Z\s\.\-\']/.test(trimmed)) {
      return { valid: false, reason: 'Name contains invalid characters' };
    }

    const lowerName = trimmed.toLowerCase();
    const tokens = trimmed.split(/\s+/).filter(t => t.length > 0);

    for (const token of tokens) {
      const lowerToken = token.toLowerCase();
      const hasVowel = /[aeiou]/.test(lowerToken);
      const vowelCount = (lowerToken.match(/[aeiou]/g) || []).length;
      const consonantCount = (lowerToken.match(/[bcdfghjklmnpqrstvwxyz]/g) || []).length;

      if (!hasVowel && token.length > 3) {
        return { valid: false, reason: 'Name contains invalid pattern (no vowels detected)' };
      }

      if (/[bcdfghjklmnpqrstvwxyz]{4,}/i.test(token)) {
        return { valid: false, reason: 'Name contains invalid consonant cluster' };
      }

      if (consonantCount > 0 && vowelCount === 0 && token.length > 3) {
        return { valid: false, reason: 'Name contains invalid pattern (no vowels)' };
      }
      
      if (consonantCount > 0 && vowelCount / consonantCount < 0.2 && token.length > 4) {
        return { valid: false, reason: 'Name has too many consonants (likely invalid)' };
      }

      const keyboardPatterns = [
        /^[qwerty]+$/i, /^[asdf]+$/i, /^[zxcv]+$/i,
        /^[hjkl]+$/i, /^[uiop]+$/i, /^[bnm]+$/i
      ];
      
      for (const pattern of keyboardPatterns) {
        if (pattern.test(token)) {
          return { valid: false, reason: 'Name contains keyboard pattern (invalid)' };
        }
      }

      if (token.length > 5) {
        const charFrequency: { [key: string]: number } = {};
        for (const char of lowerToken) {
          charFrequency[char] = (charFrequency[char] || 0) + 1;
        }
        const maxFreq = Math.max(...Object.values(charFrequency));
        if (maxFreq === 1 && token.length > 6) {
          return { valid: false, reason: 'Name appears to be random characters' };
        }
      }

      if (/^(.)\1+$/.test(token)) {
        return { valid: false, reason: 'Name contains repeated characters' };
      }
    }

    return { valid: true };
  };

  const handleSave = async (section?: string) => {
    // Get voter_id from profile or user_data
    let voterId = profile?.voter_id;
    if (!voterId) {
      const userData = localStorage.getItem('user_data');
      if (userData) {
        try {
          const user = JSON.parse(userData);
          voterId = user.voter_id || user.id;
        } catch (e) {
          console.error('Error parsing user data:', e);
        }
      }
    }
    
    if (!voterId) {
      alert('Profile not loaded. Please refresh the page or complete registration first.');
      return;
    }

    // Validate names before saving
    if (formData.name) {
      const nameValidation = validateName(formData.name);
      if (!nameValidation.valid) {
        alert(`Invalid name: ${nameValidation.reason}`);
        return;
      }
    }
    
    if (formData.father_name) {
      const fatherNameValidation = validateName(formData.father_name);
      if (!fatherNameValidation.valid) {
        alert(`Invalid father's name: ${fatherNameValidation.reason}`);
        return;
      }
    }
    
    if (formData.mother_name) {
      const motherNameValidation = validateName(formData.mother_name);
      if (!motherNameValidation.valid) {
        alert(`Invalid mother's name: ${motherNameValidation.reason}`);
        return;
      }
    }
    
    if (formData.spouse_name) {
      const spouseNameValidation = validateName(formData.spouse_name);
      if (!spouseNameValidation.valid) {
        alert(`Invalid spouse's name: ${spouseNameValidation.reason}`);
        return;
      }
    }

    setSaving(true);
    try {
      console.log('Updating profile:', { voterId, formData });
      
      // Pre-process date fields to ensure correct format
      const processedData = { ...formData };
      if (processedData.dob) {
        // Convert date to YYYY-MM-DD format if it's an ISO string
        try {
          const dateValue = processedData.dob;
          if (typeof dateValue === 'string' && dateValue.includes('T')) {
            const dateObj = new Date(dateValue);
            if (!isNaN(dateObj.getTime())) {
              const year = dateObj.getFullYear();
              const month = String(dateObj.getMonth() + 1).padStart(2, '0');
              const day = String(dateObj.getDate()).padStart(2, '0');
              processedData.dob = `${year}-${month}-${day}`;
              console.log(`Converted DOB from ${dateValue} to ${processedData.dob}`);
            }
          }
        } catch (e) {
          console.warn('Failed to pre-process DOB:', e);
        }
      }
      
      const response = await profileService.updateProfile(voterId, processedData);
      console.log('Update response:', response);
      
      if (response.data.success) {
        const updatedProfile = response.data.data;
        setProfile(updatedProfile);
        setFormData(updatedProfile); // Update formData with saved data
        
        // Track which section was saved
        if (section) {
          setLastSavedSection(section);
          // Clear saved indicator after 5 seconds
          setTimeout(() => {
            setLastSavedSection(null);
          }, 5000);
        }
        
        // Immediately update completion status with retry logic
        let retries = 3;
        let updatedCompletion = null;
        
        while (retries > 0) {
          try {
            // Wait a bit for backend to calculate completion (it's async)
            await new Promise(resolve => setTimeout(resolve, 800));
            
            const updatedCompletionRes = await profileService.getCompletionStatus(voterId);
            updatedCompletion = updatedCompletionRes.data?.data;
            
            if (updatedCompletion) {
              setCompletion(updatedCompletion);
              break;
            }
          } catch (e) {
            console.warn(`Failed to check completion status (retries left: ${retries - 1}):`, e);
            retries--;
            if (retries > 0) {
              await new Promise(resolve => setTimeout(resolve, 500));
            }
          }
        }
        
        // Show success message with updated completion percentage
        const prevPercentage = completion?.completionPercentage || 0;
        const newPercentage = updatedCompletion?.completionPercentage || prevPercentage;
        
        if (newPercentage >= 100) {
          alert(`✅ Profile Updated Successfully!\n\nProfile is now 100% Complete! 🎉\n\nYou can now access all features including voting.`);
        } else if (newPercentage > prevPercentage) {
          // Show incremental progress
          const increase = newPercentage - prevPercentage;
          alert(`✅ Section Saved!\n\nProfile Completion: ${prevPercentage}% → ${newPercentage}% (+${increase}%)\n\nKeep going! Complete your profile to unlock voting.`);
        } else {
          alert(`✅ Section Saved!\n\nProfile Completion: ${newPercentage}%`);
        }
        
        // Reload profile in background (non-blocking)
        loadProfile().catch(e => console.warn('Failed to reload profile:', e));
      } else {
        throw new Error(response.data.error || 'Update failed');
      }
    } catch (error: any) {
      console.error('Update profile error:', error);
      
      // Handle lock wait timeout errors specifically
      const errorMsg = (error.response?.data?.error || error.message || '').toLowerCase();
      if (errorMsg.includes('lock wait timeout') || errorMsg.includes('lock wait timeout exceeded') || 
          error.response?.status === 408 || error.code === 'ER_LOCK_WAIT_TIMEOUT' || error.code === 1205) {
        alert(`⏱️ Database Busy\n\nThe system is currently processing another update. Your changes have been saved, but the completion percentage update is still processing. Please refresh the page in a few seconds to see the updated completion status.`);
        // Still reload profile to get the saved changes
        await loadProfile();
        return;
      }
      
      // Handle date format errors with user-friendly message
      const errorResponse = error.response?.data;
      if (errorResponse?.error && (
        errorResponse.error.includes('date') || 
        errorResponse.error.includes('Invalid date format') ||
        errorResponse.error.includes('YYYY-MM-DD')
      )) {
        alert(`⚠️ Date Format Error\n\n${errorResponse.error}\n\n${errorResponse.details || 'Please check your date of birth and ensure it\'s in the correct format (YYYY-MM-DD).'}`);
      } else if (errorResponse?.error) {
        alert(`❌ Error: ${errorResponse.error}\n\n${errorResponse.details || ''}`);
      } else {
        const errorMsg = error.response?.data?.message || error.message || 'Failed to update profile';
        alert(`❌ Error: ${errorMsg}`);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleVerifyContact = async (type: 'mobile' | 'email' | 'aadhaar') => {
    setOtpType(type);
    setShowOTPModal(true);
  };

  const handleOTPVerify = async (verified: boolean) => {
    if (!verified) {
      setShowOTPModal(false);
      return;
    }

    // Get voter_id from profile or user_data
    let voterId = profile?.voter_id;
    if (!voterId) {
      const userData = localStorage.getItem('user_data');
      if (userData) {
        try {
          const user = JSON.parse(userData);
          voterId = user.voter_id || user.id;
        } catch (e) {
          console.error('Error parsing user data:', e);
        }
      }
    }
    
    if (!voterId) {
      alert('Profile not loaded. Please refresh the page or complete registration first.');
      setShowOTPModal(false);
      return;
    }

    try {
      const type = otpType === 'email' ? 'email' : 'mobile';
      
      console.log('Verifying contact:', { voterId, type });
      
      const response = await profileService.verifyContact(voterId, type, true);
      console.log('Verification response:', response);
      
      await loadProfile();
      setShowOTPModal(false);
      alert(t('verification_successful'));
    } catch (error: any) {
      console.error('Verification error:', error);
      const errorMsg = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to update verification status';
      alert(errorMsg);
    }
  };

  const getCompletionColor = (percentage: number) => {
    if (percentage < 50) return 'bg-red-500';
    if (percentage < 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  // Check if a section is completed based on profile data and completion checkpoints
  const isSectionCompleted = (sectionId: string): boolean => {
    if (!profile || !completion) return false;
    
    const checkpoints = completion.checkpoints || {};
    
    switch (sectionId) {
      case 'personal':
        return checkpoints.personal_info === true || (
          profile.name && profile.gender && profile.dob && profile.father_name
        );
      case 'contact':
        return (checkpoints.email_otp === true && checkpoints.mobile_otp === true) || (
          profile.email_verified && profile.mobile_verified
        );
      case 'address':
        return checkpoints.address_doc === true || (
          profile.house_number && profile.street && profile.village_city && 
          profile.district && profile.state && profile.pin_code
        );
      case 'identification':
        return checkpoints.aadhaar_otp === true || profile.aadhaar_number;
      case 'demographic':
        return profile.education_level && profile.occupation;
      case 'family':
        return checkpoints.family_linking === true;
      case 'biometric':
        return checkpoints.biometrics === true || profile.biometric_hash;
      case 'documents':
        return checkpoints.address_doc === true || profile.address_proof_url;
      case 'voter':
        return profile.epic_number || profile.polling_station_id;
      case 'nri':
        return profile.is_nri === false || (profile.is_nri === true && profile.country_of_residence);
      case 'security':
        return profile.two_factor_enabled !== undefined;
      case 'notifications':
        return profile.receive_sms_updates !== undefined || profile.receive_email_updates !== undefined;
      case 'consent':
        return profile.consent_indian_citizen === true && profile.consent_details_correct === true;
      case 'review':
        return (completion.completionPercentage || 0) >= 100;
      default:
        return false;
    }
  };

  const sections = [
    { id: 'personal', name: t('personal_details'), icon: '👤' },
    { id: 'contact', name: t('contact_details'), icon: '📞' },
    { id: 'address', name: t('address_details'), icon: '📍' },
    { id: 'identification', name: t('identification'), icon: '🆔' },
    { id: 'demographic', name: t('demographics'), icon: '📊' },
    { id: 'family', name: t('family_household'), icon: '👨‍👩‍👧‍👦' },
    { id: 'voter', name: t('voter_specific'), icon: '🗳️' },
    { id: 'documents', name: t('documents'), icon: '📄' },
    { id: 'biometric', name: t('biometrics'), icon: '🔐' },
    { id: 'nri', name: t('nri_details'), icon: '🌍' },
    { id: 'security', name: t('security_settings'), icon: '🔒' },
    { id: 'notifications', name: t('notifications'), icon: '🔔' },
    { id: 'consent', name: t('consent_declarations'), icon: '✅' },
    { id: 'review', name: t('review_submit'), icon: '📋' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-light flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-navy mx-auto mb-4"></div>
          <p className="text-gray-600">{t('loading_profile')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-light">
      {/* Progress Bar at Top - Sticky */}
      <div className="bg-white border-b-2 border-gray-200 shadow-sm sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-4">
              <h3 className="text-lg font-bold text-gray-800">Profile Completion Progress</h3>
              <div className={`text-2xl font-bold ${getCompletionColor(completion?.completionPercentage || 0)}`}>
                {completion?.completionPercentage || 0}%
              </div>
            </div>
            <div className="text-sm text-gray-600">
              {completion?.completionPercentage === 100 ? '✅ Complete' : '⚠️ Incomplete'}
            </div>
          </div>
          <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                (completion?.completionPercentage || 0) < 50
                  ? 'bg-red-500'
                  : (completion?.completionPercentage || 0) < 80
                  ? 'bg-yellow-500'
                  : 'bg-green-500'
              }`}
              style={{ width: `${completion?.completionPercentage || 0}%` }}
            ></div>
          </div>
          {lastSavedSection && (
            <div className="mt-2 text-sm text-green-600 font-medium animate-pulse">
              ✅ {t('saved')}: {sections.find(s => s.id === lastSavedSection)?.name || lastSavedSection}
            </div>
          )}
        </div>
      </div>

      <div className="py-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="card mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-heading font-bold text-gray-800 mb-2">{t('update_profile')}</h1>
                <p className="text-gray-600">{t('complete_profile')}</p>
              </div>
              <div className="flex items-center space-x-4">
                <LanguageSelector compact={true} showLabel={false} />
              </div>
            </div>

          {/* Verification Checkpoints */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            {Object.entries(completion?.checkpoints || {}).map(([key, value]: [string, any]) => (
              <div
                key={key}
                className={`p-2 rounded-lg border-2 ${
                  value ? 'bg-green-50 border-green-300' : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center gap-2 text-sm">
                  <span>{value ? '✅' : '❌'}</span>
                  <span className="capitalize">
                    {key === 'aadhaar_otp' ? t('aadhaar_otp') :
                     key === 'email_otp' ? t('email_otp') :
                     key === 'mobile_otp' ? t('mobile_otp') :
                     key === 'address_doc' ? t('address_doc') :
                     key === 'personal_info' ? t('personal_info') :
                     key === 'biometrics' ? t('biometrics_check') :
                     key === 'family_linking' ? t('family_linking') :
                     key.replace('_', ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
          </div>

        <div className="grid md:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="md:col-span-1">
            <div className="card sticky top-4">
              <h3 className="font-bold text-gray-800 mb-4">{t('sections')}</h3>
              <nav className="space-y-2">
                {sections.map((section) => {
                  const isCompleted = isSectionCompleted(section.id);
                  const isActive = activeSection === section.id;
                  const justSaved = lastSavedSection === section.id;
                  
                  return (
                    <button
                      key={section.id}
                      onClick={() => {
                        setActiveSection(section.id);
                        setLastSavedSection(null); // Clear saved indicator when switching sections
                      }}
                      className={`w-full text-left px-4 py-2 rounded-lg transition relative ${
                        isActive
                          ? 'bg-primary-navy text-white'
                          : isCompleted
                          ? 'bg-green-50 text-gray-700 hover:bg-green-100 border-l-4 border-green-500'
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <span className="mr-2">{section.icon}</span>
                          <span>{section.name}</span>
                        </div>
                        {isCompleted && (
                          <span className={`ml-2 text-xl ${isActive ? 'text-white' : 'text-green-600'}`}>
                            ✅
                          </span>
                        )}
                        {justSaved && !isCompleted && (
                          <span className="ml-2 text-xs text-blue-600 animate-pulse">
                            {t('saved')}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="md:col-span-3">
            {/* Personal Details Section */}
            {activeSection === 'personal' && (
              <div className="card">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">👤 {t('personal_details')}</h2>
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('full_name')} *</label>
                      <input
                        type="text"
                        value={formData.name || ''}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className="input-field"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('gender')} *</label>
                      <select
                        value={formData.gender || ''}
                        onChange={(e) => handleInputChange('gender', e.target.value)}
                        className="input-field"
                      >
                        <option value="">{t('select')}</option>
                        <option value="male">{t('male')}</option>
                        <option value="female">{t('female')}</option>
                        <option value="other">{t('other')}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('date_of_birth')} *</label>
                      <input
                        type="date"
                        value={formData.dob || ''}
                        onChange={(e) => handleInputChange('dob', e.target.value)}
                        className="input-field"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('marital_status')}</label>
                      <select
                        value={formData.marital_status || ''}
                        onChange={(e) => handleInputChange('marital_status', e.target.value)}
                        className="input-field"
                      >
                        <option value="">{t('select')}</option>
                        <option value="Single">{t('single')}</option>
                        <option value="Married">{t('married')}</option>
                        <option value="Divorced">{t('divorced')}</option>
                        <option value="Widowed">{t('widowed')}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('father_name')} *</label>
                      <input
                        type="text"
                        value={formData.father_name || ''}
                        onChange={(e) => handleInputChange('father_name', e.target.value)}
                        className="input-field"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('mother_name')}</label>
                      <input
                        type="text"
                        value={formData.mother_name || ''}
                        onChange={(e) => handleInputChange('mother_name', e.target.value)}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('guardian_name')}</label>
                      <input
                        type="text"
                        value={formData.guardian_name || ''}
                        onChange={(e) => handleInputChange('guardian_name', e.target.value)}
                        className="input-field"
                      />
                    </div>
                    {formData.marital_status === 'Married' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t('spouse_name')}</label>
                        <input
                          type="text"
                          value={formData.spouse_name || ''}
                          onChange={(e) => handleInputChange('spouse_name', e.target.value)}
                          className="input-field"
                        />
                      </div>
                    )}
                  </div>
                  <button onClick={() => handleSave('personal')} className="btn-primary" disabled={saving}>
                    {saving ? t('saving') : t('save_personal_details')}
                  </button>
                </div>
              </div>
            )}

            {/* Contact Details Section */}
            {activeSection === 'contact' && (
              <div className="card">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">📞 {t('contact_details')}</h2>
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('mobile_number')} *</label>
                      <div className="flex gap-2">
                        <input
                          type="tel"
                          value={formData.mobile_number || ''}
                          onChange={(e) => handleInputChange('mobile_number', e.target.value.replace(/\D/g, '').slice(0, 10))}
                          className="input-field flex-1"
                          maxLength={10}
                          required
                        />
                        <button
                          onClick={() => handleVerifyContact('mobile')}
                          className={`px-4 py-2 rounded-lg ${
                            profile?.mobile_verified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          {profile?.mobile_verified ? `✅ ${t('verified')}` : t('verify')}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('email')} *</label>
                      <div className="flex gap-2">
                        <input
                          type="email"
                          value={formData.email || ''}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          className="input-field flex-1"
                          required
                        />
                        <button
                          onClick={() => handleVerifyContact('email')}
                          className={`px-4 py-2 rounded-lg ${
                            profile?.email_verified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          {profile?.email_verified ? `✅ ${t('verified')}` : t('verify')}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('alternate_mobile')}</label>
                      <input
                        type="tel"
                        value={formData.alternate_mobile || ''}
                        onChange={(e) => handleInputChange('alternate_mobile', e.target.value.replace(/\D/g, '').slice(0, 10))}
                        className="input-field"
                        maxLength={10}
                      />
                    </div>
                  </div>
                  <button onClick={() => handleSave('contact')} className="btn-primary" disabled={saving}>
                    {saving ? t('saving') : t('save_contact_details')}
                  </button>
                </div>
              </div>
            )}

            {/* Address Details Section */}
            {activeSection === 'address' && (
              <div className="card">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">📍 {t('address_details')}</h2>
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('house_number')} *</label>
                      <input
                        type="text"
                        value={formData.house_number || ''}
                        onChange={(e) => handleInputChange('house_number', e.target.value)}
                        className="input-field"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('street')} *</label>
                      <input
                        type="text"
                        value={formData.street || ''}
                        onChange={(e) => handleInputChange('street', e.target.value)}
                        className="input-field"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('village_city')} *</label>
                      <input
                        type="text"
                        value={formData.village_city || ''}
                        onChange={(e) => handleInputChange('village_city', e.target.value)}
                        className="input-field"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('district')} *</label>
                      <input
                        type="text"
                        value={formData.district || ''}
                        onChange={(e) => handleInputChange('district', e.target.value)}
                        className="input-field"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('state')} *</label>
                      <select
                        value={formData.state || ''}
                        onChange={(e) => handleInputChange('state', e.target.value)}
                        className="input-field"
                        required
                      >
                        <option value="">{t('select')} {t('state')}</option>
                        <option value="Andhra Pradesh">Andhra Pradesh</option>
                        <option value="Arunachal Pradesh">Arunachal Pradesh</option>
                        <option value="Assam">Assam</option>
                        <option value="Bihar">Bihar</option>
                        <option value="Chhattisgarh">Chhattisgarh</option>
                        <option value="Goa">Goa</option>
                        <option value="Gujarat">Gujarat</option>
                        <option value="Haryana">Haryana</option>
                        <option value="Himachal Pradesh">Himachal Pradesh</option>
                        <option value="Jharkhand">Jharkhand</option>
                        <option value="Karnataka">Karnataka</option>
                        <option value="Kerala">Kerala</option>
                        <option value="Madhya Pradesh">Madhya Pradesh</option>
                        <option value="Maharashtra">Maharashtra</option>
                        <option value="Manipur">Manipur</option>
                        <option value="Meghalaya">Meghalaya</option>
                        <option value="Mizoram">Mizoram</option>
                        <option value="Nagaland">Nagaland</option>
                        <option value="Odisha">Odisha</option>
                        <option value="Punjab">Punjab</option>
                        <option value="Rajasthan">Rajasthan</option>
                        <option value="Sikkim">Sikkim</option>
                        <option value="Tamil Nadu">Tamil Nadu</option>
                        <option value="Telangana">Telangana</option>
                        <option value="Tripura">Tripura</option>
                        <option value="Uttar Pradesh">Uttar Pradesh</option>
                        <option value="Uttarakhand">Uttarakhand</option>
                        <option value="West Bengal">West Bengal</option>
                        <option value="Andaman and Nicobar Islands">Andaman and Nicobar Islands</option>
                        <option value="Chandigarh">Chandigarh</option>
                        <option value="Dadra and Nagar Haveli and Daman and Diu">Dadra and Nagar Haveli and Daman and Diu</option>
                        <option value="Delhi">Delhi</option>
                        <option value="Jammu and Kashmir">Jammu and Kashmir</option>
                        <option value="Ladakh">Ladakh</option>
                        <option value="Lakshadweep">Lakshadweep</option>
                        <option value="Puducherry">Puducherry</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('pin_code')} *</label>
                      <input
                        type="text"
                        value={formData.pin_code || ''}
                        onChange={(e) => handleInputChange('pin_code', e.target.value.replace(/\D/g, '').slice(0, 6))}
                        className="input-field"
                        maxLength={6}
                        required
                      />
                    </div>
                  </div>
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-gray-700">
                      <strong>Note:</strong> Address proof document upload is mandatory for verification.
                    </p>
                  </div>
                  <button onClick={() => handleSave('address')} className="btn-primary" disabled={saving}>
                    {saving ? t('saving') : t('save_address_details')}
                  </button>
                </div>
              </div>
            )}

            {/* Identification Section */}
            {activeSection === 'identification' && (
              <div className="card">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">🆔 Identification Details</h2>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                    <p className="text-sm text-gray-700">
                      <strong>Aadhaar Number:</strong> {profile?.aadhaar_number ? 
                        `${profile.aadhaar_number.slice(0, 4)}****${profile.aadhaar_number.slice(-4)}` : 
                        'Not provided'}
                    </p>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('pan_number')}</label>
                      <input
                        type="text"
                        value={formData.pan_number || ''}
                        onChange={(e) => handleInputChange('pan_number', e.target.value.toUpperCase())}
                        className="input-field"
                        maxLength={10}
                        placeholder="ABCDE1234F"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('driving_license_number')}</label>
                      <input
                        type="text"
                        value={formData.driving_license_number || ''}
                        onChange={(e) => handleInputChange('driving_license_number', e.target.value)}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('passport_number')}</label>
                      <input
                        type="text"
                        value={formData.passport_number || ''}
                        onChange={(e) => handleInputChange('passport_number', e.target.value.toUpperCase())}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('ration_card_number')}</label>
                      <input
                        type="text"
                        value={formData.ration_card_number || ''}
                        onChange={(e) => handleInputChange('ration_card_number', e.target.value)}
                        className="input-field"
                      />
                    </div>
                  </div>
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <button
                      onClick={async () => {
                        // Get voter_id from profile or user_data
                        let voterId = profile?.voter_id;
                        if (!voterId) {
                          const userData = localStorage.getItem('user_data');
                          if (userData) {
                            try {
                              const user = JSON.parse(userData);
                              voterId = user.voter_id || user.id;
                            } catch (e) {
                              console.error('Error parsing user data:', e);
                            }
                          }
                        }
                        
                        if (!voterId) {
                          alert('Profile not loaded. Please refresh the page or complete registration first.');
                          return;
                        }
                        
                        setSaving(true);
                        try {
                          const aadhaarNumber = profile?.aadhaar_number || formData.pan_number || '123456789012';
                          const response = await profileService.importFromDigiLocker(
                            voterId,
                            aadhaarNumber
                          );
                          if (response.data?.success) {
                            const fieldsUpdated = response.data.data?.fields_updated || 0;
                            alert(`✅ Successfully imported ${fieldsUpdated} fields from DigiLocker!\n\nYour profile has been updated with:\n- Personal details\n- Identification documents\n- Address information\n- Education & occupation`);
                            await loadProfile();
                          } else {
                            alert('Data imported from DigiLocker (mock)');
                            await loadProfile();
                          }
                        } catch (error: any) {
                          console.error('DigiLocker import error:', error);
                          const errorMsg = error.response?.data?.error || error.message || 'Unknown error';
                          if (errorMsg.includes('voter_id') || errorMsg.includes('null')) {
                            alert('Profile not loaded. Please refresh the page or complete registration first.');
                          } else {
                            alert(`Failed to import from DigiLocker: ${errorMsg}`);
                          }
                        } finally {
                          setSaving(false);
                        }
                      }}
                      className="text-green-700 hover:underline font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={saving}
                    >
                      {saving ? `⏳ ${t('importing')}` : `📥 ${t('import_from_digilocker_mock')}`}
                    </button>
                    <p className="text-xs text-gray-600 mt-2">
                      Click to import mock data from DigiLocker including personal details, identification documents, and address information.
                    </p>
                  </div>
                  <button onClick={() => handleSave('identification')} className="btn-primary" disabled={saving}>
                    {saving ? t('saving') : t('save_identification_details')}
                  </button>
                </div>
              </div>
            )}

            {/* Demographic Section */}
            {activeSection === 'demographic' && (
              <div className="card">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">📊 Demographic & Social Details</h2>
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('education_level')} *</label>
                      <select
                        value={formData.education_level || ''}
                        onChange={(e) => handleInputChange('education_level', e.target.value)}
                        className="input-field"
                        required
                      >
                        <option value="">Select</option>
                        <option value="Illiterate">Illiterate</option>
                        <option value="Primary">Primary</option>
                        <option value="Middle">Middle</option>
                        <option value="High School">High School</option>
                        <option value="Higher Secondary">Higher Secondary</option>
                        <option value="Graduate">Graduate</option>
                        <option value="Post Graduate">Post Graduate</option>
                        <option value="Professional">Professional</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('occupation')} *</label>
                      <input
                        type="text"
                        value={formData.occupation || ''}
                        onChange={(e) => handleInputChange('occupation', e.target.value)}
                        className="input-field"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Income Range</label>
                      <select
                        value={formData.income_range || ''}
                        onChange={(e) => handleInputChange('income_range', e.target.value)}
                        className="input-field"
                      >
                        <option value="">Select</option>
                        <option value="Below 1 Lakh">Below ₹1 Lakh</option>
                        <option value="1-3 Lakhs">₹1-3 Lakhs</option>
                        <option value="3-5 Lakhs">₹3-5 Lakhs</option>
                        <option value="5-10 Lakhs">₹5-10 Lakhs</option>
                        <option value="Above 10 Lakhs">Above ₹10 Lakhs</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Special Category</label>
                      <select
                        value={formData.special_category || ''}
                        onChange={(e) => handleInputChange('special_category', e.target.value)}
                        className="input-field"
                      >
                        <option value="">None</option>
                        <option value="Senior Citizen">Senior Citizen</option>
                        <option value="Armed Forces">Armed Forces</option>
                        <option value="Student">Student</option>
                        <option value="NRI">NRI</option>
                        <option value="Migrant Worker">Migrant Worker</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.disability_status || false}
                          onChange={(e) => handleInputChange('disability_status', e.target.checked)}
                          className="w-5 h-5"
                        />
                        <span className="text-sm font-medium text-gray-700">{t('has_disability')}</span>
                      </label>
                    </div>
                  </div>
                  <button onClick={() => handleSave('demographic')} className="btn-primary" disabled={saving}>
                    {saving ? t('saving') : t('save_demographic_details')}
                  </button>
                </div>
              </div>
            )}

            {/* Family Linking Section */}
            {activeSection === 'family' && (
              <div className="card">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">👨‍👩‍👧‍👦 Family Linking</h2>
                <FamilyLinkingSection voterId={profile?.voter_id || (() => {
                  const userData = localStorage.getItem('user_data');
                  if (userData) {
                    try {
                      const user = JSON.parse(userData);
                      return user.voter_id || user.id;
                    } catch (e) {}
                  }
                  return null;
                })()} />
              </div>
            )}

            {/* Documents Section */}
            {activeSection === 'documents' && (
              <div className="card">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">📄 Document Upload</h2>
                <p className="text-gray-600 mb-4">{t('upload_required_documents_note')}</p>
                {(() => {
                  let voterId = profile?.voter_id;
                  if (!voterId) {
                    const userData = localStorage.getItem('user_data');
                    if (userData) {
                      try {
                        const user = JSON.parse(userData);
                        voterId = user.voter_id || user.id;
                      } catch (e) {}
                    }
                  }
                  return voterId ? (
                    <DocumentUpload
                      voterId={voterId}
                      onUploadComplete={loadProfile}
                    />
                  ) : (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-gray-700">Please complete personal details first.</p>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Biometric Section */}
            {activeSection === 'biometric' && (
              <div className="card">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">🔐 Biometric Details</h2>
                {(() => {
                  let voterId = profile?.voter_id;
                  if (!voterId) {
                    const userData = localStorage.getItem('user_data');
                    if (userData) {
                      try {
                        const user = JSON.parse(userData);
                        voterId = user.voter_id || user.id;
                      } catch (e) {}
                    }
                  }
                  return voterId ? (
                    <BiometricCapture
                      voterId={voterId}
                      onCapture={async (faceEmbedding, faceHash, fingerprintTemplate, fingerprintHash, livenessPassed) => {
                        try {
                          setSaving(true);
                          // Register face biometric
                          await biometricService.registerFace(voterId, faceEmbedding, faceHash, livenessPassed);
                          // Register fingerprint biometric
                          await biometricService.registerFingerprint(voterId, fingerprintTemplate, fingerprintHash);
                          alert('Biometric data registered successfully!');
                          setBiometricData({ faceEmbedding, faceHash, fingerprintTemplate, fingerprintHash, livenessPassed });
                          await loadProfile();
                        } catch (error: any) {
                          alert(error.response?.data?.error || error.message || 'Failed to register biometric data');
                        } finally {
                          setSaving(false);
                        }
                      }}
                      onCancel={() => {}}
                      mode="register"
                    />
                  ) : (
                    <div className="text-center py-8 text-gray-600">
                      Please complete your profile first to register biometrics.
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Voter-Specific Section */}
            {activeSection === 'voter' && (
              <div className="card">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">🗳️ Voter-Specific Information</h2>
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="first_time_voter" checked={(formData as any).is_first_time_voter || false} onChange={(e) => handleInputChange('is_first_time_voter', e.target.checked)} className="w-5 h-5" />
                      <label htmlFor="first_time_voter" className="text-sm font-medium text-gray-700">First-time Voter</label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="migrant_worker" checked={(formData as any).is_migrant_worker || false} onChange={(e) => handleInputChange('is_migrant_worker', e.target.checked)} className="w-5 h-5" />
                      <label htmlFor="migrant_worker" className="text-sm font-medium text-gray-700">Migrant Worker</label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="needs_disability_assistance" checked={(formData as any).needs_disability_assistance || false} onChange={(e) => handleInputChange('needs_disability_assistance', e.target.checked)} className="w-5 h-5" />
                      <label htmlFor="needs_disability_assistance" className="text-sm font-medium text-gray-700">Needs Disability Assistance</label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="needs_braille_ballot" checked={(formData as any).needs_braille_ballot || false} onChange={(e) => handleInputChange('needs_braille_ballot', e.target.checked)} className="w-5 h-5" />
                      <label htmlFor="needs_braille_ballot" className="text-sm font-medium text-gray-700">Needs Braille Ballot</label>
                    </div>
                  </div>
                  <button onClick={() => handleSave('voter')} className="btn-primary" disabled={saving}>{saving ? t('saving') : t('save_voter_details')}</button>
                </div>
              </div>
            )}

            {/* NRI Section */}
            {activeSection === 'nri' && (
              <div className="card">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">🌍 NRI-Specific Details</h2>
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <input type="checkbox" id="is_nri" checked={(formData as any).is_nri || false} onChange={(e) => handleInputChange('is_nri', e.target.checked)} className="w-5 h-5" />
                    <label htmlFor="is_nri" className="text-sm font-medium text-gray-700">I am an NRI Voter</label>
                  </div>
                  {(formData as any).is_nri && (
                    <div className="grid md:grid-cols-2 gap-4">
                      <div><label className="block text-sm font-medium text-gray-700 mb-2">Country of Residence</label><input type="text" value={(formData as any).country_of_residence || ''} onChange={(e) => handleInputChange('country_of_residence', e.target.value)} className="input-field" /></div>
                      <div><label className="block text-sm font-medium text-gray-700 mb-2">Embassy/Consulate Jurisdiction</label><input type="text" value={(formData as any).embassy_jurisdiction || ''} onChange={(e) => handleInputChange('embassy_jurisdiction', e.target.value)} className="input-field" /></div>
                      <div><label className="block text-sm font-medium text-gray-700 mb-2">Visa Type</label><input type="text" value={(formData as any).visa_type || ''} onChange={(e) => handleInputChange('visa_type', e.target.value)} className="input-field" /></div>
                      <div><label className="block text-sm font-medium text-gray-700 mb-2">OCI/PIO Status</label><input type="text" value={(formData as any).oci_pio_status || ''} onChange={(e) => handleInputChange('oci_pio_status', e.target.value)} className="input-field" /></div>
                      <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-2">Foreign Address</label><textarea value={(formData as any).foreign_address || ''} onChange={(e) => handleInputChange('foreign_address', e.target.value)} className="input-field" rows={3} /></div>
                    </div>
                  )}
                  <button onClick={() => handleSave('nri')} className="btn-primary" disabled={saving}>{saving ? t('saving') : t('save_nri_details')}</button>
                </div>
              </div>
            )}

            {/* Security Settings Section */}
            {activeSection === 'security' && (
              <div className="card">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">🔒 Security & Authentication Settings</h2>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="two_factor" checked={(formData as any).two_factor_enabled || false} onChange={(e) => handleInputChange('two_factor_enabled', e.target.checked)} className="w-5 h-5" />
                    <label htmlFor="two_factor" className="text-sm font-medium text-gray-700">Enable Two-Factor Authentication</label>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium text-gray-700 mb-2">Security Question 1</label><input type="text" value={(formData as any).security_question_1 || ''} onChange={(e) => handleInputChange('security_question_1', e.target.value)} className="input-field" placeholder="e.g., What was your first pet's name?" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-2">Answer 1</label><input type="password" value={(formData as any).security_answer_1 || ''} onChange={(e) => handleInputChange('security_answer_1', e.target.value)} className="input-field" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-2">Security Question 2</label><input type="text" value={(formData as any).security_question_2 || ''} onChange={(e) => handleInputChange('security_question_2', e.target.value)} className="input-field" placeholder="e.g., What city were you born in?" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-2">Answer 2</label><input type="password" value={(formData as any).security_answer_2 || ''} onChange={(e) => handleInputChange('security_answer_2', e.target.value)} className="input-field" /></div>
                  </div>
                  <button onClick={() => handleSave('security')} className="btn-primary" disabled={saving}>{saving ? t('saving') : t('save_security_settings')}</button>
                </div>
              </div>
            )}

            {/* Notifications Section */}
            {activeSection === 'notifications' && (
              <div className="card">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">{t('communication_notifications')}</h2>
                <div className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"><label className="text-sm font-medium text-gray-700">{t('receive_sms_updates')}</label><input type="checkbox" checked={(formData as any).receive_sms_updates !== false} onChange={(e) => handleInputChange('receive_sms_updates', e.target.checked)} className="w-5 h-5" /></div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"><label className="text-sm font-medium text-gray-700">{t('receive_email_updates')}</label><input type="checkbox" checked={(formData as any).receive_email_updates !== false} onChange={(e) => handleInputChange('receive_email_updates', e.target.checked)} className="w-5 h-5" /></div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"><label className="text-sm font-medium text-gray-700">{t('election_reminders')}</label><input type="checkbox" checked={(formData as any).receive_election_reminders !== false} onChange={(e) => handleInputChange('receive_election_reminders', e.target.checked)} className="w-5 h-5" /></div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"><label className="text-sm font-medium text-gray-700">{t('booth_change_alerts')}</label><input type="checkbox" checked={(formData as any).receive_booth_change_alerts !== false} onChange={(e) => handleInputChange('receive_booth_change_alerts', e.target.checked)} className="w-5 h-5" /></div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"><label className="text-sm font-medium text-gray-700">{t('grievance_status_alerts')}</label><input type="checkbox" checked={(formData as any).receive_grievance_alerts !== false} onChange={(e) => handleInputChange('receive_grievance_alerts', e.target.checked)} className="w-5 h-5" /></div>
                  </div>
                  <button onClick={() => handleSave('notifications')} className="btn-primary" disabled={saving}>{saving ? t('saving') : t('save_notification_settings')}</button>
                </div>
              </div>
            )}

            {/* Consent & Declarations Section */}
            {activeSection === 'consent' && (
              <div className="card">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">{t('digital_consent_declarations')}</h2>
                <div className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-4 border-2 border-gray-200 rounded-lg"><input type="checkbox" id="consent_citizen" checked={(formData as any).consent_indian_citizen || false} onChange={(e) => handleInputChange('consent_indian_citizen', e.target.checked)} className="w-5 h-5 mt-1" required /><label htmlFor="consent_citizen" className="text-sm font-medium text-gray-700">{t('confirm_indian_citizen')} *</label></div>
                    <div className="flex items-start gap-3 p-4 border-2 border-gray-200 rounded-lg"><input type="checkbox" id="consent_details" checked={(formData as any).consent_details_correct || false} onChange={(e) => handleInputChange('consent_details_correct', e.target.checked)} className="w-5 h-5 mt-1" required /><label htmlFor="consent_details" className="text-sm font-medium text-gray-700">{t('confirm_details_correct')} *</label></div>
                    <div className="flex items-start gap-3 p-4 border-2 border-gray-200 rounded-lg"><input type="checkbox" id="consent_biometric" checked={(formData as any).consent_biometric_verification || false} onChange={(e) => handleInputChange('consent_biometric_verification', e.target.checked)} className="w-5 h-5 mt-1" /><label htmlFor="consent_biometric" className="text-sm font-medium text-gray-700">{t('allow_biometric')}</label></div>
                    <div className="flex items-start gap-3 p-4 border-2 border-gray-200 rounded-lg"><input type="checkbox" id="consent_residency" checked={(formData as any).consent_residency_confirmed || false} onChange={(e) => handleInputChange('consent_residency_confirmed', e.target.checked)} className="w-5 h-5 mt-1" required /><label htmlFor="consent_residency" className="text-sm font-medium text-gray-700">{t('confirm_residency')} *</label></div>
                    <div className="flex items-start gap-3 p-4 border-2 border-gray-200 rounded-lg"><input type="checkbox" id="consent_eci" checked={(formData as any).consent_eci_matching || false} onChange={(e) => handleInputChange('consent_eci_matching', e.target.checked)} className="w-5 h-5 mt-1" required /><label htmlFor="consent_eci" className="text-sm font-medium text-gray-700">{t('authorize_eci_matching')} *</label></div>
                  </div>
                  <button onClick={() => { handleInputChange('consent_date', new Date().toISOString()); handleSave('consent'); }} className="btn-primary" disabled={saving}>{saving ? t('saving') : t('save_consents')}</button>
                </div>
              </div>
            )}

            {/* Review & Submit Section */}
            {activeSection === 'review' && (
              <div className="card">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">{t('review_submit')}</h2>
                <div className="space-y-6">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-gray-700 mb-2"><strong>Profile Completion:</strong> {completion?.completionPercentage || 0}%</p>
                    <p className="text-sm text-gray-600">Please review all sections before final submission. Once submitted, your profile will be sent for verification.</p>
                  </div>
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-800">Verification Checkpoints:</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(completion?.checkpoints || {}).map(([key, value]: [string, any]) => (
                        <div key={key} className={`p-2 rounded ${value ? 'bg-green-50' : 'bg-red-50'}`}>
                          <span className="text-sm">{value ? '✅' : '❌'} {key.replace('_', ' ')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={async () => { if (confirm(t('submit_profile_verification'))) { setSaving(true); try { await handleSave('review'); alert(t('profile_submitted')); } catch (error) { alert(t('failed_submit')); } finally { setSaving(false); } } }} className="btn-primary flex-1" disabled={saving || (completion?.completionPercentage || 0) < 80}>{saving ? t('submitting') : t('submit_for_verification')}</button>
                    <button onClick={() => setActiveSection('personal')} className="btn-secondary">{t('edit_profile')}</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        </div>
      </div>

      {/* OTP Verification Modal */}
      {showOTPModal && (
        <OTPVerification
          otpType={otpType === 'mobile' ? 'mobile' : otpType === 'email' ? 'email' : 'aadhaar'}
          identifier={otpType === 'email' ? (formData.email || '') : (formData.mobile_number || '')}
          onVerify={handleOTPVerify}
          onCancel={() => setShowOTPModal(false)}
        />
      )}
    </div>
  );
}

