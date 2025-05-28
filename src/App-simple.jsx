import React from 'react';

function App() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🎉 React App Funcionando!</h1>
      <p>Se você está vendo isso, o React está carregando corretamente.</p>
      <p>Timestamp: {new Date().toLocaleString()}</p>
    </div>
  );
}

export default App;
