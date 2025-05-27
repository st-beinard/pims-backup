// frontend/src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css' // Your global styles, including Tailwind
import { AuthProvider } from './contexts/AuthContext.jsx' // <<<=== IMPORT

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider> {/* <<<=== WRAP APP */}
      <App />
    </AuthProvider>
  </React.StrictMode>,
)