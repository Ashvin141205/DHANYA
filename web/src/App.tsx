/**
 * Dhanya Public Web Application Root
 * Application: web
 */

import React from 'react';
import { AuthProvider } from './context/AuthContext';
import { FinancialProvider } from './context/FinancialContext';
import { WebApp } from './WebApp';
import { AuthModal } from './components/AuthModal';

export default function App() {
  return (
    <AuthProvider>
      <FinancialProvider>
        <WebApp />
        <AuthModal />
      </FinancialProvider>
    </AuthProvider>
  );
}

