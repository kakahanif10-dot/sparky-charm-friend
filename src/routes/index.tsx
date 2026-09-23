import { createFileRoute } from "@tanstack/react-router";

import { SiteHeader } from "@/components/landing/site-header";
import { Hero } from "@/components/landing/hero";
import { Showcase } from "@/components/landing/showcase";
import { Features } from "@/components/landing/features";
import { HowItWorks } from "@/components/landing/how-it-works";
import { PricingCta } from "@/components/landing/pricing-cta";
import { SiteFooter } from "@/components/landing/site-footer";

const title = "SUPERINTELLIGENS — Build software with AI";
const description =
  "Describe your idea in plain language and watch it become a real, deployable app with instant preview and one-click deploy.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: HomePage,
});

function HomePage() {
  return (
    <main className="landing-page relative min-h-screen bg-background">
      <div className="hero-pastel">
        <SiteHeader />
        <Hero />
      </div>

      <div className="landing-light">
        <Showcase />
        <Features />
        <HowItWorks />
        <PricingCta />
        <SiteFooter />
      </div>
    </main>
  );
}
