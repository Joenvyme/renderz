"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useSession, signOut } from "@/lib/auth-client";
import { StripedPattern } from "@/components/magicui/striped-pattern";
import { ArrowLeft, User, Mail, Calendar, Image, Download, Loader2, LogOut, Camera, Trash2 } from "lucide-react";
import Link from "next/link";

interface Render {
  id: string;
  original_image_url: string | null;
  generated_image_url: string | null;
  upscaled_image_url: string | null;
  prompt: string | null;
  status: string;
  created_at: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const { data: session, isPending, refetch } = useSession();
  const [renders, setRenders] = useState<Render[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/");
    }
  }, [session, isPending, router]);

  useEffect(() => {
    if (session) {
      fetchRenders();
    }
  }, [session]);

  const fetchRenders = async () => {
    try {
      const res = await fetch("/api/user/renders");
      const data = await res.json();
      if (data.renders) {
        setRenders(data.renders);
      }
    } catch (error) {
      console.error("Error fetching renders:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadImage = (url: string, filename: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side validation
    if (!file.type.startsWith("image/")) {
      alert("File must be an image");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be less than 5MB");
      return;
    }

    // Immediate local preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload
    setIsUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/user/avatar", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Upload error");
      }

      // Refresh session to get the new image
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
    if (!confirm("Are you sure you want to delete your profile picture?")) {
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const res = await fetch("/api/user/avatar", {
        method: "DELETE",
      });

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

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="relative min-h-screen bg-white overflow-hidden">
      <StripedPattern className="absolute inset-0 [mask-image:radial-gradient(800px_circle_at_center,white,transparent)]" />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/5 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="font-mono text-xs">
                <ArrowLeft className="w-4 h-4 mr-2" />
                BACK
              </Button>
            </Link>
            <span
              className="text-2xl font-bold tracking-tighter"
              style={{ fontFamily: "system-ui, -apple-system, sans-serif", letterSpacing: "-0.05em" }}
            >
              RENDERZ
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="font-mono text-xs"
            onClick={async () => {
              await signOut();
              window.location.href = "/";
            }}
          >
            <LogOut className="w-3 h-3 mr-1" />
            SIGN OUT
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-6 pt-32 pb-16">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Profile Info */}
          <Card className="p-6 bg-white/5 backdrop-blur-[2px] border border-white">
            <h1 className="text-3xl font-bold tracking-tight mb-6">My Profile</h1>
            
            <div className="flex items-start gap-6">
              {/* Avatar with Upload */}
              <div className="relative group">
                <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center border-2 border-border overflow-hidden">
                  {isUploadingAvatar ? (
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                  ) : avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : session.user.image ? (
                    <img
                      src={session.user.image}
                      alt={session.user.name || "Avatar"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-12 h-12 text-muted-foreground" />
                  )}
                </div>

                {/* Overlay Buttons */}
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
                      onClick={handleDeleteAvatar}
                      disabled={isUploadingAvatar}
                      className="w-10 h-10 rounded-full bg-red-500/70 flex items-center justify-center hover:bg-red-500/90 transition-colors"
                      title="Delete photo"
                    >
                      <Trash2 className="w-4 h-4 text-white" />
                    </button>
                  )}
                </div>

                {/* Hidden File Input */}
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
                  <span className="font-medium">{session.user.name || "User"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground font-mono text-sm">
                    {session.user.email}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Image className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground font-mono text-sm">
                    {renders.length} render{renders.length !== 1 ? "s" : ""} generated
                  </span>
                </div>
                <p className="text-xs text-muted-foreground font-mono mt-2">
                  Hover over the photo to edit · Max 5MB
                </p>
              </div>
            </div>
          </Card>

          {/* Renders History */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight">My Renders</h2>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : renders.length === 0 ? (
              <Card className="p-8 bg-white/5 backdrop-blur-[2px] border border-border text-center">
                <Image className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground font-mono">
                  No renders yet
                </p>
                <Link href="/">
                  <Button className="mt-4 font-mono text-sm">
                    CREATE MY FIRST RENDER
                  </Button>
                </Link>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {renders.map((render) => (
                  <Card
                    key={render.id}
                    className="overflow-hidden bg-white/5 backdrop-blur-[2px] border border-border"
                  >
                    {/* Image Preview */}
                    <div className="aspect-square relative bg-muted">
                      {render.upscaled_image_url || render.generated_image_url ? (
                        <img
                          src={render.upscaled_image_url || render.generated_image_url || ""}
                          alt="Render"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                        </div>
                      )}
                      
                      {/* Status Badge */}
                      <div
                        className={`absolute top-2 right-2 px-2 py-1 text-xs font-mono ${
                          render.status === "completed"
                            ? "bg-green-500 text-white"
                            : render.status === "failed"
                            ? "bg-red-500 text-white"
                            : "bg-yellow-500 text-black"
                        }`}
                      >
                        {render.status === "completed"
                          ? "COMPLETED"
                          : render.status === "failed"
                          ? "FAILED"
                          : "PROCESSING"}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-4 space-y-3">
                      {/* Prompt */}
                      {render.prompt && (
                        <p className="text-sm text-muted-foreground line-clamp-2 font-mono">
                          {render.prompt}
                        </p>
                      )}

                      {/* Date */}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        <span className="font-mono">{formatDate(render.created_at)}</span>
                      </div>

                      {/* Actions */}
                      {render.status === "completed" && (render.upscaled_image_url || render.generated_image_url) && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full font-mono text-xs"
                          onClick={() =>
                            downloadImage(
                              render.upscaled_image_url || render.generated_image_url || "",
                              `renderz-${render.id}.png`
                            )
                          }
                        >
                          <Download className="w-3 h-3 mr-2" />
                          DOWNLOAD
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 z-50 bg-white/5 backdrop-blur-sm border-t border-border">
        <div className="container mx-auto px-6 h-12 flex items-center justify-center">
          <p className="text-xs font-mono text-muted-foreground">
            © 2026 RENDERZ · ARCHITECTURE + TECHNOLOGY
          </p>
        </div>
      </footer>
    </div>
  );
}
