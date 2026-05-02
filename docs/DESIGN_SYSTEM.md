# Renderz — référence design & identité visuelle (CI)

Document de référence pour garder une cohérence entre la **page d’accueil**, le **profil / studio** et les composants partagés (générateur, tarifs, etc.).

## Fond de page & motif

- **Fond principal** : `bg-white`.
- **Motif rayé** (`StripedPattern`, `@/components/magicui/striped-pattern`) : couche décorative en `absolute` ou `fixed` avec masque radial pour atténuer les bords, par ex.  
  `[mask-image:radial-gradient(800px_circle_at_center,white,transparent)]`.
- Le hero marketing peut rester **plein écran sombre** (`bg-black`) au-dessus du fond ; les sections claires utilisent `bg-white` avec séparateurs `border-t border-border/50` si besoin.

## En-tête (header)

- **Position** : `fixed top-0 left-0 right-0`.
- **Z-index** : `z-[100]` (au-dessus du contenu scrollable ; le studio plein écran peut monter plus haut, ex. `z-[120]`).
- **Style** : `bg-white/80 backdrop-blur-sm border-b border-border`.
- **Logo « RENDERZ »** : `system-ui, -apple-system, sans-serif`, `letter-spacing: -0.05em`, `text-xl sm:text-2xl font-bold tracking-tighter`, lien vers `/`, hover `opacity-80`.

## Rayons (border-radius)

Le thème utilise `--radius: 0rem` dans `app/globals.css` : les utilitaires Tailwind basés sur `var(--radius)` (`rounded-md`, etc.) ne donnent pas un arrondi fiable. **Toujours préférer des rayons explicites** en `rounded-[…px]` pour l’UI produit.

| Niveau | Valeur | Classes | Usage typique |
|--------|--------|---------|-----------------|
| **Léger / micro** | 2px | `rounded-[2px]` | Boutons outline (header, secondaires), segments (rôles d’image), mini-actions (suppr. vignette), champs formulaire discrets, alertes inline |
| **Compact** | 4px | `rounded-[4px]` | Tuiles galerie, vignettes, sélecteurs d’aspect, pastilles liste, bouton « + » hero, badges techniques |
| **Panneau** | 6px | `rounded-[6px]` | Cartes (`Card`), toasts sombres, zones catalogue scrollables |
| **Prompt bar** | 28px | `rounded-[28px]` | Zone upload minimale hero / barre de prompt compacte (`render-generator`) |
| **Pill** | — | `rounded-full` | Badge hero « Swiss mountains », avatars, toggles circulaires |

Règle d’ensemble : **léger (2px)** sur tout ce qui est dense ou monospace ; **compact (4px)** dès qu’il s’agit d’un bloc visuel identifiable ; **panneau (6px)** pour un conteneur principal.

## Verre (glass) & ombres

- **Surfaces flottantes** (upload hero, cartes formulaire, contact) :  
  `bg-white/50 backdrop-blur-xl border border-border/50`  
  + ombre douce : `shadow-[0_8px_32px_rgba(0,0,0,0.06)]`.
- **Carte Pro / mise en avant** : même idée avec `bg-white/80` et ombre un peu plus marquée si nécessaire.

## Bordures & séparation

- Bordures légères : `border-border/50` ou `border-border` selon le contraste.
- **Séparation de sections** (landing) : `border-t border-border/50` entre blocs clairs.
- **Hero → contenu** : `border-b border-border/40` sur le conteneur hero si on veut une transition nette.

## Typographie & labels UI

- **Mono / technique** : `font-mono`, `uppercase`, `tracking-wider` pour labels de formulaire, boutons d’action type `GENERATE`, `SIGN OUT`.
- **Titres marketing** : conserver les choix éditoriaux existants (ex. `AuroraText` sur la landing) ; ce document ne prescrit pas le libellé, seulement le **cadre visuel**.

## Boutons primaires (noir)

- Fond `#000000` / hover `#1a1a1a`, texte blanc.
- **CTA pleine largeur** (générer, envoyer message) : `rounded-[4px]` (un peu plus lisible qu’un 2px sur une grande cible).
- **Boutons secondaires** (outline, ghost, `size="sm"`) : `rounded-[2px]` pour rester alignés avec le look « précision technique ».

## Composants de référence

- **Profil** : `app/profile/page.tsx` — header, galerie (`rounded-[4px]` / coins masonry `14px` en haut selon la tuile).
- **Générateur** : `components/render-generator.tsx` — pill prompt `rounded-[28px]`, verre et ombre ci-dessus.
- **Slider avant/après** : `components/before-after-slider.tsx` — cadre `rounded-[4px]`, `border-border/50` ; pastilles de labels (si affichées) `rounded-[2px]`.

## Z-index (échelle indicative)

| Élément | Z-index |
|---------|---------|
| Motif / fond décoratif | `0` |
| Contenu scroll principal | `10` |
| Header fixe | `100` |
| Toasts / modales selon besoin | `100`+ |
| Studio plein écran (fermer au-dessus du header) | `120` (ajuster si conflit) |

## Checklist pour une nouvelle page

1. Fond `bg-white` + `StripedPattern` si la page suit le shell « app ».
2. Header aligné (blur, bordure, z-index, logo).
3. Cartes : `rounded-[6px]`, bordure `border-border/50`, verre + ombre standard.
4. Petits blocs / tuiles : `rounded-[4px]`.
5. Champs, alertes inline, boutons outline / ghost : `rounded-[2px]` (rayon léger).
6. CTA noir large (génération, envoi) : `rounded-[4px]`.
7. Ne pas changer les **textes de titres** validés produit sans validation explicite.

---

*Dernière mise à jour : mars 2026 — à faire évoluer avec les maquettes Figma ou tokens Tailwind centralisés si le projet en introduit.*
