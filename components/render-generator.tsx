"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Upload, Sparkles, ArrowRight, X, Plus, Image as ImageIcon, Palette, Layers, Sofa, FolderOpen, Ratio, Gem, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { FurnitureCatalog } from "@/components/furniture-catalog";
import { useSession } from "@/lib/auth-client";
import { ASPECT_RATIOS, AspectRatio, ImageRole } from "@/lib/api/nano-banana";

interface UploadedImageItem {
  id: string;
  dataUrl: string;
  role: ImageRole;
}

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

const MAX_IMAGES = 3;

interface ProjectOption {
  id: string;
  name: string;
}

interface RenderGeneratorProps {
  onGenerateSuccess?: () => void;
  projects?: ProjectOption[];
  selectedProjectId?: string | null;
  onProjectChange?: (projectId: string | null) => void;
  compact?: boolean;
  externalReferenceImage?: {
    token: string;
    url: string;
  } | null;
}

export function RenderGenerator({
  onGenerateSuccess,
  projects,
  selectedProjectId,
  onProjectChange,
  compact,
  externalReferenceImage,
}: RenderGeneratorProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<UploadedImageItem[]>([]);
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("1:1");
  const [selectedFurniture, setSelectedFurniture] = useState<any[]>([]);
  const [showFurnitureCatalog, setShowFurnitureCatalog] = useState(false);
  const [showCatalogToast, setShowCatalogToast] = useState(false);
  const [quality, setQuality] = useState<"standard" | "hd">("standard");
  const [showCompactFormat, setShowCompactFormat] = useState(false);
  const [showCompactQuality, setShowCompactQuality] = useState(false);

  // Fermer automatiquement le toast après 4 secondes
  useEffect(() => {
    if (showCatalogToast) {
      const timer = setTimeout(() => {
        setShowCatalogToast(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [showCatalogToast]);

  // Injecter une image de référence depuis la grille (profile page)
  useEffect(() => {
    if (!externalReferenceImage?.url) return;

    setUploadedImages((prev) => {
      if (prev.length >= MAX_IMAGES) return prev;
      if (prev.some((img) => img.dataUrl === externalReferenceImage.url)) return prev;

      return [
        ...prev,
        {
          id: `ext-${externalReferenceImage.token}`,
          dataUrl: externalReferenceImage.url,
          role: "reference",
        },
      ];
    });
  }, [externalReferenceImage?.token, externalReferenceImage?.url]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const removeImage = useCallback((imageId: string) => {
    setUploadedImages(prev => prev.filter(img => img.id !== imageId));
  }, []);

  const changeImageRole = useCallback((imageId: string, newRole: ImageRole) => {
    setUploadedImages(prev => prev.map(img => 
      img.id === imageId ? { ...img, role: newRole } : img
    ));
  }, []);

  const addMultipleImages = useCallback((dataUrls: string[]) => {
    setUploadedImages(prev => {
      const availableSlots = MAX_IMAGES - prev.length;
      const urlsToAdd = dataUrls.slice(0, availableSlots);
      
      const newImages: UploadedImageItem[] = urlsToAdd.map((dataUrl, index) => {
        const allRoles = [
          ...prev.map(img => img.role),
          ...Array(index).fill(null).map((_, i) => {
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
    
    e.target.value = '';
  };

  const handleGenerate = async () => {
    if (uploadedImages.length === 0 || !prompt.trim()) return;
    
    if (!session) {
      router.push("/");
      return;
    }
    
    setIsGenerating(true);

    try {
      // Upload images
      const uploadedUrls: { url: string; role: ImageRole }[] = [];
      
      for (const img of uploadedImages) {
        // If the image already is a public URL from an existing render, reuse it directly.
        if (img.dataUrl.startsWith("http://") || img.dataUrl.startsWith("https://")) {
          uploadedUrls.push({ url: img.dataUrl, role: img.role });
          continue;
        }

        const blob = await fetch(img.dataUrl).then(r => r.blob());
        const formData = new FormData();
        formData.append('file', blob, `image-${img.role}.png`);

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!uploadRes.ok) {
          throw new Error(`Upload failed for ${img.role} image`);
        }
        
        const { url } = await uploadRes.json();
        uploadedUrls.push({ url, role: img.role });
      }

      // Enrichir le prompt avec le catalogue de mobilier
      let enhancedPrompt = prompt;
      if (selectedFurniture.length > 0) {
        const furnitureDescriptions = selectedFurniture
          .map(item => item.promptEnhancement)
          .join(", ");
        enhancedPrompt = `${prompt}. Include these furniture items: ${furnitureDescriptions}`;
      }

      // Generate render
      const generateRes = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          images: uploadedUrls, 
          prompt: enhancedPrompt, 
          aspectRatio,
          projectId: selectedProjectId && selectedProjectId !== "unassigned" ? selectedProjectId : undefined,
        }),
      });

      if (!generateRes.ok) {
        const errorData = await generateRes.json().catch(() => ({}));
        throw new Error(errorData.error || 'Generation failed');
      }

      const generateData = await generateRes.json();
      
      // Reset form
      setUploadedImages([]);
      setPrompt("");
      setSelectedFurniture([]);
      
      // Callback success
      if (onGenerateSuccess) {
        onGenerateSuccess();
      } else {
        // Refresh page to show new render
        router.refresh();
      }
    } catch (error) {
      console.error('Generation error:', error);
      alert(error instanceof Error ? error.message : 'Generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className={compact ? "space-y-3 p-3 sm:p-4 bg-transparent backdrop-blur-none border-0 shadow-none" : "space-y-3 p-4 sm:p-6 space-y-4 bg-white/10 backdrop-blur-xl border-white/20 gradient-shadow"}>
      {/* Compact layout: images above, prompt below */}
      {compact ? (
        <div className="flex flex-col gap-2">
          {/* Upload zone + images row */}
          <div className="flex gap-2 items-center">
            {uploadedImages.map((img) => (
              <div key={img.id} className="relative group">
                <div className="relative w-12 h-12 border border-border overflow-hidden bg-muted/30">
                  <img src={img.dataUrl} alt={`${img.role}`} className="w-full h-full object-cover" />
                  <button
                    onClick={() => removeImage(img.id)}
                    className="absolute top-0 right-0 w-4 h-4 bg-black/70 hover:bg-red-600 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100"
                  >
                    <X className="w-2.5 h-2.5 text-white" />
                  </button>
                  <div className="absolute bottom-0 inset-x-0 bg-black/70 px-0.5 py-px">
                    <span className="text-[7px] font-mono text-white uppercase">{img.role}</span>
                  </div>
                </div>
              </div>
            ))}
            {uploadedImages.length < MAX_IMAGES && (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative w-12 h-12 border-2 border-dashed flex items-center justify-center cursor-pointer transition-all ${isDragging ? "border-primary bg-primary/5" : "border-border/90 hover:border-primary/50 bg-muted/20"}`}
              >
                <input type="file" accept="image/*" multiple onChange={handleFileSelect} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                {uploadedImages.length === 0 ? (
                  <Upload className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <Plus className="w-3.5 h-3.5 text-muted-foreground" />
                )}
              </div>
            )}
          </div>

          {/* Prompt + Generate */}
          <div className="flex gap-2 items-end">
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value.slice(0, 500))}
              placeholder="Describe the style, mood, and details you want..."
              className="flex-1 min-h-[64px] max-h-[64px] resize-none rounded-none font-mono text-xs leading-relaxed"
            />
            <Button
              onClick={handleGenerate}
              disabled={uploadedImages.length === 0 || !prompt.trim() || isGenerating}
              className="h-[64px] px-4 sm:px-6 font-mono text-xs tracking-wider !bg-[#000000] hover:!bg-[#1a1a1a] !opacity-100 transition-all flex-shrink-0"
            >
              {isGenerating ? (
                <Sparkles className="w-4 h-4 animate-spin" />
              ) : (
                <ArrowRight className="w-4 h-4" />
              )}
            </Button>
          </div>
            {/* Compact controls: icon buttons */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Project selector */}
              {projects && projects.length > 0 && (
                <select
                  value={selectedProjectId || ""}
                  onChange={(e) => onProjectChange?.(e.target.value || null)}
                  className="h-7 text-[10px] font-mono bg-muted/30 border border-border px-1.5 text-muted-foreground rounded-sm"
                >
                  <option value="">No project</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              )}

              {/* Format (aspect ratio) button */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => { setShowCompactFormat(!showCompactFormat); setShowCompactQuality(false); }}
                  className={`h-7 px-2 flex items-center gap-1.5 text-[10px] font-mono border rounded-sm transition-all ${
                    showCompactFormat ? "bg-black text-white border-black" : "bg-muted/30 border-border text-muted-foreground hover:bg-muted/60"
                  }`}
                >
                  <Ratio className="w-3 h-3" />
                  <span>{aspectRatio}</span>
                  <ChevronDown className="w-2.5 h-2.5" />
                </button>
                {showCompactFormat && (
                  <div className="absolute bottom-full left-0 mb-1.5 bg-white border border-border shadow-lg p-1.5 z-50 min-w-[140px]">
                    {ASPECT_RATIOS.map((ratio) => (
                      <button
                        key={ratio.value}
                        type="button"
                        onClick={() => { setAspectRatio(ratio.value); setShowCompactFormat(false); }}
                        className={`w-full px-2 py-1.5 text-left text-[10px] font-mono flex items-center justify-between transition-all ${
                          aspectRatio === ratio.value
                            ? "bg-black text-white"
                            : "text-foreground hover:bg-muted/60"
                        }`}
                      >
                        <span>{ratio.label}</span>
                        <span className="text-[9px] opacity-70">{ratio.value}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Quality button */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => { setShowCompactQuality(!showCompactQuality); setShowCompactFormat(false); }}
                  className={`h-7 px-2 flex items-center gap-1.5 text-[10px] font-mono border rounded-sm transition-all ${
                    showCompactQuality ? "bg-black text-white border-black" : "bg-muted/30 border-border text-muted-foreground hover:bg-muted/60"
                  }`}
                >
                  <Gem className="w-3 h-3" />
                  <span>{quality === "hd" ? "HD" : "STD"}</span>
                  <ChevronDown className="w-2.5 h-2.5" />
                </button>
                {showCompactQuality && (
                  <div className="absolute bottom-full left-0 mb-1.5 bg-white border border-border shadow-lg p-1.5 z-50 min-w-[120px]">
                    <button
                      type="button"
                      onClick={() => { setQuality("standard"); setShowCompactQuality(false); }}
                      className={`w-full px-2 py-1.5 text-left text-[10px] font-mono flex items-center gap-2 transition-all ${
                        quality === "standard" ? "bg-black text-white" : "text-foreground hover:bg-muted/60"
                      }`}
                    >
                      <span>Standard</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { setQuality("hd"); setShowCompactQuality(false); }}
                      className={`w-full px-2 py-1.5 text-left text-[10px] font-mono flex items-center gap-2 transition-all ${
                        quality === "hd" ? "bg-black text-white" : "text-foreground hover:bg-muted/60"
                      }`}
                    >
                      <span>HD</span>
                      <span className="text-[8px] opacity-60">haute qualité</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Furniture Catalog button */}
              <button
                type="button"
                onClick={() => setShowCatalogToast(true)}
                className="h-7 px-2 flex items-center gap-1.5 text-[10px] font-mono border rounded-sm bg-muted/30 border-border text-muted-foreground hover:bg-muted/60 transition-all"
              >
                <Sofa className="w-3 h-3" />
                <span className="hidden sm:inline">Catalog</span>
              </button>
            </div>
        </div>
      ) : (
        /* Full layout (non-compact) */
        <>
      {/* Upload Zone */}
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

            {/* Zone d'ajout */}
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

        {/* Zone d'upload initiale */}
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
              <div className="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-background/60 backdrop-blur-sm border border-border/50">
                <Upload className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground" />
              </div>
              
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

      {/* Reste du formulaire */}
      {uploadedImages.length > 0 && (
        <>
          {/* Project Selector */}
          {projects && projects.length > 0 && (
            <div className="space-y-2 sm:space-y-3">
              <label className="text-xs sm:text-sm font-mono uppercase tracking-wider flex items-center gap-1.5">
                <FolderOpen className="w-3 h-3" />
                Project
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={() => onProjectChange?.(null)}
                  className={`
                    p-1.5 sm:p-2 border-2 transition-all duration-200 text-center
                    ${!selectedProjectId || selectedProjectId === "unassigned"
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                    }
                  `}
                >
                  <div className="text-[9px] sm:text-[10px] lg:text-xs font-mono">No project</div>
                </button>
                {projects.map((project) => (
                  <button
                    key={project.id}
                    type="button"
                    onClick={() => onProjectChange?.(project.id)}
                    className={`
                      p-1.5 sm:p-2 border-2 transition-all duration-200 text-center
                      ${selectedProjectId === project.id
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                      }
                    `}
                  >
                    <div className="text-[9px] sm:text-[10px] lg:text-xs font-mono truncate">{project.name}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

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
            disabled={uploadedImages.length === 0 || !prompt.trim() || isGenerating}
            className="w-full h-12 sm:h-14 font-mono text-xs sm:text-sm tracking-wider !bg-[#000000] hover:!bg-[#1a1a1a] !opacity-100 transition-all"
          >
            {isGenerating ? (
              <span className="flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4 animate-spin" />
                <span>GENERATING...</span>
              </span>
            ) : (
              <span className="flex items-center justify-center gap-1.5 sm:gap-2">
                <span className="hidden sm:inline">GENERATE RENDER</span>
                <span className="sm:hidden">GENERATE</span>
                <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
              </span>
            )}
          </Button>
        </>
      )}
        </>
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
    </Card>
  );
}
