import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from '@/components/ui/input-otp';
import { Loader2 } from 'lucide-react';

interface VerifyOtpFormProps {
  emailForVerification: string;
  onSubmit: (otp: string) => Promise<void>;
  onResendOtp: () => Promise<void>;
  onBack: () => void;
  loading: boolean;
  error: string | null;
  info: string | null;
}

export const VerifyOtpForm: React.FC<VerifyOtpFormProps> = ({
  emailForVerification,
  onSubmit,
  onResendOtp,
  onBack,
  loading,
  error,
  info,
}) => {
  const [otp, setOtp] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(otp);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <DialogHeader>
        <DialogTitle>Check your email</DialogTitle>
        <DialogDescription>
          We've sent a 6-digit verification code to
          <span className="font-medium text-foreground"> {emailForVerification}</span>.
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

      {error && <div className="text-sm text-destructive text-center">{error}</div>}
      {info && <div className="text-sm text-green-600 text-center">{info}</div>}

      <Button type="submit" className="w-full" disabled={loading || otp.length < 6}>
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Verify and Login"}
      </Button>
      
      <div className="flex justify-between items-center">
        <Button
          variant="link"
          type="button"
          onClick={onBack}
          className="p-0"
        >
          Back to Sign Up
        </Button>
        <Button
          variant="link"
          type="button"
          onClick={onResendOtp}
          disabled={loading}
          className="p-0"
        >
          Resend OTP
        </Button>
      </div>
    </form>
  );
};