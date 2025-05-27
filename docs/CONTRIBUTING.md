# Contributing to AI-Enhanced Leads Processor

Thank you for your interest in contributing to the AI-Enhanced Leads Processor! This document provides guidelines and information for contributors.

## 🤝 How to Contribute

### Reporting Issues

Before creating an issue, please:

1. **Search existing issues** to avoid duplicates
2. **Use the appropriate issue template**:
   - [Bug Report](.github/ISSUE_TEMPLATE/bug_report.md) for bugs
   - [Feature Request](.github/ISSUE_TEMPLATE/feature_request.md) for new features
3. **Provide detailed information** including:
   - Operating system and Python version
   - Input file format and sample data (anonymized)
   - Complete error messages and stack traces
   - Steps to reproduce the issue

### Suggesting Features

We welcome feature suggestions! Please:

1. **Check existing feature requests** first
2. **Use the feature request template**
3. **Explain the use case** and business value
4. **Consider implementation complexity**
5. **Provide examples** of how the feature would work

## 🛠️ Development Setup

### Prerequisites

- Python 3.8 or higher
- Git
- OpenAI API key (for AI features testing)

### Local Development

1. **Fork and clone the repository**:

   ```bash
   git clone https://github.com/yourusername/ai-enhanced-leads-processor.git
   cd ai-enhanced-leads-processor
   ```

2. **Create a virtual environment**:

   ```bash
   python -m venv venv

   # Windows
   venv\Scripts\activate

   # Linux/macOS
   source venv/bin/activate
   ```

3. **Install dependencies**:

   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables**:

   ```bash
   cp examples/.env.sample config/.env
   # Edit config/.env and add your OpenAI API key
   ```

5. **Run tests to verify setup**:

   ```bash
   python quick_start.py test
   ```

### Development Workflow

1. **Create a feature branch**:

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**:
   - Follow the coding standards (see below)
   - Add tests for new functionality
   - Update documentation as needed

3. **Test your changes**:

   ```bash
   # Run all tests
   python -m pytest tests/

   # Run specific test
   python tests/test_your_feature.py

   # Test with real data
   python quick_start.py test
   ```

4. **Commit your changes**:

   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

5. **Push and create a pull request**:

   ```bash
   git push origin feature/your-feature-name
   ```

## 📝 Coding Standards

### Python Style Guide

We follow [PEP 8](https://pep8.org/) with some modifications:

- **Line length**: 100 characters (instead of 79)
- **String quotes**: Use double quotes for strings
- **Imports**: Group imports (standard library, third-party, local)

### Code Formatting

Use [Black](https://black.readthedocs.io/) for code formatting:

```bash
# Format all Python files
black core/ tools/ tests/

# Check formatting without changes
black --check core/ tools/ tests/
```

### Linting

Use [flake8](https://flake8.pycqa.org/) for linting:

```bash
# Lint all Python files
flake8 core/ tools/ tests/

# Configuration in setup.cfg
```

### Type Hints

Use type hints for function parameters and return values:

```python
from typing import List, Dict, Optional, Union
import pandas as pd

def process_data(df: pd.DataFrame, config: Dict[str, Any]) -> pd.DataFrame:
    """Process DataFrame with given configuration."""
    pass
```

### Documentation

#### Docstrings

Use Google-style docstrings:

```python
def intelligent_column_mapping(self, df: pd.DataFrame, sample_data: Optional[List] = None) -> Tuple[pd.DataFrame, List[FieldMapping]]:
    """
    Perform intelligent column mapping using AI and rule-based fallback.

    Args:
        df: Input DataFrame with original column names
        sample_data: Optional sample data for AI context

    Returns:
        Tuple of (mapped DataFrame, list of field mappings)

    Raises:
        ProcessingError: If mapping fails completely

    Example:
        >>> processor = AIEnhancedLeadsProcessor()
        >>> df_mapped, mappings = processor.intelligent_column_mapping(df)
    """
```

#### Comments

- Use comments sparingly for complex logic
- Prefer self-documenting code
- Explain "why" not "what"

```python
# Use AI mapping first, fallback to rules if confidence is low
if ai_confidence > self.confidence_threshold:
    return ai_mappings
else:
    return rule_based_mappings
```

## 🧪 Testing Guidelines

### Test Structure

```
tests/
├── __init__.py
├── test_ai_integration.py      # AI functionality tests
├── test_excel_support.py       # Excel file handling tests
├── test_data_validation.py     # Data validation tests
├── test_field_mapping.py       # Column mapping tests
├── fixtures/                   # Test data files
│   ├── sample_leads.xlsx
│   ├── sample_leads.csv
│   └── malformed_data.csv
└── utils/                      # Test utilities
    ├── __init__.py
    └── test_helpers.py
```

### Writing Tests

1. **Use descriptive test names**:

   ```python
   def test_ai_mapping_with_high_confidence_returns_ai_results():
       """Test that high-confidence AI mappings are used over rules."""
   ```

2. **Follow AAA pattern** (Arrange, Act, Assert):

   ```python
   def test_description_formatting_with_concatenated_words():
       # Arrange
       processor = AIEnhancedLeadsProcessor()
       input_description = "ModeradoRegular"

       # Act
       result = processor.format_description_ai(input_description)

       # Assert
       assert result == "Moderado; Regular"
   ```

3. **Test edge cases**:

   ```python
   def test_description_formatting_with_empty_input():
       processor = AIEnhancedLeadsProcessor()
       assert processor.format_description_ai("") == ""
       assert processor.format_description_ai(None) == ""
   ```

4. **Mock external dependencies**:

   ```python
   @patch('openai.OpenAI')
   def test_ai_mapping_fallback_on_api_error(mock_openai_class):
       mock_client = Mock()
       mock_openai_class.return_value = mock_client
       mock_client.chat.completions.create.side_effect = OpenAIError("API Error")
       # Test fallback behavior
   ```

### Test Data

- **Use anonymized data** for testing
- **Create minimal test cases** that cover edge cases
- **Include malformed data** to test error handling

## 📚 Documentation

### README Updates

When adding features, update:

- Feature list in README.md
- Usage examples
- Configuration options
- Troubleshooting section

### Technical Documentation

Update `docs/TECHNICAL.md` for:

- Architecture changes
- New AI integration patterns
- Performance optimizations
- Security considerations

### Changelog

Update `CHANGELOG.md` following [Keep a Changelog](https://keepachangelog.com/) format:

```markdown
## [Unreleased]

### Added
- New feature description

### Changed
- Modified behavior description

### Fixed
- Bug fix description
```

## 🔄 Pull Request Process

### Before Submitting

1. **Ensure all tests pass**:

   ```bash
   python -m pytest tests/ -v
   ```

2. **Check code quality**:

   ```bash
   black --check core/ tools/ tests/
   flake8 core/ tools/ tests/
   ```

3. **Update documentation** as needed

4. **Add/update tests** for new functionality

### Pull Request Template

Use this template for your PR description:

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing
- [ ] Tests pass locally
- [ ] Added tests for new functionality
- [ ] Tested with real data

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes (or clearly documented)
```

### Review Process

1. **Automated checks** must pass (CI/CD)
2. **Code review** by maintainers
3. **Testing** with various data formats
4. **Documentation review**
5. **Approval and merge**

## 🏷️ Commit Message Guidelines

Use [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples

```bash
feat(ai): add confidence scoring for field mappings
fix(excel): handle corrupted Excel files gracefully
docs(readme): update installation instructions
test(mapping): add tests for Portuguese character handling
```

## 🎯 Areas for Contribution

### High Priority

- **AI Model Improvements**: Better prompts, fine-tuning
- **Performance Optimization**: Faster processing for large files
- **Additional File Formats**: Support for more input formats
- **Internationalization**: Support for more languages

### Medium Priority

- **UI/Web Interface**: Web-based interface for non-technical users
- **Advanced Validation**: More sophisticated data quality checks
- **Integration APIs**: REST API for external system integration
- **Cloud Deployment**: Docker containers, cloud deployment guides

### Low Priority

- **Advanced Analytics**: Data quality reporting and analytics
- **Machine Learning**: Custom ML models for specific use cases
- **Mobile Support**: Mobile-friendly interfaces

## 📞 Getting Help

- **GitHub Issues**: For bugs and feature requests
- **Discussions**: For questions and general discussion
- **Documentation**: Check `docs/` folder for detailed guides
- **Code Examples**: See `examples/` folder for usage patterns

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to the AI-Enhanced Leads Processor! 🚀
