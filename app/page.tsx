"use client";

import { useState, useCallback, useEffect } from "react";
import { Upload, Sparkles, ArrowRight, Download, LogOut, User, RefreshCw, Wand2, Check, X, Plus, Image as ImageIcon, Palette, Layers } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { AuroraText } from "@/components/ui/aurora-text";
import { StripedPattern } from "@/components/magicui/striped-pattern";
import { AuthModal } from "@/components/auth-modal";
import { useSession, signOut } from "@/lib/auth-client";
import { ASPECT_RATIOS, AspectRatio, ImageRole } from "@/lib/api/nano-banana";

interface RenderResult {
  id: string;
  generated_image_url: string | null;
  upscaled_image_url: string | null;
  status: string;
}

// Interface pour une image uploadée avec son rôle
interface UploadedImageItem {
  id: string;
  dataUrl: string;
  role: ImageRole;
}

// Configuration des rôles
const ROLE_CONFIG: Record<ImageRole, { label: string; description: string; icon: typeof ImageIcon }> = {
  main: { 
    label: 'Main', 
    description: 'Primary subject/content',
    icon: ImageIcon
  },
  style: { 
    label: 'Style', 
    description: 'Visual style reference',
    icon: Palette
  },
  reference: { 
    label: 'Reference', 
    description: 'Additional context',
    icon: Layers
  },
};

// Clés localStorage pour persister les données
const STORAGE_KEYS = {
  IMAGES: "renderz_pending_images",
  PROMPT: "renderz_pending_prompt",
  RENDER_ID: "renderz_current_render_id",
  ASPECT_RATIO: "renderz_aspect_ratio",
};

// Nombre maximum d'images
const MAX_IMAGES = 3;

export default function LandingPage() {
  const { data: session, isPending } = useSession();
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<UploadedImageItem[]>([]);
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [renderResult, setRenderResult] = useState<RenderResult | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingGeneration, setPendingGeneration] = useState(false);
  const [currentRenderId, setCurrentRenderId] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("1:1");
  const [isUpscaling, setIsUpscaling] = useState(false);

  // Fonction pour faire le polling d'un render
  const pollRenderStatus = async (renderId: string) => {
    console.log('🔄 Starting polling for render:', renderId);
    setIsGenerating(true);
    setCurrentRenderId(renderId);
    localStorage.setItem(STORAGE_KEYS.RENDER_ID, renderId);

    let attempts = 0;
    const maxAttempts = 120; // 4 minutes max (120 * 2s)

    while (attempts < maxAttempts) {
      attempts++;
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      try {
        const statusRes = await fetch(`/api/render/${renderId}`);
        if (!statusRes.ok) {
          console.error('Status check failed:', statusRes.status);
          continue;
        }
        
        const render = await statusRes.json();
        console.log(`[Attempt ${attempts}] Status: ${render.status}, Generated: ${!!render.generated_image_url}`);

        // ✅ RENDER TERMINÉ - dès qu'on a l'image OU status completed
        if (render.generated_image_url) {
          console.log('✅ Image detected! Status:', render.status);
          console.log('✅ URL:', render.generated_image_url.substring(0, 80) + '...');
          localStorage.removeItem(STORAGE_KEYS.RENDER_ID);
          
          // IMPORTANT: D'abord arrêter le chargement
          setIsGenerating(false);
          setCurrentRenderId(null);
          
          // Puis mettre le résultat
          setRenderResult({
            id: render.id,
            generated_image_url: render.generated_image_url,
            upscaled_image_url: render.upscaled_image_url,
            status: render.status,
          });
          
          console.log('✅ States updated! isGenerating=false, renderResult set');
          return; // Sortir immédiatement
        }
        
        // ❌ RENDER ÉCHOUÉ
        if (render.status === 'failed') {
          console.error('❌ Render failed');
          localStorage.removeItem(STORAGE_KEYS.RENDER_ID);
          setIsGenerating(false);
          setCurrentRenderId(null);
          alert('Generation failed. Please try again.');
          return;
        }
        
      } catch (error) {
        console.error('Polling error:', error);
      }
    }

    // ⏰ TIMEOUT
    console.warn('⏰ Polling timeout');
    localStorage.removeItem(STORAGE_KEYS.RENDER_ID);
    setIsGenerating(false);
    setCurrentRenderId(null);
    alert('Generation is taking longer than expected. Check your profile to see the result.');
  };

  // Restaurer les données depuis localStorage au chargement
  useEffect(() => {
    const savedImages = localStorage.getItem(STORAGE_KEYS.IMAGES);
    const savedPrompt = localStorage.getItem(STORAGE_KEYS.PROMPT);
    const savedRenderId = localStorage.getItem(STORAGE_KEYS.RENDER_ID);
    const savedAspectRatio = localStorage.getItem(STORAGE_KEYS.ASPECT_RATIO) as AspectRatio | null;
    
    if (savedImages) {
      try {
        const parsed = JSON.parse(savedImages) as UploadedImageItem[];
        setUploadedImages(parsed);
      } catch (e) {
        console.error('Failed to parse saved images:', e);
      }
    }
    if (savedPrompt) {
      setPrompt(savedPrompt);
    }
    if (savedAspectRatio) {
      setAspectRatio(savedAspectRatio);
    }
    
    // Si on a un render en cours, reprendre le polling
    if (savedRenderId && session) {
      console.log('Resuming polling for render:', savedRenderId);
      pollRenderStatus(savedRenderId);
    }
    // Si on a des données sauvegardées (mais pas de render en cours), marquer comme "en attente"
    else if (savedImages && savedPrompt && !savedRenderId) {
      setPendingGeneration(true);
    }
  }, [session]);

  // Lancer automatiquement la génération après connexion si des données étaient en attente
  useEffect(() => {
    if (session && pendingGeneration && uploadedImages.length > 0 && prompt.trim()) {
      setPendingGeneration(false);
      localStorage.removeItem(STORAGE_KEYS.IMAGES);
      localStorage.removeItem(STORAGE_KEYS.PROMPT);
      handleGenerate();
    }
  }, [session, pendingGeneration]);

  // Sauvegarder les données avant d'ouvrir le modal d'auth
  const saveAndShowAuth = () => {
    if (uploadedImages.length > 0) {
      localStorage.setItem(STORAGE_KEYS.IMAGES, JSON.stringify(uploadedImages));
    }
    if (prompt) {
      localStorage.setItem(STORAGE_KEYS.PROMPT, prompt);
    }
    localStorage.setItem(STORAGE_KEYS.ASPECT_RATIO, aspectRatio);
    setShowAuthModal(true);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  // Fonction pour supprimer une image
  const removeImage = useCallback((imageId: string) => {
    setUploadedImages(prev => prev.filter(img => img.id !== imageId));
  }, []);

  // Fonction pour changer le rôle d'une image
  const changeImageRole = useCallback((imageId: string, newRole: ImageRole) => {
    setUploadedImages(prev => prev.map(img => 
      img.id === imageId ? { ...img, role: newRole } : img
    ));
  }, []);

  // Fonction pour ajouter plusieurs images d'un coup avec les bons rôles
  const addMultipleImages = useCallback((dataUrls: string[]) => {
    setUploadedImages(prev => {
      const availableSlots = MAX_IMAGES - prev.length;
      const urlsToAdd = dataUrls.slice(0, availableSlots);
      
      const newImages: UploadedImageItem[] = urlsToAdd.map((dataUrl, index) => {
        // Calculer le rôle en tenant compte des images existantes ET des nouvelles déjà ajoutées
        const allRoles = [
          ...prev.map(img => img.role),
          ...Array(index).fill(null).map((_, i) => {
            // Recalculer les rôles des nouvelles images précédentes
            const existingCount = prev.length + i;
            if (existingCount === 0) return 'main';
            if (existingCount === 1) return 'style';
            return 'reference';
          })
        ];
        
        let role: ImageRole = 'main';
        if (allRoles.includes('main')) {
          role = allRoles.includes('style') ? 'reference' : 'style';
        }
        
        return {
          id: `img-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`,
          dataUrl,
          role,
        };
      });
      
      return [...prev, ...newImages];
    });
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(f => f.type.startsWith("image/"));
    
    // Lire tous les fichiers et les ajouter d'un coup
    Promise.all(
      imageFiles.map(file => new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      }))
    ).then(dataUrls => {
      const validUrls = dataUrls.filter(Boolean);
      if (validUrls.length > 0) {
        addMultipleImages(validUrls);
      }
    });
  }, [addMultipleImages]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Lire tous les fichiers et les ajouter d'un coup
    Promise.all(
      files.map(file => new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (evt) => resolve(evt.target?.result as string);
        reader.readAsDataURL(file);
      }))
    ).then(dataUrls => {
      const validUrls = dataUrls.filter(Boolean);
      if (validUrls.length > 0) {
        addMultipleImages(validUrls);
      }
    });
    
    // Reset l'input pour permettre de re-sélectionner le même fichier
    e.target.value = '';
  };

  const handleGenerate = async () => {
    if (uploadedImages.length === 0 || !prompt.trim()) return;
    
    // Vérifier l'authentification
    if (!session) {
      saveAndShowAuth();
      return;
    }
    
    // Nettoyer le localStorage des données pré-auth
    localStorage.removeItem(STORAGE_KEYS.IMAGES);
    localStorage.removeItem(STORAGE_KEYS.PROMPT);
    localStorage.removeItem(STORAGE_KEYS.ASPECT_RATIO);
    
    setIsGenerating(true);
    setRenderResult(null);

    try {
      // 1. Upload de toutes les images
      console.log(`📤 Uploading ${uploadedImages.length} image(s)...`);
      
      const uploadedUrls: { url: string; role: ImageRole }[] = [];
      
      for (const img of uploadedImages) {
        const blob = await fetch(img.dataUrl).then(r => r.blob());
        const formData = new FormData();
        formData.append('file', blob, `image-${img.role}.png`);

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!uploadRes.ok) {
          const errorData = await uploadRes.json().catch(() => ({}));
          console.error('Upload error:', errorData);
          throw new Error(`Upload failed for ${img.role} image`);
        }
        
        const { url } = await uploadRes.json();
        uploadedUrls.push({ url, role: img.role });
        console.log(`✓ ${img.role} image uploaded:`, url);
      }

      // 2. Lancer la génération avec toutes les images
      console.log('🚀 Starting generation with', uploadedUrls.length, 'image(s)...');
      
      const images = uploadedUrls.map(item => ({ url: item.url, role: item.role }));
      
      const generateRes = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images, prompt, aspectRatio }),
      });

      const generateData = await generateRes.json();

      if (!generateRes.ok) {
        console.error('Generate error:', generateData);
        // Gérer la limite de rendus
        if (generateRes.status === 403 && generateData.maxAllowed) {
          alert(`Limit reached! You have used ${generateData.currentCount}/${generateData.maxAllowed} renders. Delete existing renders in your profile or upgrade to a higher plan.`);
          setIsGenerating(false);
          return;
        }
        throw new Error(generateData.message || 'Generation failed');
      }
      
      const { renderId } = generateData;
      console.log('✓ Generation started, renderId:', renderId);

      // 3. Polling pour suivre le statut (avec persistance)
      await pollRenderStatus(renderId);

    } catch (error) {
      console.error('Error:', error);
      alert(error instanceof Error ? error.message : 'Error during generation. Check the console.');
      setIsGenerating(false);
    }
  };

  // Fonction pour lancer une nouvelle génération (reset le formulaire)
  const handleNewGeneration = () => {
    setIsGenerating(false);
    setCurrentRenderId(null);
    setRenderResult(null);
    setUploadedImages([]);
    setPrompt("");
    setAspectRatio("1:1");
    setIsUpscaling(false);
    localStorage.removeItem(STORAGE_KEYS.IMAGES);
    localStorage.removeItem(STORAGE_KEYS.PROMPT);
    localStorage.removeItem(STORAGE_KEYS.RENDER_ID);
    localStorage.removeItem(STORAGE_KEYS.ASPECT_RATIO);
  };

  // Fonction pour régénérer avec les mêmes paramètres
  const handleRegenerate = () => {
    setRenderResult(null);
    setIsUpscaling(false);
    handleGenerate();
  };

  // Fonction pour upscaler l'image générée
  const handleUpscale = async () => {
    if (!renderResult?.id) return;
    
    setIsUpscaling(true);
    
    try {
      const res = await fetch('/api/upscale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ renderId: renderResult.id, scale: 4 }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Upscaling failed');
      }

      // Polling pour suivre l'upscaling
      let completed = false;
      let attempts = 0;
      const maxAttempts = 60; // 2 minutes max

      while (!completed && attempts < maxAttempts) {
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const statusRes = await fetch(`/api/render/${renderResult.id}`);
        if (!statusRes.ok) continue;
        
        const render = await statusRes.json();
        console.log(`[Upscale Attempt ${attempts}] Status: ${render.status}`);

        if (render.status === 'completed' && render.upscaled_image_url && 
            render.upscaled_image_url !== render.generated_image_url) {
          completed = true;
          setRenderResult(render);
          console.log('✓ Upscaling completed!');
        } else if (render.status === 'completed' && render.metadata?.upscale_error) {
          throw new Error(render.metadata.upscale_error);
        }
      }

      if (!completed) {
        console.warn('Upscaling timeout - check profile');
        alert('Upscaling is taking longer than expected. Check your profile to see the result.');
      }
    } catch (error) {
      console.error('Upscale error:', error);
      alert(error instanceof Error ? error.message : 'Upscaling failed');
    } finally {
      setIsUpscaling(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-white overflow-hidden">
      <StripedPattern className="absolute inset-0 [mask-image:radial-gradient(800px_circle_at_center,white,transparent)]" />
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/5 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold tracking-tighter" style={{ fontFamily: 'system-ui, -apple-system, sans-serif', letterSpacing: '-0.05em' }}>
              RENDERZ
            </span>
          </div>
          {session ? (
            <div className="flex items-center gap-3">
              <Link href="/profile">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="font-mono text-xs"
                >
                  {session.user.image ? (
                    <img 
                      src={session.user.image} 
                      alt="Profile" 
                      className="w-5 h-5 rounded-full object-cover mr-1"
                    />
                  ) : (
                    <User className="w-4 h-4 mr-1" />
                  )}
                  PROFILE
                </Button>
              </Link>
              <Button 
                variant="outline" 
                size="sm"
                className="font-mono text-xs"
                onClick={async () => {
                  await signOut();
                  window.location.reload();
                }}
              >
                <LogOut className="w-3 h-3 mr-1" />
                SIGN OUT
              </Button>
            </div>
          ) : (
            <Button 
              variant="outline" 
              className="font-mono text-xs"
              onClick={() => setShowAuthModal(true)}
            >
              SIGN IN
            </Button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-6 pt-32 pb-16">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Title Section */}
          <div className="text-center space-y-4">
            <h1 className="text-6xl font-bold tracking-tight">
              Your <AuroraText>AI</AuroraText> <AuroraText>rendering</AuroraText> assistant.
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Show concepts easily and get client approvals faster.
            </p>
          </div>

          {/* Affichage conditionnel : Résultat OU Chargement OU Formulaire */}
          {renderResult && renderResult.generated_image_url ? (
            /* ========== RÉSULTAT - REMPLACE LE FORMULAIRE ========== */
            <Card className="max-w-2xl mx-auto overflow-hidden bg-white/5 backdrop-blur-sm border border-border">
              <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="font-mono text-sm font-medium flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" />
                      RENDER GENERATED
                    </h3>
                    <p className="text-xs font-mono text-muted-foreground">
                      {renderResult.upscaled_image_url && renderResult.upscaled_image_url !== renderResult.generated_image_url
                        ? "4K upscaled · Ready for download"
                        : "Preview ready · Choose your next step"
                      }
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleNewGeneration}
                    className="font-mono text-xs"
                  >
                    NEW RENDER
                  </Button>
                </div>
                
                {/* Preview Image */}
                <div className="relative w-full aspect-square border border-white/10 overflow-hidden bg-white/5">
                  <img
                    src={renderResult.upscaled_image_url && renderResult.upscaled_image_url !== renderResult.generated_image_url
                      ? renderResult.upscaled_image_url
                      : renderResult.generated_image_url
                    }
                    alt="Rendered image"
                    className="w-full h-full object-contain"
                  />
                  {/* Status badge */}
                  <div className="absolute top-3 left-3 bg-background/90 backdrop-blur-sm px-3 py-1 rounded-none border border-border">
                    <p className="text-xs font-mono">
                      {renderResult.upscaled_image_url && renderResult.upscaled_image_url !== renderResult.generated_image_url
                        ? "4K UPSCALED"
                        : "PREVIEW"
                      }
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                {!renderResult.upscaled_image_url || renderResult.upscaled_image_url === renderResult.generated_image_url ? (
                  // Image générée mais pas encore upscalée
                  <div className="space-y-3">
                    {/* Status info */}
                    <div className="border border-border bg-muted/30 p-3">
                      <div className="flex items-start gap-3">
                        <div className="w-1 h-10 bg-black"></div>
                        <div className="flex-1 space-y-0.5 font-mono text-xs">
                          <p className="text-black font-medium">🎨 STANDARD QUALITY</p>
                          <p className="text-muted-foreground">
                            Like this result? Upscale to 4K or regenerate a new version.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons grid */}
                    <div className="grid grid-cols-2 gap-3">
                      {/* Regenerate button */}
                      <Button
                        variant="outline"
                        size="lg"
                        onClick={handleRegenerate}
                        disabled={isGenerating}
                        className="h-14 font-mono text-sm tracking-wider"
                      >
                        <RefreshCw className={`w-4 h-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
                        REGENERATE
                      </Button>

                      {/* Upscale button */}
                      <Button
                        size="lg"
                        onClick={handleUpscale}
                        disabled={isUpscaling}
                        className="h-14 font-mono text-sm tracking-wider !bg-[#000000] hover:!bg-[#1a1a1a]"
                      >
                        {isUpscaling ? (
                          <>
                            <Sparkles className="w-4 h-4 mr-2 animate-pulse" />
                            UPSCALING...
                          </>
                        ) : (
                          <>
                            <Wand2 className="w-4 h-4 mr-2" />
                            UPSCALE 4K
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Download standard version */}
                    <Button
                      asChild
                      variant="ghost"
                      size="sm"
                      className="w-full font-mono text-xs text-muted-foreground"
                    >
                      <a
                        href={renderResult.generated_image_url}
                        download="renderz-preview.png"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Download className="w-3 h-3 mr-2" />
                        DOWNLOAD STANDARD VERSION
                      </a>
                    </Button>
                  </div>
                ) : (
                  // Image upscalée - Afficher le bouton de téléchargement
                  <div className="space-y-4">
                    {/* Success status */}
                    <div className="border border-green-500/50 bg-green-500/10 p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-1 h-12 bg-green-500"></div>
                        <div className="flex-1 space-y-1 font-mono text-xs">
                          <p className="text-green-400 font-medium">✓ UPSCALING COMPLETE</p>
                          <p className="text-muted-foreground">
                            Maximum quality image available (4096x4096, ~15MB)
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Download 4K */}
                    <Button
                      asChild
                      size="lg"
                      className="w-full h-14 font-mono text-sm tracking-wider !bg-[#000000] hover:!bg-[#1a1a1a]"
                    >
                      <a
                        href={renderResult.upscaled_image_url}
                        download="renderz-4k-upscaled.png"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Download className="w-5 h-5 mr-2" />
                        DOWNLOAD 4K IMAGE
                      </a>
                    </Button>

                    {/* Both versions download */}
                    <div className="flex gap-3">
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="flex-1 font-mono text-xs"
                      >
                        <a
                          href={renderResult.generated_image_url}
                          download="renderz-standard.png"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Download className="w-3 h-3 mr-2" />
                          STANDARD
                        </a>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleNewGeneration}
                        className="flex-1 font-mono text-xs"
                      >
                        <RefreshCw className="w-3 h-3 mr-2" />
                        NEW RENDER
                      </Button>
                    </div>
                  </div>
                )}

                {/* Info footer */}
                <div className="flex items-center justify-center gap-4 text-xs font-mono text-muted-foreground pt-2 border-t border-border">
                  <span>GEMINI 2.5 FLASH</span>
                  <span>·</span>
                  <span>
                    {renderResult.upscaled_image_url && renderResult.upscaled_image_url !== renderResult.generated_image_url
                      ? "MAGNIFIC AI 4x"
                      : `${aspectRatio} · ~1024px`
                    }
                  </span>
                </div>
              </div>
            </Card>
          ) : isGenerating ? (
            /* ========== ÉCRAN DE CHARGEMENT ========== */
            <Card className="max-w-2xl mx-auto p-8 space-y-6 bg-white/5 backdrop-blur-[2px] border border-white">
              {/* Animation de chargement */}
              <div className="flex flex-col items-center justify-center py-16 space-y-8">
                {/* Loader animé */}
                <div className="relative">
                  <div className="w-24 h-24 border-4 border-border rounded-full"></div>
                  <div className="absolute inset-0 w-24 h-24 border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                  <Sparkles className="absolute inset-0 m-auto w-8 h-8 text-primary animate-pulse" />
                </div>

                {/* Status text */}
                <div className="text-center space-y-3">
                  <h3 className="text-xl font-bold tracking-tight">Generating...</h3>
                  <p className="text-sm text-muted-foreground">
                    Your render is being created.
                  </p>
                  <p className="text-xs text-muted-foreground font-mono">
                    ⏱️ This may take up to 10 minutes.
                  </p>
                </div>
              </div>

              {/* Separator */}
              <div className="border-t border-border"></div>

              {/* New render section */}
              <div className="text-center space-y-4">
                <p className="text-sm text-muted-foreground">
                  Your current render is not lost! It will be available in your{" "}
                  <Link href="/profile" className="text-primary hover:underline font-medium">
                    profile
                  </Link>{" "}
                  once completed.
                </p>
                <Button
                  variant="outline"
                  onClick={handleNewGeneration}
                  className="font-mono text-sm"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  CREATE NEW RENDER
                </Button>
              </div>
            </Card>
          ) : (
            /* ========== FORMULAIRE NORMAL ========== */
            <Card className="max-w-2xl mx-auto p-6 space-y-4 bg-white/5 backdrop-blur-[2px] border border-white">
              {/* Upload Zone - Images multiples */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-mono uppercase tracking-wider">
                    Reference Images
                  </label>
                  <span className="text-xs font-mono text-muted-foreground">
                    {uploadedImages.length} / {MAX_IMAGES}
                  </span>
                </div>

                {/* Images uploadées */}
                {uploadedImages.length > 0 && (
                  <div className="grid grid-cols-3 gap-3">
                    {uploadedImages.map((img) => {
                      const RoleIcon = ROLE_CONFIG[img.role].icon;
                      return (
                        <div key={img.id} className="relative group">
                          {/* Image preview */}
                          <div className="relative aspect-square border border-border overflow-hidden bg-muted/30">
                            <img
                              src={img.dataUrl}
                              alt={`${img.role} reference`}
                              className="w-full h-full object-cover"
                            />
                            {/* Overlay avec rôle */}
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                              <div className="flex items-center gap-1.5">
                                <RoleIcon className="w-3 h-3 text-white" />
                                <span className="text-xs font-mono text-white uppercase">
                                  {img.role}
                                </span>
                              </div>
                            </div>
                            {/* Bouton supprimer */}
                            <button
                              onClick={() => removeImage(img.id)}
                              className="absolute top-1 right-1 w-6 h-6 bg-black/70 hover:bg-red-600 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100"
                            >
                              <X className="w-3 h-3 text-white" />
                            </button>
                          </div>
                          {/* Sélecteur de rôle */}
                          <div className="mt-2 flex gap-1">
                            {(Object.keys(ROLE_CONFIG) as ImageRole[]).map((role) => (
                              <button
                                key={role}
                                onClick={() => changeImageRole(img.id, role)}
                                className={`
                                  flex-1 py-1 text-[10px] font-mono uppercase transition-all
                                  ${img.role === role 
                                    ? 'bg-primary text-primary-foreground' 
                                    : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                                  }
                                `}
                              >
                                {role}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}

                    {/* Zone d'ajout si pas encore à la limite */}
                    {uploadedImages.length < MAX_IMAGES && (
                      <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`
                          relative aspect-square border-2 border-dashed
                          transition-all duration-200 cursor-pointer
                          flex items-center justify-center
                          ${isDragging 
                            ? "border-primary bg-primary/5" 
                            : "border-border hover:border-primary/50"
                          }
                        `}
                      >
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleFileSelect}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <Plus className="w-6 h-6" />
                          <span className="text-xs font-mono">ADD</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Zone d'upload initiale (si aucune image) */}
                {uploadedImages.length === 0 && (
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`
                      relative border-2 border-dashed rounded-none p-12
                      transition-all duration-200 cursor-pointer
                      ${isDragging 
                        ? "border-primary bg-primary/5" 
                        : "border-border hover:border-primary/50"
                      }
                    `}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileSelect}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    
                    <div className="flex flex-col items-center justify-center space-y-4 text-center">
                      <div className="relative">
                        <div className="absolute inset-0 tech-gradient opacity-20 blur-xl"></div>
                        <Upload className="w-12 h-12 relative z-10" />
                      </div>
                      <div className="space-y-2">
                        <p className="text-lg font-medium">
                          Drop your reference images here
                        </p>
                        <p className="text-sm text-muted-foreground font-mono">
                          UP TO 3 IMAGES · MAIN + STYLE + REFERENCE
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Légende des rôles */}
                {uploadedImages.length > 0 && (
                  <div className="flex flex-wrap gap-4 text-xs font-mono text-muted-foreground pt-2">
                    <div className="flex items-center gap-1.5">
                      <ImageIcon className="w-3 h-3" />
                      <span>MAIN: primary content</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Palette className="w-3 h-3" />
                      <span>STYLE: visual style</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Layers className="w-3 h-3" />
                      <span>REF: additional context</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Aspect Ratio Selector */}
              <div className="space-y-3">
                <label className="text-sm font-mono uppercase tracking-wider">
                  Aspect Ratio
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {ASPECT_RATIOS.map((ratio) => (
                    <button
                      key={ratio.value}
                      type="button"
                      onClick={() => setAspectRatio(ratio.value)}
                      className={`
                        p-3 border-2 transition-all duration-200 text-center
                        ${aspectRatio === ratio.value 
                          ? "border-primary bg-primary/10" 
                          : "border-border hover:border-primary/50"
                        }
                      `}
                    >
                      <div className="text-xs font-mono font-bold">{ratio.label}</div>
                      <div className="text-[10px] text-muted-foreground font-mono mt-1">
                        {ratio.value}
                      </div>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground font-mono">
                  Output: {ASPECT_RATIOS.find(r => r.value === aspectRatio)?.resolution}
                </p>
              </div>

              {/* Prompt Input */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-mono uppercase tracking-wider">
                    Generation instructions
                  </label>
                  <span className="text-xs font-mono text-muted-foreground">
                    {prompt.length} / 500
                  </span>
                </div>
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value.slice(0, 500))}
                  placeholder="Describe the style, mood, and details you want in your photorealistic render..."
                  className="min-h-[120px] resize-none rounded-none font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground font-mono">
                  Example: "Photorealistic architectural render, golden hour lighting, modern materials"
                </p>
              </div>

              {/* Generate Button */}
              <Button
                onClick={handleGenerate}
                disabled={uploadedImages.length === 0 || !prompt.trim()}
                className="w-full h-14 font-mono text-sm tracking-wider !bg-[#000000] hover:!bg-[#1a1a1a] !opacity-100 transition-all"
              >
                <span className="flex items-center justify-center gap-2">
                  GENERATE RENDER
                  {uploadedImages.length > 1 && (
                    <span className="text-xs opacity-70">({uploadedImages.length} images)</span>
                  )}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </Button>
            </Card>
          )}

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

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          setShowAuthModal(false);
          // La génération sera lancée automatiquement via le useEffect
          // qui surveille session + pendingGeneration
        }}
      />
    </div>
  );
}

