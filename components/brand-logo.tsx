import Link from "next/link";
import { cn } from "@/lib/utils";

export const BRAND_LOGO_SRC = "/logo-renderz.svg";

type BrandLogoProps = {
  className?: string;
  /** Hauteur / largeur max du logo (ratio du SVG conservé). */
  imgClassName?: string;
  href?: string;
  /** Pour le LCP sur la landing (hero header). */
  priority?: boolean;
  /** Image seule (ex. modale) — pas de lien vers l’accueil. */
  asStatic?: boolean;
};

export function BrandLogo({
  className,
  imgClassName = "h-7 w-auto max-w-[148px] sm:h-8 sm:max-w-[168px]",
  href = "/",
  priority,
  asStatic,
}: BrandLogoProps) {
  const img = (
    <img
      src={BRAND_LOGO_SRC}
      alt="Renderz"
      width={829}
      height={300}
      className={cn("object-contain object-left", imgClassName)}
      {...(priority ? { fetchPriority: "high" as const } : {})}
    />
  );

  if (asStatic) {
    return (
      <span className={cn("inline-flex shrink-0 items-center", className)} role="img" aria-label="Renderz">
        {img}
      </span>
    );
  }

  return (
    <Link
      href={href}
      className={cn(
        "inline-flex shrink-0 items-center rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )}
    >
      {img}
    </Link>
  );
}
