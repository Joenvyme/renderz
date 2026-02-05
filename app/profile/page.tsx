"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useSession, signOut } from "@/lib/auth-client";
import { StripedPattern } from "@/components/magicui/striped-pattern";
import { ArrowLeft, User, Mail, Calendar, Image, Download, Loader2, LogOut, Camera, Trash2, Wand2, Eye, Pencil, X, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { RenderGenerator } from "@/components/render-generator";

interface RenderMetadata {
  aspectRatio?: string;
  upscale_error?: string;
  upscale_started_at?: string;
  [key: string]: unknown;
}

interface Render {
  id: string;
  original_image_url: string | null;
  generated_image_url: string | null;
  upscaled_image_url: string | null;
  prompt: string | null;
  status: string;
  created_at: string;
  metadata?: RenderMetadata;
}

export default function ProfilePage() {
  const router = useRouter();
  const { data: session, isPending, refetch } = useSession();
  const [renders, setRenders] = useState<Render[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [upscalingIds, setUpscalingIds] = useState<Set<string>>(new Set());
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [previewImage, setPreviewImage] = useState<{ url: string; type: string } | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [isSavingName, setIsSavingName] = useState(false);
  const [showUpscaleToast, setShowUpscaleToast] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/");
    }
  }, [session, isPending, router]);

  // Bloquer le scroll du body quand le modal est ouvert
  useEffect(() => {
    if (previewImage) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [previewImage]);

  // Fermer automatiquement le toast après 4 secondes
  useEffect(() => {
    if (showUpscaleToast) {
      const timer = setTimeout(() => {
        setShowUpscaleToast(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [showUpscaleToast]);

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

  // Upscale a render from the profile
  const handleUpscale = async (renderId: string) => {
    // TEMPORAIREMENT DÉSACTIVÉ - Afficher le toast "bientôt disponible"
    setShowUpscaleToast(true);
    
    // Code original commenté pour référence
    /*
    setUpscalingIds(prev => new Set(prev).add(renderId));

    try {
      const res = await fetch('/api/upscale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ renderId, scale: 4 }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Upscaling failed');
      }

      // Polling pour suivre l'upscaling
      let completed = false;
      let attempts = 0;
      const maxAttempts = 60;

      while (!completed && attempts < maxAttempts) {
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const statusRes = await fetch(`/api/render/${renderId}`);
        if (!statusRes.ok) continue;
        
        const render = await statusRes.json();

        if (render.status === 'completed' && render.upscaled_image_url && 
            render.upscaled_image_url !== render.generated_image_url) {
          completed = true;
          // Mettre à jour le render dans la liste
          setRenders(prev => prev.map(r => r.id === renderId ? render : r));
        } else if (render.metadata?.upscale_error) {
          throw new Error(render.metadata.upscale_error);
        }
      }

      if (!completed) {
        alert('Upscaling is taking longer than expected. Refresh the page later.');
      }
    } catch (error) {
      console.error('Upscale error:', error);
      alert(error instanceof Error ? error.message : 'Upscaling failed');
    } finally {
      setUpscalingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(renderId);
        return newSet;
      });
    }
    */
  };

  // Check if a render can be upscaled
  const canUpscale = (render: Render) => {
    return render.status === 'completed' && 
           render.generated_image_url && 
           (!render.upscaled_image_url || render.upscaled_image_url === render.generated_image_url);
  };

  // Check if a render has been upscaled
  const isUpscaled = (render: Render) => {
    return render.upscaled_image_url && 
           render.upscaled_image_url !== render.generated_image_url;
  };

  // Delete a render
  const handleDeleteRender = async (renderId: string) => {
    if (!confirm("Are you sure you want to delete this render?")) return;

    setDeletingIds(prev => new Set(prev).add(renderId));

    try {
      const res = await fetch(`/api/render/${renderId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Delete failed');
      }

      // Retirer de la liste locale
      setRenders(prev => prev.filter(r => r.id !== renderId));
    } catch (error) {
      console.error('Delete error:', error);
      alert(error instanceof Error ? error.message : 'Delete failed');
    } finally {
      setDeletingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(renderId);
        return newSet;
      });
    }
  };

  // Update profile name
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
        <div className="container mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <Link href="/">
            <span
              className="text-xl sm:text-2xl font-bold tracking-tighter cursor-pointer hover:opacity-80 transition-opacity"
              style={{ fontFamily: "system-ui, -apple-system, sans-serif", letterSpacing: "-0.05em" }}
            >
              RENDERZ
            </span>
          </Link>
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
        <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8">
          {/* Profile Info */}
          <Card className="p-4 sm:p-6 bg-white/5 backdrop-blur-[2px] border border-white">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4 sm:mb-6">My Profile</h1>
            
            <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
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
                {/* Name with edit */}
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
                          if (e.key === 'Escape') {
                            setIsEditingName(false);
                            setNewName("");
                          }
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
                        onClick={() => {
                          setIsEditingName(false);
                          setNewName("");
                        }}
                        className="h-8 px-2"
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <>
                      <span className="font-medium">{session.user.name || "User"}</span>
                      <button
                        onClick={() => {
                          setNewName(session.user.name || "");
                          setIsEditingName(true);
                        }}
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
                  <span className="text-muted-foreground font-mono text-sm">
                    {session.user.email}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Image className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground font-mono text-sm">
                      {renders.filter(r => r.status === 'completed').length} standard
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Wand2 className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground font-mono text-sm">
                      {renders.filter(r => r.upscaled_image_url && r.upscaled_image_url !== r.generated_image_url).length} upscaled
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Render Generator */}
          <div className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Create New Render</h2>
            <RenderGenerator 
              onGenerateSuccess={() => {
                // Refresh renders list after successful generation
                fetchRenders();
              }}
            />
          </div>

          {/* Renders History */}
          <div className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">My Renders</h2>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : renders.length === 0 ? (
              <Card className="p-6 sm:p-8 bg-white/5 backdrop-blur-[2px] border border-border text-center">
                <Image className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm sm:text-base text-muted-foreground font-mono">
                  No renders yet
                </p>
                <Link href="/">
                  <Button className="mt-4 font-mono text-xs sm:text-sm">
                    CREATE MY FIRST RENDER
                  </Button>
                </Link>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {renders.map((render) => (
                  <Card
                    key={render.id}
                    className="overflow-hidden bg-white/5 backdrop-blur-[2px] border border-border"
                  >
                    {/* Image Preview */}
                    <div className="aspect-square relative bg-muted group">
                      {render.generated_image_url ? (
                        <>
                          <img
                            src={isUpscaled(render) ? render.upscaled_image_url! : render.generated_image_url}
                            alt="Render"
                            className="w-full h-full object-cover"
                          />
                          {/* Overlay avec boutons sur hover */}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <button
                              onClick={() => setPreviewImage({ 
                                url: render.generated_image_url!, 
                                type: 'Standard' 
                              })}
                              className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
                              title="View standard"
                            >
                              <Eye className="w-4 h-4 text-white" />
                            </button>
                            {isUpscaled(render) && (
                              <button
                                onClick={() => setPreviewImage({ 
                                  url: render.upscaled_image_url!, 
                                  type: '4K Upscaled' 
                                })}
                                className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
                                title="View 4K"
                              >
                                <Wand2 className="w-4 h-4 text-white" />
                              </button>
                            )}
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                        </div>
                      )}
                      
                      {/* Status Badges */}
                      <div className="absolute top-2 left-2 flex gap-1">
                        {/* Quality badge */}
                        {isUpscaled(render) ? (
                          <div className="px-2 py-1 text-xs font-mono bg-green-500 text-white">
                            4K
                          </div>
                        ) : render.status === 'completed' && render.generated_image_url ? (
                          <div className="px-2 py-1 text-xs font-mono bg-yellow-500 text-black">
                            STD
                          </div>
                        ) : null}
                      </div>

                      {/* Status Badge (top right) */}
                      <div
                        className={`absolute top-2 right-2 px-2 py-1 text-xs font-mono ${
                          render.status === "completed"
                            ? "bg-green-500/80 text-white"
                            : render.status === "failed"
                            ? "bg-red-500 text-white"
                            : render.status === "upscaling"
                            ? "bg-purple-500 text-white"
                            : "bg-yellow-500 text-black"
                        }`}
                      >
                        {render.status === "completed"
                          ? "✓"
                          : render.status === "failed"
                          ? "✗"
                          : render.status === "upscaling"
                          ? "⬆"
                          : "⏳"}
                      </div>

                      {/* Aspect ratio badge */}
                      {render.metadata?.aspectRatio && (
                        <div className="absolute bottom-2 left-2 px-2 py-0.5 text-[10px] font-mono bg-black/70 text-white">
                          {render.metadata.aspectRatio}
                        </div>
                      )}
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
                      {render.status === "completed" && render.generated_image_url && (
                        <div className="space-y-2">
                          {/* Upscale button si pas encore upscalé - Temporairement désactivé */}
                          {canUpscale(render) && (
                            <Button
                              size="sm"
                              className="w-full font-mono text-[10px] sm:text-xs !bg-[#000000] hover:!bg-[#1a1a1a] cursor-pointer h-8 sm:h-9"
                              onClick={() => handleUpscale(render.id)}
                            >
                              <Wand2 className="w-3 h-3 sm:mr-2" />
                              <span className="ml-1 sm:ml-0">UPSCALE TO 4K</span>
                            </Button>
                          )}

                          {/* Download buttons */}
                          <div className="flex flex-col sm:flex-row gap-2">
                            {/* Standard download */}
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 font-mono text-[10px] sm:text-xs h-8 sm:h-9"
                              onClick={() => downloadImage(
                                render.generated_image_url!,
                                `renderz-${render.id}-standard.png`
                              )}
                            >
                              <Download className="w-3 h-3 sm:mr-1" />
                              <span className="ml-1 sm:ml-0">STD</span>
                            </Button>

                            {/* 4K download si upscalé */}
                            {isUpscaled(render) && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 font-mono text-[10px] sm:text-xs border-green-500/50 text-green-400 hover:bg-green-500/10 h-8 sm:h-9"
                                onClick={() => downloadImage(
                                  render.upscaled_image_url!,
                                  `renderz-${render.id}-4k.png`
                                )}
                              >
                                <Download className="w-3 h-3 sm:mr-1" />
                                <span className="ml-1 sm:ml-0">4K</span>
                              </Button>
                            )}

                            {/* Delete button */}
                            <Button
                              variant="outline"
                              size="sm"
                              className="font-mono text-[10px] sm:text-xs border-red-500/50 text-red-400 hover:bg-red-500/10 h-8 sm:h-9"
                              onClick={() => handleDeleteRender(render.id)}
                              disabled={deletingIds.has(render.id)}
                            >
                              {deletingIds.has(render.id) ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Trash2 className="w-3 h-3" />
                              )}
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Delete button for non-completed renders */}
                      {render.status !== "completed" && (
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 font-mono text-[10px] sm:text-xs border-red-500/50 text-red-400 hover:bg-red-500/10 h-8 sm:h-9"
                            onClick={() => handleDeleteRender(render.id)}
                            disabled={deletingIds.has(render.id)}
                          >
                            {deletingIds.has(render.id) ? (
                              <Loader2 className="w-3 h-3 sm:mr-2 animate-spin" />
                            ) : (
                              <Trash2 className="w-3 h-3 sm:mr-2" />
                            )}
                            <span className="ml-1 sm:ml-0">DELETE</span>
                          </Button>
                        </div>
                      )}

                      {/* Error message */}
                      {render.metadata?.upscale_error && (
                        <p className="text-xs text-red-400 font-mono">
                          Upscale failed: {render.metadata.upscale_error.substring(0, 50)}...
                        </p>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Image Preview Modal */}
            {previewImage && (
              <div 
                className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
                style={{ paddingTop: '3.5rem', paddingBottom: '2.5rem' }}
                onClick={() => setPreviewImage(null)}
              >
                <div className="relative w-full h-full flex items-center justify-center px-2 sm:px-4" onClick={(e) => e.stopPropagation()}>
                  {/* Type label - top left */}
                  <div className="absolute top-2 sm:top-4 left-2 sm:left-4 bg-black/70 px-2 sm:px-3 py-1 text-xs sm:text-sm font-mono text-white z-10 rounded">
                    {previewImage.type}
                  </div>
                  
                  {/* Action buttons - top right */}
                  <div className="absolute top-2 sm:top-4 right-2 sm:right-4 flex gap-1.5 sm:gap-2 z-10">
                    {/* Download button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadImage(
                          previewImage.url,
                          `renderz-${previewImage.type.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.png`
                        );
                      }}
                      className="w-8 h-8 sm:w-10 sm:h-10 bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center rounded"
                      title="Download image"
                    >
                      <Download className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </button>
                    
                    {/* Close button */}
                    <button
                      onClick={() => setPreviewImage(null)}
                      className="w-8 h-8 sm:w-10 sm:h-10 bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center rounded"
                      title="Close"
                    >
                      <X className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </button>
                  </div>
                  
                  {/* Image - centered and contained */}
                  <img
                    src={previewImage.url}
                    alt="Preview"
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 z-50 bg-white/5 backdrop-blur-sm border-t border-border">
        <div className="container mx-auto px-3 sm:px-6 h-10 sm:h-12 flex items-center justify-center">
          <p className="text-[10px] sm:text-xs font-mono text-muted-foreground text-center">
            <span className="hidden sm:inline">© 2026 RENDERZ · ARCHITECTURE + TECHNOLOGY</span>
            <span className="sm:hidden">© 2026 RENDERZ</span>
          </p>
        </div>
      </footer>

      {/* Toast "Bientôt disponible" pour l'upscale */}
      {showUpscaleToast && (
        <div className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:w-auto z-[100] animate-in slide-in-from-bottom-2 fade-in duration-300">
          <div className="bg-black/90 backdrop-blur-sm border border-white/20 px-4 py-3 rounded-none shadow-lg">
            <div className="flex items-center gap-3">
              <Sparkles className="w-4 h-4 text-yellow-400 animate-pulse flex-shrink-0" />
              <p className="text-xs sm:text-sm font-mono text-white">
                Bientôt disponible
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
