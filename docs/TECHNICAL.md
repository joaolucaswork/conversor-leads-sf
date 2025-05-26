# Technical Documentation

## Architecture Overview

The AI-Enhanced Leads Processor is built with a modular architecture that combines traditional rule-based processing with modern AI capabilities.

### Core Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Quick Start Interface                    │
│                    (quick_start.py)                        │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                 Core Processing Layer                       │
│  ┌─────────────────────────┐  ┌─────────────────────────┐   │
│  │ AI-Enhanced Processor   │  │ Traditional Processor   │   │
│  │ (master_leads_          │  │ (master_leads_          │   │
│  │  processor_ai.py)       │  │  processor.py)          │   │
│  └─────────────────────────┘  └─────────────────────────┘   │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                 AI Integration Layer                        │
│  ┌─────────────────────────┐  ┌─────────────────────────┐   │
│  │ AI Field Mapper         │  │ OpenAI API Client       │   │
│  │ (ai_field_mapper.py)    │  │ (GPT Integration)       │   │
│  └─────────────────────────┘  └─────────────────────────┘   │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                   Utility Layer                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐   │
│  │ Batch       │ │ Data        │ │ System Setup        │   │
│  │ Processor   │ │ Validator   │ │ & Configuration     │   │
│  └─────────────┘ └─────────────┘ └─────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## AI Integration

### OpenAI GPT Integration

The system uses OpenAI's GPT models for intelligent field mapping and data validation:

```python
class AIFieldMapper:
    def __init__(self, config):
        self.client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
        self.model = config.get('model', 'gpt-3.5-turbo')
        self.confidence_threshold = config.get('confidence_threshold', 80.0)
    
    def ai_enhanced_mapping(self, columns, sample_data):
        """Use AI to map columns with high accuracy."""
        prompt = self._build_mapping_prompt(columns, sample_data)
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1,
            max_tokens=1000
        )
        return self._parse_ai_response(response)
```

### Confidence Scoring

Each AI mapping receives a confidence score (0-100%):

- **90-100%**: High confidence, direct mapping
- **70-89%**: Medium confidence, with validation
- **50-69%**: Low confidence, requires review
- **<50%**: Very low confidence, fallback to rules

### Fallback Mechanism

```python
def intelligent_column_mapping(self, df, sample_data=None):
    """Intelligent mapping with AI and rule-based fallback."""
    if self.ai_enabled:
        try:
            ai_mappings = self.ai_enhanced_mapping(df.columns, sample_data)
            if self._validate_ai_mappings(ai_mappings):
                return ai_mappings
        except Exception as e:
            self.logger.warning(f"AI mapping failed: {e}, falling back to rules")
    
    return self._rule_based_mapping(df.columns)
```

## Data Processing Pipeline

### 1. File Format Detection

```python
def detect_file_format_ai(self, file_path):
    """AI-enhanced file format detection."""
    file_extension = Path(file_path).suffix.lower()
    
    if file_extension in ['.xlsx', '.xls']:
        return self._detect_excel_format(file_path)
    elif file_extension == '.csv':
        return self._detect_csv_format(file_path)
    else:
        raise ValueError(f"Unsupported file format: {file_extension}")
```

### 2. Column Mapping

The system uses a two-tier mapping approach:

#### AI-Enhanced Mapping
```python
def ai_enhanced_mapping(self, columns, sample_data):
    """Use OpenAI to intelligently map columns."""
    prompt = f"""
    Map these columns to standard CRM fields:
    Columns: {columns}
    Sample data: {sample_data}
    
    Standard mappings:
    - Cliente/Customer/Nome/Name/Lead → Last Name
    - Telefone/Phone/Tel → Phone
    - Email/E-mail → Email
    - Descrição/Description → Description
    - Atribuir/Owner/Alias → OwnerId
    
    Return JSON with confidence scores.
    """
```

#### Rule-Based Fallback
```python
def _rule_based_mapping(self, columns):
    """Traditional regex-based mapping."""
    patterns = {
        r'cliente|customer|nome|name|last.*name|lead': 'Last Name',
        r'telefone|phone|tel\.?\s*fixo|celular': 'Phone',
        r'e?-?mail': 'Email',
        r'descri[çc][aã]o|description|obs': 'Description',
        r'alias|owner|respons[aá]vel|vendedor|atribuir': 'OwnerId'
    }
```

### 3. Data Validation

#### AI-Powered Validation
```python
def ai_enhanced_data_validation(self, df, field_mappings):
    """Use AI to validate data quality."""
    validations = {}
    
    for field_name in df.columns:
        sample_values = df[field_name].dropna().head(10).tolist()
        validation = self._validate_field_with_ai(field_name, sample_values)
        validations[field_name] = validation
    
    return validations
```

#### Rule-Based Validation
```python
def _rule_based_validation(self, field_name, values):
    """Traditional validation rules."""
    if 'email' in field_name.lower():
        return self._validate_emails(values)
    elif 'phone' in field_name.lower():
        return self._validate_phones(values)
    elif 'name' in field_name.lower():
        return self._validate_names(values)
```

### 4. Data Cleaning

#### Smart Description Formatting
```python
def format_description_ai(self, description):
    """Format concatenated Portuguese words with semicolons."""
    pattern = r'([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][a-záàâãéêíóôõúç]+)([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][a-záàâãéêíóôõúç]+)'
    
    formatted = description
    max_iterations = 10
    
    for _ in range(max_iterations):
        new_formatted = re.sub(pattern, r'\1; \2', formatted)
        if new_formatted == formatted:
            break
        formatted = new_formatted
    
    return formatted
```

#### Lead Assignment Preservation
```python
def distribute_leads(self, df):
    """Smart distribution that preserves original assignments."""
    if 'OwnerId' in df.columns:
        existing_assignments = df['OwnerId'].dropna()
        existing_assignments = existing_assignments[existing_assignments.astype(str).str.strip() != '']
        
        if len(existing_assignments) > 0:
            self.logger.info(f"Found {len(existing_assignments)} existing assignments - preserving")
            return self._preserve_assignments(df)
    
    return self._apply_automatic_distribution(df)
```

## Configuration System

### Environment Variables
```bash
# Required for AI features
OPENAI_API_KEY=your_openai_api_key_here

# Optional OpenAI configuration
OPENAI_MODEL=gpt-3.5-turbo
OPENAI_MAX_TOKENS=1000
OPENAI_TEMPERATURE=0.1
```

### JSON Configuration
```json
{
  "lead_distribution": {
    "user1": 100,
    "user2": 100,
    "user3": 70,
    "user4": 30
  },
  "default_values": {
    "patrimonio_financeiro": 1500000,
    "tipo": "Pessoa Física",
    "state_province": "SP"
  },
  "ai_processing": {
    "enabled": true,
    "confidence_threshold": 80.0,
    "use_ai_for_mapping": true,
    "use_ai_for_validation": true,
    "fallback_to_rules": true,
    "model": "gpt-3.5-turbo",
    "max_tokens": 1000,
    "temperature": 0.1
  },
  "file_processing": {
    "backup_enabled": true,
    "output_encoding": "utf-8",
    "max_file_size_mb": 100,
    "supported_formats": [".csv", ".xlsx", ".xls"]
  },
  "validation": {
    "strict_email_validation": true,
    "phone_formatting": "brazilian",
    "name_case_conversion": "title"
  }
}
```

## Error Handling

### Graceful Degradation
```python
class AIEnhancedLeadsProcessor:
    def process_file_ai(self, input_file, output_file=None):
        try:
            # Try AI-enhanced processing
            return self._process_with_ai(input_file, output_file)
        except OpenAIError as e:
            self.logger.warning(f"AI processing failed: {e}")
            return self._process_with_rules(input_file, output_file)
        except Exception as e:
            self.logger.error(f"Processing failed: {e}")
            raise ProcessingError(f"Failed to process {input_file}: {e}")
```

### Comprehensive Logging
```python
def setup_logging(self):
    """Setup comprehensive logging system."""
    log_format = '%(asctime)s - %(levelname)s - %(name)s - %(message)s'
    
    # File handler
    file_handler = logging.FileHandler(
        f'logs/ai_leads_processing_{datetime.now().strftime("%Y%m%d")}.log'
    )
    file_handler.setFormatter(logging.Formatter(log_format))
    
    # Console handler
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(logging.Formatter(log_format))
    
    self.logger.addHandler(file_handler)
    self.logger.addHandler(console_handler)
    self.logger.setLevel(logging.INFO)
```

## Performance Optimization

### Memory Management
- **Chunked Processing**: Large files processed in chunks
- **Lazy Loading**: Data loaded only when needed
- **Memory Monitoring**: Track memory usage during processing

### Processing Speed
- **Vectorized Operations**: Use pandas vectorized operations
- **Parallel Processing**: Multi-threading for batch operations
- **Caching**: Cache AI responses for repeated patterns

### Scalability
- **Batch Processing**: Handle multiple files efficiently
- **Progress Tracking**: Real-time progress indicators
- **Resource Limits**: Configurable memory and time limits

## Testing Framework

### Test Categories
1. **Unit Tests**: Individual function testing
2. **Integration Tests**: AI integration testing
3. **End-to-End Tests**: Complete workflow testing
4. **Performance Tests**: Speed and memory testing

### Test Data
- **Synthetic Data**: Generated test datasets
- **Real Data Samples**: Anonymized real-world data
- **Edge Cases**: Boundary condition testing

## Security Considerations

### API Key Management
- Environment variable storage
- No hardcoded credentials
- Secure key rotation support

### Data Privacy
- No data sent to AI without explicit consent
- Local processing fallback available
- Automatic data anonymization options

### Input Validation
- File type validation
- Size limit enforcement
- Malicious content detection
