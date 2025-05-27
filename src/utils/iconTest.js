// Icon import verification test
// This file helps verify that all Material-UI icons are correctly imported

import {
  TrendingUp as TrendingUpIcon,
  Memory as MemoryIcon,
  AttachMoney as MoneyIcon,
  Speed as SpeedIcon,
  Psychology as PsychologyIcon,
  Gavel as RuleIcon,
  Storage as StorageIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Info as InfoIcon,
  Code as ApiIcon,
  CheckCircle as CheckCircleIcon,
  Autorenew as AutorenewIcon,
  Assessment as AssessmentIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

// Export all icons to verify they can be imported
export {
  TrendingUpIcon,
  MemoryIcon,
  MoneyIcon,
  SpeedIcon,
  PsychologyIcon,
  RuleIcon,
  StorageIcon,
  ExpandMoreIcon,
  ExpandLessIcon,
  InfoIcon,
  ApiIcon,
  CheckCircleIcon,
  AutorenewIcon,
  AssessmentIcon,
  RefreshIcon
};

// Test function to verify all icons are available
export const testIconImports = () => {
  const icons = {
    TrendingUpIcon,
    MemoryIcon,
    MoneyIcon,
    SpeedIcon,
    PsychologyIcon,
    RuleIcon,
    StorageIcon,
    ExpandMoreIcon,
    ExpandLessIcon,
    InfoIcon,
    ApiIcon,
    CheckCircleIcon,
    AutorenewIcon,
    AssessmentIcon,
    RefreshIcon
  };

  const missingIcons = [];
  
  Object.entries(icons).forEach(([name, icon]) => {
    if (!icon || typeof icon !== 'function') {
      missingIcons.push(name);
    }
  });

  if (missingIcons.length > 0) {
    console.error('Missing or invalid icons:', missingIcons);
    return false;
  }

  console.log('✅ All icons imported successfully');
  return true;
};

export default testIconImports;
