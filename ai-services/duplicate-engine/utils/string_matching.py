"""
String matching utilities for duplicate detection
Implements Jaro-Winkler, Levenshtein, Soundex, Metaphone
"""

import logging

logger = logging.getLogger(__name__)

class StringMatcher:
    """String matching utilities"""
    
    def jaro_winkler(self, s1: str, s2: str, prefix_weight: float = 0.1) -> float:
        """
        Jaro-Winkler similarity (0-1)
        Higher values indicate more similarity
        """
        if not s1 or not s2:
            return 0.0
        
        s1 = s1.lower().strip()
        s2 = s2.lower().strip()
        
        if s1 == s2:
            return 1.0
        
        # Jaro distance
        jaro = self._jaro_distance(s1, s2)
        
        # Winkler modification: boost for common prefix
        prefix_len = 0
        max_prefix = min(len(s1), len(s2), 4)
        for i in range(max_prefix):
            if s1[i] == s2[i]:
                prefix_len += 1
            else:
                break
        
        winkler = jaro + (prefix_weight * prefix_len * (1 - jaro))
        return min(1.0, winkler)
    
    def _jaro_distance(self, s1: str, s2: str) -> float:
        """Calculate Jaro distance"""
        if len(s1) == 0 and len(s2) == 0:
            return 1.0
        if len(s1) == 0 or len(s2) == 0:
            return 0.0
        
        match_window = max(len(s1), len(s2)) // 2 - 1
        if match_window < 0:
            match_window = 0
        
        s1_matches = [False] * len(s1)
        s2_matches = [False] * len(s2)
        
        matches = 0
        transpositions = 0
        
        # Find matches
        for i in range(len(s1)):
            start = max(0, i - match_window)
            end = min(i + match_window + 1, len(s2))
            
            for j in range(start, end):
                if s2_matches[j] or s1[i] != s2[j]:
                    continue
                s1_matches[i] = True
                s2_matches[j] = True
                matches += 1
                break
        
        if matches == 0:
            return 0.0
        
        # Find transpositions
        k = 0
        for i in range(len(s1)):
            if not s1_matches[i]:
                continue
            while not s2_matches[k]:
                k += 1
            if s1[i] != s2[k]:
                transpositions += 1
            k += 1
        
        jaro = (
            matches / len(s1) +
            matches / len(s2) +
            (matches - transpositions / 2) / matches
        ) / 3.0
        
        return jaro
    
    def levenshtein(self, s1: str, s2: str) -> int:
        """Levenshtein distance (edit distance)"""
        if len(s1) < len(s2):
            return self.levenshtein(s2, s1)
        
        if len(s2) == 0:
            return len(s1)
        
        previous_row = range(len(s2) + 1)
        for i, c1 in enumerate(s1):
            current_row = [i + 1]
            for j, c2 in enumerate(s2):
                insertions = previous_row[j + 1] + 1
                deletions = current_row[j] + 1
                substitutions = previous_row[j] + (c1 != c2)
                current_row.append(min(insertions, deletions, substitutions))
            previous_row = current_row
        
        return previous_row[-1]
    
    def levenshtein_similarity(self, s1: str, s2: str) -> float:
        """Normalized Levenshtein similarity (0-1)"""
        if not s1 or not s2:
            return 0.0
        
        max_len = max(len(s1), len(s2))
        if max_len == 0:
            return 1.0
        
        distance = self.levenshtein(s1, s2)
        return 1.0 - (distance / max_len)
    
    def soundex(self, word: str) -> str:
        """Soundex phonetic encoding"""
        if not word:
            return ""
        
        word = word.upper()
        first_letter = word[0]
        
        # Remove non-alphabetic characters
        word = ''.join(c for c in word if c.isalpha())
        
        if not word:
            return ""
        
        # Soundex mapping
        soundex_map = {
            'B': '1', 'F': '1', 'P': '1', 'V': '1',
            'C': '2', 'G': '2', 'J': '2', 'K': '2', 'Q': '2', 'S': '2', 'X': '2', 'Z': '2',
            'D': '3', 'T': '3',
            'L': '4',
            'M': '5', 'N': '5',
            'R': '6'
        }
        
        soundex_code = first_letter
        prev_code = ''
        
        for char in word[1:]:
            code = soundex_map.get(char, '')
            if code and code != prev_code:
                soundex_code += code
            prev_code = code
        
        # Pad to 4 characters
        soundex_code = (soundex_code + '0000')[:4]
        return soundex_code
    
    def soundex_match(self, s1: str, s2: str) -> bool:
        """Check if two strings have the same Soundex code"""
        return self.soundex(s1) == self.soundex(s2)
    
    def metaphone(self, word: str) -> str:
        """Metaphone phonetic encoding (simplified version)"""
        if not word:
            return ""
        
        word = word.upper()
        # Simplified Metaphone - in production, use a library like Metaphone
        # This is a basic implementation
        word = word.replace('PH', 'F')
        word = word.replace('CK', 'K')
        word = word.replace('C', 'K')
        word = word.replace('Q', 'K')
        word = word.replace('Z', 'S')
        word = word.replace('X', 'KS')
        
        # Remove vowels except at start
        if len(word) > 1:
            word = word[0] + ''.join(c for c in word[1:] if c not in 'AEIOU')
        
        return word[:4]  # Return first 4 characters
    
    def metaphone_match(self, s1: str, s2: str) -> bool:
        """Check if two strings have similar Metaphone codes"""
        return self.metaphone(s1) == self.metaphone(s2)


