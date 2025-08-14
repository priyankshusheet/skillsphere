"""
Model Manager for SkillSphere AI services.
Handles model loading, caching, and lifecycle management.
"""

import os
import pickle
import json
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
import joblib
from pathlib import Path

logger = logging.getLogger(__name__)

class ModelManager:
    """Manages AI model lifecycle and caching."""
    
    def __init__(self, models_dir: str = "models/trained_models"):
        """
        Initialize model manager.
        
        Args:
            models_dir: Directory containing trained models
        """
        self.models_dir = Path(models_dir)
        self.models_dir.mkdir(parents=True, exist_ok=True)
        self.loaded_models: Dict[str, Any] = {}
        self.model_metadata: Dict[str, Dict[str, Any]] = {}
        self.cache_expiry: Dict[str, datetime] = {}
        self.cache_duration = timedelta(hours=24)  # 24 hours cache
        
        # Load model metadata
        self._load_metadata()
    
    def _load_metadata(self):
        """Load model metadata from file."""
        metadata_file = self.models_dir / "metadata.json"
        if metadata_file.exists():
            try:
                with open(metadata_file, 'r') as f:
                    self.model_metadata = json.load(f)
            except Exception as e:
                logger.error(f"Failed to load model metadata: {e}")
                self.model_metadata = {}
    
    def _save_metadata(self):
        """Save model metadata to file."""
        metadata_file = self.models_dir / "metadata.json"
        try:
            with open(metadata_file, 'w') as f:
                json.dump(self.model_metadata, f, indent=2, default=str)
        except Exception as e:
            logger.error(f"Failed to save model metadata: {e}")
    
    def register_model(self, model_name: str, model_path: str, 
                      metadata: Dict[str, Any]) -> bool:
        """
        Register a new model.
        
        Args:
            model_name: Name of the model
            model_path: Path to the model file
            metadata: Model metadata
            
        Returns:
            True if registration successful
        """
        try:
            if not os.path.exists(model_path):
                logger.error(f"Model file not found: {model_path}")
                return False
            
            # Add registration metadata
            metadata.update({
                'registered_at': datetime.now().isoformat(),
                'model_path': model_path,
                'file_size': os.path.getsize(model_path),
                'last_accessed': None,
                'access_count': 0
            })
            
            self.model_metadata[model_name] = metadata
            self._save_metadata()
            
            logger.info(f"Model registered: {model_name}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to register model {model_name}: {e}")
            return False
    
    def load_model(self, model_name: str, force_reload: bool = False) -> Optional[Any]:
        """
        Load a model into memory.
        
        Args:
            model_name: Name of the model to load
            force_reload: Force reload even if cached
            
        Returns:
            Loaded model or None if failed
        """
        try:
            # Check if model is already loaded and not expired
            if (model_name in self.loaded_models and 
                not force_reload and
                model_name in self.cache_expiry and
                datetime.now() < self.cache_expiry[model_name]):
                
                # Update access metadata
                self._update_access_metadata(model_name)
                return self.loaded_models[model_name]
            
            # Load model from file
            if model_name not in self.model_metadata:
                logger.error(f"Model not registered: {model_name}")
                return None
            
            model_path = self.model_metadata[model_name]['model_path']
            
            # Determine file type and load accordingly
            if model_path.endswith('.pkl') or model_path.endswith('.pickle'):
                with open(model_path, 'rb') as f:
                    model = pickle.load(f)
            elif model_path.endswith('.joblib'):
                model = joblib.load(model_path)
            else:
                logger.error(f"Unsupported model format: {model_path}")
                return None
            
            # Cache the model
            self.loaded_models[model_name] = model
            self.cache_expiry[model_name] = datetime.now() + self.cache_duration
            
            # Update access metadata
            self._update_access_metadata(model_name)
            
            logger.info(f"Model loaded: {model_name}")
            return model
            
        except Exception as e:
            logger.error(f"Failed to load model {model_name}: {e}")
            return None
    
    def unload_model(self, model_name: str) -> bool:
        """
        Unload a model from memory.
        
        Args:
            model_name: Name of the model to unload
            
        Returns:
            True if unloaded successfully
        """
        try:
            if model_name in self.loaded_models:
                del self.loaded_models[model_name]
                if model_name in self.cache_expiry:
                    del self.cache_expiry[model_name]
                logger.info(f"Model unloaded: {model_name}")
                return True
            return False
        except Exception as e:
            logger.error(f"Failed to unload model {model_name}: {e}")
            return False
    
    def get_model_info(self, model_name: str) -> Optional[Dict[str, Any]]:
        """
        Get information about a model.
        
        Args:
            model_name: Name of the model
            
        Returns:
            Model information or None if not found
        """
        if model_name in self.model_metadata:
            info = self.model_metadata[model_name].copy()
            info['is_loaded'] = model_name in self.loaded_models
            if model_name in self.cache_expiry:
                info['cache_expires'] = self.cache_expiry[model_name].isoformat()
            return info
        return None
    
    def list_models(self) -> List[Dict[str, Any]]:
        """
        List all registered models.
        
        Returns:
            List of model information
        """
        models = []
        for name, metadata in self.model_metadata.items():
            model_info = self.get_model_info(name)
            if model_info:
                models.append(model_info)
        return models
    
    def cleanup_expired_cache(self) -> int:
        """
        Clean up expired model cache.
        
        Returns:
            Number of models unloaded
        """
        unloaded_count = 0
        current_time = datetime.now()
        
        expired_models = [
            name for name, expiry in self.cache_expiry.items()
            if current_time > expiry
        ]
        
        for model_name in expired_models:
            if self.unload_model(model_name):
                unloaded_count += 1
        
        logger.info(f"Cleaned up {unloaded_count} expired models")
        return unloaded_count
    
    def _update_access_metadata(self, model_name: str):
        """Update model access metadata."""
        if model_name in self.model_metadata:
            self.model_metadata[model_name]['last_accessed'] = datetime.now().isoformat()
            self.model_metadata[model_name]['access_count'] += 1
            self._save_metadata()
    
    def get_model_performance(self, model_name: str) -> Optional[Dict[str, Any]]:
        """
        Get model performance metrics.
        
        Args:
            model_name: Name of the model
            
        Returns:
            Performance metrics or None if not available
        """
        model_info = self.get_model_info(model_name)
        if not model_info:
            return None
        
        # This would typically load performance metrics from a separate file
        # For now, return basic information
        return {
            'model_name': model_name,
            'accuracy': model_info.get('accuracy', 'N/A'),
            'precision': model_info.get('precision', 'N/A'),
            'recall': model_info.get('recall', 'N/A'),
            'f1_score': model_info.get('f1_score', 'N/A'),
            'training_date': model_info.get('training_date', 'N/A'),
            'version': model_info.get('version', 'N/A'),
            'access_count': model_info.get('access_count', 0),
            'last_accessed': model_info.get('last_accessed', 'N/A'),
        }
    
    def update_model_metadata(self, model_name: str, 
                            updates: Dict[str, Any]) -> bool:
        """
        Update model metadata.
        
        Args:
            model_name: Name of the model
            updates: Metadata updates
            
        Returns:
            True if updated successfully
        """
        try:
            if model_name in self.model_metadata:
                self.model_metadata[model_name].update(updates)
                self._save_metadata()
                logger.info(f"Model metadata updated: {model_name}")
                return True
            return False
        except Exception as e:
            logger.error(f"Failed to update model metadata {model_name}: {e}")
            return False
    
    def delete_model(self, model_name: str) -> bool:
        """
        Delete a model and its metadata.
        
        Args:
            model_name: Name of the model to delete
            
        Returns:
            True if deleted successfully
        """
        try:
            # Unload from memory if loaded
            self.unload_model(model_name)
            
            # Remove metadata
            if model_name in self.model_metadata:
                del self.model_metadata[model_name]
                self._save_metadata()
            
            logger.info(f"Model deleted: {model_name}")
            return True
        except Exception as e:
            logger.error(f"Failed to delete model {model_name}: {e}")
            return False

# Global model manager instance
model_manager = ModelManager()
