import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { AuthDivider } from './AuthDivider';

interface LoginFormProps {
  onSubmit: (email, password) => Promise<void>;
  onGoogleSuccess: (credentialResponse: CredentialResponse) => void;
  onGoogleError: () => void;
  onForgotPasswordClick: (email: string) => void; // --- UPDATED: Now accepts email string ---
  loading: boolean;
  error: string | null;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSubmit,
  onGoogleSuccess,
  onGoogleError,
  onForgotPasswordClick,
  loading,
  error,
}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(email, password);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="login-email">Email</Label>
        <Input
          id="login-email"
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="login-password">Password</Label>
        <Input
          id="login-password"
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
          required
        />
      </div>
      {error && <div className="text-sm text-destructive">{error}</div>}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Login"}
      </Button>
      <Button
        variant="link"
        type="button"
        className="p-0 h-auto"
        onClick={() => onForgotPasswordClick(email)} // --- UPDATED: Pass the email state ---
      >
        Forgot Password?
      </Button>
      <AuthDivider />
      <GoogleLogin
        onSuccess={onGoogleSuccess}
        onError={onGoogleError}
        width="100%"
        theme="outline"
        shape="rectangular"
        // disabled={loading}
      />
    </form>
  );
};