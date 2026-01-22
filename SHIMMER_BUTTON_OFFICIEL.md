# ✨ ShimmerButton - Composant Officiel Magic UI

## 📚 Source

Composant officiel de [Magic UI](https://magicui.design/docs/components/shimmer-button)

**Documentation** : https://magicui.design/docs/components/shimmer-button

---

## ✅ Installation

### Emplacement
```
components/magicui/shimmer-button.tsx
```

### Import
```tsx
import { ShimmerButton } from "@/components/magicui/shimmer-button";
```

---

## 🎨 Props par défaut (Magic UI)

D'après la [documentation officielle](https://magicui.design/docs/components/shimmer-button) :

| Prop            | Type            | Default          | Description                         |
| --------------- | --------------- | ---------------- | ----------------------------------- |
| shimmerColor    | string          | #ffffff          | Couleur de l'effet shimmer          |
| shimmerSize     | string          | 0.05em           | Taille de l'effet shimmer           |
| borderRadius    | string          | 100px            | Rayon des coins du bouton           |
| shimmerDuration | string          | 3s               | Durée de l'animation                |
| background      | string          | rgba(0, 0, 0, 1) | Fond du bouton                      |
| className       | string          | undefined        | Classes CSS supplémentaires         |
| children        | React.ReactNode | undefined        | Contenu du bouton                   |

---

## 🎯 Notre configuration

### Bouton "GÉNÉRER LE RENDU"

```tsx
<ShimmerButton
  onClick={handleGenerate}
  disabled={!uploadedImage || !prompt.trim() || isGenerating}
  className="w-full h-14 shadow-2xl"
  shimmerColor="#8b5cf6"                                          // Violet (cohérent avec AuroraText)
  shimmerSize="0.1em"                                             // Plus visible (default: 0.05em)
  shimmerDuration="2s"                                            // Plus rapide (default: 3s)
  borderRadius="0px"                                              // Coins carrés (default: 100px)
  background="linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 100%)" // Gradient noir
>
  <span className="flex items-center justify-center gap-2 text-sm font-mono tracking-wider">
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
</ShimmerButton>
```

---

## 🎨 Différences avec les defaults Magic UI

### Notre design "Architectural Precision"

| Prop            | Default Magic UI | Notre valeur                                      | Raison                           |
| --------------- | ---------------- | ------------------------------------------------- | -------------------------------- |
| shimmerColor    | #ffffff          | #8b5cf6 (violet)                                  | Cohérence avec AuroraText        |
| shimmerSize     | 0.05em           | 0.1em                                             | Plus visible, plus impactant     |
| shimmerDuration | 3s               | 2s                                                | Plus dynamique                   |
| borderRadius    | 100px            | 0px                                               | Style architectural carré        |
| background      | rgba(0, 0, 0, 1) | linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 100%) | Gradient élégant                 |
| className       | -                | w-full h-14 shadow-2xl                            | Pleine largeur, hauteur généreuse|

---

## 🎬 Effet visuel

```
┌─────────────────────────────────────┐
│                                     │
│   GÉNÉRER LE RENDU        →        │ ← Shimmer violet qui tourne
│                                     │
└─────────────────────────────────────┘
        ↑
   Gradient lumineux violet
   tourne autour du bouton (2s/tour)
```

---

## 🔧 Animations CSS requises

Dans `app/globals.css` :

```css
/* Shimmer Button Animations */
@keyframes shimmer-slide {
  to {
    translate: calc(100cqw - 100%) 0;
  }
}

@keyframes spin-around {
  to {
    transform: rotate(1turn);
  }
}

.animate-shimmer-slide {
  animation: shimmer-slide var(--speed) ease-in-out infinite alternate;
}

.animate-spin-around {
  animation: spin-around var(--speed) linear infinite;
}
```

---

## 🎨 Cohérence design

### Avec AuroraText

```tsx
// Titre
<h1>
  Your <AuroraText>AI</AuroraText> rendering assistant.
</h1>
```

**Palette commune** :
- Violet #8b5cf6 (purple-600)
- Animations fluides
- Style tech et moderne

---

## ✨ Exemples d'utilisation

### 1. Bouton CTA principal (notre cas)

```tsx
<ShimmerButton 
  shimmerColor="#8b5cf6"
  borderRadius="0px"
  className="w-full h-14"
>
  GÉNÉRER LE RENDU
</ShimmerButton>
```

### 2. Bouton arrondi (style Magic UI default)

```tsx
<ShimmerButton className="shadow-2xl">
  <span className="text-sm font-medium text-white lg:text-lg">
    Shimmer Button
  </span>
</ShimmerButton>
```

### 3. Bouton coloré

```tsx
<ShimmerButton 
  shimmerColor="#10b981"
  background="rgba(16, 185, 129, 0.1)"
>
  Success Action
</ShimmerButton>
```

### 4. Bouton rapide

```tsx
<ShimmerButton 
  shimmerDuration="1s"
  shimmerSize="0.15em"
>
  Fast Shimmer
</ShimmerButton>
```

---

## 🔍 Détails techniques

### Structure du composant

Le ShimmerButton officiel utilise :

1. **CSS Variables** : Pour la personnalisation dynamique
   ```tsx
   style={{
     "--shimmer-color": shimmerColor,
     "--speed": shimmerDuration,
     "--cut": shimmerSize,
     ...
   }}
   ```

2. **Container Queries** : Pour le dimensionnement responsive
   ```css
   [container-type:size]
   h-[100cqh]
   ```

3. **Conic Gradient** : Pour l'effet de rotation
   ```css
   background: conic-gradient(
     from calc(270deg - (var(--spread) * 0.5)),
     transparent 0,
     var(--shimmer-color) var(--spread),
     transparent var(--spread)
   )
   ```

4. **Blur Effect** : Pour adoucir l'effet lumineux
   ```tsx
   className="blur-[2px]"
   ```

5. **Multiple layers** :
   - Spark container (blur)
   - Spark slide (translation)
   - Spin around (rotation)
   - Highlight (inset shadow)

---

## 🚀 Performance

### Optimisations intégrées

- ✅ **GPU-accelerated** : `transform-gpu`
- ✅ **Pure CSS animations** : Pas de JS pour l'effet
- ✅ **Container queries** : Responsive automatique
- ✅ **Efficient rerenders** : Props memoized

---

## 📊 Comparaison

### Version Custom vs Officielle

| Aspect          | Ma version initiale | Version officielle Magic UI |
| --------------- | ------------------- | --------------------------- |
| Source          | Personnalisée       | ✅ Officielle, maintenue    |
| Props           | Similaires          | ✅ Standards Magic UI       |
| Animations      | Similaires          | ✅ Optimisées               |
| Documentation   | Custom              | ✅ Doc officielle           |
| Mises à jour    | Manuelle            | ✅ Via shadcn/MagicUI       |
| Support         | -                   | ✅ Communauté Magic UI      |

**Avantage** : La version officielle bénéficie des mises à jour et du support de la communauté Magic UI.

---

## 🎯 Bonnes pratiques

### ✅ À faire

- Utiliser sur les CTAs importants
- Cohérence des couleurs (violet = #8b5cf6)
- Adapter borderRadius au design (0px pour architectural)
- Vitesse adaptée au contexte (2s-3s)

### ❌ À éviter

- Trop de ShimmerButtons sur une page
- Couleurs trop vives (distrayant)
- Animation trop rapide (< 1s)
- Utilisation sur boutons secondaires

---

## 📚 Références

- **Magic UI Docs** : https://magicui.design/docs/components/shimmer-button
- **Crédit original** : @jh3yy (inspiration du composant)
- **Magic UI GitHub** : https://github.com/magicuidesign/magicui

---

## 🚀 Test

```bash
npm run dev
```

Allez sur http://localhost:3000 et admirez l'effet shimmer sur le bouton "GÉNÉRER LE RENDU" !

---

**Le composant officiel Magic UI est maintenant intégré ! ✨**

Design cohérent avec AuroraText pour une identité visuelle moderne et professionnelle ! 🎨🚀






