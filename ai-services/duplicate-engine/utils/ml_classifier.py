"""
ML Classifier for duplicate detection
Uses XGBoost or RandomForest to predict duplicate probability
"""

import logging
import numpy as np
from typing import Any

logger = logging.getLogger(__name__)

class DuplicateClassifier:
    """
    ML Classifier for duplicate detection
    In production, this would load a trained XGBoost/RandomForest model
    For now, uses a simple rule-based classifier as placeholder
    """
    
    def __init__(self):
        self.model = None
        self._load_model()
        logger.info("DuplicateClassifier initialized")
    
    def _load_model(self):
        """Load trained model (placeholder - in production, load actual model)"""
        # In production, load a trained model:
        # import pickle
        # with open('models/duplicate_classifier.pkl', 'rb') as f:
        #     self.model = pickle.load(f)
        
        # For now, use rule-based classifier
        self.model = "rule_based"
        logger.info("Using rule-based classifier (placeholder)")
    
    def predict(self, features: np.ndarray) -> np.ndarray:
        """
        Predict duplicate probability
        
        Args:
            features: Array of shape (n_samples, 8) containing:
                [name_score, father_name_score, mother_name_score, dob_match,
                 address_score, phone_match, aadhaar_match, face_score]
        
        Returns:
            Array of duplicate probabilities (0-1)
        """
        if self.model == "rule_based":
            return self._rule_based_predict(features)
        else:
            # In production, use actual model
            return self.model.predict_proba(features)[:, 1]
    
    def _rule_based_predict(self, features: np.ndarray) -> np.ndarray:
        """
        Rule-based prediction (placeholder for ML model)
        
        Rules:
        - High name similarity + DOB match = high probability
        - Multiple matching features = higher probability
        - Face match = very high probability
        """
        probabilities = []
        
        for feature_row in features:
            name_score, father_score, mother_score, dob_match, \
            address_score, phone_match, aadhaar_match, face_score = feature_row
            
            # Weighted combination
            score = (
                0.25 * name_score +
                0.10 * father_score +
                0.10 * mother_score +
                0.20 * dob_match +
                0.15 * address_score +
                0.05 * phone_match +
                0.05 * aadhaar_match +
                0.10 * face_score
            )
            
            # Boost for multiple matches
            match_count = sum([
                name_score > 0.8,
                dob_match == 1.0,
                address_score > 0.7,
                phone_match == 1.0,
                face_score > 0.9
            ])
            
            if match_count >= 3:
                score = min(1.0, score * 1.2)
            
            # Face match is very strong indicator
            if face_score > 0.9:
                score = max(score, 0.95)
            
            probabilities.append(np.clip(score, 0.0, 1.0))
        
        return np.array(probabilities)
    
    def get_confidence(self, features: np.ndarray) -> float:
        """
        Get confidence in prediction
        
        Higher confidence when:
        - More features are available
        - Feature values are extreme (very high or very low)
        """
        if len(features) == 0:
            return 0.0
        
        feature_row = features[0]
        
        # Count non-zero features
        non_zero_count = np.count_nonzero(feature_row)
        feature_completeness = non_zero_count / len(feature_row)
        
        # Check for extreme values (high confidence)
        max_val = np.max(feature_row)
        min_val = np.min(feature_row)
        value_range = max_val - min_val
        
        # Confidence based on completeness and value range
        confidence = 0.5 + (feature_completeness * 0.3) + (value_range * 0.2)
        
        return float(np.clip(confidence, 0.0, 1.0))


