"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useSession, signOut } from "@/lib/auth-client";
import { StripedPattern } from "@/components/magicui/striped-pattern";
import { ArrowLeft, User, Mail, Calendar, Image, Loader2, LogOut, Camera, Trash2, Pencil, X, Wand2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { ConfirmActionDialog } from "@/components/confirm-action-dialog";

export default function SettingsPage() {
  const router = useRouter();
  const { data: session, isPending, refetch } = useSession();
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [isSavingName, setIsSavingName] = useState(false);
  const [renderStats, setRenderStats] = useState({ standard: 0, upscaled: 0 });
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [isConfirmDeleteAvatarOpen, setIsConfirmDeleteAvatarOpen] = useState(false);
  const [isConfirmDeleteAccountOpen, setIsConfirmDeleteAccountOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/");
    }
  }, [session, isPending, router]);

  useEffect(() => {
    if (session) {
      fetchStats();
    }
  }, [session]);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/user/renders");
      const data = await res.json();
      if (data.renders) {
        const standard = data.renders.filter((r: any) => r.status === 'completed').length;
        const upscaled = data.renders.filter((r: any) => r.upscaled_image_url && r.upscaled_image_url !== r.generated_image_url).length;
        setRenderStats({ standard, upscaled });
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleUpdateName = async () => {
    if (!newName.trim()) return;
    setIsSavingName(true);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim() }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Update failed');
      }
      await refetch();
      setIsEditingName(false);
      setNewName("");
    } catch (error) {
      console.error('Update name error:', error);
      alert(error instanceof Error ? error.message : 'Update failed');
    } finally {
      setIsSavingName(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("File must be an image");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be less than 5MB");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    setIsUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/user/avatar", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload error");
      await refetch();
      setAvatarPreview(null);
    } catch (error) {
      console.error("Avatar upload error:", error);
      alert(error instanceof Error ? error.message : "Upload error");
      setAvatarPreview(null);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleDeleteAvatar = async () => {
    setIsUploadingAvatar(true);
    try {
      const res = await fetch("/api/user/avatar", { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Delete error");
      }
      await refetch();
    } catch (error) {
      console.error("Avatar delete error:", error);
      alert(error instanceof Error ? error.message : "Delete error");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (isDeletingAccount) return;

    setIsDeletingAccount(true);
    try {
      const res = await fetch("/api/user/account", { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete account");
      }

      await signOut().catch(() => null);
      window.location.href = "/";
    } catch (error) {
      console.error("Delete account error:", error);
      alert(error instanceof Error ? error.message : "Failed to delete account");
    } finally {
      setIsDeletingAccount(false);
    }
  };

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="relative min-h-screen bg-white overflow-hidden">
      <StripedPattern className="absolute inset-0 [mask-image:radial-gradient(800px_circle_at_center,white,transparent)]" />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/5 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/profile">
              <button className="p-1.5 hover:bg-muted rounded transition-colors">
                <ArrowLeft className="w-4 h-4" />
              </button>
            </Link>
            <Link href="/">
              <span
                className="text-xl sm:text-2xl font-bold tracking-tighter cursor-pointer hover:opacity-80 transition-opacity"
                style={{ fontFamily: "system-ui, -apple-system, sans-serif", letterSpacing: "-0.05em" }}
              >
                RENDERZ
              </span>
            </Link>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="font-mono text-[10px] sm:text-xs px-2 sm:px-3"
            onClick={async () => {
              await signOut();
              window.location.href = "/";
            }}
          >
            <LogOut className="w-3 h-3 sm:mr-1" />
            <span className="hidden sm:inline">SIGN OUT</span>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-3 sm:px-6 pt-24 sm:pt-32 pb-16">
        <div className="max-w-2xl mx-auto space-y-6 sm:space-y-8">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Settings</h1>

          {/* Profile Info */}
          <Card className="p-4 sm:p-6 bg-white/5 backdrop-blur-[2px] border border-white">
            <h2 className="text-lg font-bold tracking-tight mb-4">Profile</h2>
            
            <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
              {/* Avatar */}
              <div className="relative group">
                <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center border-2 border-border overflow-hidden">
                  {isUploadingAvatar ? (
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                  ) : avatarPreview ? (
                    <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : session.user.image ? (
                    <img src={session.user.image} alt={session.user.name || "Avatar"} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-12 h-12 text-muted-foreground" />
                  )}
                </div>
                <div className="absolute inset-0 flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingAvatar}
                    className="w-10 h-10 rounded-full bg-black/70 flex items-center justify-center hover:bg-black/90 transition-colors"
                    title="Change photo"
                  >
                    <Camera className="w-4 h-4 text-white" />
                  </button>
                  {session.user.image && (
                    <button
                      onClick={() => setIsConfirmDeleteAvatarOpen(true)}
                      disabled={isUploadingAvatar}
                      className="w-10 h-10 rounded-full bg-red-500/70 flex items-center justify-center hover:bg-red-500/90 transition-colors"
                      title="Delete photo"
                    >
                      <Trash2 className="w-4 h-4 text-white" />
                    </button>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </div>

              {/* Info */}
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  {isEditingName ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder={session.user.name || "Your name"}
                        className="h-8 w-48 font-mono text-sm"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleUpdateName();
                          if (e.key === 'Escape') { setIsEditingName(false); setNewName(""); }
                        }}
                      />
                      <Button
                        size="sm"
                        onClick={handleUpdateName}
                        disabled={isSavingName || !newName.trim()}
                        className="h-8 px-2"
                      >
                        {isSavingName ? <Loader2 className="w-3 h-3 animate-spin" /> : "Save"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => { setIsEditingName(false); setNewName(""); }}
                        className="h-8 px-2"
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <>
                      <span className="font-medium">{session.user.name || "User"}</span>
                      <button
                        onClick={() => { setNewName(session.user.name || ""); setIsEditingName(true); }}
                        className="p-1 hover:bg-muted rounded transition-colors"
                        title="Edit name"
                      >
                        <Pencil className="w-3 h-3 text-muted-foreground" />
                      </button>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground font-mono text-sm">{session.user.email}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Stats */}
          <Card className="p-4 sm:p-6 bg-white/5 backdrop-blur-[2px] border border-white">
            <h2 className="text-lg font-bold tracking-tight mb-4">Statistics</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-muted/20 border border-border text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Image className="w-4 h-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold font-mono">{renderStats.standard}</p>
                <p className="text-xs font-mono text-muted-foreground mt-1">Standard renders</p>
              </div>
              <div className="p-4 bg-muted/20 border border-border text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Wand2 className="w-4 h-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold font-mono">{renderStats.upscaled}</p>
                <p className="text-xs font-mono text-muted-foreground mt-1">4K upscaled</p>
              </div>
            </div>
          </Card>

          {/* Account Actions */}
          <Card className="p-4 sm:p-6 bg-white/5 backdrop-blur-[2px] border border-white">
            <h2 className="text-lg font-bold tracking-tight mb-4">Account</h2>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                className="font-mono text-xs border-red-500/50 text-red-500 hover:bg-red-500/10"
                onClick={async () => {
                  await signOut();
                  window.location.href = "/";
                }}
              >
                <LogOut className="w-3 h-3 mr-2" />
                SIGN OUT
              </Button>
              <Button
                variant="outline"
                className="font-mono text-xs border-red-500 text-red-600 hover:bg-red-500/10"
                onClick={() => setIsConfirmDeleteAccountOpen(true)}
                disabled={isDeletingAccount}
              >
                {isDeletingAccount ? (
                  <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="w-3 h-3 mr-2" />
                )}
                DELETE ACCOUNT
              </Button>
            </div>
          </Card>
        </div>
      </main>

      <ConfirmActionDialog
        open={isConfirmDeleteAvatarOpen}
        title="Delete profile picture?"
        description="Your current profile picture will be removed."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        danger
        isLoading={isUploadingAvatar}
        onCancel={() => setIsConfirmDeleteAvatarOpen(false)}
        onConfirm={async () => {
          await handleDeleteAvatar();
          setIsConfirmDeleteAvatarOpen(false);
        }}
      />

      <ConfirmActionDialog
        open={isConfirmDeleteAccountOpen}
        title="Delete account permanently?"
        description="This action is irreversible. Your account and related data will be deleted."
        confirmLabel="Delete account"
        cancelLabel="Cancel"
        danger
        requiredText="DELETE"
        requiredTextLabel='Type "DELETE" to confirm account deletion.'
        isLoading={isDeletingAccount}
        onCancel={() => setIsConfirmDeleteAccountOpen(false)}
        onConfirm={async () => {
          await handleDeleteAccount();
          setIsConfirmDeleteAccountOpen(false);
        }}
      />
    </div>
  );
}
