"""
Skills Assessment Model for SkillSphere.
Handles skills evaluation and level prediction.
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Any, Optional, Tuple
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
from sklearn.linear_model import LinearRegression, LogisticRegression
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import mean_squared_error, accuracy_score, classification_report
import joblib
import logging

logger = logging.getLogger(__name__)

class SkillsAssessmentModel:
    """AI model for skills assessment and level prediction."""
    
    def __init__(self, model_name: str = "skills_assessment"):
        """
        Initialize skills assessment model.
        
        Args:
            model_name: Name of the model
        """
        self.model_name = model_name
        self.regression_model = None
        self.classification_model = None
        self.scaler = StandardScaler()
        self.label_encoder = LabelEncoder()
        self.feature_names = []
        self.is_trained = False
        
        # Model parameters
        self.regression_params = {
            'n_estimators': 100,
            'max_depth': 10,
            'random_state': 42
        }
        
        self.classification_params = {
            'n_estimators': 100,
            'max_depth': 10,
            'random_state': 42
        }
    
    def prepare_features(self, user_data: Dict[str, Any], 
                        skills_data: List[Dict[str, Any]]) -> np.ndarray:
        """
        Prepare features for model input.
        
        Args:
            user_data: User information
            skills_data: Skills information
            
        Returns:
            Feature array
        """
        features = []
        
        # User features
        features.extend([
            user_data.get('experience', 0),
            len(skills_data),
            np.mean([skill.get('experience', 0) for skill in skills_data]),
            np.std([skill.get('experience', 0) for skill in skills_data]),
        ])
        
        # Skills features
        skill_levels = [skill.get('level', 1) for skill in skills_data]
        features.extend([
            np.mean(skill_levels),
            np.std(skill_levels),
            np.max(skill_levels),
            np.min(skill_levels),
            len([s for s in skill_levels if s >= 4]),  # Advanced skills count
            len([s for s in skill_levels if s <= 2]),  # Beginner skills count
        ])
        
        # Skill categories (if available)
        categories = [skill.get('category', 'other') for skill in skills_data]
        if categories:
            category_counts = pd.Series(categories).value_counts()
            features.extend([
                len(category_counts),  # Number of categories
                category_counts.max() if len(category_counts) > 0 else 0,  # Most common category count
            ])
        else:
            features.extend([0, 0])
        
        return np.array(features).reshape(1, -1)
    
    def train(self, training_data: List[Dict[str, Any]], 
              target_variable: str = 'skill_level') -> bool:
        """
        Train the skills assessment model.
        
        Args:
            training_data: List of training examples
            target_variable: Target variable name
            
        Returns:
            True if training successful
        """
        try:
            if not training_data:
                logger.error("No training data provided")
                return False
            
            # Prepare features and targets
            X = []
            y_regression = []
            y_classification = []
            
            for example in training_data:
                user_data = example.get('user', {})
                skills_data = example.get('skills', [])
                target = example.get(target_variable, 1)
                
                features = self.prepare_features(user_data, skills_data).flatten()
                X.append(features)
                y_regression.append(target)
                y_classification.append(int(target))
            
            X = np.array(X)
            y_regression = np.array(y_regression)
            y_classification = np.array(y_classification)
            
            # Split data
            X_train, X_test, y_train_reg, y_test_reg, y_train_clf, y_test_clf = train_test_split(
                X, y_regression, y_classification, test_size=0.2, random_state=42
            )
            
            # Scale features
            X_train_scaled = self.scaler.fit_transform(X_train)
            X_test_scaled = self.scaler.transform(X_test)
            
            # Train regression model
            self.regression_model = RandomForestRegressor(**self.regression_params)
            self.regression_model.fit(X_train_scaled, y_train_reg)
            
            # Train classification model
            self.classification_model = RandomForestClassifier(**self.classification_params)
            self.classification_model.fit(X_train_scaled, y_train_clf)
            
            # Evaluate models
            regression_score = self.regression_model.score(X_test_scaled, y_test_reg)
            classification_score = self.classification_model.score(X_test_scaled, y_test_clf)
            
            logger.info(f"Regression model R² score: {regression_score:.4f}")
            logger.info(f"Classification model accuracy: {classification_score:.4f}")
            
            self.is_trained = True
            self.feature_names = [f"feature_{i}" for i in range(X.shape[1])]
            
            return True
            
        except Exception as e:
            logger.error(f"Training failed: {e}")
            return False
    
    def predict_skill_level(self, user_data: Dict[str, Any], 
                          skills_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Predict skill level for a user.
        
        Args:
            user_data: User information
            skills_data: Skills information
            
        Returns:
            Prediction results
        """
        try:
            if not self.is_trained:
                raise ValueError("Model not trained")
            
            # Prepare features
            features = self.prepare_features(user_data, skills_data)
            features_scaled = self.scaler.transform(features)
            
            # Make predictions
            regression_pred = self.regression_model.predict(features_scaled)[0]
            classification_pred = self.classification_model.predict(features_scaled)[0]
            classification_prob = self.classification_model.predict_proba(features_scaled)[0]
            
            # Calculate confidence
            confidence = np.max(classification_prob)
            
            # Determine skill level (1-5 scale)
            skill_level = max(1, min(5, round(regression_pred)))
            
            return {
                'predicted_level': skill_level,
                'confidence': confidence,
                'regression_prediction': regression_pred,
                'classification_prediction': classification_pred,
                'probability_distribution': classification_prob.tolist(),
                'features_used': len(self.feature_names)
            }
            
        except Exception as e:
            logger.error(f"Prediction failed: {e}")
            return {
                'predicted_level': 1,
                'confidence': 0.0,
                'error': str(e)
            }
    
    def assess_skills(self, user_data: Dict[str, Any], 
                     skills_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Comprehensive skills assessment.
        
        Args:
            user_data: User information
            skills_data: Skills information
            
        Returns:
            Assessment results
        """
        try:
            # Get base prediction
            prediction = self.predict_skill_level(user_data, skills_data)
            
            # Analyze individual skills
            skill_analyses = []
            for skill in skills_data:
                skill_analysis = self._analyze_individual_skill(skill, user_data)
                skill_analyses.append(skill_analysis)
            
            # Calculate overall assessment
            overall_score = np.mean([skill['score'] for skill in skill_analyses])
            skill_gaps = self._identify_skill_gaps(skills_data, user_data)
            recommendations = self._generate_recommendations(skill_analyses, skill_gaps)
            
            return {
                'overall_assessment': {
                    'score': overall_score,
                    'level': prediction['predicted_level'],
                    'confidence': prediction['confidence'],
                    'strengths': self._identify_strengths(skill_analyses),
                    'weaknesses': self._identify_weaknesses(skill_analyses)
                },
                'skill_analyses': skill_analyses,
                'skill_gaps': skill_gaps,
                'recommendations': recommendations,
                'next_steps': self._suggest_next_steps(skill_analyses, skill_gaps)
            }
            
        except Exception as e:
            logger.error(f"Skills assessment failed: {e}")
            return {
                'error': str(e),
                'overall_assessment': {
                    'score': 0,
                    'level': 1,
                    'confidence': 0
                }
            }
    
    def _analyze_individual_skill(self, skill: Dict[str, Any], 
                                user_data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze individual skill."""
        skill_name = skill.get('name', 'Unknown')
        skill_level = skill.get('level', 1)
        experience = skill.get('experience', 0)
        
        # Calculate skill score based on level and experience
        base_score = skill_level * 20  # 20 points per level
        experience_bonus = min(experience * 2, 20)  # Up to 20 points for experience
        total_score = min(base_score + experience_bonus, 100)
        
        return {
            'name': skill_name,
            'level': skill_level,
            'experience': experience,
            'score': total_score,
            'strength_level': 'strong' if total_score >= 80 else 'moderate' if total_score >= 60 else 'weak',
            'development_needed': max(0, 100 - total_score)
        }
    
    def _identify_skill_gaps(self, skills_data: List[Dict[str, Any]], 
                           user_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Identify skill gaps based on user profile."""
        # This would typically use market data and job requirements
        # For now, use a simple heuristic
        gaps = []
        
        # Check for missing critical skills based on user's role/industry
        role = user_data.get('title', '').lower()
        industry = user_data.get('industry', '').lower()
        
        critical_skills = self._get_critical_skills(role, industry)
        current_skills = [skill['name'].lower() for skill in skills_data]
        
        for skill in critical_skills:
            if skill['name'].lower() not in current_skills:
                gaps.append({
                    'skill_name': skill['name'],
                    'priority': skill['priority'],
                    'estimated_time': skill['estimated_time'],
                    'reason': f"Critical skill for {role} role"
                })
        
        return gaps
    
    def _get_critical_skills(self, role: str, industry: str) -> List[Dict[str, Any]]:
        """Get critical skills for a role and industry."""
        # This would typically come from a database or external API
        # For now, return some common skills
        common_skills = [
            {'name': 'Communication', 'priority': 'high', 'estimated_time': '3-6 months'},
            {'name': 'Problem Solving', 'priority': 'high', 'estimated_time': '6-12 months'},
            {'name': 'Leadership', 'priority': 'medium', 'estimated_time': '12-18 months'},
        ]
        
        # Add role-specific skills
        if 'developer' in role or 'engineer' in role:
            common_skills.extend([
                {'name': 'Programming', 'priority': 'high', 'estimated_time': '6-12 months'},
                {'name': 'System Design', 'priority': 'medium', 'estimated_time': '12-18 months'},
            ])
        
        if 'manager' in role or 'lead' in role:
            common_skills.extend([
                {'name': 'Project Management', 'priority': 'high', 'estimated_time': '6-12 months'},
                {'name': 'Team Management', 'priority': 'high', 'estimated_time': '12-18 months'},
            ])
        
        return common_skills
    
    def _generate_recommendations(self, skill_analyses: List[Dict[str, Any]], 
                                skill_gaps: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Generate learning recommendations."""
        recommendations = []
        
        # Recommendations for weak skills
        weak_skills = [skill for skill in skill_analyses if skill['strength_level'] == 'weak']
        for skill in weak_skills[:3]:  # Top 3 weak skills
            recommendations.append({
                'type': 'skill_improvement',
                'skill_name': skill['name'],
                'priority': 'high',
                'action': f"Focus on improving {skill['name']} skills",
                'estimated_time': '3-6 months',
                'resources': self._get_learning_resources(skill['name'])
            })
        
        # Recommendations for skill gaps
        for gap in skill_gaps[:3]:  # Top 3 gaps
            recommendations.append({
                'type': 'skill_gap',
                'skill_name': gap['skill_name'],
                'priority': gap['priority'],
                'action': f"Learn {gap['skill_name']}",
                'estimated_time': gap['estimated_time'],
                'resources': self._get_learning_resources(gap['skill_name'])
            })
        
        return recommendations
    
    def _get_learning_resources(self, skill_name: str) -> List[str]:
        """Get learning resources for a skill."""
        # This would typically come from a learning management system
        return [
            f"Online courses for {skill_name}",
            f"Books on {skill_name}",
            f"Practice exercises for {skill_name}",
            f"Certification programs for {skill_name}"
        ]
    
    def _identify_strengths(self, skill_analyses: List[Dict[str, Any]]) -> List[str]:
        """Identify user strengths."""
        strong_skills = [skill for skill in skill_analyses if skill['strength_level'] == 'strong']
        return [skill['name'] for skill in strong_skills[:5]]  # Top 5 strengths
    
    def _identify_weaknesses(self, skill_analyses: List[Dict[str, Any]]) -> List[str]:
        """Identify user weaknesses."""
        weak_skills = [skill for skill in skill_analyses if skill['strength_level'] == 'weak']
        return [skill['name'] for skill in weak_skills[:5]]  # Top 5 weaknesses
    
    def _suggest_next_steps(self, skill_analyses: List[Dict[str, Any]], 
                          skill_gaps: List[Dict[str, Any]]) -> List[str]:
        """Suggest next steps for development."""
        steps = []
        
        if skill_gaps:
            steps.append(f"Focus on learning {skill_gaps[0]['skill_name']} (Priority: {skill_gaps[0]['priority']})")
        
        weak_skills = [skill for skill in skill_analyses if skill['strength_level'] == 'weak']
        if weak_skills:
            steps.append(f"Improve {weak_skills[0]['name']} skills through practice and training")
        
        steps.append("Set up regular skill assessments to track progress")
        steps.append("Create a personalized learning plan")
        
        return steps
    
    def save_model(self, filepath: str) -> bool:
        """Save the trained model."""
        try:
            model_data = {
                'regression_model': self.regression_model,
                'classification_model': self.classification_model,
                'scaler': self.scaler,
                'feature_names': self.feature_names,
                'is_trained': self.is_trained,
                'model_name': self.model_name
            }
            joblib.dump(model_data, filepath)
            logger.info(f"Model saved to {filepath}")
            return True
        except Exception as e:
            logger.error(f"Failed to save model: {e}")
            return False
    
    def load_model(self, filepath: str) -> bool:
        """Load a trained model."""
        try:
            model_data = joblib.load(filepath)
            self.regression_model = model_data['regression_model']
            self.classification_model = model_data['classification_model']
            self.scaler = model_data['scaler']
            self.feature_names = model_data['feature_names']
            self.is_trained = model_data['is_trained']
            self.model_name = model_data['model_name']
            logger.info(f"Model loaded from {filepath}")
            return True
        except Exception as e:
            logger.error(f"Failed to load model: {e}")
            return False
