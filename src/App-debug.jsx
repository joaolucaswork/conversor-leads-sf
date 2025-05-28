import React from 'react';

// Test imports one by one to identify the problematic one
console.log('Testing imports...');

// Test 1: React Router
try {
  console.log('1. Testing React Router...');
  import('react-router-dom').then(() => {
    console.log('✓ React Router imported successfully');
  }).catch(error => {
    console.error('✗ React Router import failed:', error);
  });
} catch (error) {
  console.error('✗ React Router import failed:', error);
}

// Test 2: Material-UI
try {
  console.log('2. Testing Material-UI...');
  import('@mui/material/styles').then(() => {
    console.log('✓ Material-UI imported successfully');
  }).catch(error => {
    console.error('✗ Material-UI import failed:', error);
  });
} catch (error) {
  console.error('✗ Material-UI import failed:', error);
}

// Test 3: i18n
try {
  console.log('3. Testing i18n...');
  import('./i18n/config').then(() => {
    console.log('✓ i18n imported successfully');
  }).catch(error => {
    console.error('✗ i18n import failed:', error);
  });
} catch (error) {
  console.error('✗ i18n import failed:', error);
}

// Test 4: Auth store
try {
  console.log('4. Testing stores...');
  import('./store/authStore').then(() => {
    console.log('✓ Auth store imported successfully');
  }).catch(error => {
    console.error('✗ Auth store import failed:', error);
  });
} catch (error) {
  console.error('✗ Auth store import failed:', error);
}

// Test 5: Environment utils
try {
  console.log('5. Testing environment utils...');
  import('./utils/environment').then(() => {
    console.log('✓ Environment utils imported successfully');
  }).catch(error => {
    console.error('✗ Environment utils import failed:', error);
  });
} catch (error) {
  console.error('✗ Environment utils import failed:', error);
}

// Test 6: Pages
try {
  console.log('6. Testing pages...');
  import('./pages/HomePage').then(() => {
    console.log('✓ HomePage imported successfully');
  }).catch(error => {
    console.error('✗ HomePage import failed:', error);
  });
} catch (error) {
  console.error('✗ HomePage import failed:', error);
}

function App() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🔍 Debug Mode - Import Testing</h1>
      <p>Check the console for import test results.</p>
      <p>Timestamp: {new Date().toLocaleString()}</p>
    </div>
  );
}

export default App;
