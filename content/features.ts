export type FeatureBenefit = {
  title: string;
  body: string;
};

export type FeatureFaq = {
  q: string;
  a: string;
};

export type Feature = {
  slug: string;
  /** Full display name (page title, headings). */
  name: string;
  /** Short label used in the navigation menu. */
  navLabel: string;
  metaTitle: string;
  metaDescription: string;
  /** Eyebrow shown above the H1, e.g. "Creation mode" or "Pro capability". */
  eyebrow: string;
  h1: string;
  intro: string;
  threeBenefits: [FeatureBenefit, FeatureBenefit, FeatureBenefit];
  exampleCaptions: [string, string, string];
  /** Public image path used in the example block. */
  image: string;
  faq: [FeatureFaq, FeatureFaq, FeatureFaq];
  relatedSlugs: [string, string] | [string, string, string];
};

export type FeatureNavGroup = {
  label: string;
  slugs: string[];
};

export const FEATURE_NAV_GROUPS: FeatureNavGroup[] = [
  {
    label: "Creation Modes",
    slugs: ["render-mode", "inspiration-mode", "motion-mode"],
  },
  {
    label: "Pro Capabilities",
    slugs: ["architecture-aware-ai", "material-variants", "upscaling"],
  },
];

export const FEATURES: Feature[] = [
  {
    slug: "render-mode",
    name: "Render Mode",
    navLabel: "Render Mode",
    metaTitle: "Render Mode — Sketch to Photoreal in Seconds | Renderz",
    metaDescription:
      "Turn floor plans, SketchUp screens, sketches, or photos into photoreal renders in about 30 seconds — no 3D software, no render farm.",
    eyebrow: "Creation mode",
    h1: "From input to photoreal render in seconds",
    intro:
      "Render Mode is the core of Renderz: drop in a plan, model screenshot, sketch, or photo and get a presentation-ready image back. You describe the look in plain language and the engine keeps your geometry intact while applying the materials, light, and mood you asked for. No nodes, no GPU queue, no overnight wait.",
    threeBenefits: [
      {
        title: "Any input, one workflow",
        body: "Floor plans, clay models, hand sketches, or site photos all run through the same flow — upload, describe, render. You don't switch tools depending on the source.",
      },
      {
        title: "Plain-language direction",
        body: "Type \"warm oak floor, soft afternoon light\" instead of fiddling with seeds and weights. The model translates intent into a usable result on the first try.",
      },
      {
        title: "~30 second turnaround",
        body: "Iterate live in front of a client instead of booking time with a visualization studio. Most renders come back fast enough for same-meeting revisions.",
      },
    ],
    exampleCaptions: [
      "Hand sketch → photoreal interior at the same angle",
      "SketchUp screenshot → client-ready living room",
      "Plain prompt → finished scene with materials and light",
    ],
    image: "/exemple-render.jpeg",
    faq: [
      {
        q: "Do I need SketchUp, Rhino, or any 3D software?",
        a: "No. Render Mode works from a plan, sketch, screenshot, or photo. A 3D model improves fidelity but is never required.",
      },
      {
        q: "How long does one render take?",
        a: "Typically around 30 seconds, which makes it practical to iterate during a live client conversation.",
      },
      {
        q: "Can I keep refining the same image?",
        a: "Yes. Adjust the prompt — materials, lighting, season — and re-render until the result is right.",
      },
    ],
    relatedSlugs: ["inspiration-mode", "architecture-aware-ai", "material-variants"],
  },
  {
    slug: "inspiration-mode",
    name: "Inspiration Mode",
    navLabel: "Inspiration Mode",
    metaTitle: "Inspiration Mode — Explore Concepts Fast | Renderz",
    metaDescription:
      "Generate concept directions and moodboards from a prompt before you have geometry — explore styles, palettes, and atmosphere in minutes.",
    eyebrow: "Creation mode",
    h1: "Explore the concept before you commit to geometry",
    intro:
      "Some projects start with a feeling, not a plan. Inspiration Mode lets you generate concept directions, palettes, and atmospheres from a text prompt alone — perfect for the early conversation when you're still aligning on taste. Lock the direction the client loves, then carry it into Render Mode once the geometry exists.",
    threeBenefits: [
      {
        title: "Start from a prompt, not a model",
        body: "No upload required. Describe the brief and get several visual directions to react to before any drawing is finalized.",
      },
      {
        title: "Align on taste early",
        body: "Show three moods side by side in the first meeting so the client narrows the aesthetic before you invest billable hours.",
      },
      {
        title: "Hand off to Render Mode",
        body: "When the concept is approved and the plan is ready, reuse the same direction to produce geometry-faithful renders.",
      },
    ],
    exampleCaptions: [
      "Text brief → three concept directions to choose from",
      "Mood prompt → palette and atmosphere study",
      "Approved concept → carried into a geometry-faithful render",
    ],
    image: "/Hero image – 8.png",
    faq: [
      {
        q: "Is Inspiration Mode the same as Render Mode?",
        a: "No. Inspiration Mode explores concepts from a prompt without geometry; Render Mode produces geometry-faithful images from your plan or model.",
      },
      {
        q: "Can I use these images in a client deck?",
        a: "Yes — they're ideal for early concept boards. For final, geometry-accurate visuals, move the chosen direction into Render Mode.",
      },
      {
        q: "Do I lose my chosen style when switching modes?",
        a: "No. You can describe the same look in Render Mode so the approved direction carries through.",
      },
    ],
    relatedSlugs: ["render-mode", "material-variants", "motion-mode"],
  },
  {
    slug: "motion-mode",
    name: "Motion Mode",
    navLabel: "Motion Mode",
    metaTitle: "Motion Mode — Turn Renders into Walkthroughs | Renderz",
    metaDescription:
      "Animate a still render into a short cinematic walkthrough for presentations, listings, and social — without a motion designer or a render farm.",
    eyebrow: "Creation mode",
    h1: "Bring a still render to life with motion",
    intro:
      "A moving shot holds attention in a way a flat image can't. Motion Mode turns a finished render into a short cinematic clip — a slow push-in, a pan across the space — ready for client presentations, listing pages, and social. No After Effects, no motion designer, no overnight export.",
    threeBenefits: [
      {
        title: "Render to clip in one step",
        body: "Start from an image you already generated and produce a short animated walkthrough without rebuilding anything in 3D.",
      },
      {
        title: "Presentation-ready output",
        body: "Use the clip in a pitch deck, a listing page, or an Instagram reel — formats that win attention beyond a static board.",
      },
      {
        title: "No motion toolchain",
        body: "Skip the camera-rig and keyframe workflow. Describe the movement and let the engine handle the animation.",
      },
    ],
    exampleCaptions: [
      "Finished render → slow push-in walkthrough clip",
      "Interior still → gentle pan for a listing video",
      "Hero image → short loop for social and ads",
    ],
    image: "/interior-full.png",
    faq: [
      {
        q: "Do I need video editing skills?",
        a: "No. Motion Mode animates an existing render automatically — you describe the movement, not keyframes.",
      },
      {
        q: "How long are the clips?",
        a: "Short, presentation-friendly clips suited to decks, listings, and social. Length depends on your plan's video allowance.",
      },
      {
        q: "Can I use the clips commercially?",
        a: "Paid plans include commercial usage suitable for client presentations and marketing. Check your plan tier for limits.",
      },
    ],
    relatedSlugs: ["render-mode", "upscaling", "inspiration-mode"],
  },
  {
    slug: "architecture-aware-ai",
    name: "Architecture-Aware AI",
    navLabel: "Architecture-Aware AI",
    metaTitle: "Architecture-Aware AI — Geometry-Faithful Renders | Renderz",
    metaDescription:
      "AI that understands plans versus perspectives and preserves your layout, walls, and proportions — instead of warping the design like generic image tools.",
    eyebrow: "Pro capability",
    h1: "AI that respects your geometry, not just your pixels",
    intro:
      "Generic image AI invents new rooms and bends your walls. Renderz is tuned for architecture: it recognizes the difference between a top-down plan and a perspective view, and it preserves the layout, openings, and proportions you upload. The result reads as your design rendered — not an AI reinterpretation you have to explain away in the meeting.",
    threeBenefits: [
      {
        title: "Knows plans from perspectives",
        body: "Feed a 2D plan and the output stays top-down and readable; feed a model view and it returns a perspective render at the same angle.",
      },
      {
        title: "Layout stays intact",
        body: "Walls, openings, and proportions are preserved, so reviewers compare design intent instead of spotting AI distortions.",
      },
      {
        title: "Trustworthy for client work",
        body: "Because geometry holds, you can put the render in a board or proposal without disclaiming \"the AI changed the plan.\"",
      },
    ],
    exampleCaptions: [
      "2D plan → furnished top-down view, layout unchanged",
      "Model screenshot → perspective render at the same camera",
      "Detailed elevation → faithful materials without warped lines",
    ],
    image: "/Hero image – 1.png",
    faq: [
      {
        q: "Will the AI change my floor plan?",
        a: "No. The engine is built to keep your spatial structure intact — you control finishes and atmosphere, not the layout.",
      },
      {
        q: "How is this different from generic AI image tools?",
        a: "Generic tools optimize for a pretty image and will reshape rooms. Architecture-Aware AI anchors to your uploaded geometry and angle.",
      },
      {
        q: "Does it work for both interiors and exteriors?",
        a: "Yes — it handles interior views, facades, and site context while respecting the input geometry.",
      },
    ],
    relatedSlugs: ["render-mode", "material-variants", "upscaling"],
  },
  {
    slug: "material-variants",
    name: "Material Variants",
    navLabel: "Material Variants",
    metaTitle: "Material Variants — Compare Finishes in One View | Renderz",
    metaDescription:
      "Show oak vs walnut, warm vs cool, summer vs winter on the same design and camera angle — and batch multiple options from a single prompt.",
    eyebrow: "Pro capability",
    h1: "Every material option, same view, in seconds",
    intro:
      "Clients decide faster when they can compare like-for-like. Material Variants keeps the layout and camera locked while swapping finishes, palettes, and moods — oak vs walnut, warm vs cool, summer vs winter. Generate a set of options from one prompt so the whole project stays visually consistent across rooms.",
    threeBenefits: [
      {
        title: "Locked camera, swapped finish",
        body: "The viewpoint never moves, so side-by-side comparisons are honest and the client decides on the spot.",
      },
      {
        title: "Batch options from one prompt",
        body: "Produce several palettes or rooms in a single pass to keep an entire project consistent without re-describing each scene.",
      },
      {
        title: "Fewer follow-up meetings",
        body: "Present the full range at once instead of emailing one render at a time and waiting on each reaction.",
      },
    ],
    exampleCaptions: [
      "Same living room → oak, bright, Scandinavian, and walnut",
      "One prompt → a consistent set across multiple rooms",
      "Warm vs cool palette on the identical camera angle",
    ],
    image: "/compare-scandinave.png",
    faq: [
      {
        q: "Do the variants keep the exact same layout?",
        a: "Yes — the camera and geometry stay fixed so only the materials and mood change between options.",
      },
      {
        q: "Can I match specific products or named finishes?",
        a: "Upload reference swatches or product photos and prompt for the named line you intend to specify.",
      },
      {
        q: "How many options can I generate at once?",
        a: "Batching lets you produce several variants in one pass; the exact count depends on your plan.",
      },
    ],
    relatedSlugs: ["render-mode", "architecture-aware-ai", "upscaling"],
  },
  {
    slug: "upscaling",
    name: "4K Upscaling",
    navLabel: "Upscaling",
    metaTitle: "4K Upscaling — Print-Ready Render Resolution | Renderz",
    metaDescription:
      "Boost any render to crisp, high-resolution output for competition boards, large-format prints, and marketing — without re-rendering the scene.",
    eyebrow: "Pro capability",
    h1: "Take any render to print-ready resolution",
    intro:
      "A render that looks great on screen can fall apart on an A1 board. Upscaling boosts your image to crisp, high-resolution output with sharpened detail and clean edges — ready for competition panels, large-format prints, and marketing collateral. No need to re-render the scene from scratch to get there.",
    threeBenefits: [
      {
        title: "Print-ready detail",
        body: "Bring renders up to high resolution so textures and edges stay sharp at large format instead of going soft.",
      },
      {
        title: "No re-render required",
        body: "Upscale an image you already made — keep the composition and just gain resolution and crispness.",
      },
      {
        title: "Board and marketing ready",
        body: "Deliver assets sized for competition boards, brochures, and hero banners straight from the same workflow.",
      },
    ],
    exampleCaptions: [
      "Screen render → high-resolution file for an A1 board",
      "Standard output → sharpened detail for large-format print",
      "Hero image → crisp banner for the project website",
    ],
    image: "/exemple-render.jpeg",
    faq: [
      {
        q: "Does upscaling change my composition?",
        a: "No — it preserves the image and increases resolution and sharpness so you can print large.",
      },
      {
        q: "What resolution can I reach?",
        a: "High enough for competition boards and large-format prints. Exact ceilings depend on your plan tier.",
      },
      {
        q: "Do I need to re-render to upscale?",
        a: "No. You upscale an existing render directly, which saves time and keeps the look you already approved.",
      },
    ],
    relatedSlugs: ["render-mode", "material-variants", "motion-mode"],
  },
];

export function getFeatureBySlug(slug: string): Feature | undefined {
  return FEATURES.find((f) => f.slug === slug);
}

export function getAllFeatureSlugs(): string[] {
  return FEATURES.map((f) => f.slug);
}

export function getFeatureNavLabel(slug: string): string | undefined {
  return getFeatureBySlug(slug)?.navLabel;
}

export function getRelatedFeatures(slug: string): Feature[] {
  const feature = getFeatureBySlug(slug);
  if (!feature) return [];
  return feature.relatedSlugs
    .map((s) => getFeatureBySlug(s))
    .filter((f): f is Feature => f !== undefined);
}
