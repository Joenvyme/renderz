"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Upload, Sparkles, ArrowRight, Download, LogOut, User, RefreshCw, Wand2, Check, X, Plus, Image as ImageIcon, Palette, Layers, Sofa, Zap } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { AuroraText } from "@/components/ui/aurora-text";

import { AuthModal } from "@/components/auth-modal";
import { FurnitureCatalog } from "@/components/furniture-catalog";
import { BeforeAfterSlider } from "@/components/before-after-slider";

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
  const router = useRouter();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
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
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [isSubmittingContact, setIsSubmittingContact] = useState(false);
  const [contactSuccess, setContactSuccess] = useState(false);
  const [contactError, setContactError] = useState("");
  const [showFurnitureCatalog, setShowFurnitureCatalog] = useState(false);
  const [showCatalogToast, setShowCatalogToast] = useState(false);

  const heroRef = useRef<HTMLDivElement>(null);

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

      // Store render ID and redirect to studio
      localStorage.setItem(STORAGE_KEYS.RENDER_ID, renderId);
      router.push(`/profile?studio=${renderId}`);

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

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingContact(true);
    setContactError("");
    setContactSuccess(false);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: contactName,
          email: contactEmail,
          phone: contactPhone,
          message: contactMessage,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error sending message');
      }

      setContactSuccess(true);
      setContactName("");
      setContactEmail("");
      setContactPhone("");
      setContactMessage("");
      
      // Réinitialiser le message de succès après 5 secondes
      setTimeout(() => setContactSuccess(false), 5000);
    } catch (error) {
      setContactError(error instanceof Error ? error.message : 'Error sending message');
    } finally {
      setIsSubmittingContact(false);
    }
  };

  return (
    <div ref={scrollContainerRef} className="h-screen overflow-y-auto snap-y snap-mandatory scroll-smooth">
      {/* Section 1: Hero with cinematic sketch → render crossfade */}
      <div
        ref={heroRef}
        className="relative min-h-screen bg-black overflow-hidden snap-start"
      >
        <style>{`
          @keyframes heroZoom {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.06); }
          }
          @keyframes heroFade {
            0%, 8% { opacity: 0; }
            28%, 58% { opacity: 1; }
            78%, 100% { opacity: 0; }
          }
        `}</style>
        {/* Sketch layer (base, always present) */}
        <img
          src="/Hero image – 1.png"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
          draggable={false}
          style={{ animation: 'heroZoom 14s ease-in-out infinite' }}
        />
        <div className="absolute inset-0 bg-white/20 pointer-events-none" />
        {/* Render layer (fades in and out) */}
        <img
          src="/Hero image – 2.png"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
          draggable={false}
          style={{ animation: 'heroFade 14s ease-in-out infinite, heroZoom 14s ease-in-out infinite' }}
        />
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-md border-b border-border">
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
                  <span className="hidden sm:inline">DASHBOARD</span>
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
      <main className={`relative z-10 flex flex-col items-center justify-center min-h-screen px-2 sm:px-4 transition-all duration-700 ${uploadedImages.length > 0 ? "mt-0" : "-mt-10 sm:-mt-14"}`}>
        {/* Hero text - fades out when images uploaded */}
        <div
          className={`text-center space-y-4 sm:space-y-6 transition-all duration-700 ease-out ${
            uploadedImages.length > 0
              ? "opacity-0 scale-95 max-h-0 overflow-hidden pointer-events-none mb-0"
              : "opacity-100 scale-100 max-h-[500px] mb-10 sm:mb-14"
          }`}
        >
          <div className="flex justify-center">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 text-xs sm:text-sm font-medium bg-white/70 border border-border/70 text-black backdrop-blur-sm">
              Made with heart in the Swiss mountains 🇨🇭
            </span>
          </div>
          <h1 className="text-3xl sm:text-5xl lg:text-6xl xl:text-7xl 2xl:text-8xl font-bold tracking-tight whitespace-normal sm:whitespace-nowrap px-2">
            Your <AuroraText>AI</AuroraText> <AuroraText>rendering</AuroraText> assistant.
          </h1>
          <p className="text-lg sm:text-xl lg:text-2xl xl:text-3xl 2xl:text-4xl font-semibold text-black text-center" style={{ textShadow: '0 2px 8px rgba(255,255,255,0.6), 0 4px 16px rgba(255,255,255,0.5), 0 0 4px rgba(255,255,255,0.4)' }}>
            Show concepts easily and get client approvals faster.
          </p>
        </div>

        {/* Upload & Form area */}
        <div className={`w-full transition-all duration-700 ease-out ${
          uploadedImages.length > 0
            ? "max-w-2xl"
            : "max-w-xl"
        }`}>
          {/* Minimal upload zone when no images */}
          {uploadedImages.length === 0 && !isGenerating && !renderResult && (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`
                relative transition-all duration-200 cursor-pointer
                bg-white/70 backdrop-blur-sm hover:bg-white/80 border border-border/60 hover:border-black/40 p-3 sm:p-4 gradient-shadow
                ${isDragging ? "border-primary bg-primary/5" : ""}
              `}
            >
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex items-center justify-center gap-4 sm:gap-5">
                {/* Stacked photos effect */}
                <div className="relative w-14 h-14 sm:w-16 sm:h-16">
                  <div className="absolute inset-0 border border-border/50 bg-white rounded-sm shadow-sm" style={{ transform: 'rotate(-12deg)' }} />
                  <div className="absolute inset-0 border border-border/50 bg-white rounded-sm shadow-sm" style={{ transform: 'rotate(6deg)' }} />
                  <div className="absolute inset-0 border border-border/60 bg-white rounded-sm shadow-sm flex items-center justify-center" style={{ transform: 'rotate(-2deg)' }}>
                    <ImageIcon className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground/35" />
                  </div>
                </div>
                {/* Add button */}
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-sm bg-black text-white flex items-center justify-center shadow-md pointer-events-none">
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
              </div>
            </div>
          )}

          {/* Expanded form when images are uploaded */}
          {uploadedImages.length > 0 && !isGenerating && !(renderResult && renderResult.generated_image_url) && (
            <Card className="p-4 sm:p-6 space-y-4 bg-white/40 backdrop-blur-md border border-border/50 gradient-shadow animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Uploaded images grid */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                    Reference Images
                  </label>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    {uploadedImages.length} / {MAX_IMAGES}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                  {uploadedImages.map((img) => {
                    const RoleIcon = ROLE_CONFIG[img.role].icon;
                    return (
                      <div key={img.id} className="relative group">
                        <div className="relative aspect-square border border-border overflow-hidden bg-muted/30">
                          <img
                            src={img.dataUrl}
                            alt={`${img.role} reference`}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                            <div className="flex items-center gap-1.5">
                              <RoleIcon className="w-3 h-3 text-white" />
                              <span className="text-xs font-mono text-white uppercase">
                                {img.role}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => removeImage(img.id)}
                            className="absolute top-1 right-1 w-6 h-6 bg-black/70 hover:bg-red-600 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100"
                          >
                            <X className="w-3 h-3 text-white" />
                          </button>
                        </div>
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
              </div>

              {/* Prompt */}
              <div className="space-y-2 sm:space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                    Generation instructions
                  </label>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    {prompt.length} / 500
                  </span>
                </div>
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value.slice(0, 500))}
                  placeholder="Describe the style, mood, and details you want in your photorealistic render..."
                  className="min-h-[100px] sm:min-h-[120px] resize-none rounded-none font-mono text-xs sm:text-sm"
                />
              </div>

              {/* Aspect Ratio */}
              <div className="space-y-2 sm:space-y-3">
                <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
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
                  <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                    Furniture Catalog
                  </label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCatalogToast(true)}
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
                  <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
                </span>
              </Button>
            </Card>
          )}

          {/* Loading state */}
          {isGenerating && (
            <Card className="p-8 space-y-6 bg-white/40 backdrop-blur-md border border-border/50">
              <div className="flex flex-col items-center justify-center py-12 space-y-8">
                <div className="relative">
                  <div className="w-20 h-20 border-4 border-border rounded-full"></div>
                  <div className="absolute inset-0 w-20 h-20 border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                  <Sparkles className="absolute inset-0 m-auto w-7 h-7 text-primary animate-pulse" />
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-bold tracking-tight">Generating...</h3>
                  <p className="text-xs text-muted-foreground">
                    Your render is being created.
                  </p>
                  <p className="text-[10px] text-muted-foreground font-mono">
                    This may take up to 10 minutes.
                  </p>
                </div>
              </div>
              <div className="border-t border-border"></div>
              <div className="text-center space-y-3">
                <p className="text-xs text-muted-foreground">
                  Your render will be available in your{" "}
                  <Link href="/profile" className="text-primary hover:underline font-medium">
                    profile
                  </Link>{" "}
                  once completed.
                </p>
                <Button
                  variant="outline"
                  onClick={handleNewGeneration}
                  className="font-mono text-xs h-9"
                >
                  <Upload className="w-3 h-3 mr-1.5" />
                  NEW RENDER
                </Button>
              </div>
            </Card>
          )}

          {/* Result state */}
          {renderResult && renderResult.generated_image_url && (
            <Card className="overflow-hidden bg-white/40 backdrop-blur-md border border-border/50">
              <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
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
                
                <div className="relative w-full aspect-square border border-border/30 overflow-hidden bg-white/5">
                  <img
                    src={renderResult.upscaled_image_url && renderResult.upscaled_image_url !== renderResult.generated_image_url
                      ? renderResult.upscaled_image_url
                      : renderResult.generated_image_url
                    }
                    alt="Rendered image"
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute top-3 left-3 bg-background/90 backdrop-blur-sm px-3 py-1 border border-border">
                    <p className="text-xs font-mono">
                      {renderResult.upscaled_image_url && renderResult.upscaled_image_url !== renderResult.generated_image_url
                        ? "4K UPSCALED"
                        : "PREVIEW"
                      }
                    </p>
                  </div>
                </div>

                {!renderResult.upscaled_image_url || renderResult.upscaled_image_url === renderResult.generated_image_url ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
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
                      <Button
                        size="lg"
                        onClick={handleUpscale}
                        className="h-12 sm:h-14 font-mono text-xs sm:text-sm tracking-wider !bg-[#000000] hover:!bg-[#1a1a1a] cursor-pointer"
                      >
                        <Wand2 className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                        <span className="ml-1 sm:ml-0">UPSCALE 4K</span>
                      </Button>
                    </div>
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="w-full font-mono text-[10px] sm:text-xs h-9 sm:h-10"
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
                    <div className="space-y-2 pt-2 border-t border-border">
                      <label className="text-[10px] sm:text-xs font-mono text-muted-foreground">
                        Modify this render:
                      </label>
                      <Textarea
                        value={modificationPrompt}
                        onChange={(e) => setModificationPrompt(e.target.value)}
                        placeholder="e.g., make it more vibrant, change lighting to sunset..."
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
                            APPLYING...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1.5 sm:mr-2" />
                            APPLY MODIFICATION
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 sm:space-y-4">
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
                        DOWNLOAD 4K IMAGE
                      </a>
                    </Button>
                    <div className="flex gap-2 sm:gap-3">
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
                          <Download className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1.5" />
                          STANDARD
                        </a>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleNewGeneration}
                        className="flex-1 font-mono text-[10px] sm:text-xs h-9 sm:h-10"
                      >
                        <RefreshCw className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1.5" />
                        NEW RENDER
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      </main>
      </div>

      {/* Section 2: Landing page avec fond blanc */}
      <section className="bg-white py-16 sm:py-24 snap-start min-h-screen flex items-center">
        <div className="container mx-auto px-3 sm:px-6">
          <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6">
            <div className="text-center space-y-2 mb-8 sm:mb-12">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight text-black">
                Transform your <AuroraText>visions</AuroraText> into reality
              </h2>
              <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto">
                From sketches to photorealistic renders, and from 3D base models to stunning visualizations
              </p>
            </div>
            
            <div className="max-w-4xl mx-auto">
              <BeforeAfterSlider
                beforeImage="/exemple-draw.png"
                afterImage="/exemple-render.jpeg"
                beforeLabel="Sketch"
                afterLabel="AI Render"
                hideLabels
                className="w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: 4K Upscaling Feature */}
      <section className="bg-white py-16 sm:py-24 snap-start min-h-screen flex items-center">
        <div className="container mx-auto px-3 sm:px-6">
          <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6">
            <div className="text-center space-y-2 mb-8 sm:mb-12">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight text-black">
                Upgrade to <AuroraText>4K</AuroraText> quality
              </h2>
              <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto">
                Transform your standard renders into ultra-high resolution 4K images with enhanced detail and clarity
              </p>
            </div>
            
            <div className="max-w-4xl mx-auto">
              <BeforeAfterSlider
                beforeImage="/1K.png"
                afterImage="/4K.png"
                beforeLabel="LOW RESOLUTION"
                afterLabel="4K Upscaled"
                hideLabels
                className="w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Furniture Catalog Feature */}
      <section className="bg-white py-16 sm:py-24 snap-start min-h-screen flex items-center">
        <div className="container mx-auto px-3 sm:px-6">
          <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6">
            <div className="text-center space-y-2 mb-8 sm:mb-12">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight text-black">
                Enhance with <AuroraText>furniture</AuroraText> catalog
              </h2>
              <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto">
                Transform empty spaces into fully furnished renders by selecting items from your catalog
              </p>
            </div>
            
            <div className="max-w-4xl mx-auto">
              <BeforeAfterSlider
                beforeImage="/render-empty.png"
                afterImage="/render-fourniture.png"
                beforeLabel="Empty"
                afterLabel="Fourniture"
                hideLabels
                className="w-full"
                beforeObjectFit="cover"
                afterObjectFit="cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="bg-white py-16 sm:py-24 snap-start min-h-screen flex items-center">
        <div className="container mx-auto px-3 sm:px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center space-y-2 mb-10 sm:mb-14">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight text-black">
                Simple <AuroraText>pricing</AuroraText>
              </h2>
              <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto">
                Start for free. Upgrade when you need more.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
              {/* Free */}
              <div className="border border-border p-6 sm:p-8 space-y-6 bg-white">
                <div>
                  <h3 className="text-lg font-bold tracking-tight">Free</h3>
                  <p className="text-sm text-muted-foreground mt-1">Try it out</p>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">0</span>
                  <span className="text-lg font-medium text-muted-foreground">CHF</span>
                </div>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-black flex-shrink-0" /> 5 renders / month</li>
                  <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-black flex-shrink-0" /> Standard quality</li>
                  <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-black flex-shrink-0" /> 1 project folder</li>
                  <li className="flex items-center gap-2.5 text-muted-foreground"><X className="w-4 h-4 flex-shrink-0" /> 4K upscaling</li>
                  <li className="flex items-center gap-2.5 text-muted-foreground"><X className="w-4 h-4 flex-shrink-0" /> Video animation</li>
                </ul>
                <button
                  onClick={() => scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="w-full py-3 border-2 border-black text-black font-mono text-xs tracking-wider hover:bg-black hover:text-white transition-colors"
                >
                  GET STARTED
                </button>
              </div>

              {/* Pro */}
              <div className="border-2 border-black p-6 sm:p-8 space-y-6 bg-white relative">
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-1 bg-black text-white text-[10px] font-mono tracking-widest uppercase">
                    Popular
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-bold tracking-tight">Pro</h3>
                  <p className="text-sm text-muted-foreground mt-1">For professionals</p>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">49</span>
                  <span className="text-lg font-medium text-muted-foreground">CHF / mo</span>
                </div>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-black flex-shrink-0" /> 100 renders / month</li>
                  <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-black flex-shrink-0" /> 4K upscaling included</li>
                  <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-black flex-shrink-0" /> Unlimited projects</li>
                  <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-black flex-shrink-0" /> Video animation</li>
                  <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-black flex-shrink-0" /> Priority generation</li>
                </ul>
                <button
                  onClick={() => scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="w-full py-3 bg-black text-white font-mono text-xs tracking-wider hover:bg-black/85 transition-colors"
                >
                  START PRO
                </button>
              </div>

              {/* Enterprise */}
              <div className="border border-border p-6 sm:p-8 space-y-6 bg-white">
                <div>
                  <h3 className="text-lg font-bold tracking-tight">Enterprise</h3>
                  <p className="text-sm text-muted-foreground mt-1">For teams & agencies</p>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">Custom</span>
                </div>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-black flex-shrink-0" /> Unlimited renders</li>
                  <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-black flex-shrink-0" /> 4K + video included</li>
                  <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-black flex-shrink-0" /> Furniture catalog integration</li>
                  <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-black flex-shrink-0" /> White-label option</li>
                  <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-black flex-shrink-0" /> Dedicated support</li>
                </ul>
                <button
                  onClick={() => {
                    const contactSection = document.getElementById('contact-section');
                    contactSection?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="w-full py-3 border-2 border-black text-black font-mono text-xs tracking-wider hover:bg-black hover:text-white transition-colors"
                >
                  CONTACT US
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-white py-20 sm:py-28 snap-start min-h-screen flex items-center">
        <div className="container mx-auto px-3 sm:px-6">
          <div className="max-w-3xl mx-auto text-center space-y-6 sm:space-y-8">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight text-black">
              Ready to <AuroraText>transform</AuroraText> your workflow?
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-xl mx-auto">
              Start creating stunning renders in seconds. No design skills required.
            </p>
            <button
              onClick={() => scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
              className="inline-flex items-center justify-center gap-2 px-8 sm:px-10 py-3 sm:py-4 bg-black text-white font-semibold text-sm sm:text-base tracking-wide uppercase hover:bg-black/85 transition-colors duration-200"
            >
              Get started now
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </button>
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section id="contact-section" className="bg-white py-16 sm:py-24 snap-start">
        <div className="container mx-auto px-3 sm:px-6">
          <div className="max-w-2xl mx-auto space-y-6 sm:space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight text-black">
                Get in <AuroraText>touch</AuroraText>
              </h2>
              <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-xl mx-auto">
                Have a question or want to learn more? Send us a message and we'll get back to you.
              </p>
            </div>

            <Card className="p-6 sm:p-8 bg-white/20 backdrop-blur-sm border border-border/60">
              <form onSubmit={handleContactSubmit} className="space-y-4 sm:space-y-6">
                <div className="space-y-2">
                  <label htmlFor="contact-name" className="text-sm font-semibold text-foreground uppercase tracking-wider">
                    Name
                  </label>
                  <Input
                    id="contact-name"
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    required
                    className="w-full"
                    placeholder="Your name"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="contact-email" className="text-sm font-semibold text-foreground uppercase tracking-wider">
                    Email
                  </label>
                  <Input
                    id="contact-email"
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    required
                    className="w-full"
                    placeholder="your@email.com"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="contact-phone" className="text-sm font-semibold text-foreground uppercase tracking-wider">
                    Phone Number
                  </label>
                  <Input
                    id="contact-phone"
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    required
                    className="w-full"
                    placeholder="+41 XX XXX XX XX"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="contact-message" className="text-sm font-semibold text-foreground uppercase tracking-wider">
                    Message
                  </label>
                  <Textarea
                    id="contact-message"
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    required
                    className="w-full min-h-[120px] sm:min-h-[150px]"
                    placeholder="Your message..."
                  />
                </div>

                {contactError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 text-sm">
                    {contactError}
                  </div>
                )}

                {contactSuccess && (
                  <div className="p-3 bg-green-500/10 border border-green-500/20 text-green-600 text-sm">
                    Message sent successfully! We'll get back to you soon.
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isSubmittingContact}
                  className="w-full h-12 sm:h-14 font-mono text-xs sm:text-sm tracking-wider !bg-[#000000] hover:!bg-[#1a1a1a] !opacity-100 transition-all"
                >
                  {isSubmittingContact ? (
                    <span className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Sending...</span>
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <span>SEND MESSAGE</span>
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  )}
                </Button>
              </form>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-border">
        <div className="container mx-auto px-3 sm:px-6 py-3 sm:py-4 flex flex-col items-center justify-center gap-1">
          <p className="text-[10px] sm:text-xs font-mono text-muted-foreground text-center">
            <span className="hidden sm:inline">© 2026 RENDERZ · ARCHITECTURE + TECHNOLOGY</span>
            <span className="sm:hidden">© 2026 RENDERZ</span>
          </p>
          <p className="text-[10px] sm:text-xs text-muted-foreground/80 text-center">
            Made with heart in the Swiss mountains 🇨🇭
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
    </div>
  );
}

