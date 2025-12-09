import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';

interface ForgotPasswordFormProps {
  initialEmail: string;
  onSubmit: (email: string) => Promise<void>;
  onBack: () => void;
  loading: boolean;
  error: string | null;
}

export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({
  initialEmail,
  onSubmit,
  onBack,
  loading,
  error,
}) => {
  const [email, setEmail] = useState(initialEmail || "");

  useEffect(() => {
    setEmail(initialEmail);
  }, [initialEmail]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(email);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <DialogHeader>
        <DialogTitle>Reset Your Password</DialogTitle>
        <DialogDescription>
          Enter your account's email address and we will send you a 6-digit code to reset your password.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-2">
        <Label htmlFor="forgot-email">Email</Label>
        <Input
          id="forgot-email"
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          required
        />
      </div>
      {error && <div className="text-sm text-destructive text-center">{error}</div>}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Send OTP"}
      </Button>
      <Button
        variant="link"
        type="button"
        onClick={onBack}
        className="p-0 w-full"
      >
        Back to Login
      </Button>
    </form>
  );
};