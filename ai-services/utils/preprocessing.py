"""
Data preprocessing utilities for SkillSphere AI services.
Handles text cleaning, normalization, and feature extraction.
"""

import re
import string
import numpy as np
import pandas as pd
from typing import List, Dict, Any, Optional, Tuple
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import StandardScaler, LabelEncoder
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from nltk.stem import WordNetLemmatizer
import spacy
from sentence_transformers import SentenceTransformer
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Download required NLTK data
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt')

try:
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('stopwords')

try:
    nltk.data.find('corpora/wordnet')
except LookupError:
    nltk.download('wordnet')

class TextPreprocessor:
    """Text preprocessing utilities for skills and job descriptions."""
    
    def __init__(self, language: str = 'english'):
        """
        Initialize text preprocessor.
        
        Args:
            language: Language for stopwords and lemmatization
        """
        self.language = language
        self.stop_words = set(stopwords.words(language))
        self.lemmatizer = WordNetLemmatizer()
        
        # Load spaCy model
        try:
            self.nlp = spacy.load("en_core_web_sm")
        except OSError:
            logger.warning("spaCy model not found. Installing...")
            import subprocess
            subprocess.run(["python", "-m", "spacy", "download", "en_core_web_sm"])
            self.nlp = spacy.load("en_core_web_sm")
    
    def clean_text(self, text: str) -> str:
        """
        Clean and normalize text.
        
        Args:
            text: Input text to clean
            
        Returns:
            Cleaned text
        """
        if not text or not isinstance(text, str):
            return ""
        
        # Convert to lowercase
        text = text.lower()
        
        # Remove special characters and extra whitespace
        text = re.sub(r'[^\w\s]', ' ', text)
        text = re.sub(r'\s+', ' ', text)
        
        # Remove numbers (optional - can be kept for some use cases)
        text = re.sub(r'\d+', '', text)
        
        # Strip whitespace
        text = text.strip()
        
        return text
    
    def remove_stopwords(self, text: str) -> str:
        """
        Remove stopwords from text.
        
        Args:
            text: Input text
            
        Returns:
            Text with stopwords removed
        """
        words = word_tokenize(text)
        filtered_words = [word for word in words if word.lower() not in self.stop_words]
        return ' '.join(filtered_words)
    
    def lemmatize_text(self, text: str) -> str:
        """
        Lemmatize text to reduce words to their base form.
        
        Args:
            text: Input text
            
        Returns:
            Lemmatized text
        """
        words = word_tokenize(text)
        lemmatized_words = [self.lemmatizer.lemmatize(word) for word in words]
        return ' '.join(lemmatized_words)
    
    def extract_entities(self, text: str) -> Dict[str, List[str]]:
        """
        Extract named entities from text using spaCy.
        
        Args:
            text: Input text
            
        Returns:
            Dictionary of entity types and their values
        """
        doc = self.nlp(text)
        entities = {}
        
        for ent in doc.ents:
            if ent.label_ not in entities:
                entities[ent.label_] = []
            entities[ent.label_].append(ent.text)
        
        return entities
    
    def extract_skills(self, text: str) -> List[str]:
        """
        Extract skills from text using pattern matching and NLP.
        
        Args:
            text: Input text
            
        Returns:
            List of extracted skills
        """
        # Common skill patterns
        skill_patterns = [
            r'\b(?:proficient in|experienced with|skilled in|expert in)\s+([^,\.]+)',
            r'\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:development|programming|analysis|management)',
            r'\b(?:knowledge of|familiarity with)\s+([^,\.]+)',
        ]
        
        skills = set()
        
        # Extract skills using patterns
        for pattern in skill_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches:
                skills.add(match.strip().lower())
        
        # Extract using spaCy entities
        doc = self.nlp(text)
        for ent in doc.ents:
            if ent.label_ in ['ORG', 'PRODUCT', 'GPE']:
                skills.add(ent.text.lower())
        
        return list(skills)
    
    def preprocess_text(self, text: str, remove_stopwords: bool = True, 
                       lemmatize: bool = True) -> str:
        """
        Complete text preprocessing pipeline.
        
        Args:
            text: Input text
            remove_stopwords: Whether to remove stopwords
            lemmatize: Whether to lemmatize text
            
        Returns:
            Preprocessed text
        """
        text = self.clean_text(text)
        
        if remove_stopwords:
            text = self.remove_stopwords(text)
        
        if lemmatize:
            text = self.lemmatize_text(text)
        
        return text

class SkillsPreprocessor:
    """Specialized preprocessor for skills data."""
    
    def __init__(self):
        """Initialize skills preprocessor."""
        self.text_preprocessor = TextPreprocessor()
        self.skill_mapping = self._load_skill_mapping()
    
    def _load_skill_mapping(self) -> Dict[str, str]:
        """
        Load skill mapping for normalization.
        
        Returns:
            Dictionary mapping variations to standard skill names
        """
        # This would typically be loaded from a database or file
        return {
            'javascript': 'JavaScript',
            'js': 'JavaScript',
            'react.js': 'React',
            'reactjs': 'React',
            'node.js': 'Node.js',
            'nodejs': 'Node.js',
            'python': 'Python',
            'java': 'Java',
            'c++': 'C++',
            'c#': 'C#',
            'machine learning': 'Machine Learning',
            'ml': 'Machine Learning',
            'artificial intelligence': 'Artificial Intelligence',
            'ai': 'Artificial Intelligence',
            'data science': 'Data Science',
            'project management': 'Project Management',
            'agile': 'Agile',
            'scrum': 'Scrum',
            'devops': 'DevOps',
            'cloud computing': 'Cloud Computing',
            'aws': 'Amazon Web Services',
            'azure': 'Microsoft Azure',
            'gcp': 'Google Cloud Platform',
        }
    
    def normalize_skill_name(self, skill: str) -> str:
        """
        Normalize skill name to standard format.
        
        Args:
            skill: Input skill name
            
        Returns:
            Normalized skill name
        """
        skill_lower = skill.lower().strip()
        return self.skill_mapping.get(skill_lower, skill.title())
    
    def preprocess_skills_list(self, skills: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Preprocess a list of skills.
        
        Args:
            skills: List of skill dictionaries
            
        Returns:
            Preprocessed skills list
        """
        processed_skills = []
        
        for skill in skills:
            processed_skill = skill.copy()
            
            # Normalize skill name
            if 'name' in processed_skill:
                processed_skill['name'] = self.normalize_skill_name(processed_skill['name'])
            
            # Clean description if present
            if 'description' in processed_skill:
                processed_skill['description'] = self.text_preprocessor.clean_text(
                    processed_skill['description']
                )
            
            processed_skills.append(processed_skill)
        
        return processed_skills
    
    def extract_skills_from_text(self, text: str) -> List[str]:
        """
        Extract skills from text.
        
        Args:
            text: Input text
            
        Returns:
            List of extracted skills
        """
        skills = self.text_preprocessor.extract_skills(text)
        normalized_skills = [self.normalize_skill_name(skill) for skill in skills]
        return list(set(normalized_skills))

class JobDescriptionPreprocessor:
    """Preprocessor for job descriptions and requirements."""
    
    def __init__(self):
        """Initialize job description preprocessor."""
        self.text_preprocessor = TextPreprocessor()
        self.skills_preprocessor = SkillsPreprocessor()
    
    def extract_requirements(self, job_description: str) -> Dict[str, Any]:
        """
        Extract requirements from job description.
        
        Args:
            job_description: Job description text
            
        Returns:
            Dictionary containing extracted requirements
        """
        requirements = {
            'skills': [],
            'experience_level': None,
            'education': None,
            'certifications': [],
            'responsibilities': []
        }
        
        # Extract skills
        requirements['skills'] = self.skills_preprocessor.extract_skills_from_text(job_description)
        
        # Extract experience level
        experience_patterns = {
            'entry': r'\b(?:entry\s+level|junior|0-2\s+years?)\b',
            'mid': r'\b(?:mid\s+level|intermediate|3-5\s+years?)\b',
            'senior': r'\b(?:senior|lead|5\+\s+years?)\b',
            'expert': r'\b(?:expert|principal|10\+\s+years?)\b'
        }
        
        for level, pattern in experience_patterns.items():
            if re.search(pattern, job_description, re.IGNORECASE):
                requirements['experience_level'] = level
                break
        
        # Extract education requirements
        education_patterns = [
            r'\b(?:bachelor|master|phd|degree)\s+(?:in|of)\s+([^,\.]+)',
            r'\b(?:bachelor|master|phd)\s+degree\b',
            r'\b(?:high\s+school|associate)\s+degree\b'
        ]
        
        for pattern in education_patterns:
            matches = re.findall(pattern, job_description, re.IGNORECASE)
            if matches:
                requirements['education'] = matches[0] if isinstance(matches[0], str) else ' '.join(matches[0])
                break
        
        # Extract certifications
        cert_patterns = [
            r'\b(?:certified|certification)\s+(?:in|for)\s+([^,\.]+)',
            r'\b([A-Z]{2,}(?:\s+[A-Z]{2,})*)\s+certification\b'
        ]
        
        for pattern in cert_patterns:
            matches = re.findall(pattern, job_description, re.IGNORECASE)
            requirements['certifications'].extend(matches)
        
        # Extract responsibilities
        responsibility_patterns = [
            r'\b(?:responsible\s+for|duties\s+include|will\s+be\s+responsible)\s+([^\.]+)',
            r'\b(?:develop|design|implement|manage|lead|coordinate)\s+([^\.]+)'
        ]
        
        for pattern in responsibility_patterns:
            matches = re.findall(pattern, job_description, re.IGNORECASE)
            requirements['responsibilities'].extend(matches)
        
        return requirements

class FeatureExtractor:
    """Feature extraction utilities for machine learning models."""
    
    def __init__(self):
        """Initialize feature extractor."""
        self.tfidf_vectorizer = TfidfVectorizer(
            max_features=1000,
            ngram_range=(1, 2),
            stop_words='english'
        )
        self.sentence_transformer = SentenceTransformer('all-MiniLM-L6-v2')
        self.scaler = StandardScaler()
        self.label_encoder = LabelEncoder()
    
    def extract_text_features(self, texts: List[str]) -> np.ndarray:
        """
        Extract TF-IDF features from text.
        
        Args:
            texts: List of text documents
            
        Returns:
            TF-IDF feature matrix
        """
        return self.tfidf_vectorizer.fit_transform(texts).toarray()
    
    def extract_embeddings(self, texts: List[str]) -> np.ndarray:
        """
        Extract sentence embeddings.
        
        Args:
            texts: List of text documents
            
        Returns:
            Embedding matrix
        """
        return self.sentence_transformer.encode(texts)
    
    def extract_skills_features(self, skills_data: List[Dict[str, Any]]) -> np.ndarray:
        """
        Extract features from skills data.
        
        Args:
            skills_data: List of skills dictionaries
            
        Returns:
            Feature matrix
        """
        features = []
        
        for skill_data in skills_data:
            skill_features = []
            
            # Skill level (1-5)
            skill_features.append(skill_data.get('level', 1))
            
            # Experience years
            skill_features.append(skill_data.get('experience', 0))
            
            # Confidence score
            skill_features.append(skill_data.get('confidence', 0.5))
            
            # Skill category (encoded)
            category = skill_data.get('category', 'other')
            if hasattr(self, '_category_encoder'):
                category_encoded = self._category_encoder.transform([category])[0]
            else:
                self._category_encoder = LabelEncoder()
                category_encoded = self._category_encoder.fit_transform([category])[0]
            skill_features.append(category_encoded)
            
            features.append(skill_features)
        
        return np.array(features)
    
    def normalize_features(self, features: np.ndarray) -> np.ndarray:
        """
        Normalize features using StandardScaler.
        
        Args:
            features: Feature matrix
            
        Returns:
            Normalized feature matrix
        """
        return self.scaler.fit_transform(features)
    
    def encode_categorical(self, categories: List[str]) -> np.ndarray:
        """
        Encode categorical variables.
        
        Args:
            categories: List of categorical values
            
        Returns:
            Encoded array
        """
        return self.label_encoder.fit_transform(categories)

class DataValidator:
    """Data validation utilities."""
    
    @staticmethod
    def validate_skills_data(skills_data: List[Dict[str, Any]]) -> Tuple[bool, List[str]]:
        """
        Validate skills data format.
        
        Args:
            skills_data: List of skills dictionaries
            
        Returns:
            Tuple of (is_valid, error_messages)
        """
        errors = []
        
        if not isinstance(skills_data, list):
            errors.append("Skills data must be a list")
            return False, errors
        
        for i, skill in enumerate(skills_data):
            if not isinstance(skill, dict):
                errors.append(f"Skill at index {i} must be a dictionary")
                continue
            
            if 'name' not in skill:
                errors.append(f"Skill at index {i} missing 'name' field")
            
            if 'level' in skill and not (1 <= skill['level'] <= 5):
                errors.append(f"Skill at index {i} has invalid level (must be 1-5)")
            
            if 'experience' in skill and skill['experience'] < 0:
                errors.append(f"Skill at index {i} has negative experience")
        
        return len(errors) == 0, errors
    
    @staticmethod
    def validate_user_data(user_data: Dict[str, Any]) -> Tuple[bool, List[str]]:
        """
        Validate user data format.
        
        Args:
            user_data: User data dictionary
            
        Returns:
            Tuple of (is_valid, error_messages)
        """
        errors = []
        required_fields = ['firstName', 'lastName', 'email']
        
        for field in required_fields:
            if field not in user_data:
                errors.append(f"Missing required field: {field}")
        
        if 'email' in user_data and '@' not in user_data['email']:
            errors.append("Invalid email format")
        
        return len(errors) == 0, errors

def create_preprocessing_pipeline() -> Dict[str, Any]:
    """
    Create a complete preprocessing pipeline.
    
    Returns:
        Dictionary containing all preprocessors
    """
    return {
        'text_preprocessor': TextPreprocessor(),
        'skills_preprocessor': SkillsPreprocessor(),
        'job_preprocessor': JobDescriptionPreprocessor(),
        'feature_extractor': FeatureExtractor(),
        'validator': DataValidator()
    }

if __name__ == "__main__":
    # Example usage
    pipeline = create_preprocessing_pipeline()
    
    # Test text preprocessing
    text = "I am proficient in JavaScript and React.js development with 3 years of experience."
    cleaned_text = pipeline['text_preprocessor'].preprocess_text(text)
    print(f"Cleaned text: {cleaned_text}")
    
    # Test skills extraction
    skills = pipeline['skills_preprocessor'].extract_skills_from_text(text)
    print(f"Extracted skills: {skills}")
    
    # Test job description processing
    job_desc = """
    Senior Software Engineer
    Requirements:
    - 5+ years experience in JavaScript and React
    - Bachelor's degree in Computer Science
    - Certified in AWS
    - Responsible for developing web applications
    """
    
    requirements = pipeline['job_preprocessor'].extract_requirements(job_desc)
    print(f"Job requirements: {requirements}")
