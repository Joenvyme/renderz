export type ProfileBenefit = {
  title: string;
  body: string;
};

export type ProfileFaq = {
  q: string;
  a: string;
};

export type Profile = {
  slug: string;
  name: string;
  metaTitle: string;
  metaDescription: string;
  h1: string;
  intro: string;
  threeBenefits: [ProfileBenefit, ProfileBenefit, ProfileBenefit];
  exampleCaptions: [string, string, string];
  faq: [ProfileFaq, ProfileFaq, ProfileFaq];
  relatedSlugs: [string, string] | [string, string, string];
};

export type ProfileNavGroup = {
  label: string;
  slugs: string[];
};

export const PROFILE_NAV_GROUPS: ProfileNavGroup[] = [
  {
    label: "Design & Architecture",
    slugs: [
      "architects",
      "interior-designers",
      "landscape-architects",
      "urban-planners",
    ],
  },
  {
    label: "Real Estate",
    slugs: ["real-estate-agents", "property-developers"],
  },
  {
    label: "Specialists",
    slugs: [
      "kitchen-and-bath-designers",
      "furniture-designers",
      "renovation-contractors",
    ],
  },
];

export const PROFILES: Profile[] = [
  {
    slug: "architects",
    name: "Architects",
    metaTitle: "AI Renders for Architects | Renderz",
    metaDescription:
      "Turn floor plans and SketchUp views into geometry-faithful photoreal renders for design reviews — without waiting on a full visualization pipeline.",
    h1: "Photoreal renders for your next design review",
    intro:
      "Design meetings move faster when clients see the actual massing, light, and materials — not a generic AI reinterpretation of your layout. Renderz reads your plan or model view and returns a presentation-ready image that keeps walls, openings, and proportions intact. Skip the overnight render farm queue when you only need a credible visual for Tuesday's pin-up.",
    threeBenefits: [
      {
        title: "Plans that stay true to your geometry",
        body: "Upload a PDF plan, SketchUp export, or site photo. The output respects your camera angle and spatial logic — so reviewers compare design intent, not AI hallucinations.",
      },
      {
        title: "Three schemes, one viewpoint",
        body: "Present facade options, interior palettes, or roof forms from the identical frame. Clients decide in the room instead of juggling mismatched screenshots.",
      },
      {
        title: "Iterate in plain language",
        body: "Ask for a warmer oak floor, a slimmer guardrail, or softer afternoon light — without reopening the model or re-exporting from Revit.",
      },
    ],
    exampleCaptions: [
      "Hand-drawn plan → massing study with realistic light and shadow",
      "SketchUp viewport → client-ready interior at the same camera angle",
      "Existing site photo → proposed extension composited into context",
    ],
    faq: [
      {
        q: "Will Renderz change my floor plan layout?",
        a: "No — the product is tuned for geometry-faithful output. You describe finishes and atmosphere; the spatial structure you upload is preserved.",
      },
      {
        q: "Can I use outputs in competition boards or client PDFs?",
        a: "Yes. Pro and Enterprise plans include commercial usage rights suitable for presentations, boards, and marketing collateral.",
      },
      {
        q: "Do I need a full BIM or V-Ray setup?",
        a: "No 3D pipeline required. A plan, sketch, or screenshot plus a short prompt is enough to get a review-ready image in minutes.",
      },
    ],
    relatedSlugs: ["interior-designers", "urban-planners", "property-developers"],
  },
  {
    slug: "interior-designers",
    name: "Interior Designers",
    metaTitle: "AI Interior Visualization for Designers | Renderz",
    metaDescription:
      "Place catalog products, swap finishes, and show mood options in the same room view — so clients sign off before you order a single sample.",
    h1: "Show the finished room before the first sample arrives",
    intro:
      "Mood boards explain taste; they rarely sell spatial balance or product scale. Renderz lets you drop real catalog pieces into a room photo or plan view and iterate finishes without rebuilding a 3D scene. Walk into the client meeting with photoreal options — not a Pinterest grid they have to imagine in their head.",
    threeBenefits: [
      {
        title: "Your catalog, correctly scaled",
        body: "Pull chairs, tables, and rugs from your library into the scene. Products land at believable proportions relative to the room — not floating stock-photo furniture.",
      },
      {
        title: "Oak vs walnut in one click",
        body: "Keep the layout locked and swap wood tones, stone slabs, or textile palettes. Side-by-side decisions happen live instead of over email threads.",
      },
      {
        title: "Edit details without starting over",
        body: "Remove clutter, add a pendant, or shift a sofa — describe the change and keep the rest of the composition intact.",
      },
    ],
    exampleCaptions: [
      "Empty room photo → fully furnished scheme with specified products",
      "Same layout → Scandinavian palette vs dark walnut mood",
      "Initial render → refined version with swapped rug and lighting",
    ],
    faq: [
      {
        q: "Can I use my own product images?",
        a: "Yes. Upload catalog items to your library and place them in renders so clients see the exact SKUs you intend to specify.",
      },
      {
        q: "How is this different from generic AI room generators?",
        a: "Generic tools invent new rooms. Renderz anchors to your uploaded view and applies controlled edits — critical when you're specifying real products.",
      },
      {
        q: "Is it fast enough for live client sessions?",
        a: "Most iterations return in under a minute, which makes same-meeting revisions practical on a laptop.",
      },
    ],
    relatedSlugs: ["architects", "furniture-designers", "real-estate-agents"],
  },
  {
    slug: "real-estate-agents",
    name: "Real Estate Agents",
    metaTitle: "Virtual Staging & Listing Renders | Renderz",
    metaDescription:
      "Stage empty listings photorealistically, test furniture layouts, and publish sharper photos — without physical staging costs or long turnaround.",
    h1: "Listings that look lived-in before staging day",
    intro:
      "Empty rooms photograph flat and slow buyer imagination. Physical staging is expensive, slow, and hard to undo when a buyer prefers a different layout. Renderz virtually furnishes from listing photos while respecting room dimensions — so your MLS gallery shows potential, not bare drywall.",
    threeBenefits: [
      {
        title: "Virtual staging tied to the actual room",
        body: "Start from your wide-angle listing photo. Furniture scales to ceiling height and window placement — buyers trust what they see.",
      },
      {
        title: "Two staging styles, one property",
        body: "Show a modern family layout and a minimalist investor version without moving a single chair on site.",
      },
      {
        title: "Same-day gallery upgrades",
        body: "Publish enhanced visuals the day photos hit your desk — no coordinator, no warehouse delivery window.",
      },
    ],
    exampleCaptions: [
      "Vacant living room → warmly staged for family buyers",
      "Same floor plan → alternate furniture layout for investors",
      "Dated kitchen photo → refreshed finishes for listing refresh",
    ],
    faq: [
      {
        q: "Do I need permission to virtually stage listing photos?",
        a: "Follow your local MLS and disclosure rules. Many markets allow virtual staging when labeled; check with your brokerage compliance team.",
      },
      {
        q: "Will furniture look oversized or float?",
        a: "Renderz anchors to your photo's perspective. Pieces are placed with room-scale logic — a common failure mode of generic AI staging tools.",
      },
      {
        q: "Can my stager or photographer use the same account?",
        a: "Enterprise plans support team seats so your preferred vendors can produce renders under one subscription.",
      },
    ],
    relatedSlugs: ["property-developers", "interior-designers", "renovation-contractors"],
  },
  {
    slug: "property-developers",
    name: "Property Developers",
    metaTitle: "Pre-Sales Renders for Developers | Renderz",
    metaDescription:
      "Market units before drywall is up — photoreal interiors and exteriors from plans, consistent across your sales collateral.",
    h1: "Sell the unit before the model suite opens",
    intro:
      "Pre-sales hinge on belief: buyers must picture themselves in a space that does not exist yet. Traditional visualization vendors quote weeks and charge per angle — painful when you are A/B testing kitchen packages across a tower. Renderz turns plan views and marketing sketches into consistent, on-brand renders you can refresh as specs change.",
    threeBenefits: [
      {
        title: "Marketing imagery from early plans",
        body: "Launch campaigns with credible interiors and amenity views while construction is still in foundation phase.",
      },
      {
        title: "Package comparisons buyers understand",
        body: "Show Standard vs Premium finish tiers from the same camera — upgrade decisions become visual, not abstract line items.",
      },
      {
        title: "One visual language across channels",
        body: "Reuse renders in brochures, landing pages, and broker kits without mismatched angles or lighting between assets.",
      },
    ],
    exampleCaptions: [
      "Floor plan → hero living room for launch website",
      "Same unit type → standard vs premium finish package",
      "Amenity sketch → photoreal rooftop lounge for broker deck",
    ],
    faq: [
      {
        q: "Can we match brand guidelines and palette locks?",
        a: "Yes. Save material presets and prompt templates so every unit type stays on-brand across phases.",
      },
      {
        q: "How does pricing work at portfolio scale?",
        a: "Enterprise plans include higher monthly render volumes and team access — suited to multi-unit rollouts.",
      },
      {
        q: "Do renders replace architectural sign-off drawings?",
        a: "No. Renders are sales and marketing tools; permitted construction documents still come from your architect of record.",
      },
    ],
    relatedSlugs: ["architects", "real-estate-agents", "urban-planners"],
  },
  {
    slug: "kitchen-and-bath-designers",
    name: "Kitchen & Bath Designers",
    metaTitle: "Kitchen & Bath Visualization | Renderz",
    metaDescription:
      "Show countertop, cabinet, and tile combinations in the client's actual layout — and get sign-off before cabinets are ordered.",
    h1: "Countertop decisions made with eyes, not swatches",
    intro:
      "A 4×4 tile sample never captures how light hits a full backsplash at 6 p.m. Kitchen and bath designers lose weeks to change orders when clients mis-imagined the combo. Renderz renders your layout with specified slabs, hardware, and fixtures — then lets you swap finishes in the same view until the homeowner says yes.",
    threeBenefits: [
      {
        title: "Slab and cabinet combos in context",
        body: "Pair quartz with brass pulls or matte lacquer with marble veining — all in the client's actual galley or primary bath layout.",
      },
      {
        title: "Appliance and fixture placement",
        body: "Drop in range hoods, freestanding tubs, or panel-ready fridges at believable scale before shop drawings are finalized.",
      },
      {
        title: "Revision without redraw",
        body: "Switch from subway tile to zellige, or warm the under-cabinet glow, with a sentence — not a full re-render from your viz partner.",
      },
    ],
    exampleCaptions: [
      "Plan elevation → photoreal galley with specified cabinet line",
      "Same kitchen → quartz island vs butcher-block alternative",
      "Primary bath layout → freestanding tub with niche tile detail",
    ],
    faq: [
      {
        q: "Can I match specific manufacturer colors?",
        a: "Upload reference swatches or product photos; prompts can target named lines and finishes you specify.",
      },
      {
        q: "Will small rooms look distorted?",
        a: "Upload a photo or plan with clear proportions. Renderz preserves spatial logic — critical in tight kitchen and bath spaces.",
      },
      {
        q: "Is this useful before construction starts?",
        a: "Absolutely. Many designers use renders in the proposal stage to win the job and reduce downstream change orders.",
      },
    ],
    relatedSlugs: ["interior-designers", "renovation-contractors", "furniture-designers"],
  },
  {
    slug: "landscape-architects",
    name: "Landscape Architects",
    metaTitle: "Landscape Visualization for LA Studios | Renderz",
    metaDescription:
      "Turn site photos and planting plans into photoreal outdoor scenes — hardscape materials, planting palettes, and seasonal mood without a full 3D plant library.",
    h1: "Planting plans clients can actually read",
    intro:
      "Clients struggle to translate planting schedules and paving patterns into a finished courtyard. Building a detailed 3D planting model for every schematic design burns billable hours you cannot always recover. Renderz starts from your site photo or plan view and returns a photoreal outdoor scene — then lets you test gravel vs pavers or native vs ornamental palettes in the same frame.",
    threeBenefits: [
      {
        title: "Site context preserved",
        body: "Existing trees, slopes, and building edges stay anchored. Proposed paths and beds read as additions — not a stock garden pasted on.",
      },
      {
        title: "Hardscape material studies",
        body: "Compare basalt pavers, poured concrete, or decomposed granite from one viewpoint for quick design charrettes.",
      },
      {
        title: "Planting mood without a plant DB",
        body: "Describe structure, color, and density — meadow, formal hedge, or drought-tolerant palette — and iterate before specifying quantities.",
      },
    ],
    exampleCaptions: [
      "Backyard site photo → proposed patio and planting scheme",
      "Same courtyard → formal hedge layout vs loose native planting",
      "Entry plan view → hardscape material swap (stone vs concrete)",
    ],
    faq: [
      {
        q: "Can Renderz identify specific botanical species?",
        a: "You can prompt for species character and form; final species selection should still follow your planting schedule and zone.",
      },
      {
        q: "Does it work on steep or irregular sites?",
        a: "Yes — start from photos that show grade change. The model respects visible topography better than flat stock scenes.",
      },
      {
        q: "Useful for municipal or campus submittals?",
        a: "Many studios pair renders with drawings for public-facing boards where photoreal context helps non-designers engage.",
      },
    ],
    relatedSlugs: ["architects", "urban-planners", "property-developers"],
  },
  {
    slug: "furniture-designers",
    name: "Furniture Designers",
    metaTitle: "Product-in-Context Renders for Furniture | Renderz",
    metaDescription:
      "Place your pieces in realistic interiors for lookbooks, trade shows, and buyer meetings — without building a full room set in CAD.",
    h1: "Your chair in a room, not on white",
    intro:
      "Studio photography and blank-background CGI sell form — but buyers want to see scale, shadow, and neighbor pieces in a real dining room or lobby. Building every environment in KeyShot or Blender multiplies cost per SKU. Renderz drops your product into contextual interiors and lets you test finishes and styling for catalog drops in hours, not weeks.",
    threeBenefits: [
      {
        title: "Product hero shots in situ",
        body: "Upload your piece and place it in residential or contract settings that match your brand's target segment.",
      },
      {
        title: "Finish variants from one scene",
        body: "Show oak vs smoked oak, or bouclé vs leather — same camera, same styling props, new SKU story.",
      },
      {
        title: "Trade-show ready imagery",
        body: "Generate booth backdrop visuals and lookbook spreads before prototypes ship from the factory.",
      },
    ],
    exampleCaptions: [
      "Product cutout → dining room hero with natural window light",
      "Same table → walnut top vs white oak finish variant",
      "Lounge chair → contract lobby setting for specifier deck",
    ],
    faq: [
      {
        q: "Do I need a 3D model of my product?",
        a: "A clean product photo or simple render works. For complex forms, a basic model export improves fidelity.",
      },
      {
        q: "Can I keep backgrounds minimal for e-commerce?",
        a: "Yes — prompt for neutral interiors or controlled sets that do not compete with the product silhouette.",
      },
      {
        q: "Commercial rights for catalogs?",
        a: "Paid plans include usage suitable for lookbooks, websites, and sales decks — check your plan tier for volume limits.",
      },
    ],
    relatedSlugs: ["interior-designers", "kitchen-and-bath-designers", "real-estate-agents"],
  },
  {
    slug: "renovation-contractors",
    name: "Renovation Contractors",
    metaTitle: "Before & After Renders for Contractors | Renderz",
    metaDescription:
      "Show homeowners the finished renovation before demo day — fewer disputes, clearer scope, faster signed change orders.",
    h1: "The finished remodel, before you swing a hammer",
    intro:
      "Homeowners sign contracts based on imagination — then argue when tile or trim looks different in reality. Contractors lose margin on goodwill fixes that stem from miscommunication, not bad workmanship. Renderz turns job-site photos into photoreal after views so scope, finishes, and layout expectations align before demolition starts.",
    threeBenefits: [
      {
        title: "Scope alignment on day one",
        body: "Walk the client through a visual of the opened kitchen or new bath layout while you are still estimating.",
      },
      {
        title: "Upsell with visuals, not jargon",
        body: "Show premium countertop or cabinet upgrades side by side — upgrades sell when they are seen, not listed.",
      },
      {
        title: "Documented client expectations",
        body: "Save approved renders with the job file. When questions arise mid-build, you have a shared reference point.",
      },
    ],
    exampleCaptions: [
      "Dated kitchen photo → proposed remodel with new cabinets and counters",
      "Same space → budget package vs premium upgrade visualization",
      "Bath before photo → walk-in shower conversion preview",
    ],
    faq: [
      {
        q: "Is this a substitute for permits or architectural drawings?",
        a: "No. Renders align client expectations; structural and permitted plans still come from qualified professionals.",
      },
      {
        q: "Can my sales team use this on iPad at estimates?",
        a: "Yes — the web app runs in the browser. Most renders return fast enough for same-visit revisions.",
      },
      {
        q: "What if the client changes mind mid-project?",
        a: "Generate a revised visual before ordering new materials — cheaper than reversing installed work.",
      },
    ],
    relatedSlugs: ["kitchen-and-bath-designers", "real-estate-agents", "interior-designers"],
  },
  {
    slug: "urban-planners",
    name: "Urban Planners",
    metaTitle: "Public-Facing Planning Visuals | Renderz",
    metaDescription:
      "Translate zoning scenarios and street improvements into images residents understand — for charrettes, council packets, and community engagement.",
    h1: "Plans neighbors can picture without reading CAD",
    intro:
      "Public meetings stall when the only visuals are linework and zoning tables. Residents need to see bike lanes, park edges, and streetscape materials in context — but dedicated viz studios are rarely in the municipal budget for every alternative. Renderz turns aerials, street photos, and schematic plans into readable before/after scenes for workshops and council submittals.",
    threeBenefits: [
      {
        title: "Street-level before / after",
        body: "Show a corridor with added trees, curb extensions, or facade improvements anchored to existing photography.",
      },
      {
        title: "Scenario A vs B for workshops",
        body: "Present two development intensities or park layouts from the same vantage — feedback becomes specific, not abstract.",
      },
      {
        title: "Faster turnaround for tight deadlines",
        body: "Produce engagement visuals in-house days before a hearing instead of waiting on external consultants.",
      },
    ],
    exampleCaptions: [
      "Street photo → proposed bike lane and street trees",
      "Aerial context → mid-rise scenario at neighborhood scale",
      "Plaza sketch → activated public space with seating and shade",
    ],
    faq: [
      {
        q: "Are renders suitable for official environmental documents?",
        a: "Use them as illustrative material alongside technical analysis — not as engineering proof or legal guarantees.",
      },
      {
        q: "Can we show multiple community languages in materials?",
        a: "Export images into your own report templates; Renderz focuses on visual generation, not document layout.",
      },
      {
        q: "Does it replace dedicated urban 3D teams?",
        a: "For high-stakes masterplans you may still need full models — Renderz covers early alternatives and public engagement faster.",
      },
    ],
    relatedSlugs: ["architects", "landscape-architects", "property-developers"],
  },
];

export function getProfileBySlug(slug: string): Profile | undefined {
  return PROFILES.find((p) => p.slug === slug);
}

export function getAllProfileSlugs(): string[] {
  return PROFILES.map((p) => p.slug);
}

export function getRelatedProfiles(slug: string): Profile[] {
  const profile = getProfileBySlug(slug);
  if (!profile) return [];
  return profile.relatedSlugs
    .map((s) => getProfileBySlug(s))
    .filter((p): p is Profile => p !== undefined);
}

export function getProfileNameBySlug(slug: string): string | undefined {
  return getProfileBySlug(slug)?.name;
}
