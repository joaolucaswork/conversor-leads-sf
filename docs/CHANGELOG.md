# Changelog

All notable changes to the AI-Enhanced Leads Processor project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2024-05-26

### 🚀 Major Release - AI Integration & GitHub Ready

#### Added
- **AI-Enhanced Processing**: Complete OpenAI GPT integration for intelligent field mapping
- **Smart Column Mapping**: 90-95% accuracy with confidence scoring and fallback mechanisms
- **Intelligent Data Validation**: AI-powered data quality assessment and suggestions
- **Salesforce Compatibility**: Optimized CSV output for seamless Salesforce imports
- **Description Formatting**: Automatic semicolon separation for concatenated Portuguese words
- **Assignment Preservation**: Smart lead distribution that preserves original assignments
- **Comprehensive Testing**: Full test suite with real data validation
- **GitHub Organization**: Professional repository structure with proper documentation

#### Enhanced
- **Excel Support**: Improved handling of .xlsx and .xls files with automatic format detection
- **Error Handling**: Robust error handling with detailed logging and fallback mechanisms
- **Performance**: Optimized processing for large datasets (up to 10,000 records)
- **Documentation**: Complete rewrite with professional README and technical documentation

#### Fixed
- **Column Mapping Issues**: Resolved "Lead" → "Last Name" and "Descrição" → "Description" mapping
- **Duplicate Phone Columns**: Smart handling of multiple phone fields
- **CSV Import Conflicts**: Changed comma separators to semicolons for Salesforce compatibility
- **Assignment Override**: Preserved original lead assignments from Excel files

### Technical Improvements
- **AI Field Mapper**: New `ai_field_mapper.py` with OpenAI integration
- **Confidence Scoring**: 0-100% confidence ratings for all mappings
- **Fallback Processing**: Automatic fallback to rule-based processing when AI unavailable
- **Batch Processing**: Support for processing multiple files
- **Comprehensive Logging**: Detailed logs with AI statistics and processing summaries

## [1.5.0] - 2024-05-20

### Added
- **Excel File Support**: Native support for .xlsx and .xls files
- **Automatic Backups**: Backup creation before processing
- **Data Validation**: Basic validation for phone numbers, emails, and names
- **Batch Processing**: Process multiple files in sequence

### Enhanced
- **Error Handling**: Improved error messages and recovery
- **Configuration**: Flexible configuration system with JSON files
- **Logging**: Comprehensive logging system

### Fixed
- **Encoding Issues**: Better handling of Portuguese characters
- **Phone Formatting**: Improved phone number cleaning and formatting
- **Memory Usage**: Optimized for larger datasets

## [1.0.0] - 2024-05-15

### 🎉 Initial Release

#### Added
- **Basic Lead Processing**: Core functionality for CSV lead processing
- **Column Mapping**: Rule-based column mapping for common fields
- **Data Cleaning**: Basic data cleaning and formatting
- **Lead Distribution**: Configurable lead assignment distribution
- **Quick Start Interface**: Simple command-line interface

#### Core Features
- **CSV Processing**: Read and process CSV files
- **Field Mapping**: Map common Portuguese field names to standard formats
- **Data Formatting**: Clean and format names, phones, and emails
- **Output Generation**: Generate processed CSV files

#### Configuration
- **JSON Configuration**: Configurable lead distribution and default values
- **Environment Variables**: Support for environment-based configuration

---

## Version History Summary

| Version | Release Date | Key Features |
|---------|-------------|--------------|
| **2.0.0** | 2024-05-26 | AI Integration, Salesforce Compatibility, GitHub Ready |
| **1.5.0** | 2024-05-20 | Excel Support, Validation, Batch Processing |
| **1.0.0** | 2024-05-15 | Initial Release, Basic Processing |

## Upgrade Guide

### From 1.5.0 to 2.0.0

1. **Install new dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Configure OpenAI API** (optional but recommended):
   ```bash
   cp examples/.env.sample config/.env
   # Edit config/.env and add your OpenAI API key
   ```

3. **Update usage patterns**:
   ```bash
   # Old way
   python core/master_leads_processor.py input.csv
   
   # New way (with AI)
   python quick_start.py ai input.xlsx
   ```

4. **Review new features**:
   - AI-enhanced column mapping
   - Salesforce-compatible output
   - Preserved lead assignments
   - Semicolon-separated descriptions

### From 1.0.0 to 2.0.0

1. **Complete reinstallation recommended**:
   ```bash
   git pull origin main
   pip install -r requirements.txt
   ```

2. **Migrate configuration**:
   - Update `config/config.json` with new AI settings
   - Add OpenAI API key to `config/.env`

3. **Update scripts**:
   - Use new `quick_start.py` interface
   - Review new command options

## Breaking Changes

### Version 2.0.0
- **Description Formatting**: Changed from comma to semicolon separators
- **File Structure**: Reorganized into proper package structure
- **Command Interface**: New `quick_start.py` interface (old commands still work)
- **Dependencies**: Updated OpenAI library to v1.0.0+

### Version 1.5.0
- **Configuration Format**: Enhanced JSON configuration structure
- **Output Format**: Standardized CSV output columns

## Migration Notes

### AI Features
- AI features are **optional** - system works without OpenAI API key
- Fallback to rule-based processing when AI unavailable
- No breaking changes to existing workflows

### Salesforce Integration
- New semicolon separators improve import compatibility
- Preserved lead assignments prevent data loss
- Enhanced field mapping for better CRM integration

---

**For detailed technical documentation, see the `docs/` folder.**
