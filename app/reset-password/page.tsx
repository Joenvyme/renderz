"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";
import { StripedPattern } from "@/components/magicui/striped-pattern";
import { Loader2, Lock, CheckCircle, XCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const error = searchParams.get("error");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (error === "INVALID_TOKEN") {
      setStatus("error");
      setErrorMessage("This reset link is invalid or has expired. Please request a new one.");
    }
  }, [error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      setErrorMessage("Password must be at least 8 characters");
      return;
    }

    if (!token) {
      setErrorMessage("Invalid reset token");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      const { error } = await authClient.resetPassword({
        newPassword,
        token,
      });

      if (error) {
        setStatus("error");
        setErrorMessage(error.message || "Failed to reset password");
      } else {
        setStatus("success");
      }
    } catch {
      setStatus("error");
      setErrorMessage("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
      {/* Background Pattern */}
      <div className="fixed inset-0 z-0">
        <StripedPattern className="opacity-30" />
      </div>

      <Card className="relative z-10 w-full max-w-md p-8 bg-card/80 backdrop-blur-sm border-border">
        {/* Logo */}
        <Link href="/" className="block mb-8">
          <h1
            className="text-3xl font-bold tracking-tighter text-center"
            style={{ fontFamily: "system-ui, -apple-system, sans-serif", letterSpacing: "-0.05em" }}
          >
            RENDERZ
          </h1>
        </Link>

        {status === "success" ? (
          <div className="text-center space-y-4">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
            <h2 className="text-xl font-semibold">Password Reset Successful</h2>
            <p className="text-muted-foreground text-sm">
              Your password has been reset. You can now sign in with your new password.
            </p>
            <Button
              className="w-full font-mono"
              onClick={() => router.push("/")}
            >
              GO TO SIGN IN
            </Button>
          </div>
        ) : status === "error" && !token ? (
          <div className="text-center space-y-4">
            <XCircle className="w-16 h-16 text-red-500 mx-auto" />
            <h2 className="text-xl font-semibold">Invalid Reset Link</h2>
            <p className="text-muted-foreground text-sm">
              {errorMessage}
            </p>
            <Button
              variant="outline"
              className="w-full font-mono"
              onClick={() => router.push("/")}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              BACK TO HOME
            </Button>
          </div>
        ) : (
          <>
            <div className="text-center mb-6">
              <Lock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold">Reset Your Password</h2>
              <p className="text-muted-foreground text-sm mt-2">
                Enter your new password below.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Input
                  type="password"
                  placeholder="New password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  className="font-mono"
                />
              </div>

              <div>
                <Input
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                  className="font-mono"
                />
              </div>

              {errorMessage && (
                <p className="text-red-500 text-sm text-center">{errorMessage}</p>
              )}

              <Button
                type="submit"
                className="w-full font-mono"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    RESETTING...
                  </>
                ) : (
                  "RESET PASSWORD"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link
                href="/"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Back to sign in
              </Link>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}




