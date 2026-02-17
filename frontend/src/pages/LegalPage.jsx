import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import LegalNav from "../components/LegalNav";
import FadeIn from "../components/ui/FadeIn";
import Grainient from "../components/ui/Grainient";

const content = {
  en: {
    terms: {
      badge: "Legal",
      title: "Terms of Service",
      subtitle: "Short rules for using Subzro safely and fairly.",
      updated: "Updated February 17, 2026",
      sections: [
        {
          heading: "Use of service",
          body: "You must use Subzro lawfully and keep your account information accurate.",
        },
        {
          heading: "Subscriptions",
          body: "Paid plans renew automatically until canceled in your billing portal.",
        },
        {
          heading: "Content and data",
          body: "You keep ownership of your content. You grant us rights only to operate and improve the service.",
        },
        {
          heading: "Availability",
          body: "We aim for stable uptime but cannot guarantee uninterrupted service.",
        },
        {
          heading: "Contact",
          body: "Legal requests: legal@subzro.com",
        },
      ],
    },
    privacy: {
      badge: "Legal",
      title: "Privacy Policy",
      subtitle: "What we collect, why we collect it, and your control options.",
      updated: "Updated February 17, 2026",
      sections: [
        {
          heading: "Data we process",
          body: "Account data, subscription entries, usage data, and support messages.",
        },
        {
          heading: "Purpose",
          body: "We process data to run the app, secure accounts, and provide customer support.",
        },
        {
          heading: "Storage and providers",
          body: "Data is stored with vetted infrastructure providers under contractual safeguards.",
        },
        {
          heading: "Your rights",
          body: "You can request access, correction, deletion, or export of your personal data.",
        },
        {
          heading: "Contact",
          body: "Privacy requests: privacy@subzro.com",
        },
      ],
    },
    refund: {
      badge: "Legal",
      title: "Refund Policy",
      subtitle: "Simple refund and cancellation rules for paid subscriptions.",
      updated: "Updated February 17, 2026",
      sections: [
        {
          heading: "Cancellation",
          body: "You can cancel anytime. Access stays active until the end of your paid period.",
        },
        {
          heading: "Refund window",
          body: "First purchase can be refunded within 14 days if no excessive abuse is detected.",
        },
        {
          heading: "Renewals",
          body: "Renewal payments are normally non-refundable unless required by law.",
        },
        {
          heading: "How to request",
          body: "Use the billing portal first. If needed, email billing@subzro.com with your invoice id.",
        },
      ],
    },
    links: {
      terms: "Terms",
      privacy: "Privacy",
      refund: "Refunds",
      backHome: "Back to home",
    },
  },
  de: {
    terms: {
      badge: "Rechtliches",
      title: "Nutzungsbedingungen",
      subtitle: "Kurze Regeln fuer eine sichere und faire Nutzung von Subzro.",
      updated: "Stand 17. Februar 2026",
      sections: [
        {
          heading: "Nutzung",
          body: "Du nutzt Subzro rechtmaessig und haeltst Kontodaten aktuell.",
        },
        {
          heading: "Abos",
          body: "Bezahlte Plaene verlaengern sich automatisch bis zur Kuendigung im Billing Portal.",
        },
        {
          heading: "Inhalte und Daten",
          body: "Deine Inhalte bleiben dein Eigentum. Wir nutzen sie nur fuer Betrieb und Verbesserung des Dienstes.",
        },
        {
          heading: "Verfuegbarkeit",
          body: "Wir arbeiten auf stabile Verfuegbarkeit hin, garantieren aber keine unterbrechungsfreie Nutzung.",
        },
        {
          heading: "Kontakt",
          body: "Rechtliche Anfragen: legal@subzro.com",
        },
      ],
    },
    privacy: {
      badge: "Rechtliches",
      title: "Datenschutzerklaerung",
      subtitle: "Welche Daten wir verarbeiten, warum, und welche Rechte du hast.",
      updated: "Stand 17. Februar 2026",
      sections: [
        {
          heading: "Verarbeitete Daten",
          body: "Kontodaten, Abo-Eintraege, Nutzungsdaten und Support-Nachrichten.",
        },
        {
          heading: "Zweck",
          body: "Wir verarbeiten Daten fuer App-Betrieb, Kontosicherheit und Support.",
        },
        {
          heading: "Speicherung und Anbieter",
          body: "Daten liegen bei geprueften Infrastruktur-Anbietern mit vertraglichen Schutzmassnahmen.",
        },
        {
          heading: "Deine Rechte",
          body: "Du kannst Auskunft, Berichtigung, Loeschung oder Datenexport anfordern.",
        },
        {
          heading: "Kontakt",
          body: "Datenschutzanfragen: privacy@subzro.com",
        },
      ],
    },
    refund: {
      badge: "Rechtliches",
      title: "Erstattungsrichtlinie",
      subtitle: "Klare Regeln fuer Kuendigung und Erstattung bei bezahlten Abos.",
      updated: "Stand 17. Februar 2026",
      sections: [
        {
          heading: "Kuendigung",
          body: "Du kannst jederzeit kuendigen. Der Zugang bleibt bis zum Ende des bezahlten Zeitraums aktiv.",
        },
        {
          heading: "Erstattungsfrist",
          body: "Der erste Kauf ist innerhalb von 14 Tagen erstattbar, sofern kein Missbrauch vorliegt.",
        },
        {
          heading: "Verlaengerungen",
          body: "Verlaengerungen sind grundsaetzlich nicht erstattbar, ausser gesetzlich vorgeschrieben.",
        },
        {
          heading: "Anfrage",
          body: "Nutze zuerst das Billing Portal. Falls noetig: billing@subzro.com mit Rechnungsnummer.",
        },
      ],
    },
    links: {
      terms: "AGB",
      privacy: "Datenschutz",
      refund: "Erstattung",
      backHome: "Zur Startseite",
    },
  },
};

function getStoredLanguage() {
  if (typeof window === "undefined") return "en";
  const value = window.localStorage.getItem("subzro-lang");
  return value === "de" ? "de" : "en";
}

export default function LegalPage({ pageKey = "terms" }) {
  const [lang, setLang] = useState(getStoredLanguage);

  useEffect(() => {
    window.localStorage.setItem("subzro-lang", lang);
  }, [lang]);

  const currentLocale = content[lang] ?? content.en;
  const page = useMemo(
    () => currentLocale[pageKey] ?? currentLocale.terms,
    [currentLocale, pageKey],
  );

  return (
    <div className="relative min-h-screen">
      <div className="fixed inset-0 -z-10">
        <Grainient />
      </div>

      <LegalNav lang={lang} onLangChange={setLang} />

      <main className="px-4 pb-16 pt-8">
        <div className="mx-auto max-w-3xl">
          <FadeIn delay={0}>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/50 px-4 py-1.5 backdrop-blur-sm">
              <span className="text-xs font-medium text-purple-900">
                {page.badge}
              </span>
            </div>
          </FadeIn>

          <FadeIn delay={0.08}>
            <section className="rounded-3xl border border-white/30 bg-white/40 p-6 shadow-xl backdrop-blur-sm sm:p-8">
              <h1 className="text-3xl font-bold tracking-tight text-black/90 sm:text-4xl">
                {page.title}
              </h1>
              <p className="mt-3 text-sm text-black/60 sm:text-base">
                {page.subtitle}
              </p>
              <p className="mt-2 text-xs font-medium uppercase tracking-wide text-purple-800">
                {page.updated}
              </p>
            </section>
          </FadeIn>

          <section className="mt-6 space-y-4">
            {page.sections.map((section, index) => (
              <FadeIn key={section.heading} delay={0.12 + index * 0.05}>
                <article className="rounded-2xl border border-white/30 bg-white/40 p-5 backdrop-blur-sm sm:p-6">
                  <h2 className="text-lg font-semibold text-black/90">
                    {section.heading}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-black/70 sm:text-base">
                    {section.body}
                  </p>
                </article>
              </FadeIn>
            ))}
          </section>

          <FadeIn delay={0.35}>
            <footer className="mt-10 rounded-2xl border border-white/30 bg-white/40 p-5 text-sm backdrop-blur-sm">
              <div className="flex flex-wrap gap-4 text-black/70">
                <Link to="/terms" className="transition hover:text-black">
                  {currentLocale.links.terms}
                </Link>
                <Link to="/privacy" className="transition hover:text-black">
                  {currentLocale.links.privacy}
                </Link>
                <Link to="/refund" className="transition hover:text-black">
                  {currentLocale.links.refund}
                </Link>
                <Link to="/" className="transition hover:text-black">
                  {currentLocale.links.backHome}
                </Link>
              </div>
            </footer>
          </FadeIn>
        </div>
      </main>
    </div>
  );
}
