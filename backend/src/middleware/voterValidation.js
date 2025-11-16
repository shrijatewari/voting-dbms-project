/**
 * Voter Registration Validation Middleware
 * Validates all essential fields during registration
 */

const validateVoterRegistration = (req, res, next) => {
  const {
    name,
    dob,
    aadhaar_number,
    email,
    mobile_number,
    father_name,
    gender,
    house_number,
    street,
    village_city,
    district,
    state,
    pin_code
  } = req.body;

  const errors = [];

  // Mandatory fields
  if (!name || name.trim().length < 3) {
    errors.push({ field: 'name', message: 'Full name is required (minimum 3 characters)' });
  }

  if (!dob) {
    errors.push({ field: 'dob', message: 'Date of birth is required' });
  } else {
    const dobDate = new Date(dob);
    if (Number.isNaN(dobDate.getTime())) {
      errors.push({ field: 'dob', message: 'Invalid date of birth' });
    } else {
      const today = new Date();
      if (dobDate > today) {
        errors.push({ field: 'dob', message: 'Date of birth cannot be in the future' });
      } else {
        let age = today.getFullYear() - dobDate.getFullYear();
        const hasBirthdayPassed =
          today.getMonth() > dobDate.getMonth() ||
          (today.getMonth() === dobDate.getMonth() && today.getDate() >= dobDate.getDate());
        if (!hasBirthdayPassed) {
          age -= 1;
        }
        if (age < 18) {
          errors.push({ field: 'dob', message: 'You must be at least 18 years old to register' });
        }
      }
    }
  }

  if (!aadhaar_number || !/^\d{12}$/.test(aadhaar_number)) {
    errors.push({ field: 'aadhaar_number', message: 'Valid 12-digit Aadhaar number is required' });
  }

  // Email validation (mandatory)
  if (!email) {
    errors.push({ field: 'email', message: 'Email address is required' });
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errors.push({ field: 'email', message: 'Invalid email format' });
    }
  }

  // Mobile validation (mandatory)
  if (!mobile_number) {
    errors.push({ field: 'mobile_number', message: 'Mobile number is required' });
  } else {
    const mobileRegex = /^[6-9]\d{9}$/;
    if (!mobileRegex.test(mobile_number)) {
      errors.push({ field: 'mobile_number', message: 'Invalid mobile number (must be 10 digits starting with 6-9)' });
    }
  }

  // Father's name (mandatory for Indian voters)
  if (!father_name || father_name.trim().length < 3) {
    errors.push({ field: 'father_name', message: "Father's name is required (minimum 3 characters)" });
  }

  // Gender (mandatory) - accept both cases
  const validGenders = ['Male', 'Female', 'Transgender', 'Other', 'male', 'female', 'transgender', 'other'];
  if (!gender || !validGenders.includes(gender)) {
    errors.push({ field: 'gender', message: 'Valid gender is required (Male, Female, Transgender, Other)' });
  }

  // Address validation (mandatory)
  if (!house_number || house_number.trim().length < 1) {
    errors.push({ field: 'house_number', message: 'House/Building number is required' });
  }

  if (!street || street.trim().length < 3) {
    errors.push({ field: 'street', message: 'Street/Area is required (minimum 3 characters)' });
  }

  if (!village_city || village_city.trim().length < 2) {
    errors.push({ field: 'village_city', message: 'Village/City is required (minimum 2 characters)' });
  }

  if (!district || district.trim().length < 2) {
    errors.push({ field: 'district', message: 'District is required (minimum 2 characters)' });
  }

  if (!state || state.trim().length < 2) {
    errors.push({ field: 'state', message: 'State is required (minimum 2 characters)' });
  }

  if (!pin_code || !/^\d{6}$/.test(pin_code)) {
    errors.push({ field: 'pin_code', message: 'Valid 6-digit PIN code is required' });
  }

  // Check for duplicate email
  if (email) {
    // This will be checked in the service, but we can add a warning
  }

  // Check for duplicate mobile
  if (mobile_number) {
    // This will be checked in the service
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors
    });
  }

  next();
};

module.exports = {
  validateVoterRegistration
};

