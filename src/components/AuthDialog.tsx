import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import api from "@/lib/api";
import { CredentialResponse } from "@react-oauth/google";

// --- Import all the new sub-components ---
import { LoginForm } from "./auth/LoginForm";
import { SignupForm } from "./auth/SignupForm";
import { VerifyOtpForm } from "./auth/VerifyOtpForm";
import { ForgotPasswordForm } from "./auth/ForgotPasswordForm";
import { ResetPasswordForm } from "./auth/ResetPasswordForm";

// Response types from backend
type LoginResponse = {
  id: string;
  email: string;
  name: string;
  token: string;
  role: 'user' | 'admin';
};

type SignupResponse = {
  message: string;
};

type AuthUiStep = 'credentials' | 'otp' | 'forgotPassword' | 'resetPassword';

export const AuthDialog = () => {
  const { isAuthDialogOpen, setAuthDialogOpen, login } = useAuth();
  
  // --- STATE MANAGED BY THE CONTAINER ---
  const [activeTab, setActiveTab] = useState("login");
  const [uiStep, setUiStep] = useState<AuthUiStep>('credentials');
  
  // State to pass between steps
  const [emailForVerification, setEmailForVerification] = useState("");
  const [forgotEmail, setForgotEmail] = useState(""); // --- RENAMED this from emailForReset for clarity ---
  
  // Shared state for all forms
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null); // For non-error messages
  const [loading, setLoading] = useState(false);

  // --- FORM DATA FOR RESEND OTP (we need to keep it) ---
  const [signupData, setSignupData] = useState({ name: "", email: "", password: "" });

  // Reset all state on dialog close
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setError(null);
      setInfo(null);
      setLoading(false);
      setUiStep('credentials');
      setActiveTab('login');
      setEmailForVerification("");
      setForgotEmail(""); // --- UPDATED ---
      setSignupData({ name: "", email: "", password: "" });
    }
    setAuthDialogOpen(open);
  };

  // --- API HANDLERS ---

  const handleLogin = async (email, password) => {
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      const res = await api.post<LoginResponse>("/auth/login", { email, password });
      if (!res || !res.token) throw { message: "Invalid response from server" };
      login({
        token: res.token,
        user: { email: res.email, name: res.name, role: res.role },
      });
      handleOpenChange(false);
    } catch (e: any) {
      setError(e?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (name, email, password) => {
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      setSignupData({ name, email, password });
      
      await api.post<SignupResponse>("/auth/signup", { email, password, name });
      
      setEmailForVerification(email);
      setUiStep('otp');
      setError(null);
    } catch (e: any) {
      setError(e?.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (otp: string) => {
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      const res = await api.post<LoginResponse>("/auth/verify-otp", {
        email: emailForVerification,
        otp: otp,
      });
      if (!res || !res.token) throw { message: "Invalid response from server" };
      login({
        token: res.token,
        user: { email: res.email, name: res.name, role: res.role },
      });
      handleOpenChange(false);
    } catch (e: any) {
      setError(e?.message || "OTP Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      await api.post<SignupResponse>("/auth/signup", signupData);
      setInfo("A new OTP has been sent to your email.");
    } catch (e: any) {
      setError(e?.message || "Failed to resend OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      if (!credentialResponse.credential) {
        throw new Error("No credential received from Google.");
      }
      const res = await api.post<LoginResponse>("/auth/google", {
        token: credentialResponse.credential,
      });
      if (!res || !res.token) throw { message: "Invalid response from server" };
      login({
        token: res.token,
        user: { email: res.email, name: res.name, role: res.role },
      });
      handleOpenChange(false);
    } catch (e: any) {
      setError(e?.message || "Google login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError("Google login failed. Please try again.");
  };

  const handleForgotPassword = async (email: string) => {
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setForgotEmail(email); // --- UPDATED ---
      setUiStep('resetPassword');
      setError(null);
    } catch (e: any) {
      setError(e?.message || "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (otp: string, newPassword: string) => {
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      const res = await api.post("/auth/reset-password", { 
        email: forgotEmail, // --- UPDATED ---
        otp, 
        newPassword 
      });
      
      setUiStep('credentials');
      setActiveTab('login');
      setInfo(res.message || "Password reset! Please log in.");
      
      setForgotEmail(""); // --- UPDATED ---
      setSignupData({ name: "", email: "", password: "" });

    } catch (e: any) {
      setError(e?.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  // --- RENDER LOGIC ---

  const renderStep = () => {
    switch (uiStep) {
      case 'credentials':
        return (
          <>
            <DialogHeader>
              <DialogTitle>Welcome</DialogTitle>
              <DialogDescription>
                Login to your account or create a new one to get started.
              </DialogDescription>
            </DialogHeader>
            {info && <div className="text-sm text-green-600 text-center">{info}</div>}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              <TabsContent value="login">
                <LoginForm
                  onSubmit={handleLogin}
                  onGoogleSuccess={handleGoogleSuccess}
                  onGoogleError={handleGoogleError}
                  // --- UPDATED: Pass the email up from the form ---
                  onForgotPasswordClick={(email: string) => {
                    setUiStep('forgotPassword');
                    setForgotEmail(email); // Set the email for the next step
                    setError(null);
                    setInfo(null);
                  }}
                  loading={loading}
                  error={error}
                />
              </TabsContent>
              <TabsContent value="signup">
                <SignupForm
                  onSubmit={handleSignup}
                  onGoogleSuccess={handleGoogleSuccess}
                  onGoogleError={handleGoogleError}
                  loading={loading}
                  error={error}
                />
              </TabsContent>
            </Tabs>
          </>
        );

      case 'otp':
        return (
          <VerifyOtpForm
            emailForVerification={emailForVerification}
            onSubmit={handleVerifyOtp}
            onResendOtp={handleResendOtp}
            onBack={() => { setUiStep('credentials'); setActiveTab('signup'); setError(null); setInfo(null); }}
            loading={loading}
            error={error}
            info={info}
          />
        );

      case 'forgotPassword':
        return (
          <ForgotPasswordForm
            initialEmail={forgotEmail} // --- UPDATED: Pass the email from state ---
            onSubmit={handleForgotPassword}
            onBack={() => { setUiStep('credentials'); setActiveTab('login'); setError(null); setInfo(null); }}
            loading={loading}
            error={error}
          />
        );

      case 'resetPassword':
        return (
          <ResetPasswordForm
            emailForReset={forgotEmail} // --- UPDATED: Pass the email from state ---
            onSubmit={handleResetPassword}
            onBack={() => { setUiStep('credentials'); setActiveTab('login'); setError(null); setInfo(null); }}
            loading={loading}
            error={error}
          />
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isAuthDialogOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        {renderStep()}
      </DialogContent>
    </Dialog>
  );
};