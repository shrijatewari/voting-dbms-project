"""
Duplicate Detection Service
Implements ML and fuzzy matching algorithms for duplicate detection
"""

import logging
from typing import Dict, Any, List
import numpy as np
from datetime import datetime

from utils.string_matching import StringMatcher
from utils.ml_classifier import DuplicateClassifier

logger = logging.getLogger(__name__)

class DuplicateDetectionService:
    """Service for detecting duplicate voter records"""
    
    def __init__(self):
        self.string_matcher = StringMatcher()
        self.ml_classifier = DuplicateClassifier()
        logger.info("DuplicateDetectionService initialized")
    
    async def predict_duplicate(
        self, 
        record1: Dict[str, Any], 
        record2: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Predict if two records are duplicates
        
        Returns:
            Dictionary with duplicate_probability, features, and recommendation
        """
        try:
            # Extract features
            features = self._extract_features(record1, record2)
            
            # Calculate individual similarity scores
            name_score = self.string_matcher.jaro_winkler(
                record1.get('name', ''), 
                record2.get('name', '')
            )
            
            father_name_score = self.string_matcher.jaro_winkler(
                record1.get('father_name', '') or '',
                record2.get('father_name', '') or ''
            )
            
            mother_name_score = self.string_matcher.jaro_winkler(
                record1.get('mother_name', '') or '',
                record2.get('mother_name', '') or ''
            )
            
            # DOB match (exact or within 1 day tolerance)
            dob_match = self._compare_dob(
                record1.get('dob'),
                record2.get('dob')
            )
            
            # Address similarity
            address_score = self._compare_address(
                record1.get('address', {}),
                record2.get('address', {})
            )
            
            # Phone number match
            phone_match = 1.0 if (
                record1.get('mobile_number') and 
                record2.get('mobile_number') and
                record1.get('mobile_number') == record2.get('mobile_number')
            ) else 0.0
            
            # Aadhaar partial match (last 4 digits)
            aadhaar_match = self._compare_aadhaar(
                record1.get('aadhaar_number'),
                record2.get('aadhaar_number')
            )
            
            # Face embedding similarity (if available)
            face_score = self._compare_face_embeddings(
                record1.get('face_embedding'),
                record2.get('face_embedding')
            )
            
            # Compile feature dictionary
            feature_dict = {
                "name_similarity": name_score,
                "father_name_similarity": father_name_score,
                "mother_name_similarity": mother_name_score,
                "dob_match": dob_match,
                "address_similarity": address_score,
                "phone_match": phone_match,
                "aadhaar_match": aadhaar_match,
                "face_similarity": face_score
            }
            
            # Use ML classifier to predict duplicate probability
            ml_features = np.array([
                name_score,
                father_name_score,
                mother_name_score,
                dob_match,
                address_score,
                phone_match,
                aadhaar_match,
                face_score
            ]).reshape(1, -1)
            
            duplicate_probability = self.ml_classifier.predict(ml_features)[0]
            confidence = self.ml_classifier.get_confidence(ml_features)
            
            # Determine algorithm flags
            algorithm_flags = []
            if name_score > 0.85:
                algorithm_flags.append("jaro_winkler_name")
            if dob_match == 1.0 and name_score > 0.7:
                algorithm_flags.append("dob_name_match")
            if address_score > 0.8 and name_score > 0.75:
                algorithm_flags.append("address_name_match")
            if face_score > 0.9:
                algorithm_flags.append("face_embedding_match")
            if phone_match == 1.0:
                algorithm_flags.append("phone_exact_match")
            
            # Generate recommendation
            if duplicate_probability >= 0.9:
                recommendation = "merge"
            elif duplicate_probability >= 0.7:
                recommendation = "review"
            else:
                recommendation = "dismiss"
            
            return {
                "duplicate_probability": float(duplicate_probability),
                "confidence": float(confidence),
                "features": {k: float(v) for k, v in feature_dict.items()},
                "algorithm_flags": algorithm_flags,
                "recommendation": recommendation
            }
            
        except Exception as e:
            logger.error(f"Error in predict_duplicate: {str(e)}")
            raise
    
    def _extract_features(self, record1: Dict, record2: Dict) -> Dict[str, float]:
        """Extract features for ML model"""
        # This is a placeholder - in production, extract all relevant features
        return {}
    
    def _compare_dob(self, dob1: Any, dob2: Any) -> float:
        """Compare dates of birth"""
        if not dob1 or not dob2:
            return 0.0
        
        try:
            from datetime import datetime
            d1 = datetime.strptime(str(dob1), "%Y-%m-%d") if isinstance(dob1, str) else dob1
            d2 = datetime.strptime(str(dob2), "%Y-%m-%d") if isinstance(dob2, str) else dob2
            
            # Exact match
            if d1 == d2:
                return 1.0
            
            # Within 1 day tolerance (typo tolerance)
            diff = abs((d1 - d2).days)
            if diff <= 1:
                return 0.95
            
            return 0.0
        except:
            return 0.0
    
    def _compare_address(self, addr1: Dict, addr2: Dict) -> float:
        """Compare addresses using multiple methods"""
        if not addr1 or not addr2:
            return 0.0
        
        # Convert to strings for comparison
        addr1_str = self._address_to_string(addr1)
        addr2_str = self._address_to_string(addr2)
        
        if not addr1_str or not addr2_str:
            return 0.0
        
        # Use Jaro-Winkler for address similarity
        return self.string_matcher.jaro_winkler(addr1_str, addr2_str)
    
    def _address_to_string(self, addr: Dict) -> str:
        """Convert address dict to normalized string"""
        parts = []
        if isinstance(addr, dict):
            parts = [
                addr.get('house_number', ''),
                addr.get('street', ''),
                addr.get('village_city', ''),
                addr.get('district', ''),
                addr.get('state', ''),
                str(addr.get('pin_code', ''))
            ]
        elif isinstance(addr, str):
            return addr
        
        return ' '.join(filter(None, parts)).lower()
    
    def _compare_aadhaar(self, aad1: Optional[str], aad2: Optional[str]) -> float:
        """Compare Aadhaar numbers (partial match on last 4 digits)"""
        if not aad1 or not aad2:
            return 0.0
        
        aad1_str = str(aad1).strip()
        aad2_str = str(aad2).strip()
        
        # Exact match
        if aad1_str == aad2_str:
            return 1.0
        
        # Last 4 digits match
        if len(aad1_str) >= 4 and len(aad2_str) >= 4:
            if aad1_str[-4:] == aad2_str[-4:]:
                return 0.5
        
        return 0.0
    
    def _compare_face_embeddings(self, emb1: Any, emb2: Any) -> float:
        """Compare face embeddings using cosine similarity"""
        if not emb1 or not emb2:
            return 0.0
        
        try:
            import numpy as np
            
            # Convert to numpy arrays if needed
            if isinstance(emb1, list):
                emb1 = np.array(emb1)
            if isinstance(emb2, list):
                emb2 = np.array(emb2)
            
            # Normalize
            emb1_norm = emb1 / (np.linalg.norm(emb1) + 1e-8)
            emb2_norm = emb2 / (np.linalg.norm(emb2) + 1e-8)
            
            # Cosine similarity
            similarity = np.dot(emb1_norm, emb2_norm)
            return float(np.clip(similarity, 0, 1))
        except:
            return 0.0
    
    async def batch_detect(self, records: List[Dict[str, Any]], threshold: float = 0.7) -> List[Dict[str, Any]]:
        """Run batch duplicate detection"""
        results = []
        
        for i in range(len(records)):
            for j in range(i + 1, len(records)):
                try:
                    prediction = await self.predict_duplicate(records[i], records[j])
                    
                    if prediction['duplicate_probability'] >= threshold:
                        results.append({
                            "record1_id": records[i].get('voter_id'),
                            "record2_id": records[j].get('voter_id'),
                            "score": prediction['duplicate_probability'],
                            "features": prediction['features'],
                            "recommendation": prediction['recommendation']
                        })
                except Exception as e:
                    logger.warning(f"Error comparing records {i} and {j}: {str(e)}")
                    continue
        
        return results


