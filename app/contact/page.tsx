import type { Metadata } from "next";
import { Mail, MessageSquare } from "lucide-react";
import { ContactForm } from "@/components/contact/contact-form";
import { MarketingShell } from "@/components/layout/marketing-shell";
import { PageHeader } from "@/components/marketing/page-header";
import { CONTACT_EMAIL, SITE_NAME } from "@/lib/site";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Contact",
  description: `Get in touch with the ${SITE_NAME} team. Send feedback, report issues, or ask questions.`,
  path: "/contact",
});

export default function ContactPage() {
  return (
    <MarketingShell>
      <PageHeader
        eyebrow="Contact"
        title="Get in touch"
        description={`Have a question, feedback, or partnership inquiry? We'd love to hear from you.`}
      />

      <section className="mx-auto max-w-2xl px-6 pb-24">
        <div className="mb-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-border/60 bg-card/50 p-5 backdrop-blur-xl">
            <Mail className="mb-2 h-5 w-5 text-primary" />
            <p className="text-sm font-medium">Email</p>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="text-sm text-muted-foreground transition-colors hover:text-primary"
            >
              {CONTACT_EMAIL}
            </a>
          </div>
          <div className="rounded-2xl border border-border/60 bg-card/50 p-5 backdrop-blur-xl">
            <MessageSquare className="mb-2 h-5 w-5 text-primary" />
            <p className="text-sm font-medium">Response time</p>
            <p className="text-sm text-muted-foreground">Usually within 48 hours</p>
          </div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card/50 p-8 backdrop-blur-xl">
          <ContactForm />
        </div>
      </section>
    </MarketingShell>
  );
}
