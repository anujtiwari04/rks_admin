import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from '@/components/ui/input-otp';
import { Loader2 } from 'lucide-react';

interface ResetPasswordFormProps {
  emailForReset: string;
  onSubmit: (otp: string, newPassword: string) => Promise<void>;
  onBack: () => void;
  loading: boolean;
  error: string | null;
}

export const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({
  emailForReset,
  onSubmit,
  onBack,
  loading,
  error,
}) => {
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }
    setPasswordError(null);
    onSubmit(otp, newPassword);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <DialogHeader>
        <DialogTitle>Create New Password</DialogTitle>
        <DialogDescription>
          An OTP was sent to <span className="font-medium text-foreground">{emailForReset}</span>.
          Enter it below along with your new password.
        </DialogDescription>
      </DialogHeader>
      
      <div className="flex justify-center">
        <InputOTP maxLength={6} value={otp} onChange={setOtp}>
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
          </InputOTPGroup>
          <InputOTPSeparator />
          <InputOTPGroup>
            <InputOTPSlot index={3} />
            <InputOTPSlot index={4} />
            <InputOTPSlot index={5} />
          </InputOTPGroup>
        </InputOTP>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="new-password">New Password</Label>
        <Input
          id="new-password"
          type="password"
          placeholder="Enter new password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          disabled={loading}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirm-password">Confirm Password</Label>
        <Input
          id="confirm-password"
          type="password"
          placeholder="Confirm new password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          disabled={loading}
          required
        />
      </div>
      
      {passwordError && <div className="text-sm text-destructive text-center">{passwordError}</div>}
      {error && <div className="text-sm text-destructive text-center">{error}</div>}
      
      <Button type="submit" className="w-full" disabled={loading || otp.length < 6 || !newPassword}>
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Reset Password"}
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