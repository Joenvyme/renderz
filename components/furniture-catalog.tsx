"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, X, Check, Filter, Grid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface FurnitureItem {
  id: string;
  supplierId: string;
  name: string;
  category: string;
  style: string;
  imageUrl: string;
  promptEnhancement: string;
  metadata: {
    materials?: string[];
    color?: string;
    dimensions?: {
      width?: number;
      height?: number;
      depth?: number;
    };
    designer?: string;
    reference?: string;
  };
}

interface FurnitureCatalogProps {
  selectedItems: FurnitureItem[];
  onSelectionChange: (items: FurnitureItem[]) => void;
  className?: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  sofa: "Canapés",
  chair: "Chaises",
  table: "Tables",
  "coffee-table": "Tables basses",
  "dining-table": "Tables à manger",
  desk: "Bureaux",
  bed: "Lits",
  wardrobe: "Armoires",
  shelf: "Étagères",
  lamp: "Lampes",
  rug: "Tapis",
  curtain: "Rideaux",
  plant: "Plantes",
  decoration: "Décorations",
  storage: "Rangement",
  ottoman: "Poufs",
  mirror: "Miroirs",
  cabinet: "Buffets",
};

const STYLE_LABELS: Record<string, string> = {
  modern: "Moderne",
  contemporary: "Contemporain",
  scandinavian: "Scandinave",
  industrial: "Industriel",
  minimalist: "Minimaliste",
  rustic: "Rustique",
  classic: "Classique",
  luxury: "Luxe",
  "mid-century": "Milieu de siècle",
  bohemian: "Bohème",
  vintage: "Vintage",
  transitional: "Transitionnel",
};

export function FurnitureCatalog({
  selectedItems,
  onSelectionChange,
  className = "",
}: FurnitureCatalogProps) {
  const [items, setItems] = useState<FurnitureItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [styles, setStyles] = useState<string[]>([]);
  const [suppliers, setSuppliers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Charger le catalogue
  useEffect(() => {
    async function loadCatalog() {
      try {
        setLoading(true);
        
        // Charger les catégories, styles et fournisseurs
        const [categoriesRes, stylesRes, suppliersRes, itemsRes] = await Promise.all([
          fetch("/api/furniture/categories"),
          fetch("/api/furniture/styles"),
          fetch("/api/furniture/suppliers"),
          fetch("/api/furniture?limit=200"),
        ]);

        const categoriesData = await categoriesRes.json();
        const stylesData = await stylesRes.json();
        const suppliersData = await suppliersRes.json();
        const itemsData = await itemsRes.json();

        setCategories(categoriesData.categories || []);
        setStyles(stylesData.styles || []);
        
        // Filtrer les fournisseurs pour éviter les valeurs nulles ou vides
        const validSuppliers = (suppliersData.suppliers || []).filter(
          (supplier: string) => supplier && supplier.trim() !== ''
        );
        setSuppliers(validSuppliers);
        
        setItems(itemsData.items || []);
        
        // Debug: afficher les fournisseurs chargés
        if (validSuppliers.length > 0) {
          console.log('Fournisseurs chargés:', validSuppliers);
        } else {
          console.warn('Aucun fournisseur trouvé dans les données');
        }
      } catch (error) {
        console.error("Erreur lors du chargement du catalogue:", error);
      } finally {
        setLoading(false);
      }
    }

    loadCatalog();
  }, []);

  // Filtrer les items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Recherche textuelle
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          item.name.toLowerCase().includes(query) ||
          item.promptEnhancement.toLowerCase().includes(query) ||
          item.metadata?.reference?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Filtre catégorie
      if (selectedCategory && item.category !== selectedCategory) {
        return false;
      }

      // Filtre style
      if (selectedStyle && item.style !== selectedStyle) {
        return false;
      }

      // Filtre fournisseur
      if (selectedSupplier && item.supplierId !== selectedSupplier) {
        return false;
      }

      return true;
    });
  }, [items, searchQuery, selectedCategory, selectedStyle, selectedSupplier]);

  const toggleItemSelection = (item: FurnitureItem) => {
    const isSelected = selectedItems.some((selected) => selected.id === item.id);
    
    if (isSelected) {
      onSelectionChange(selectedItems.filter((selected) => selected.id !== item.id));
    } else {
      onSelectionChange([...selectedItems, item]);
    }
  };

  const isItemSelected = (itemId: string) => {
    return selectedItems.some((item) => item.id === itemId);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory(null);
    setSelectedStyle(null);
    setSelectedSupplier(null);
  };

  const hasActiveFilters = searchQuery || selectedCategory || selectedStyle || selectedSupplier;

  if (loading) {
    return (
      <div className={`${className} flex items-center justify-center p-8`}>
        <div className="text-sm text-gray-500">Chargement du catalogue...</div>
      </div>
    );
  }

  return (
    <div className={`${className} space-y-4`}>
      {/* Header avec recherche et filtres */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Recherche */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Rechercher un meuble..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 sm:h-11"
            />
          </div>

          {/* Boutons d'action */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="h-10 sm:h-11"
            >
              <Filter className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Filtres</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
              className="h-10 sm:h-11"
            >
              {viewMode === "grid" ? (
                <>
                  <List className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Liste</span>
                </>
              ) : (
                <>
                  <Grid className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Grille</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Filtres */}
        {showFilters && (
          <Card className="p-4 space-y-3">
            <div className="flex flex-wrap gap-2">
              {/* Filtre catégorie */}
              <div className="flex-1 min-w-[150px]">
                <label className="text-xs font-medium text-gray-500 mb-1 block">
                  Catégorie
                </label>
                <select
                  value={selectedCategory || ""}
                  onChange={(e) => setSelectedCategory(e.target.value || null)}
                  className="w-full h-9 px-3 text-sm border border-gray-300 rounded-md bg-white"
                >
                  <option value="">Toutes</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {CATEGORY_LABELS[cat] || cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtre style */}
              <div className="flex-1 min-w-[150px]">
                <label className="text-xs font-medium text-gray-500 mb-1 block">
                  Style
                </label>
                <select
                  value={selectedStyle || ""}
                  onChange={(e) => setSelectedStyle(e.target.value || null)}
                  className="w-full h-9 px-3 text-sm border border-gray-300 rounded-md bg-white"
                >
                  <option value="">Tous</option>
                  {styles.map((style) => (
                    <option key={style} value={style}>
                      {STYLE_LABELS[style] || style}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtre fournisseur */}
              <div className="flex-1 min-w-[150px]">
                <label className="text-xs font-medium text-gray-500 mb-1 block">
                  Fournisseur
                </label>
                <select
                  value={selectedSupplier || ""}
                  onChange={(e) => setSelectedSupplier(e.target.value || null)}
                  className="w-full h-9 px-3 text-sm border border-gray-300 rounded-md bg-white"
                >
                  <option value="">Tous</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier} value={supplier}>
                      {supplier}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Bouton clear filters */}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-8 text-xs"
              >
                <X className="h-3 w-3 mr-1" />
                Réinitialiser les filtres
              </Button>
            )}
          </Card>
        )}

        {/* Compteur de résultats */}
        <div className="text-sm text-gray-500">
          {filteredItems.length} meuble{filteredItems.length > 1 ? "s" : ""} trouvé
          {filteredItems.length > 1 ? "s" : ""}
          {selectedItems.length > 0 && ` • ${selectedItems.length} sélectionné${selectedItems.length > 1 ? "s" : ""}`}
        </div>
      </div>

      {/* Liste des meubles */}
      {filteredItems.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="text-sm text-gray-500">
            Aucun meuble trouvé. Essayez de modifier vos filtres.
          </div>
        </Card>
      ) : (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4"
              : "space-y-2"
          }
        >
          {filteredItems.map((item) => {
            const isSelected = isItemSelected(item.id);
            
            // Affichage en grille : seulement les images
            if (viewMode === "grid") {
              return (
                <Card
                  key={item.id}
                  className={`relative aspect-square cursor-pointer transition-all hover:shadow-lg overflow-hidden ${
                    isSelected
                      ? "ring-2 ring-blue-500"
                      : "hover:border-gray-400"
                  }`}
                  onClick={() => toggleItemSelection(item)}
                >
                  {/* Image */}
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                      <div className="text-xs text-gray-400 text-center px-2">
                        {item.category}
                      </div>
                    </div>
                  )}
                  
                  {/* Badge de sélection */}
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                  )}
                </Card>
              );
            }
            
            // Affichage en liste : image + contenu
            return (
              <Card
                key={item.id}
                className={`p-3 sm:p-4 cursor-pointer transition-all hover:shadow-md ${
                  isSelected
                    ? "ring-2 ring-blue-500 bg-blue-50"
                    : "hover:border-gray-400"
                }`}
                onClick={() => toggleItemSelection(item)}
              >
                <div className="flex gap-3 sm:gap-4">
                  {/* Image placeholder */}
                  <div className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-md flex items-center justify-center">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover rounded-md"
                      />
                    ) : (
                      <div className="text-xs text-gray-400 text-center px-2">
                        {item.category}
                      </div>
                    )}
                  </div>

                  {/* Contenu */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-medium text-sm sm:text-base line-clamp-2">
                        {item.name}
                      </h3>
                      {isSelected && (
                        <div className="flex-shrink-0 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      <span className="text-xs px-2 py-0.5 bg-gray-100 rounded text-gray-600">
                        {CATEGORY_LABELS[item.category] || item.category}
                      </span>
                      <span className="text-xs px-2 py-0.5 bg-gray-100 rounded text-gray-600">
                        {STYLE_LABELS[item.style] || item.style}
                      </span>
                    </div>
                    {item.metadata?.dimensions && (
                      <div className="mt-1 text-xs text-gray-500">
                        {item.metadata.dimensions.width} × {item.metadata.dimensions.depth} cm
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
