/**
 * String Matching Utilities
 * Implements Soundex, Metaphone, Jaro-Winkler, and other phonetic/fuzzy matching algorithms
 * for robust duplicate detection
 */

class StringMatchingUtils {
  /**
   * Soundex algorithm - phonetic matching for English names
   * Returns 4-character code representing sound of name
   */
  soundex(str) {
    if (!str) return '';
    
    str = str.toUpperCase().trim();
    const firstChar = str[0];
    
    // Remove non-letters
    str = str.replace(/[^A-Z]/g, '');
    
    // Soundex mapping
    const mapping = {
      'B': '1', 'F': '1', 'P': '1', 'V': '1',
      'C': '2', 'G': '2', 'J': '2', 'K': '2', 'Q': '2', 'S': '2', 'X': '2', 'Z': '2',
      'D': '3', 'T': '3',
      'L': '4',
      'M': '5', 'N': '5',
      'R': '6'
    };
    
    let code = firstChar;
    let prevCode = '';
    
    for (let i = 1; i < str.length && code.length < 4; i++) {
      const char = str[i];
      const charCode = mapping[char] || '';
      
      if (charCode && charCode !== prevCode) {
        code += charCode;
      }
      prevCode = charCode;
    }
    
    // Pad with zeros
    while (code.length < 4) {
      code += '0';
    }
    
    return code;
  }

  /**
   * Metaphone algorithm - improved phonetic matching
   * Returns phonetic code (variable length, typically 4-6 chars)
   */
  metaphone(str) {
    if (!str) return '';
    
    str = str.toUpperCase().trim();
    str = str.replace(/[^A-Z]/g, '');
    
    // Simplified Metaphone (full implementation is more complex)
    let code = '';
    let i = 0;
    
    // Handle initial characters
    if (str.startsWith('KN') || str.startsWith('GN') || str.startsWith('PN') || str.startsWith('AE') || str.startsWith('WR')) {
      i = 1;
    }
    
    if (str.startsWith('X')) {
      code += 'S';
      i = 1;
    }
    
    // Process remaining characters
    while (i < str.length && code.length < 6) {
      const char = str[i];
      const next = str[i + 1] || '';
      const prev = str[i - 1] || '';
      
      // Vowels
      if ('AEIOU'.includes(char)) {
        if (i === 0 || prev === ' ') {
          code += char;
        }
        i++;
        continue;
      }
      
      // Consonants
      switch (char) {
        case 'B':
          if (prev !== 'M' || next !== '') code += 'B';
          break;
        case 'C':
          if (next === 'H') {
            code += 'X';
            i++;
          } else if (next === 'E' || next === 'I' || next === 'Y') {
            code += 'S';
          } else {
            code += 'K';
          }
          break;
        case 'D':
          if (next === 'G' && ('EIY'.includes(str[i + 2] || ''))) {
            code += 'J';
            i++;
          } else {
            code += 'T';
          }
          break;
        case 'F':
          code += 'F';
          break;
        case 'G':
          if (next === 'H' && !'AEIOU'.includes(str[i + 2] || '')) {
            // Silent
          } else if (next === 'N') {
            code += 'N';
            i++;
          } else if (('EIY'.includes(next)) && prev !== 'G') {
            code += 'J';
          } else {
            code += 'K';
          }
          break;
        case 'H':
          if ('AEIOU'.includes(prev) && 'AEIOU'.includes(next)) {
            code += 'H';
          }
          break;
        case 'J':
          code += 'J';
          break;
        case 'K':
          if (prev !== 'C') code += 'K';
          break;
        case 'L':
          code += 'L';
          break;
        case 'M':
          code += 'M';
          break;
        case 'N':
          code += 'N';
          break;
        case 'P':
          if (next === 'H') {
            code += 'F';
            i++;
          } else {
            code += 'P';
          }
          break;
        case 'Q':
          code += 'K';
          break;
        case 'R':
          code += 'R';
          break;
        case 'S':
          if (next === 'H') {
            code += 'X';
            i++;
          } else if (next === 'C' && ('EIY'.includes(str[i + 2] || ''))) {
            code += 'S';
            i++;
          } else {
            code += 'S';
          }
          break;
        case 'T':
          if (next === 'H') {
            code += '0'; // TH sound
            i++;
          } else if (next === 'C' && next === 'H') {
            code += 'X';
            i++;
          } else {
            code += 'T';
          }
          break;
        case 'V':
          code += 'F';
          break;
        case 'W':
          if ('AEIOU'.includes(next)) code += 'W';
          break;
        case 'X':
          code += 'KS';
          break;
        case 'Y':
          if ('AEIOU'.includes(next)) code += 'Y';
          break;
        case 'Z':
          code += 'S';
          break;
      }
      
      i++;
    }
    
    return code.substring(0, 6);
  }

  /**
   * Jaro-Winkler similarity
   * Returns similarity score between 0 and 1
   */
  jaroWinkler(str1, str2) {
    if (!str1 || !str2) return 0;
    if (str1 === str2) return 1;
    
    const jaro = this.jaro(str1, str2);
    const prefixLength = this.commonPrefixLength(str1, str2, 4);
    const p = 0.1; // Scaling factor
    
    return jaro + (prefixLength * p * (1 - jaro));
  }

  /**
   * Jaro similarity
   */
  jaro(str1, str2) {
    if (str1.length === 0 && str2.length === 0) return 1;
    
    const matchWindow = Math.floor(Math.max(str1.length, str2.length) / 2) - 1;
    const str1Matches = new Array(str1.length).fill(false);
    const str2Matches = new Array(str2.length).fill(false);
    
    let matches = 0;
    let transpositions = 0;
    
    // Find matches
    for (let i = 0; i < str1.length; i++) {
      const start = Math.max(0, i - matchWindow);
      const end = Math.min(i + matchWindow + 1, str2.length);
      
      for (let j = start; j < end; j++) {
        if (str2Matches[j] || str1[i] !== str2[j]) continue;
        str1Matches[i] = true;
        str2Matches[j] = true;
        matches++;
        break;
      }
    }
    
    if (matches === 0) return 0;
    
    // Find transpositions
    let k = 0;
    for (let i = 0; i < str1.length; i++) {
      if (!str1Matches[i]) continue;
      while (!str2Matches[k]) k++;
      if (str1[i] !== str2[k]) transpositions++;
      k++;
    }
    
    return (
      matches / str1.length +
      matches / str2.length +
      (matches - transpositions / 2) / matches
    ) / 3;
  }

  /**
   * Common prefix length (for Jaro-Winkler)
   */
  commonPrefixLength(str1, str2, maxLength) {
    let prefix = 0;
    for (let i = 0; i < Math.min(maxLength, str1.length, str2.length); i++) {
      if (str1[i] === str2[i]) {
        prefix++;
      } else {
        break;
      }
    }
    return prefix;
  }

  /**
   * Levenshtein distance
   * Returns edit distance between two strings
   */
  levenshtein(str1, str2) {
    const len1 = str1.length;
    const len2 = str2.length;
    
    if (len1 === 0) return len2;
    if (len2 === 0) return len1;
    
    const matrix = Array(len1 + 1).fill(null).map(() => Array(len2 + 1).fill(0));
    
    for (let i = 0; i <= len1; i++) matrix[i][0] = i;
    for (let j = 0; j <= len2; j++) matrix[0][j] = j;
    
    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,      // deletion
          matrix[i][j - 1] + 1,      // insertion
          matrix[i - 1][j - 1] + cost // substitution
        );
      }
    }
    
    return matrix[len1][len2];
  }

  /**
   * Normalized Levenshtein similarity (0-1)
   */
  normalizedLevenshtein(str1, str2) {
    const maxLen = Math.max(str1.length, str2.length);
    if (maxLen === 0) return 1;
    const distance = this.levenshtein(str1, str2);
    return 1 - (distance / maxLen);
  }

  /**
   * Address similarity (normalized)
   * Compares address components
   */
  addressSimilarity(addr1, addr2) {
    if (!addr1 || !addr2) return 0;
    
    const components1 = this.normalizeAddress(addr1);
    const components2 = this.normalizeAddress(addr2);
    
    let totalScore = 0;
    let components = 0;
    
    // PIN code exact match
    if (components1.pin && components2.pin) {
      if (components1.pin === components2.pin) {
        totalScore += 0.3;
      }
      components += 0.3;
    }
    
    // District similarity
    if (components1.district && components2.district) {
      totalScore += this.jaroWinkler(components1.district, components2.district) * 0.3;
      components += 0.3;
    }
    
    // City similarity
    if (components1.city && components2.city) {
      totalScore += this.jaroWinkler(components1.city, components2.city) * 0.2;
      components += 0.2;
    }
    
    // Street similarity
    if (components1.street && components2.street) {
      totalScore += this.jaroWinkler(components1.street, components2.street) * 0.2;
      components += 0.2;
    }
    
    return components > 0 ? totalScore / components : 0;
  }

  /**
   * Normalize address for comparison
   */
  normalizeAddress(address) {
    if (typeof address === 'string') {
      // Try to parse string address
      return {
        pin: address.match(/\b\d{6}\b/)?.[0] || '',
        district: '',
        city: '',
        street: address
      };
    }
    
    return {
      pin: address.pin_code || address.pin || '',
      district: address.district || '',
      city: address.city || address.village_city || '',
      street: address.street || address.house_number || ''
    };
  }

  /**
   * Combined similarity score for voter matching
   */
  voterSimilarity(voter1, voter2, weights = {}) {
    const defaultWeights = {
      name: 0.4,
      dob: 0.2,
      address: 0.2,
      aadhaar: 0.2
    };
    
    const w = { ...defaultWeights, ...weights };
    let totalScore = 0;
    let totalWeight = 0;
    
    // Name similarity (phonetic + fuzzy)
    if (voter1.name && voter2.name) {
      const soundex1 = this.soundex(voter1.name);
      const soundex2 = this.soundex(voter2.name);
      const phoneticMatch = soundex1 === soundex2 ? 0.5 : 0;
      const fuzzyMatch = this.jaroWinkler(voter1.name.toLowerCase(), voter2.name.toLowerCase()) * 0.5;
      const nameScore = phoneticMatch + fuzzyMatch;
      totalScore += nameScore * w.name;
      totalWeight += w.name;
    }
    
    // DOB exact match
    if (voter1.dob && voter2.dob) {
      const dobScore = voter1.dob === voter2.dob ? 1 : 0;
      totalScore += dobScore * w.dob;
      totalWeight += w.dob;
    }
    
    // Address similarity
    if (voter1.address || voter2.address) {
      const addrScore = this.addressSimilarity(voter1.address || voter1, voter2.address || voter2);
      totalScore += addrScore * w.address;
      totalWeight += w.address;
    }
    
    // Aadhaar exact match (high weight)
    if (voter1.aadhaar_number && voter2.aadhaar_number) {
      const aadhaarScore = voter1.aadhaar_number === voter2.aadhaar_number ? 1 : 0;
      totalScore += aadhaarScore * w.aadhaar;
      totalWeight += w.aadhaar;
    }
    
    return totalWeight > 0 ? totalScore / totalWeight : 0;
  }
}

module.exports = new StringMatchingUtils();

