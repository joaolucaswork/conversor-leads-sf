# Salesforce Field Mapping - Quick Reference

## 🎯 Problem Solved

**Before**: Upload failed with error `Missing required fields: LastName`
**After**: Automatic field mapping transforms `"Last Name"` → `"LastName"`

## 🔧 How It Works

The system now automatically maps your processed lead data fields to match Salesforce requirements:

### Lead Object Mappings
| Your Field | Salesforce Field | Description |
|------------|------------------|-------------|
| `Last Name` | `LastName` | ✅ **Critical fix** - Lead name (required) |
| `Telefone Adcional` | `MobilePhone` | Additional/mobile phone |
| `Phone` | `Phone` | Primary phone number |
| `Email` | `Email` | Email address |
| `Description` | `Description` | Lead description/notes |
| `Patrimônio Financeiro` | `AnnualRevenue` | Financial information |
| `Tipo` | `LeadSource` | Lead type/source |
| `State/Province` | `State` | State or province |
| `OwnerId` | `OwnerId` | Lead owner ID |
| `maisdeMilhao__c` | `maisdeMilhao__c` | Custom field |

## 🚀 What Changed

### ✅ Automatic Field Mapping
- No manual field mapping required
- Works with existing processed files
- Transparent to your workflow

### ✅ Enhanced Error Messages
- Clear explanation of field mapping issues
- Shows original vs mapped field names
- Provides troubleshooting information

### ✅ Multi-Object Support
- Lead objects (primary use case)
- Contact objects
- Account objects

## 🔍 Validation Tool

Use the validation tool to check files before upload:

```bash
# Validate a single file
python tools/validate_field_mapping.py processed_leads.csv

# Validate multiple files
python tools/validate_field_mapping.py data/output/*.csv

# Validate for Contact object
python tools/validate_field_mapping.py leads.csv --object Contact
```

## 🛠️ Troubleshooting

### Common Issues

**Issue**: "Missing required fields: LastName"
**Solution**: ✅ **FIXED** - Automatic mapping now handles this

**Issue**: "Field mapping failed"
**Solution**: Check that your file has the expected column names from lead processing

**Issue**: "Unmapped fields" warning
**Solution**: These fields will be ignored (not uploaded to Salesforce)

### Error Message Guide

**MISSING_REQUIRED_FIELDS**: Shows detailed mapping information
- Original field names from your file
- Applied field mappings
- Missing required fields for Salesforce

**FIELD_MAPPING_ERROR**: Configuration or mapping issue
- Check that mapping configuration files exist
- Verify file format matches expected structure

## 📋 Supported File Formats

The field mapping works with all standard processed lead formats:

### Standard Format (Current)
```csv
Last Name,Telefone Adcional,Phone,Email,Description,Patrimônio Financeiro,Tipo,State/Province,OwnerId,maisdeMilhao__c
```

### Raw Format (After Processing)
Automatically converted to standard format, then mapped to Salesforce fields.

## 🔄 Upload Flow

1. **Select processed file** in the interface
2. **Automatic field mapping** applied (transparent)
3. **Field validation** ensures required fields present
4. **Upload to Salesforce** with correct field names
5. **Success confirmation** or detailed error information

## 📞 Support

### Self-Service
1. **Run validation tool** to check your files
2. **Check error messages** for detailed mapping information
3. **Review logs** in `salesforce_integration.log`

### Common Solutions
- **Re-process your leads** if file format is unexpected
- **Check original Excel file** for correct column names
- **Use validation tool** to preview field mapping

### Files to Check
- `config/salesforce_field_mapping.json` - Field mapping rules
- `logs/salesforce_integration.log` - Detailed upload logs
- `tests/test_salesforce_field_mapping.py` - Test the solution

## 🎉 Benefits

### For Users
- ✅ **No more "LastName" errors**
- ✅ **Seamless uploads** with existing files
- ✅ **Clear error messages** when issues occur
- ✅ **No workflow changes** required

### For Developers
- ✅ **Configurable mappings** for new fields
- ✅ **Multi-object support** for future needs
- ✅ **Comprehensive logging** for debugging
- ✅ **Automated testing** for reliability

## 📈 Next Steps

The field mapping solution is **production-ready** and handles the immediate "LastName" issue. Future enhancements could include:

- **Dynamic field mapping** based on Salesforce metadata
- **Custom field mapping** configuration in the UI
- **Field mapping suggestions** for new file formats
- **Bulk field mapping** operations
