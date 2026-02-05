# 🔍 Vérification : Gemini 3 sans Preview

## ❓ Question

Est-ce que `gemini-3-pro-image` (sans `-preview`) est disponible en version de production ?

## 🔍 Vérification à faire

### Option 1 : Tester directement dans le code

Modifiez temporairement `lib/api/nano-banana.ts` ligne 134 pour tester :

```typescript
// Test 1 : Version sans -preview
`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image:generateContent?key=${apiKey}`

// Test 2 : Gemini 2.5 Flash Image (alternative)
`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${apiKey}`
```

### Option 2 : Vérifier dans Google AI Studio

1. Allez sur : https://aistudio.google.com/
2. Connectez-vous
3. Vérifiez les modèles disponibles dans l'interface
4. Regardez si `gemini-3-pro-image` (sans preview) apparaît

### Option 3 : Consulter la documentation officielle

- **Documentation Gemini Image Generation** : https://ai.google.dev/gemini-api/docs/image-generation
- **Liste des modèles** : https://ai.google.dev/gemini-api/docs/models/gemini

### Option 4 : Tester via l'API directement

Vous pouvez tester directement avec curl :

```bash
curl -X POST \
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image:generateContent?key=VOTRE_CLE" \
  -H "Content-Type: application/json" \
  -d '{
    "contents": [{
      "parts": [{
        "text": "A beautiful landscape"
      }]
    }],
    "generationConfig": {
      "responseModalities": ["IMAGE"],
      "imageConfig": {
        "aspectRatio": "1:1"
      }
    }
  }'
```

Si ça fonctionne, le modèle est disponible. Si vous obtenez une erreur 404, il n'est pas encore disponible.

## 📝 Résultat attendu

- ✅ **Si disponible** : Le modèle fonctionne et génère des images sans watermark
- ❌ **Si non disponible** : Erreur 404 "Model not found" ou similaire

## 🎯 Action recommandée

Je peux modifier le code pour tester automatiquement les deux versions et voir laquelle fonctionne. Voulez-vous que je le fasse ?
