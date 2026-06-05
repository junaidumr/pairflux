import type { Metadata } from "next";
import { MarketingShell } from "@/components/layout/marketing-shell";
import { PageHeader } from "@/components/marketing/page-header";
import { SITE_NAME } from "@/lib/site";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Privacy Policy",
  description: `${SITE_NAME} privacy policy — no file storage, peer-to-peer architecture, and minimal data collection.`,
  path: "/privacy",
});

export default function PrivacyPage() {
  const updated = "June 5, 2026";

  return (
    <MarketingShell>
      <PageHeader
        eyebrow="Legal"
        title="Privacy Policy"
        description={`Last updated: ${updated}`}
      />

      <article className="prose-policy mx-auto max-w-3xl space-y-8 px-6 pb-24 text-muted-foreground">
        <section>
          <h2 className="text-lg font-semibold text-foreground">Overview</h2>
          <p className="mt-3 leading-relaxed">
            {SITE_NAME} is designed with privacy as a core principle. We do not store, access,
            or analyze the content you share. This policy explains what limited data is
            processed and how our peer-to-peer architecture protects your information.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">No file storage</h2>
          <p className="mt-3 leading-relaxed">
            {SITE_NAME} does not upload your files to any server. All file transfers occur
            directly between browsers using WebRTC encrypted data channels. We have no ability
            to view, copy, or retain your shared content.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">Peer-to-peer architecture</h2>
          <p className="mt-3 leading-relaxed">
            A lightweight signaling server facilitates device discovery and WebRTC handshake
            (offers, answers, and ICE candidates). This metadata is transient and exists only
            to establish a direct connection. Once peers connect, file and message data flows
            exclusively between devices.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">No account tracking</h2>
          <p className="mt-3 leading-relaxed">
            {SITE_NAME} does not require registration. We do not collect names, email addresses,
            phone numbers, or other personal identifiers as part of normal app usage. Each
            browser generates a random device ID stored locally on your device.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">Local data</h2>
          <p className="mt-3 leading-relaxed">
            Your browser stores a device name, device ID, and list of trusted paired peers in
            local storage. This data never leaves your device unless you explicitly share files
            or messages with a paired peer over WebRTC.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">Contact form</h2>
          <p className="mt-3 leading-relaxed">
            If you submit our contact form, the information you provide (name, email, subject,
            and message) is stored locally in your browser or sent to a configured endpoint.
            We use this solely to respond to your inquiry.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">Cookies & analytics</h2>
          <p className="mt-3 leading-relaxed">
            {SITE_NAME} does not use tracking cookies or third-party analytics on the sharing
            application. Hosting providers (e.g., Vercel, Render) may collect standard server
            logs for infrastructure purposes.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">Changes</h2>
          <p className="mt-3 leading-relaxed">
            We may update this policy as the service evolves. Material changes will be reflected
            on this page with an updated date.
          </p>
        </section>
      </article>
    </MarketingShell>
  );
}
