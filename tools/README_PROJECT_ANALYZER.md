# Project Structure Analyzer

A comprehensive Python tool for analyzing and improving project organization. This tool provides detailed insights into your project structure, identifies organizational issues, and proposes improvements based on industry best practices.

## 🚀 Features

### **Comprehensive Analysis**
- **Project Type Detection**: Automatically identifies technology stack (Electron, React, Python, FastAPI, etc.)
- **File Distribution Analysis**: Categorizes files by type and analyzes distribution patterns
- **Dependency Analysis**: Examines package.json and requirements.txt for technology insights
- **Naming Convention Analysis**: Identifies inconsistencies in file and directory naming
- **Structural Issue Detection**: Finds deep nesting, scattered configs, and other problems

### **Intelligent Recommendations**
- **Technology-Specific Structures**: Tailored recommendations for your tech stack
- **File Relocation Suggestions**: Proposes better organization for misplaced files
- **Directory Consolidation**: Identifies opportunities to merge similar directories
- **Cleanup Suggestions**: Recommends removal of empty directories and optimization

### **Automated Reorganization**
- **Preview Mode**: See all proposed changes before applying them
- **Automatic Backup**: Creates backup before making any changes
- **Safe Application**: Applies changes with comprehensive error handling
- **Migration Planning**: Provides step-by-step reorganization plan

### **Rich Reporting**
- **JSON Reports**: Machine-readable detailed analysis
- **HTML Reports**: Beautiful visual reports with charts and recommendations
- **Directory Tree Visualization**: ASCII tree representation of project structure
- **Progress Tracking**: Real-time feedback during analysis and reorganization

## 📋 Requirements

- Python 3.8 or higher
- Standard library modules (no external dependencies required)

## 🛠️ Installation

1. **Copy the analyzer to your project:**
   ```bash
   # The analyzer is already in your tools/ directory
   ls tools/project_structure_analyzer.py
   ```

2. **Make it executable (optional):**
   ```bash
   chmod +x tools/project_structure_analyzer.py
   ```

## 📖 Usage

### **Command Line Interface**

#### **1. Analyze Project Structure**
```bash
# Generate JSON analysis report
python tools/project_structure_analyzer.py analyze

# Generate HTML report with visual formatting
python tools/project_structure_analyzer.py analyze --format html
```

#### **2. Visualize Directory Tree**
```bash
# Show directory tree (default depth: 3)
python tools/project_structure_analyzer.py tree

# Show deeper tree structure
python tools/project_structure_analyzer.py tree --max-depth 5
```

#### **3. Preview Reorganization Changes**
```bash
# See what changes would be made (safe preview)
python tools/project_structure_analyzer.py preview
```

#### **4. Apply Reorganization**
```bash
# Apply changes with automatic backup
python tools/project_structure_analyzer.py reorganize
```

### **Python API Usage**

```python
from tools.project_structure_analyzer import ProjectStructureAnalyzer

# Initialize analyzer
analyzer = ProjectStructureAnalyzer()

# Perform comprehensive analysis
structure = analyzer.analyze_current_structure()

# Generate improvement proposals
proposals = analyzer.propose_organizational_improvements()

# Preview changes
preview = analyzer.apply_reorganization(preview_only=True)

# Generate reports
json_report = analyzer.generate_comprehensive_report('json')
html_report = analyzer.generate_comprehensive_report('html')

# Create directory tree visualization
tree = analyzer.generate_directory_tree_visualization()
print(tree)
```

## 📊 Report Contents

### **Analysis Report Includes:**
- **Project Overview**: Type, size, file counts, technology stack
- **Organization Score**: Modularity rating and overall assessment
- **Issues Identified**: Structural problems with severity levels
- **File Distribution**: Breakdown by category and directory
- **Naming Conventions**: Analysis of consistency patterns
- **Technology Stack**: Detected frameworks and libraries

### **Improvement Proposals Include:**
- **Recommended Structure**: Best practices for your project type
- **File Relocations**: Specific move suggestions with reasoning
- **New Directories**: Missing standard directories to create
- **Cleanup Suggestions**: Files and directories to remove/optimize
- **Migration Plan**: Step-by-step reorganization process

## 🎯 Supported Project Types

### **Electron + React + Python** (Current Project)
- Optimized for desktop apps with React frontend and Python backend
- Separates Electron main process, React components, and Python services
- Organizes by functionality: components, pages, services, core logic

### **React Applications**
- Component-based organization
- Hooks, services, and utilities separation
- Testing and documentation structure

### **Python Projects**
- Source code organization
- Testing and documentation
- Configuration and scripts separation

### **Generic Projects**
- Universal best practices
- Flexible structure recommendations
- Technology-agnostic organization

## 🔧 Configuration

The analyzer automatically detects your project type and applies appropriate recommendations. No configuration required for basic usage.

### **Customization Options:**
- `--project-root`: Specify different project directory
- `--max-depth`: Control directory tree depth
- `--format`: Choose report format (json/html)

## 📁 Example Output

### **Directory Tree Visualization:**
```
Novos Leads/
├── app/
│   ├── main.js
│   └── preload.js
├── src/
│   ├── components/
│   ├── pages/
│   ├── services/
│   └── store/
├── backend/
│   ├── core/
│   ├── main.py
│   └── requirements.txt
├── tools/
│   ├── project_structure_analyzer.py
│   └── demo_project_analyzer.py
└── docs/
    └── README.md
```

### **Analysis Summary:**
```
Project: Novos Leads
Type: electron, react, python, fastapi
Organization Score: 83.3%
Overall Rating: Good
Issues Found: 2 (medium priority)
Recommendations: 3 improvements proposed
```

## 🚨 Safety Features

### **Backup Protection**
- Automatic backup creation before any changes
- Timestamped backup directories
- Excludes large directories (node_modules, __pycache__)

### **Preview Mode**
- See all changes before applying
- No modifications made in preview mode
- Detailed change descriptions with reasoning

### **Error Handling**
- Comprehensive error reporting
- Graceful failure handling
- Rollback capabilities

## 🎮 Demo

Run the interactive demo to see the analyzer in action:

```bash
python tools/demo_project_analyzer.py
```

This will:
1. Analyze your current project structure
2. Show technology stack detection
3. Display organizational patterns
4. Preview improvement proposals
5. Generate sample reports

## 📝 Best Practices

### **Before Running:**
1. Commit all changes to version control
2. Ensure no uncommitted work
3. Review the preview before applying changes

### **After Running:**
1. Test your application functionality
2. Update import statements if needed
3. Adjust build scripts for new paths
4. Update documentation

## 🤝 Contributing

This tool is designed to be extensible. You can:
- Add new project type detection
- Implement custom organization patterns
- Extend the reporting capabilities
- Add new analysis metrics

## 📄 License

This tool is part of the Leads Processing System and follows the same license terms.

---

**Made with ❤️ for better project organization**
