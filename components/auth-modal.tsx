"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { X, Loader2, Mail, CheckCircle } from "lucide-react";
import { signIn, signUp } from "@/lib/auth-client";

// Google Icon SVG
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // État pour la liste d'attente
  const [isCheckingCapacity, setIsCheckingCapacity] = useState(true);
  const [isSignupOpen, setIsSignupOpen] = useState(true);
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [isJoiningWaitlist, setIsJoiningWaitlist] = useState(false);
  const [waitlistSuccess, setWaitlistSuccess] = useState(false);
  const [waitlistPosition, setWaitlistPosition] = useState<number | null>(null);

  // Vérifier la capacité au chargement
  useEffect(() => {
    if (isOpen) {
      checkCapacity();
    }
  }, [isOpen]);

  const checkCapacity = async () => {
    setIsCheckingCapacity(true);
    try {
      const res = await fetch('/api/waitlist');
      const data = await res.json();
      setIsSignupOpen(data.isOpen);
    } catch (error) {
      console.error('Error checking capacity:', error);
      // En cas d'erreur, on permet l'inscription
      setIsSignupOpen(true);
    } finally {
      setIsCheckingCapacity(false);
    }
  };

  const handleJoinWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsJoiningWaitlist(true);
    setError(null);

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: waitlistEmail }),
      });

      const data = await res.json();

      if (data.success) {
        setWaitlistSuccess(true);
        setWaitlistPosition(data.position || null);
      } else {
        setError(data.message || data.error || "Erreur lors de l'inscription");
      }
    } catch (err) {
      setError("Error joining the waitlist");
    } finally {
      setIsJoiningWaitlist(false);
    }
  };

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setError(null);
    
    try {
      await signIn.social({
        provider: "google",
        callbackURL: "/",
      });
    } catch (err) {
      setError("Error signing in with Google");
      setIsGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (mode === "signup") {
        // Revérifier la capacité avant l'inscription
        const capacityRes = await fetch('/api/waitlist');
        const capacityData = await capacityRes.json();
        
        if (!capacityData.isOpen) {
          setIsSignupOpen(false);
          setIsLoading(false);
          return;
        }

        const { error } = await signUp.email({
          email,
          password,
          name: name || email.split("@")[0],
        });
        
        if (error) {
          setError(error.message || "Error signing up");
          return;
        }
      } else {
        const { error } = await signIn.email({
          email,
          password,
        });
        
        if (error) {
          setError(error.message || "Error signing in");
          return;
        }
      }
      
      onSuccess();
      onClose();
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Écran de chargement
  if (isCheckingCapacity) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        <Card className="relative z-10 w-full max-w-md p-8 bg-white border border-border shadow-2xl">
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin mb-4" />
            <p className="text-sm text-muted-foreground font-mono">Checking...</p>
          </div>
        </Card>
      </div>
    );
  }

  // Écran de liste d'attente (quand inscriptions fermées et mode signup)
  if (!isSignupOpen && mode === "signup") {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        
        <Card className="relative z-10 w-full max-w-md p-8 bg-white border border-border shadow-2xl">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 hover:bg-muted rounded-sm transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {waitlistSuccess ? (
            // Waitlist success
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight mb-2">
                You're on the list!
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                We'll send you an email as soon as a spot opens up.
              </p>
              {waitlistPosition && (
                <p className="text-xs font-mono text-muted-foreground">
                  Position in queue: #{waitlistPosition}
                </p>
              )}
              <Button
                onClick={onClose}
                className="mt-6 font-mono text-sm"
              >
                CLOSE
              </Button>
            </div>
          ) : (
            // Waitlist form
            <>
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8 text-amber-600" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight">
                  Waitlist
                </h2>
                <p className="text-sm text-muted-foreground mt-2">
                  We currently have too many requests. Leave your email and we'll contact you as soon as we increase our server capacity.
                </p>
              </div>

              <form onSubmit={handleJoinWaitlist} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-mono uppercase tracking-wider">
                    Your email
                  </label>
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={waitlistEmail}
                    onChange={(e) => setWaitlistEmail(e.target.value)}
                    required
                    className="rounded-none font-mono"
                  />
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm font-mono">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isJoiningWaitlist}
                  className="w-full h-12 font-mono text-sm tracking-wider !bg-[#000000] hover:!bg-[#1a1a1a]"
                >
                  {isJoiningWaitlist ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "JOIN THE WAITLIST"
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => setMode("signin")}
                  className="text-sm text-muted-foreground hover:text-foreground font-mono transition-colors"
                >
                  Already have an account? Sign in
                </button>
              </div>
            </>
          )}
        </Card>
      </div>
    );
  }

  // Formulaire normal (connexion ou inscription si places disponibles)
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <Card className="relative z-10 w-full max-w-md p-8 bg-white border border-border shadow-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 hover:bg-muted rounded-sm transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold tracking-tight">
            {mode === "signin" ? "Sign In" : "Sign Up"}
          </h2>
          <p className="text-sm text-muted-foreground mt-1 font-mono">
            {mode === "signin" 
              ? "Sign in to generate renders" 
              : "Create an account to get started"}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div className="space-y-2">
              <label className="text-sm font-mono uppercase tracking-wider">
                Name
              </label>
              <Input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="rounded-none font-mono"
              />
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-mono uppercase tracking-wider">
              Email
            </label>
            <Input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="rounded-none font-mono"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-mono uppercase tracking-wider">
              Password
            </label>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="rounded-none font-mono"
            />
            {mode === "signup" && (
              <p className="text-xs text-muted-foreground font-mono">
                Minimum 8 characters
              </p>
            )}
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm font-mono">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading || isGoogleLoading}
            className="w-full h-12 font-mono text-sm tracking-wider !bg-[#000000] hover:!bg-[#1a1a1a]"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : mode === "signin" ? (
              "SIGN IN"
            ) : (
              "SIGN UP"
            )}
          </Button>
        </form>

        {/* Separator */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-muted-foreground font-mono">
              or
            </span>
          </div>
        </div>

        {/* Google Sign In */}
        <Button
          type="button"
          variant="outline"
          onClick={handleGoogleSignIn}
          disabled={isLoading || isGoogleLoading}
          className="w-full h-12 font-mono text-sm tracking-wider"
        >
          {isGoogleLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <GoogleIcon />
              <span className="ml-2">CONTINUE WITH GOOGLE</span>
            </>
          )}
        </Button>

        {/* Toggle mode */}
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setError(null);
            }}
            className="text-sm text-muted-foreground hover:text-foreground font-mono transition-colors"
          >
            {mode === "signin" 
              ? "Don't have an account? Sign up" 
              : "Already have an account? Sign in"}
          </button>
        </div>
      </Card>
    </div>
  );
}
