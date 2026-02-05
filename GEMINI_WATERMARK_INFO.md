# 🎨 Watermark Gemini sur les Rendus

## ❓ Pourquoi le watermark apparaît ?

Le watermark "Gemini" apparaît parce que vous utilisez le modèle **`gemini-3-pro-image-preview`** qui est une **version preview/test** de l'API Google Gemini.

Les modèles en preview ajoutent automatiquement un watermark pour indiquer qu'il s'agit d'une version de test.

## 🔍 Vérification

Dans votre code (`lib/api/nano-banana.ts`), vous utilisez :

```typescript
`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${apiKey}`
```

Le suffixe `-preview` indique que c'est une version de test.

## ✅ Solutions possibles

### Option 1 : Vérifier s'il existe un modèle de production

Google peut avoir publié une version de production sans watermark. Vérifiez la documentation officielle :

**Documentation Gemini Image Generation :**
- https://ai.google.dev/gemini-api/docs/image-generation

**Modèles possibles :**
- `gemini-3-pro-image` (sans `-preview`) - si disponible
- `gemini-2.5-flash-image` - modèle plus rapide, peut-être sans watermark

### Option 2 : Modifier le modèle utilisé

Si un modèle de production existe, modifiez `lib/api/nano-banana.ts` :

```typescript
// Remplacer :
`gemini-3-pro-image-preview`

// Par (si disponible) :
`gemini-3-pro-image`
// ou
`gemini-2.5-flash-image`
```

### Option 3 : Vérifier les paramètres de l'API

Certaines APIs permettent de désactiver le watermark via un paramètre. Vérifiez la documentation pour voir si `generationConfig` accepte un paramètre comme :

```typescript
generationConfig: {
  responseModalities: ['IMAGE'],
  imageConfig: {
    aspectRatio: request.aspectRatio || '1:1',
    // watermark: false  // Si ce paramètre existe
  }
}
```

### Option 4 : Attendre la version de production

Si le modèle n'est pas encore en production, il faudra attendre que Google publie la version finale sans watermark.

## 🔧 Test rapide

Pour tester avec un autre modèle, modifiez temporairement `lib/api/nano-banana.ts` ligne 134 :

```typescript
// Test avec Gemini 2.5 Flash Image (peut-être sans watermark)
`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${apiKey}`
```

## 📝 Note importante

Les watermarks sur les modèles preview sont **normaux et attendus**. C'est la façon de Google d'indiquer que vous utilisez une version de test.

Pour un usage en production sans watermark, vous devrez :
1. Attendre la version de production du modèle
2. Ou utiliser un autre service de génération d'images (Replicate, Stability AI, etc.)

---

**Action recommandée :** Vérifiez la documentation Gemini officielle pour voir si une version de production est disponible.
