"""
Address normalization and fraud detection service
"""

import logging
import re
from typing import Dict, Any, List
import hashlib

logger = logging.getLogger(__name__)

class AddressService:
    """Service for address processing"""
    
    def __init__(self):
        # Common address abbreviations
        self.abbreviations = {
            'st': 'street', 'str': 'street', 'rd': 'road', 'ave': 'avenue',
            'blvd': 'boulevard', 'dr': 'drive', 'ln': 'lane', 'ct': 'court',
            'apt': 'apartment', 'fl': 'floor', 'no': 'number', 'nr': 'near'
        }
        logger.info("AddressService initialized")
    
    async def normalize(self, address: Dict[str, Any]) -> Dict[str, Any]:
        """Normalize address"""
        normalized = {}
        
        # Normalize each field
        normalized['house_number'] = self._normalize_text(address.get('house_number', ''))
        normalized['street'] = self._normalize_street(address.get('street', ''))
        normalized['village_city'] = self._normalize_text(address.get('village_city', ''))
        normalized['district'] = self._normalize_text(address.get('district', ''))
        normalized['state'] = self._normalize_text(address.get('state', ''))
        normalized['pin_code'] = self._normalize_pincode(address.get('pin_code', ''))
        
        # Calculate confidence based on completeness
        confidence = self._calculate_confidence(normalized)
        
        return {
            "normalized_address": normalized,
            "confidence": confidence
        }
    
    def _normalize_text(self, text: str) -> str:
        """Normalize text field"""
        if not text:
            return ""
        
        # Convert to lowercase
        text = text.lower().strip()
        
        # Remove extra spaces
        text = re.sub(r'\s+', ' ', text)
        
        # Capitalize first letter of each word
        text = ' '.join(word.capitalize() for word in text.split())
        
        return text
    
    def _normalize_street(self, street: str) -> str:
        """Normalize street name with abbreviation expansion"""
        if not street:
            return ""
        
        street = street.lower().strip()
        
        # Expand abbreviations
        words = street.split()
        expanded = []
        for word in words:
            # Remove punctuation
            word_clean = re.sub(r'[^\w]', '', word)
            if word_clean in self.abbreviations:
                expanded.append(self.abbreviations[word_clean])
            else:
                expanded.append(word)
        
        street = ' '.join(expanded)
        return self._normalize_text(street)
    
    def _normalize_pincode(self, pincode: Any) -> str:
        """Normalize PIN code"""
        if not pincode:
            return ""
        
        # Extract only digits
        pincode_str = re.sub(r'\D', '', str(pincode))
        
        # Validate length (Indian PIN codes are 6 digits)
        if len(pincode_str) == 6:
            return pincode_str
        elif len(pincode_str) > 6:
            return pincode_str[:6]
        else:
            return pincode_str.zfill(6)
    
    def _calculate_confidence(self, normalized: Dict[str, Any]) -> float:
        """Calculate normalization confidence"""
        required_fields = ['village_city', 'district', 'state', 'pin_code']
        present = sum(1 for field in required_fields if normalized.get(field))
        return present / len(required_fields)
    
    async def detect_fraud(self, address: Dict[str, Any]) -> Dict[str, Any]:
        """Detect fraudulent addresses"""
        reasons = []
        risk_score = 0.0
        
        # Check for invalid PIN code
        pin_code = str(address.get('pin_code', '')).strip()
        if pin_code and (len(pin_code) != 6 or not pin_code.isdigit()):
            reasons.append("Invalid PIN code format")
            risk_score += 0.3
        
        # Check for suspicious patterns
        house_number = str(address.get('house_number', '')).lower()
        if 'fake' in house_number or 'test' in house_number:
            reasons.append("Suspicious house number")
            risk_score += 0.4
        
        # Check for missing critical fields
        if not address.get('village_city') and not address.get('district'):
            reasons.append("Missing location information")
            risk_score += 0.2
        
        # Check for duplicate address hash (would need database lookup)
        address_hash = self._hash_address(address)
        
        is_fraud = risk_score >= 0.5
        
        return {
            "is_fraud": is_fraud,
            "risk_score": min(1.0, risk_score),
            "reasons": reasons,
            "cluster_id": address_hash[:8]  # First 8 chars as cluster ID
        }
    
    def _hash_address(self, address: Dict[str, Any]) -> str:
        """Generate hash for address clustering"""
        address_str = f"{address.get('house_number', '')}{address.get('street', '')}{address.get('village_city', '')}{address.get('pin_code', '')}"
        return hashlib.sha256(address_str.lower().encode()).hexdigest()
    
    async def analyze_clusters(self, addresses: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze address clusters for ghost houses"""
        clusters = {}
        
        for addr in addresses:
            cluster_id = self._hash_address(addr)[:8]
            if cluster_id not in clusters:
                clusters[cluster_id] = []
            clusters[cluster_id].append(addr)
        
        suspicious_clusters = []
        for cluster_id, cluster_addresses in clusters.items():
            if len(cluster_addresses) > 15:  # Threshold for ghost house
                suspicious_clusters.append({
                    "cluster_id": cluster_id,
                    "voter_count": len(cluster_addresses),
                    "risk_score": min(1.0, len(cluster_addresses) / 50.0),
                    "address": cluster_addresses[0] if cluster_addresses else {}
                })
        
        return {
            "total_clusters": len(clusters),
            "suspicious_clusters": suspicious_clusters,
            "max_voters_per_address": max(len(addrs) for addrs in clusters.values()) if clusters else 0
        }


