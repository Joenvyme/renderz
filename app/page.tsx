"use client";

import { useState, useCallback, useEffect } from "react";
import { Upload, Sparkles, ArrowRight, Download, LogOut, User } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { AuroraText } from "@/components/ui/aurora-text";
import { StripedPattern } from "@/components/magicui/striped-pattern";
import { AuthModal } from "@/components/auth-modal";
import { useSession, signOut } from "@/lib/auth-client";

interface RenderResult {
  id: string;
  generated_image_url: string | null;
  upscaled_image_url: string | null;
  status: string;
}

// Clés localStorage pour persister les données
const STORAGE_KEYS = {
  IMAGE: "renderz_pending_image",
  PROMPT: "renderz_pending_prompt",
  RENDER_ID: "renderz_current_render_id",
};

export default function LandingPage() {
  const { data: session, isPending } = useSession();
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [renderResult, setRenderResult] = useState<RenderResult | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingGeneration, setPendingGeneration] = useState(false);
  const [currentRenderId, setCurrentRenderId] = useState<string | null>(null);

  // Fonction pour faire le polling d'un render
  const pollRenderStatus = async (renderId: string) => {
    setIsGenerating(true);
    setCurrentRenderId(renderId);
    localStorage.setItem(STORAGE_KEYS.RENDER_ID, renderId);

    try {
      let completed = false;
      let attempts = 0;
      const maxAttempts = 120; // 4 minutes max (120 * 2s)

      while (!completed && attempts < maxAttempts) {
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const statusRes = await fetch(`/api/render/${renderId}`);
        if (!statusRes.ok) {
          console.error('Status check failed:', statusRes.status);
          continue;
        }
        
        const render = await statusRes.json();
        console.log(`[Attempt ${attempts}] Status: ${render.status}, Generated: ${!!render.generated_image_url}, Upscaled: ${!!render.upscaled_image_url}`);

        if (render.status === 'completed') {
          completed = true;
          setRenderResult(render);
          localStorage.removeItem(STORAGE_KEYS.RENDER_ID);
          console.log('✓ Render completed!');
        } else if (render.status === 'failed') {
          localStorage.removeItem(STORAGE_KEYS.RENDER_ID);
          throw new Error('Render failed');
        }
        // Si on a déjà l'image générée, on peut l'afficher en preview
        else if (render.generated_image_url && !renderResult?.generated_image_url) {
          setRenderResult(render);
        }
      }

      if (!completed) {
        console.warn('Polling timeout - check profile for result');
        alert('La génération prend plus de temps que prévu. Vérifiez votre profil pour voir le résultat.');
      }
    } catch (error) {
      console.error('Polling error:', error);
    } finally {
      setIsGenerating(false);
      setCurrentRenderId(null);
    }
  };

  // Restaurer les données depuis localStorage au chargement
  useEffect(() => {
    const savedImage = localStorage.getItem(STORAGE_KEYS.IMAGE);
    const savedPrompt = localStorage.getItem(STORAGE_KEYS.PROMPT);
    const savedRenderId = localStorage.getItem(STORAGE_KEYS.RENDER_ID);
    
    if (savedImage) {
      setUploadedImage(savedImage);
    }
    if (savedPrompt) {
      setPrompt(savedPrompt);
    }
    
    // Si on a un render en cours, reprendre le polling
    if (savedRenderId && session) {
      console.log('Resuming polling for render:', savedRenderId);
      pollRenderStatus(savedRenderId);
    }
    // Si on a des données sauvegardées (mais pas de render en cours), marquer comme "en attente"
    else if (savedImage && savedPrompt && !savedRenderId) {
      setPendingGeneration(true);
    }
  }, [session]);

  // Lancer automatiquement la génération après connexion si des données étaient en attente
  useEffect(() => {
    if (session && pendingGeneration && uploadedImage && prompt.trim()) {
      setPendingGeneration(false);
      localStorage.removeItem(STORAGE_KEYS.IMAGE);
      localStorage.removeItem(STORAGE_KEYS.PROMPT);
      handleGenerate();
    }
  }, [session, pendingGeneration]);

  // Sauvegarder les données avant d'ouvrir le modal d'auth
  const saveAndShowAuth = () => {
    if (uploadedImage) {
      localStorage.setItem(STORAGE_KEYS.IMAGE, uploadedImage);
    }
    if (prompt) {
      localStorage.setItem(STORAGE_KEYS.PROMPT, prompt);
    }
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

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!uploadedImage || !prompt.trim()) return;
    
    // Vérifier l'authentification
    if (!session) {
      saveAndShowAuth();
      return;
    }
    
    // Nettoyer le localStorage des données pré-auth
    localStorage.removeItem(STORAGE_KEYS.IMAGE);
    localStorage.removeItem(STORAGE_KEYS.PROMPT);
    
    setIsGenerating(true);
    setRenderResult(null);

    try {
      // 1. Upload de l'image
      console.log('📤 Uploading image...');
      const blob = await fetch(uploadedImage).then(r => r.blob());
      const formData = new FormData();
      formData.append('file', blob, 'image.png');

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) {
        const errorData = await uploadRes.json().catch(() => ({}));
        console.error('Upload error:', errorData);
        throw new Error('Upload failed');
      }
      const { url: imageUrl } = await uploadRes.json();
      console.log('✓ Image uploaded:', imageUrl);

      // 2. Lancer la génération
      console.log('🚀 Starting generation...');
      const generateRes = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl, prompt }),
      });

      if (!generateRes.ok) {
        const errorData = await generateRes.json().catch(() => ({}));
        console.error('Generate error:', errorData);
        throw new Error('Generation failed');
      }
      const { renderId } = await generateRes.json();
      console.log('✓ Generation started, renderId:', renderId);

      // 3. Polling pour suivre le statut (avec persistance)
      await pollRenderStatus(renderId);

    } catch (error) {
      console.error('Error:', error);
      alert('Erreur lors de la génération. Vérifiez la console.');
      setIsGenerating(false);
    }
  };

  // Fonction pour lancer une nouvelle génération (reset le formulaire)
  const handleNewGeneration = () => {
    setRenderResult(null);
    setUploadedImage(null);
    setPrompt("");
    localStorage.removeItem(STORAGE_KEYS.IMAGE);
    localStorage.removeItem(STORAGE_KEYS.PROMPT);
    localStorage.removeItem(STORAGE_KEYS.RENDER_ID);
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
              <span className="text-xs font-mono text-muted-foreground hidden sm:inline">
                {session.user.email}
              </span>
              <Link href="/profile">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="font-mono text-xs"
                >
                  <User className="w-3 h-3 mr-1" />
                  PROFIL
                </Button>
              </Link>
              <Button 
                variant="outline" 
                size="sm"
                className="font-mono text-xs"
                onClick={() => signOut()}
              >
                <LogOut className="w-3 h-3 mr-1" />
                DÉCONNEXION
              </Button>
            </div>
          ) : (
            <Button 
              variant="outline" 
              className="font-mono text-xs"
              onClick={() => setShowAuthModal(true)}
            >
              SE CONNECTER
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
              Transformez vos croquis et références en rendus photoréalistes de qualité professionnelle en quelques secondes.
            </p>
          </div>

          {/* Chat Interface */}
          <Card className="max-w-2xl mx-auto p-6 space-y-4 bg-white/5 backdrop-blur-[2px] border border-white">
            {/* Upload Zone */}
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
                ${uploadedImage ? "bg-muted/30" : ""}
              `}
            >
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              
              {uploadedImage ? (
                <div className="space-y-4">
                  <div className="relative w-full h-64 bg-muted rounded-none overflow-hidden">
                    <img
                      src={uploadedImage}
                      alt="Uploaded"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <p className="text-center text-sm font-mono text-muted-foreground">
                    IMAGE CHARGÉE · CLIQUEZ POUR CHANGER
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center space-y-4 text-center">
                  <div className="relative">
                    <div className="absolute inset-0 tech-gradient opacity-20 blur-xl"></div>
                    <Upload className="w-12 h-12 relative z-10" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-lg font-medium">
                      Glissez votre image de référence
                    </p>
                    <p className="text-sm text-muted-foreground font-mono">
                      CROQUIS · DESSIN · PHOTO · RENDU 3D
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Prompt Input */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-mono uppercase tracking-wider">
                  Instructions de génération
                </label>
                <span className="text-xs font-mono text-muted-foreground">
                  {prompt.length} / 500
                </span>
              </div>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value.slice(0, 500))}
                placeholder="Décrivez le style, l'ambiance, les détails que vous souhaitez dans votre rendu hyperréaliste..."
                className="min-h-[120px] resize-none rounded-none font-mono text-sm"
                disabled={isGenerating}
              />
              <p className="text-xs text-muted-foreground font-mono">
                Exemple : "Photorealistic architectural render, golden hour lighting, modern materials"
              </p>
            </div>

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={!uploadedImage || !prompt.trim() || isGenerating}
              className="w-full h-14 font-mono text-sm tracking-wider !bg-[#000000] hover:!bg-[#1a1a1a] !opacity-100 transition-all"
            >
              <span className="flex items-center justify-center gap-2">
                {isGenerating ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-pulse" />
                    GÉNÉRATION EN COURS...
                  </>
                ) : (
                  <>
                    GÉNÉRER LE RENDU
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </span>
            </Button>

            {/* Info - Génération en cours */}
            {isGenerating && (
              <div className="border border-border p-4 bg-muted/30">
                <div className="flex items-start gap-3">
                  <div className="w-1 h-20 tech-gradient animate-pulse"></div>
                  <div className="flex-1 space-y-1 font-mono text-xs">
                    <p className="text-white">ÉTAPE 1/2 · GÉNÉRATION IA</p>
                    <p className="text-muted-foreground">🍌 Nano Banana (Google) en cours...</p>
                    <p className="text-muted-foreground mt-2">ÉTAPE 2/2 · UPSCALING</p>
                    <p className="text-muted-foreground">Magnific AI en attente...</p>
                    {currentRenderId && (
                      <p className="text-muted-foreground mt-2">
                        ID: {currentRenderId.slice(0, 8)}... · 
                        <Link href="/profile" className="text-primary hover:underline ml-1">
                          Voir dans le profil →
                        </Link>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Result Display */}
          {renderResult && (
            <Card className="overflow-hidden bg-white/5 backdrop-blur-sm border border-border">
              <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="font-mono text-sm font-medium">RENDU GÉNÉRÉ ✓</h3>
                    <p className="text-xs font-mono text-muted-foreground">
                      Aperçu 1024x1024 · Qualité maximale disponible ci-dessous
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNewGeneration}
                    className="font-mono text-xs"
                  >
                    NOUVEAU RENDU
                  </Button>
                </div>
                
                {/* Preview Image - Grande taille pour l'aperçu */}
                {renderResult.generated_image_url && (
                  <div className="space-y-4">
                    <div className="relative w-full aspect-square border border-white/10 overflow-hidden bg-white/5">
                      <img
                        src={renderResult.generated_image_url}
                        alt="Aperçu du rendu"
                        className="w-full h-full object-contain"
                      />
                      {/* Badge aperçu */}
                      <div className="absolute top-3 left-3 bg-background/90 backdrop-blur-sm px-3 py-1 rounded-none border border-border">
                        <p className="text-xs font-mono">APERÇU · 1024x1024</p>
                      </div>
                    </div>
                    
                    {/* Upscaling Status */}
                    {renderResult.upscaled_image_url && 
                     renderResult.upscaled_image_url !== renderResult.generated_image_url ? (
                      // Upscaling réussi
                      <div className="architectural-border bg-primary/5 p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-1 h-12 tech-gradient"></div>
                          <div className="flex-1 space-y-1 font-mono text-xs">
                            <p className="text-white font-medium">✓ UPSCALING TERMINÉ</p>
                            <p className="text-muted-foreground">
                              Image en qualité maximale disponible (4096x4096, ~15MB)
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : renderResult.status === 'processing' ? (
                      // Upscaling en cours
                      <div className="border border-border bg-muted/30 p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-1 h-12 tech-gradient animate-pulse"></div>
                          <div className="flex-1 space-y-1 font-mono text-xs">
                            <p className="text-white">⏳ UPSCALING EN COURS...</p>
                            <p className="text-muted-foreground">
                              Magnific AI traite votre image (30-60s)
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      // Pas d'upscaling ou échoué
                      <div className="border border-border bg-muted/30 p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-1 h-12 bg-muted"></div>
                          <div className="flex-1 space-y-1 font-mono text-xs">
                            <p className="text-white">ℹ️ QUALITÉ STANDARD</p>
                            <p className="text-muted-foreground">
                              Image disponible en résolution 1024x1024
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Main Download Button */}
                    <Button
                      asChild
                      size="lg"
                      className="w-full h-14 font-mono text-sm tracking-wider group relative overflow-hidden"
                    >
                      <a
                        href={
                          renderResult.upscaled_image_url && 
                          renderResult.upscaled_image_url !== renderResult.generated_image_url
                            ? renderResult.upscaled_image_url
                            : renderResult.generated_image_url
                        }
                        download={
                          renderResult.upscaled_image_url && 
                          renderResult.upscaled_image_url !== renderResult.generated_image_url
                            ? "renderz-4k-upscaled.png"
                            : "renderz-generated.png"
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <span className="absolute inset-0 tech-gradient opacity-0 group-hover:opacity-100 transition-opacity"></span>
                        <span className="relative z-10 flex items-center justify-center gap-2">
                          <Download className="w-5 h-5" />
                          {renderResult.upscaled_image_url && 
                           renderResult.upscaled_image_url !== renderResult.generated_image_url
                            ? "TÉLÉCHARGER EN QUALITÉ MAXIMALE (4K)"
                            : "TÉLÉCHARGER L'IMAGE"
                          }
                        </span>
                      </a>
                    </Button>

                    {/* Secondary info */}
                    <div className="flex items-center justify-center gap-6 text-xs font-mono text-muted-foreground">
                      <span>
                        {renderResult.upscaled_image_url && 
                         renderResult.upscaled_image_url !== renderResult.generated_image_url
                          ? "4096x4096 · ~15MB · PNG"
                          : "1024x1024 · ~2.5MB · PNG"
                        }
                      </span>
                      <span>·</span>
                      <span>
                        {renderResult.upscaled_image_url && 
                         renderResult.upscaled_image_url !== renderResult.generated_image_url
                          ? "MAGNIFIC AI UPSCALE 4x"
                          : "NANO BANANA"
                        }
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}

        </div>
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 z-50 bg-white/5 backdrop-blur-sm border-t border-border">
        <div className="container mx-auto px-6 h-12 flex items-center justify-center">
          <p className="text-xs font-mono text-muted-foreground">
            © 2026 RENDERZ · ARCHITECTURE + TECHNOLOGIE
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

