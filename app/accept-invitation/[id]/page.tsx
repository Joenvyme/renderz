"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StripedPattern } from "@/components/magicui/striped-pattern";
import { BrandLogo } from "@/components/brand-logo";
import { authClient, useSession } from "@/lib/auth-client";
import { Building2, Check, Loader2, X } from "lucide-react";

type Stage = "loading" | "needs-login" | "ready" | "accepting" | "done" | "error";

interface InvitationDetails {
  id: string;
  email: string;
  status: string;
  expiresAt: string;
  role: string | null;
  organizationId: string;
  organizationName?: string;
  organizationSlug?: string;
  organizationLogo?: string | null;
  inviterEmail?: string;
}

export default function AcceptInvitationPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const { data: session, isPending: sessionPending } = useSession();
  const [stage, setStage] = useState<Stage>("loading");
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchInvitation = useCallback(async () => {
    setStage("loading");
    try {
      const res = await authClient.organization.getInvitation({
        query: { id: params.id },
      });
      const data = (res as { data?: InvitationDetails | null }).data ?? null;
      const errMsg = (res as { error?: { message?: string } }).error?.message;
      if (errMsg) throw new Error(errMsg);
      if (!data) throw new Error("Invitation introuvable ou expirée.");
      setInvitation(data);
      setStage(session ? "ready" : "needs-login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement");
      setStage("error");
    }
  }, [params.id, session]);

  useEffect(() => {
    if (sessionPending) return;
    void fetchInvitation();
  }, [sessionPending, fetchInvitation]);

  const handleAccept = useCallback(async () => {
    if (!invitation) return;
    setStage("accepting");
    try {
      const res = await authClient.organization.acceptInvitation({
        invitationId: invitation.id,
      });
      if ((res as { error?: { message?: string } }).error) {
        throw new Error(
          (res as { error?: { message?: string } }).error?.message ||
            "Acceptation impossible"
        );
      }
      // Active l'org tout juste rejointe, puis redirige.
      try {
        await authClient.organization.setActive({
          organizationId: invitation.organizationId,
        });
      } catch {
        /* non bloquant */
      }
      setStage("done");
      setTimeout(() => {
        router.push("/profile");
      }, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
      setStage("error");
    }
  }, [invitation, router]);

  const handleReject = useCallback(async () => {
    if (!invitation) return;
    setStage("accepting");
    try {
      const res = await authClient.organization.rejectInvitation({
        invitationId: invitation.id,
      });
      if ((res as { error?: { message?: string } }).error) {
        throw new Error(
          (res as { error?: { message?: string } }).error?.message ||
            "Refus impossible"
        );
      }
      setStage("done");
      setTimeout(() => {
        router.push("/");
      }, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
      setStage("error");
    }
  }, [invitation, router]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-white">
      <StripedPattern className="absolute inset-0 [mask-image:radial-gradient(800px_circle_at_center,white,transparent)]" />

      <header className="fixed left-0 right-0 top-0 z-50 border-b border-border bg-white/5 backdrop-blur-sm">
        <div className="container mx-auto flex h-14 items-center px-3 sm:h-16 sm:px-6">
          <BrandLogo className="transition-opacity hover:opacity-90" />
        </div>
      </header>

      <main className="relative z-10 flex min-h-screen items-center justify-center px-3 pt-20 sm:px-6">
        <Card className="w-full max-w-md border border-white bg-white/85 p-6 backdrop-blur-[2px] sm:p-8">
          {stage === "loading" || sessionPending ? (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Chargement…</p>
            </div>
          ) : stage === "error" ? (
            <div className="space-y-4 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
                <X className="h-6 w-6 text-red-600" strokeWidth={2} />
              </div>
              <h1 className="text-lg font-semibold">Invitation indisponible</h1>
              <p className="text-sm text-muted-foreground">
                {error ?? "Cette invitation n'est plus valide."}
              </p>
              <Link href="/">
                <Button variant="outline" className="w-full">
                  Retour à l'accueil
                </Button>
              </Link>
            </div>
          ) : stage === "needs-login" && invitation ? (
            <div className="space-y-5 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[6px] border border-border bg-white">
                <Building2 className="h-6 w-6 text-muted-foreground" strokeWidth={1.75} />
              </div>
              <div className="space-y-1">
                <h1 className="text-lg font-semibold tracking-tight">
                  Connectez-vous pour rejoindre
                </h1>
                <p className="text-sm text-muted-foreground">
                  Vous êtes invité à rejoindre{" "}
                  <strong className="text-foreground">
                    {invitation.organizationName || "cette organisation"}
                  </strong>
                  . Connectez-vous avec l'adresse{" "}
                  <strong className="text-foreground">{invitation.email}</strong>{" "}
                  pour accepter.
                </p>
              </div>
              <Link
                href={`/?invite=${encodeURIComponent(invitation.id)}&email=${encodeURIComponent(invitation.email)}`}
              >
                <Button className="w-full">Se connecter</Button>
              </Link>
            </div>
          ) : stage === "done" ? (
            <div className="space-y-4 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50">
                <Check className="h-6 w-6 text-emerald-600" strokeWidth={2.5} />
              </div>
              <h1 className="text-lg font-semibold">C'est fait</h1>
              <p className="text-sm text-muted-foreground">
                Redirection en cours…
              </p>
            </div>
          ) : invitation ? (
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[6px] border border-border bg-white">
                  {invitation.organizationLogo ? (
                    <img
                      src={invitation.organizationLogo}
                      alt=""
                      className="h-full w-full rounded-[6px] object-cover"
                    />
                  ) : (
                    <Building2
                      className="h-6 w-6 text-muted-foreground"
                      strokeWidth={1.75}
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="truncate text-lg font-semibold tracking-tight">
                    {invitation.organizationName || "Organisation"}
                  </h1>
                  <p className="truncate text-xs text-muted-foreground">
                    {invitation.organizationSlug}
                  </p>
                </div>
              </div>

              <div className="space-y-2 rounded-[6px] border border-border bg-muted/15 p-3 text-sm">
                <p className="text-foreground">
                  Vous êtes invité à rejoindre cette organisation en tant que{" "}
                  <strong>
                    {invitation.role === "owner"
                      ? "Propriétaire"
                      : invitation.role === "admin"
                        ? "Admin"
                        : "Membre"}
                  </strong>
                  .
                </p>
                <p className="text-xs text-muted-foreground">
                  Une fois acceptée, vous aurez accès aux rendus, images et items
                  catalogue partagés avec l'organisation.
                </p>
              </div>

              {session?.user?.email &&
                session.user.email.toLowerCase() !==
                  invitation.email.toLowerCase() && (
                  <div className="rounded-[6px] border border-amber-200 bg-amber-50/50 p-3 text-xs text-amber-800">
                    Vous êtes connecté avec <strong>{session.user.email}</strong>{" "}
                    mais l'invitation a été envoyée à{" "}
                    <strong>{invitation.email}</strong>. Vous pouvez quand même
                    l'accepter — l'invitation sera liée à votre compte actuel.
                  </div>
                )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleReject}
                  disabled={stage === "accepting"}
                  className="flex-1"
                >
                  Refuser
                </Button>
                <Button
                  onClick={handleAccept}
                  disabled={stage === "accepting"}
                  className="flex-1"
                >
                  {stage === "accepting" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Rejoindre"
                  )}
                </Button>
              </div>
            </div>
          ) : null}
        </Card>
      </main>
    </div>
  );
}
