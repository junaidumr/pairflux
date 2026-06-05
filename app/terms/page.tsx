import type { Metadata } from "next";
import { MarketingShell } from "@/components/layout/marketing-shell";
import { PageHeader } from "@/components/marketing/page-header";
import { SITE_NAME } from "@/lib/site";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Terms of Service",
  description: `${SITE_NAME} terms of service — acceptable use, responsibilities, and limitations.`,
  path: "/terms",
});

export default function TermsPage() {
  const updated = "June 5, 2026";

  return (
    <MarketingShell>
      <PageHeader
        eyebrow="Legal"
        title="Terms of Service"
        description={`Last updated: ${updated}`}
      />

      <article className="prose-policy mx-auto max-w-3xl space-y-8 px-6 pb-24 text-muted-foreground">
        <section>
          <h2 className="text-lg font-semibold text-foreground">Agreement</h2>
          <p className="mt-3 leading-relaxed">
            By using {SITE_NAME}, you agree to these Terms of Service. If you do not agree,
            please do not use the service.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">Service description</h2>
          <p className="mt-3 leading-relaxed">
            {SITE_NAME} is a browser-based peer-to-peer file sharing tool. The service facilitates
            device discovery and WebRTC connections but does not store, host, or transmit your
            file content through our servers.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">Acceptable use</h2>
          <p className="mt-3 leading-relaxed">You agree not to use {SITE_NAME} to:</p>
          <ul className="mt-3 list-inside list-disc space-y-2">
            <li>Share unlawful, harmful, or infringing content</li>
            <li>Distribute malware, viruses, or malicious code</li>
            <li>Harass, abuse, or harm other users</li>
            <li>Attempt to disrupt or compromise the service infrastructure</li>
            <li>Violate applicable local, national, or international laws</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">User responsibilities</h2>
          <p className="mt-3 leading-relaxed">
            You are solely responsible for the content you share and receive. Verify pairing
            codes before accepting connections. Ensure you have the right to share any files you
            transfer. {SITE_NAME} cannot recover lost files or reverse completed transfers.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">Service limitations</h2>
          <p className="mt-3 leading-relaxed">
            {SITE_NAME} is provided on an &quot;as available&quot; basis. Transfers depend on
            network conditions, browser support, and device compatibility. We do not guarantee
            uninterrupted availability, specific transfer speeds, or compatibility with all
            networks (corporate firewalls may require TURN relay configuration).
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">Disclaimer</h2>
          <p className="mt-3 leading-relaxed">
            {SITE_NAME} is provided &quot;as is&quot; without warranties of any kind, express or
            implied. We disclaim liability for data loss, connection failures, unauthorized
            sharing, or damages arising from use of the service. Your use of {SITE_NAME} is at
            your own risk.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">Modifications</h2>
          <p className="mt-3 leading-relaxed">
            We reserve the right to modify or discontinue the service at any time. Continued use
            after changes to these terms constitutes acceptance of the updated terms.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">Contact</h2>
          <p className="mt-3 leading-relaxed">
            Questions about these terms? Visit our{" "}
            <a href="/contact" className="text-primary hover:underline">
              contact page
            </a>
            .
          </p>
        </section>
      </article>
    </MarketingShell>
  );
}
