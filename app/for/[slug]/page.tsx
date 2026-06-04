import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ProfileTrialCta } from "@/components/marketing/profile-trial-cta";
import { AuroraText } from "@/components/ui/aurora-text";
import {
  getAllProfileSlugs,
  getProfileBySlug,
  getRelatedProfiles,
} from "@/content/profiles";
import {
  SECTION_H2_CLASSES,
  SECTION_LEAD_CLASSES,
  SECTION_PADDING,
} from "@/lib/marketing-layout";
import { getSiteUrl } from "@/lib/site-url";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return getAllProfileSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const profile = getProfileBySlug(slug);
  if (!profile) return {};

  const url = `${getSiteUrl()}/for/${profile.slug}`;

  return {
    title: profile.metaTitle,
    description: profile.metaDescription,
    alternates: { canonical: url },
    openGraph: {
      title: profile.metaTitle,
      description: profile.metaDescription,
      url,
      type: "website",
      siteName: "Renderz",
    },
    twitter: {
      card: "summary_large_image",
      title: profile.metaTitle,
      description: profile.metaDescription,
    },
  };
}

function FaqJsonLd({ faq }: { faq: { q: string; a: string }[] }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export default async function ProfileLandingPage({ params }: PageProps) {
  const { slug } = await params;
  const profile = getProfileBySlug(slug);
  if (!profile) notFound();

  const related = getRelatedProfiles(slug);

  return (
    <>
      <FaqJsonLd faq={profile.faq} />

      <section className={`relative border-b border-border/40 bg-white ${SECTION_PADDING}`}>
        <div className="container mx-auto w-full min-w-0 px-4 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              For {profile.name}
            </p>
            <h1 className="text-balance text-[clamp(1.75rem,5vw,3.25rem)] font-semibold leading-[1.08] tracking-tight text-foreground">
              {profile.h1}
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground md:text-lg">
              {profile.intro}
            </p>
          </div>
        </div>
      </section>

      <section className={`relative border-t border-border/50 bg-white ${SECTION_PADDING}`}>
        <div className="container mx-auto w-full min-w-0 px-4 sm:px-6">
          <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3 md:gap-6 lg:gap-8">
            {profile.threeBenefits.map((benefit) => (
              <div
                key={benefit.title}
                className="rounded-[6px] border border-border/50 bg-white/50 p-6 shadow-[0_8px_32px_rgba(0,0,0,0.04)] backdrop-blur-xl"
              >
                <h2 className="text-lg font-semibold tracking-tight text-foreground">
                  {benefit.title}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
                  {benefit.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={`relative border-t border-border/50 bg-white ${SECTION_PADDING}`}>
        <div className="container mx-auto w-full min-w-0 px-4 sm:px-6">
          <div className="mx-auto max-w-4xl">
            <div className="mb-10 space-y-3 text-center sm:mb-14">
              <h2 className={SECTION_H2_CLASSES}>
                See the <AuroraText>difference</AuroraText>
              </h2>
              <p className={SECTION_LEAD_CLASSES}>
                Same workflow as the main demo — your input, a photoreal output.
              </p>
            </div>

            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl border border-border/40 bg-muted/20 shadow-[0_24px_80px_-32px_rgba(0,0,0,0.25)]">
              <Image
                src="/exemple-render.jpeg"
                alt="Photoreal render example"
                fill
                sizes="(max-width: 768px) 100vw, 896px"
                className="object-cover"
                priority
              />
            </div>

            <ul className="mt-8 space-y-3 text-sm text-muted-foreground sm:mt-10 sm:text-base">
              {profile.exampleCaptions.map((caption) => (
                <li key={caption} className="flex gap-3">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-foreground/40" />
                  <span>{caption}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className={`relative border-t border-border/50 bg-white ${SECTION_PADDING}`}>
        <div className="container mx-auto w-full min-w-0 px-4 sm:px-6">
          <div className="mx-auto max-w-3xl">
            <h2 className={`${SECTION_H2_CLASSES} mb-10 text-center sm:mb-14`}>
              Frequently asked <AuroraText>questions</AuroraText>
            </h2>
            <dl className="space-y-8">
              {profile.faq.map((item) => (
                <div key={item.q}>
                  <dt className="text-base font-semibold text-foreground sm:text-lg">
                    {item.q}
                  </dt>
                  <dd className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
                    {item.a}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {related.length > 0 ? (
        <section className="relative border-t border-border/50 bg-white py-12 sm:py-16">
          <div className="container mx-auto w-full min-w-0 px-4 sm:px-6">
            <div className="mx-auto max-w-3xl text-center">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Also for
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                {related.map((rel) => (
                  <Link
                    key={rel.slug}
                    href={`/for/${rel.slug}`}
                    className="rounded-[2px] border border-border/60 px-4 py-2 font-mono text-xs uppercase tracking-wide text-foreground transition-colors hover:bg-muted"
                  >
                    {rel.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <ProfileTrialCta profileName={profile.name} />
    </>
  );
}
