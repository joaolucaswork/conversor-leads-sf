#!/usr/bin/env python3
"""
Production startup script for Heroku deployment
Optimized for cloud hosting with proper error handling and logging
"""

import os
import sys
import logging
from pathlib import Path

# Configure logging for production
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger(__name__)

def setup_production_environment():
    """Setup environment for production deployment"""
    logger.info("Setting up production environment...")
    
    # Add project root and core directories to Python path
    project_root = Path(__file__).parent.parent
    core_dir = project_root / "core"
    
    sys.path.insert(0, str(project_root))
    sys.path.insert(0, str(core_dir))
    
    logger.info(f"Added to Python path: {project_root}")
    logger.info(f"Added to Python path: {core_dir}")
    
    # Ensure required directories exist
    required_dirs = [
        project_root / "data" / "input",
        project_root / "data" / "output", 
        project_root / "data" / "backup",
        project_root / "backend" / "logs",
        project_root / "backend" / "cache",
        project_root / "backend" / "cache" / "ai_mappings"
    ]
    
    for dir_path in required_dirs:
        dir_path.mkdir(parents=True, exist_ok=True)
        logger.info(f"Ensured directory exists: {dir_path}")

def validate_environment():
    """Validate required environment variables"""
    logger.info("Validating environment variables...")
    
    required_vars = {
        'OPENAI_API_KEY': 'OpenAI API integration',
        'SALESFORCE_CLIENT_ID': 'Salesforce OAuth',
        'SALESFORCE_CLIENT_SECRET': 'Salesforce OAuth'
    }
    
    missing_vars = []
    for var, description in required_vars.items():
        if not os.environ.get(var):
            missing_vars.append(f"{var} ({description})")
            logger.warning(f"Missing environment variable: {var}")
    
    if missing_vars:
        logger.warning("Some environment variables are missing:")
        for var in missing_vars:
            logger.warning(f"  - {var}")
        logger.warning("Application will continue but some features may not work")
    else:
        logger.info("All required environment variables are present")

def start_production_server():
    """Start the FastAPI server in production mode"""
    logger.info("Starting FastAPI server in production mode...")
    
    # Get configuration from environment
    port = int(os.environ.get("PORT", 8000))
    host = "0.0.0.0"
    workers = int(os.environ.get("WEB_CONCURRENCY", 1))
    
    logger.info(f"Server configuration:")
    logger.info(f"  Host: {host}")
    logger.info(f"  Port: {port}")
    logger.info(f"  Workers: {workers}")
    
    try:
        import uvicorn
        
        # Change to backend directory for proper imports
        backend_dir = Path(__file__).parent
        os.chdir(backend_dir)
        
        uvicorn.run(
            "main:app",
            host=host,
            port=port,
            workers=workers,
            reload=False,
            log_level="info",
            access_log=True
        )
        
    except ImportError as e:
        logger.error(f"Failed to import uvicorn: {e}")
        sys.exit(1)
    except Exception as e:
        logger.error(f"Failed to start server: {e}")
        sys.exit(1)

def main():
    """Main production startup function"""
    logger.info("=" * 50)
    logger.info("LEADS PROCESSING API - PRODUCTION MODE")
    logger.info("=" * 50)
    
    try:
        setup_production_environment()
        validate_environment()
        start_production_server()
        
    except KeyboardInterrupt:
        logger.info("Server stopped by user")
    except Exception as e:
        logger.error(f"Fatal error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
