"use client";

import { useState, useCallback, useEffect } from "react";
import { Upload, Sparkles, ArrowRight, Download, LogOut, User, RefreshCw, Wand2, Check, X, Plus, Image as ImageIcon, Palette, Layers, Sofa, Zap } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { AuroraText } from "@/components/ui/aurora-text";
import { StripedPattern } from "@/components/magicui/striped-pattern";
import { AuthModal } from "@/components/auth-modal";
import { FurnitureCatalog } from "@/components/furniture-catalog";
import { BeforeAfterSlider } from "@/components/before-after-slider";
import { AnimatedBeamDemo } from "@/components/database-integration-demo";
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
  const [originalPrompt, setOriginalPrompt] = useState<string>("");
  const [modificationPrompt, setModificationPrompt] = useState<string>("");
  const [isReprompting, setIsReprompting] = useState(false);
  const [showUpscaleToast, setShowUpscaleToast] = useState(false);
  const [selectedFurniture, setSelectedFurniture] = useState<any[]>([]);
  const [showFurnitureCatalog, setShowFurnitureCatalog] = useState(false);
  const [showCatalogToast, setShowCatalogToast] = useState(false);

  // Fonction pour faire le polling d'un render
  const pollRenderStatus = async (renderId: string, isReprompt: boolean = false) => {
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
          setIsReprompting(false); // Réinitialiser aussi isReprompting
          setCurrentRenderId(null);
          
          // Puis mettre le résultat
          setRenderResult({
            id: render.id,
            generated_image_url: render.generated_image_url,
            upscaled_image_url: render.upscaled_image_url,
            status: render.status,
          });
          
          // Sauvegarder le prompt original pour le reprompt suivant
          if (prompt && !originalPrompt) {
            setOriginalPrompt(prompt);
          }
          
          // Si c'était un reprompt, réinitialiser le prompt de modification
          // pour permettre un nouveau reprompt
          if (isReprompt) {
            setModificationPrompt("");
          }
          
          console.log('✅ States updated! isGenerating=false, isReprompting=false, renderResult set');
          return; // Sortir immédiatement
        }
        
        // ❌ RENDER ÉCHOUÉ
        if (render.status === 'failed') {
          console.error('❌ Render failed');
          localStorage.removeItem(STORAGE_KEYS.RENDER_ID);
          setIsGenerating(false);
          setIsReprompting(false); // Réinitialiser aussi isReprompting en cas d'erreur
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
    setIsReprompting(false); // Réinitialiser aussi isReprompting en cas de timeout
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

  // Fermer automatiquement le toast après 4 secondes
  useEffect(() => {
    if (showUpscaleToast) {
      const timer = setTimeout(() => {
        setShowUpscaleToast(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [showUpscaleToast]);

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
    
    // Sauvegarder le prompt original pour le reprompt
    if (prompt && !originalPrompt) {
      setOriginalPrompt(prompt);
    }

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

      // 2. Enrichir le prompt avec les meubles sélectionnés
      let enhancedPrompt = prompt;
      if (selectedFurniture.length > 0) {
        const furnitureDescriptions = selectedFurniture
          .map(item => item.promptEnhancement)
          .join(', ');
        enhancedPrompt = `${prompt}. Include these furniture items: ${furnitureDescriptions}`;
        console.log('🪑 Enhanced prompt with furniture:', selectedFurniture.length, 'items');
      }

      // 3. Lancer la génération avec toutes les images
      console.log('🚀 Starting generation with', uploadedUrls.length, 'image(s)...');
      
      const images = uploadedUrls.map(item => ({ url: item.url, role: item.role }));
      
      const generateRes = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images, prompt: enhancedPrompt, aspectRatio }),
      });

      const generateData = await generateRes.json();

      if (!generateRes.ok) {
        console.error('Generate error:', generateData);
        // Afficher simplement le message d'erreur
        setIsGenerating(false);
        const errorMessage = generateData.message || generateData.error || 'Generation failed';
        alert(errorMessage);
        return;
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
    setOriginalPrompt("");
    setModificationPrompt("");
    setIsReprompting(false);
    localStorage.removeItem(STORAGE_KEYS.IMAGES);
    localStorage.removeItem(STORAGE_KEYS.PROMPT);
    localStorage.removeItem(STORAGE_KEYS.RENDER_ID);
    localStorage.removeItem(STORAGE_KEYS.ASPECT_RATIO);
  };

  // Fonction pour régénérer avec les mêmes paramètres
  const handleRegenerate = () => {
    setRenderResult(null);
    setIsUpscaling(false);
    setModificationPrompt("");
    handleGenerate();
  };

  // Fonction pour reprompter avec une modification spécifique (bonnes pratiques Gemini 3)
  // Utilise le rendu généré comme référence principale et applique la modification
  const handleReprompt = async () => {
    if (!modificationPrompt.trim()) return;
    if (!renderResult?.generated_image_url) {
      alert("No generated image to modify");
      return;
    }
    if (!session) {
      alert("Please sign in to generate renders");
      return;
    }

    // IMPORTANT: Sauvegarder l'URL de l'image générée AVANT de la mettre à null
    const currentGeneratedImageUrl = renderResult.generated_image_url;
    
    setIsReprompting(true);
    setRenderResult(null);
    setIsUpscaling(false);

    try {
      // Utiliser le rendu généré comme image principale (référence)
      // Le prompt de modification est concis et direct (bonnes pratiques Gemini 3)
      const modificationPromptText = modificationPrompt.trim();
      
      // Construire le tableau d'images avec le rendu généré comme référence principale
      const images: { url: string; role: ImageRole }[] = [
        { url: currentGeneratedImageUrl, role: 'main' }
      ];

      // Optionnellement, ajouter les images originales comme références supplémentaires
      // (limité à 2 images supplémentaires pour rester sous la limite de 3)
      if (uploadedImages.length > 0 && uploadedImages.length <= 2) {
        const uploadedUrls: { url: string; role: ImageRole }[] = [];
        
        for (const img of uploadedImages) {
          const blob = await fetch(img.dataUrl).then(r => r.blob());
          const formData = new FormData();
          formData.append('file', blob, `image-${img.role}.png`);

          const uploadRes = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });

          if (uploadRes.ok) {
            const uploadData = await uploadRes.json();
            uploadedUrls.push({ url: uploadData.url, role: img.role });
          }
        }

        // Ajouter les images originales comme références (pas comme main)
        uploadedUrls.forEach(img => {
          if (img.role !== 'main') {
            images.push({ url: img.url, role: img.role });
          }
        });
      }

      console.log('🔄 Reprompt: Using generated image as main reference');
      console.log(`   Modification: ${modificationPromptText}`);
      console.log(`   Total images: ${images.length}`);

      // Lancer la génération avec le rendu généré comme référence et la modification
      const generateRes = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          images, 
          prompt: modificationPromptText, // Prompt concis : juste la modification
          aspectRatio 
        }),
      });

      const generateData = await generateRes.json();

      if (!generateRes.ok) {
        if (generateRes.status === 403 && generateData.maxAllowed) {
          alert(`Limit reached! You have used ${generateData.currentCount}/${generateData.maxAllowed} renders.`);
          setIsReprompting(false);
          return;
        }
        throw new Error(generateData.message || 'Reprompt failed');
      }
      
      const { renderId } = generateData;
      console.log('✓ Reprompt started, renderId:', renderId);

      // Mettre à jour le prompt original pour la prochaine modification
      const newPrompt = `${originalPrompt || prompt}. ${modificationPromptText}`;
      setPrompt(newPrompt);
      setOriginalPrompt(newPrompt);
      
      // Ne pas réinitialiser modificationPrompt ici, on le fera après le polling réussi
      // Cela permet de garder le texte si l'utilisateur veut modifier à nouveau

      // Polling pour suivre le statut (indiquer que c'est un reprompt)
      await pollRenderStatus(renderId, true);

    } catch (error) {
      console.error('Reprompt error:', error);
      alert(error instanceof Error ? error.message : 'Error during reprompt.');
      setIsReprompting(false);
    }
  };

  // Fonction pour upscaler l'image générée
  const handleUpscale = async () => {
    // TEMPORAIREMENT DÉSACTIVÉ - Afficher le toast "bientôt disponible"
    setShowUpscaleToast(true);
    
    // Code original commenté pour référence
    /*
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
        // Afficher simplement le message d'erreur
        setIsUpscaling(false);
        const errorMessage = errorData.message || errorData.error || 'Upscaling failed';
        alert(errorMessage);
        return;
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
    */
  };

  return (
    <>
      {/* Section 1: Hero avec fond à rayures (plein écran) */}
      <div className="relative min-h-screen bg-white overflow-hidden">
        <StripedPattern className="absolute inset-0 [mask-image:radial-gradient(800px_circle_at_center,white,transparent)]" />
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-white/5 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl sm:text-2xl font-bold tracking-tighter" style={{ fontFamily: "'Funnel Display', system-ui, sans-serif", letterSpacing: '-0.05em' }}>
              RENDERZ
            </span>
          </div>
          {session ? (
            <div className="flex items-center gap-1.5 sm:gap-3">
              <Link href="/profile">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="font-mono text-[10px] sm:text-xs px-2 sm:px-3"
                >
                  {session.user.image ? (
                    <img 
                      src={session.user.image} 
                      alt="Profile" 
                      className="w-4 h-4 sm:w-5 sm:h-5 rounded-full object-cover sm:mr-1"
                    />
                  ) : (
                    <User className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
                  )}
                  <span className="hidden sm:inline">PROFILE</span>
                </Button>
              </Link>
              <Button 
                variant="outline" 
                size="sm"
                className="font-mono text-[10px] sm:text-xs px-2 sm:px-3"
                onClick={async () => {
                  await signOut();
                  window.location.reload();
                }}
              >
                <LogOut className="w-3 h-3 sm:mr-1" />
                <span className="hidden sm:inline">SIGN OUT</span>
              </Button>
            </div>
          ) : (
            <Button 
              variant="outline" 
              className="font-mono text-[10px] sm:text-xs px-3 sm:px-4"
              onClick={() => setShowAuthModal(true)}
            >
              SIGN IN
            </Button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-2 sm:px-4 pt-32 sm:pt-40 lg:pt-48 pb-16">
        <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">
          {/* Title Section */}
          <div className="text-center space-y-4 sm:space-y-6">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl xl:text-7xl 2xl:text-8xl font-bold tracking-tight whitespace-normal sm:whitespace-nowrap px-2">
              Your <AuroraText>AI</AuroraText> <AuroraText>rendering</AuroraText> assistant.
            </h1>
            <p className="text-lg sm:text-xl lg:text-2xl xl:text-3xl 2xl:text-4xl font-semibold text-black text-center" style={{ textShadow: '0 2px 8px rgba(255,255,255,0.6), 0 4px 16px rgba(255,255,255,0.5), 0 0 4px rgba(255,255,255,0.4)' }}>
              Show concepts easily and get client approvals faster.
            </p>
          </div>
          
          {/* Espacement supplémentaire avant le formulaire */}
          <div className="pt-4 sm:pt-6 lg:pt-8"></div>

          {/* Affichage conditionnel : Résultat OU Chargement OU Formulaire */}
          {renderResult && renderResult.generated_image_url ? (
            /* ========== RÉSULTAT - REMPLACE LE FORMULAIRE ========== */
            <Card className="max-w-2xl mx-auto overflow-hidden bg-white/5 backdrop-blur-sm border border-border">
              <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
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
                    <div className="border border-border bg-muted/30 p-2.5 sm:p-3">
                      <div className="flex items-start gap-2 sm:gap-3">
                        <div className="w-0.5 sm:w-1 h-8 sm:h-10 bg-black flex-shrink-0"></div>
                        <div className="flex-1 space-y-0.5 font-mono text-[10px] sm:text-xs">
                          <p className="text-black font-medium">🎨 STANDARD QUALITY</p>
                          <p className="text-muted-foreground">
                            Like this result? Upscale to 4K or regenerate a new version.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                      {/* Regenerate button */}
                      <Button
                        variant="outline"
                        size="lg"
                        onClick={handleRegenerate}
                        disabled={isGenerating}
                        className="h-12 sm:h-14 font-mono text-xs sm:text-sm tracking-wider"
                      >
                        <RefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 sm:mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
                        <span className="ml-1 sm:ml-0">REGENERATE</span>
                      </Button>

                      {/* Upscale button - Temporairement désactivé */}
                      <Button
                        size="lg"
                        onClick={handleUpscale}
                        className="h-12 sm:h-14 font-mono text-xs sm:text-sm tracking-wider !bg-[#000000] hover:!bg-[#1a1a1a] cursor-pointer"
                      >
                        <Wand2 className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                        <span className="ml-1 sm:ml-0">UPSCALE 4K</span>
                      </Button>
                    </div>

                    {/* Download standard version */}
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="w-full font-mono text-[10px] sm:text-xs h-9 sm:h-10 border-2 border-border hover:bg-muted/50 hover:border-primary/50 transition-colors"
                    >
                      <a
                        href={renderResult.generated_image_url}
                        download="renderz-preview.png"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Download className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1.5 sm:mr-2" />
                        <span className="hidden sm:inline">DOWNLOAD STANDARD VERSION</span>
                        <span className="sm:hidden">DOWNLOAD</span>
                      </a>
                    </Button>

                    {/* Reprompt section - Modifier le rendu généré */}
                    <div className="space-y-2 pt-2 border-t border-border">
                      <label className="text-[10px] sm:text-xs font-mono text-muted-foreground">
                        Modify this render:
                      </label>
                      <Textarea
                        value={modificationPrompt}
                        onChange={(e) => setModificationPrompt(e.target.value)}
                        placeholder="e.g., make it more vibrant, change lighting to sunset, add more details..."
                        className="min-h-[50px] sm:min-h-[60px] resize-none rounded-none font-mono text-[10px] sm:text-xs"
                        disabled={isReprompting || isGenerating}
                      />
                      <Button
                        onClick={handleReprompt}
                        disabled={!modificationPrompt.trim() || isReprompting || isGenerating}
                        size="sm"
                        className="w-full font-mono text-[10px] sm:text-xs h-9 sm:h-10 !bg-[#000000] hover:!bg-[#1a1a1a]"
                      >
                        {isReprompting ? (
                          <>
                            <RefreshCw className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1.5 sm:mr-2 animate-spin" />
                            <span className="hidden sm:inline">APPLYING MODIFICATION...</span>
                            <span className="sm:hidden">APPLYING...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1.5 sm:mr-2" />
                            <span className="hidden sm:inline">APPLY MODIFICATION</span>
                            <span className="sm:hidden">APPLY</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  // Image upscalée - Afficher le bouton de téléchargement
                  <div className="space-y-3 sm:space-y-4">
                    {/* Success status */}
                    <div className="border border-green-500/50 bg-green-500/10 p-3 sm:p-4">
                      <div className="flex items-start gap-2 sm:gap-3">
                        <div className="w-0.5 sm:w-1 h-10 sm:h-12 bg-green-500 flex-shrink-0"></div>
                        <div className="flex-1 space-y-0.5 sm:space-y-1 font-mono text-[10px] sm:text-xs">
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
                      className="w-full h-12 sm:h-14 font-mono text-xs sm:text-sm tracking-wider !bg-[#000000] hover:!bg-[#1a1a1a]"
                    >
                      <a
                        href={renderResult.upscaled_image_url}
                        download="renderz-4k-upscaled.png"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Download className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" />
                        <span className="hidden sm:inline">DOWNLOAD 4K IMAGE</span>
                        <span className="sm:hidden">DOWNLOAD 4K</span>
                      </a>
                    </Button>

                    {/* Both versions download */}
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="flex-1 font-mono text-[10px] sm:text-xs h-9 sm:h-10"
                      >
                        <a
                          href={renderResult.generated_image_url}
                          download="renderz-standard.png"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Download className="w-2.5 h-2.5 sm:w-3 sm:h-3 sm:mr-1.5 lg:mr-2" />
                          <span className="ml-1 sm:ml-0">STANDARD</span>
                        </a>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleNewGeneration}
                        className="flex-1 font-mono text-[10px] sm:text-xs h-9 sm:h-10"
                      >
                        <RefreshCw className="w-2.5 h-2.5 sm:w-3 sm:h-3 sm:mr-1.5 lg:mr-2" />
                        <span className="ml-1 sm:ml-0">NEW RENDER</span>
                      </Button>
                    </div>
                  </div>
                )}

                {/* Info footer */}
                <div className="flex items-center justify-center gap-2 sm:gap-4 text-[10px] sm:text-xs font-mono text-muted-foreground pt-2 border-t border-border">
                  <span>GEMINI 3 PRO</span>
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
                <div className="text-center space-y-2 sm:space-y-3">
                  <h3 className="text-lg sm:text-xl font-bold tracking-tight">Generating...</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Your render is being created.
                  </p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground font-mono">
                    ⏱️ This may take up to 10 minutes.
                  </p>
                </div>
              </div>

              {/* Separator */}
              <div className="border-t border-border"></div>

              {/* New render section */}
              <div className="text-center space-y-3 sm:space-y-4">
                <p className="text-xs sm:text-sm text-muted-foreground px-2">
                  Your current render is not lost! It will be available in your{" "}
                  <Link href="/profile" className="text-primary hover:underline font-medium">
                    profile
                  </Link>{" "}
                  once completed.
                </p>
                <Button
                  variant="outline"
                  onClick={handleNewGeneration}
                  className="font-mono text-xs sm:text-sm h-9 sm:h-10"
                >
                  <Upload className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                  <span className="hidden sm:inline">CREATE NEW RENDER</span>
                  <span className="sm:hidden">NEW RENDER</span>
                </Button>
              </div>
            </Card>
          ) : (
            /* ========== FORMULAIRE NORMAL ========== */
            <Card className="max-w-2xl mx-auto p-4 sm:p-6 space-y-4 bg-white/20 backdrop-blur-sm gradient-shadow">
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
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
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
                          <div className="mt-1.5 sm:mt-2 flex gap-0.5 sm:gap-1">
                            {(Object.keys(ROLE_CONFIG) as ImageRole[]).map((role) => (
                              <button
                                key={role}
                                onClick={() => changeImageRole(img.id, role)}
                                className={`
                                  flex-1 py-0.5 sm:py-1 text-[9px] sm:text-[10px] font-mono uppercase transition-all
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
                        <div className="flex flex-col items-center gap-1.5 sm:gap-2 text-muted-foreground">
                          <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
                          <span className="text-[10px] sm:text-xs font-mono">ADD</span>
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
                      relative border border-dashed rounded-lg p-8 sm:p-12
                      transition-all duration-200 cursor-pointer
                      ${isDragging 
                        ? "border-primary bg-primary/5" 
                        : "border-border/90 hover:border-primary/50 bg-muted/20 hover:bg-muted/60"
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
                    
                    <div className="flex flex-col items-center justify-center space-y-4 sm:space-y-5 text-center">
                      {/* Icône Upload unique */}
                      <div className="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-background/60 backdrop-blur-sm border border-border/50">
                        <Upload className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground" />
                      </div>
                      
                      {/* Texte descriptif */}
                      <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto">
                        Add sketch, draw, pictures anything you want to start working with
                      </p>
                    </div>
                  </div>
                )}

                {/* Légende des rôles */}
                {uploadedImages.length > 0 && (
                  <div className="flex flex-wrap gap-2 sm:gap-4 text-[10px] sm:text-xs font-mono text-muted-foreground pt-2">
                    <div className="flex items-center gap-1 sm:gap-1.5">
                      <ImageIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                      <span>MAIN: primary content</span>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-1.5">
                      <Palette className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                      <span>STYLE: visual style</span>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-1.5">
                      <Layers className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                      <span>REF: additional context</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Afficher le reste du formulaire uniquement si au moins une image est uploadée */}
              {uploadedImages.length > 0 && (
                <>
                  {/* Prompt Input */}
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs sm:text-sm font-mono uppercase tracking-wider">
                        Generation instructions
                      </label>
                      <span className="text-[10px] sm:text-xs font-mono text-muted-foreground">
                        {prompt.length} / 500
                      </span>
                    </div>
                    <Textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value.slice(0, 500))}
                      placeholder="Describe the style, mood, and details you want in your photorealistic render..."
                      className="min-h-[100px] sm:min-h-[120px] resize-none rounded-none font-mono text-xs sm:text-sm"
                    />
                    <p className="text-[10px] sm:text-xs text-muted-foreground font-mono">
                      Example: "Photorealistic architectural render, golden hour lighting, modern materials"
                    </p>
                  </div>

                  {/* Aspect Ratio Selector */}
                  <div className="space-y-2 sm:space-y-3">
                    <label className="text-xs sm:text-sm font-mono uppercase tracking-wider">
                      Aspect Ratio
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 sm:gap-2">
                      {ASPECT_RATIOS.map((ratio) => (
                        <button
                          key={ratio.value}
                          type="button"
                          onClick={() => setAspectRatio(ratio.value)}
                          className={`
                            p-1.5 sm:p-2 lg:p-3 border-2 transition-all duration-200 text-center
                            ${aspectRatio === ratio.value 
                              ? "border-primary bg-primary/10" 
                              : "border-border hover:border-primary/50"
                            }
                          `}
                        >
                          <div className="text-[9px] sm:text-[10px] lg:text-xs font-mono font-bold">{ratio.label}</div>
                          <div className="text-[8px] sm:text-[9px] lg:text-[10px] text-muted-foreground font-mono mt-0.5 sm:mt-1">
                            {ratio.value}
                          </div>
                        </button>
                      ))}
                    </div>
                    <p className="text-[9px] sm:text-[10px] lg:text-xs text-muted-foreground font-mono">
                      Output: {ASPECT_RATIOS.find(r => r.value === aspectRatio)?.resolution}
                    </p>
                  </div>

                  {/* Furniture Catalog */}
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs sm:text-sm font-mono uppercase tracking-wider">
                        Furniture Catalog
                      </label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Afficher le toast "bientôt disponible" au lieu d'ouvrir le catalogue
                          setShowCatalogToast(true);
                          // Ne pas ouvrir le catalogue
                          // setShowFurnitureCatalog(!showFurnitureCatalog);
                        }}
                        className="font-mono text-[10px] sm:text-xs h-7 sm:h-8 lg:h-9"
                      >
                        <Sofa className="w-2.5 h-2.5 sm:w-3 sm:h-3 sm:mr-1.5 lg:mr-2" />
                        <span className="hidden sm:inline">
                          {showFurnitureCatalog ? "HIDE" : "BROWSE"}
                        </span>
                        <span className="sm:hidden">{showFurnitureCatalog ? "HIDE" : "CATALOG"}</span>
                        {selectedFurniture.length > 0 && (
                          <span className="ml-1 sm:ml-1.5 lg:ml-2 px-1 sm:px-1.5 py-0.5 bg-primary text-primary-foreground text-[8px] sm:text-[9px] lg:text-[10px] rounded">
                            {selectedFurniture.length}
                          </span>
                        )}
                      </Button>
                    </div>
                    {showFurnitureCatalog && (
                      <div className="border border-border bg-white/5 p-3 sm:p-4 max-h-[300px] sm:max-h-[400px] overflow-y-auto">
                        <FurnitureCatalog
                          selectedItems={selectedFurniture}
                          onSelectionChange={setSelectedFurniture}
                        />
                      </div>
                    )}
                    {selectedFurniture.length > 0 && !showFurnitureCatalog && (
                      <div className="flex flex-wrap gap-1.5 sm:gap-2">
                        {selectedFurniture.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center gap-1.5 sm:gap-2 px-1.5 sm:px-2 py-0.5 sm:py-1 bg-muted/50 border border-border text-[10px] sm:text-xs font-mono"
                          >
                            <span className="line-clamp-1">{item.name}</span>
                            <button
                              onClick={() => setSelectedFurniture(selectedFurniture.filter(f => f.id !== item.id))}
                              className="hover:text-red-500 flex-shrink-0"
                            >
                              <X className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Generate Button */}
                  <Button
                    onClick={handleGenerate}
                    disabled={uploadedImages.length === 0 || !prompt.trim()}
                    className="w-full h-12 sm:h-14 font-mono text-xs sm:text-sm tracking-wider !bg-[#000000] hover:!bg-[#1a1a1a] !opacity-100 transition-all"
                  >
                    <span className="flex items-center justify-center gap-1.5 sm:gap-2">
                      <span className="hidden sm:inline">GENERATE RENDER</span>
                      <span className="sm:hidden">GENERATE</span>
                      {uploadedImages.length > 1 && (
                        <span className="text-[10px] sm:text-xs opacity-70">({uploadedImages.length})</span>
                      )}
                      <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </Button>
                </>
              )}
            </Card>
          )}

        </div>
      </main>
      </div>

      {/* Section 2: Landing page avec fond blanc */}
      <section className="bg-white py-16 sm:py-24">
        <div className="container mx-auto px-3 sm:px-6">
          <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
            <div className="text-center space-y-2 mb-8 sm:mb-12">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight text-black">
                Transform your <AuroraText>visions</AuroraText> into reality
              </h2>
            </div>
            
            <div className="max-w-4xl mx-auto">
              <BeforeAfterSlider
                beforeImage="/exemple-render.jpeg"
                afterImage="/exemple-draw.png"
                beforeLabel="Original"
                afterLabel="AI Render"
                className="w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Database Integration */}
      <section className="bg-white py-16 sm:py-24">
        <div className="container mx-auto px-3 sm:px-6">
          <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
            <div className="text-center space-y-2 mb-8 sm:mb-12">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight text-black">
                Integrate your <AuroraText>database</AuroraText> into renders
              </h2>
              <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto">
                Connect your furniture catalog and automatically enrich your prompts
              </p>
            </div>
            
            <div className="max-w-4xl mx-auto">
              <AnimatedBeamDemo />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-border">
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

      {/* Toast "Bientôt disponible" pour le catalogue */}
      {showCatalogToast && (
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
    </>
  );
}

