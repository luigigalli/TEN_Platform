import React from 'react';
import { LoginForm } from '../../components/auth/LoginForm';
import { useLocation } from 'wouter';
import { Alert } from '../../components/ui/alert';

export const LoginPage = () => {
  const location = useLocation();
  const message = location.state?.message;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full">
        {message && (
          <div className="max-w-md mx-auto mb-4">
            <Alert>{message}</Alert>
          </div>
        )}
        <LoginForm />
      </div>
    </div>
  );
};
