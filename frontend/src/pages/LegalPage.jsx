import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import LegalNav from "../components/LegalNav";
import FadeIn from "../components/ui/FadeIn";
import Grainient from "../components/ui/Grainient";

const business = {
  legalName: "Jerry Schmalz",
  brand: "Subzro",
  street: "Berliner Str 12",
  city: "14169 Berlin",
  country: "Germany",
  email: "jr.a.schmalz@gmail.com",
  phone: "+49 160 97740241",
  website: "https://subzro.vercel.app",
};

const content = {
  en: {
    imprint: {
      badge: "Legal",
      title: "Imprint",
      subtitle: "Provider information under Section 5 DDG and Section 18 (2) MStV.",
      updated: "Updated February 17, 2026",
      sections: [
        {
          heading: "Provider",
          body: `${business.legalName} (sole proprietor), ${business.brand}\n${business.street}\n${business.city}\n${business.country}`,
        },
        {
          heading: "Contact",
          body: `Email: ${business.email}\nPhone: ${business.phone}`,
        },
        {
          heading: "Responsible for content",
          body: `Responsible according to Section 18 (2) MStV:\n${business.legalName}\nAddress as above.`,
        },
        {
          heading: "Business activity",
          body: "Operation of a subscription management software service and freelance web development.",
        },
        {
          heading: "VAT information",
          body: "VAT ID according to Section 27a UStG: not provided.",
        },
        {
          heading: "Consumer dispute resolution",
          body: "We are not willing and not obliged to participate in dispute resolution proceedings before a consumer arbitration board (Section 36 VSBG).",
        },
        {
          heading: "EU online dispute platform",
          body: "The EU online dispute resolution platform was discontinued on July 20, 2025 under Regulation (EU) 2024/3228.",
        },
      ],
    },
    terms: {
      badge: "Legal",
      title: "Terms of Service",
      subtitle: "Contract terms for use of Subzro software services.",
      updated: "Updated February 17, 2026",
      sections: [
        {
          heading: "Scope and provider",
          body: `${business.brand} is provided by ${business.legalName}. These terms apply to all users of ${business.website}.`,
        },
        {
          heading: "Account and contract conclusion",
          body: "A contract is formed when you complete sign up and, for paid plans, when checkout is completed successfully.",
        },
        {
          heading: "Prices, billing, and renewal",
          body: "All prices shown at checkout are binding. Paid subscriptions renew automatically for the selected billing period unless canceled before renewal.",
        },
        {
          heading: "Cancellation",
          body: "You can cancel through the billing portal or by email at any time. Access remains active until the end of the paid period unless a statutory withdrawal right applies.",
        },
        {
          heading: "Consumer withdrawal rights",
          body: "For consumers, statutory withdrawal rights apply. Details are provided on the refund page, including the model withdrawal form.",
        },
        {
          heading: "Acceptable use",
          body: "You must not misuse the service, interfere with security, or use the service for unlawful purposes.",
        },
        {
          heading: "Availability and changes",
          body: "We may update features for security, legal compliance, and product improvement. We aim for high availability but do not guarantee uninterrupted operation.",
        },
        {
          heading: "Liability",
          body: "Unlimited liability applies for intent, gross negligence, injury to life, body, or health, and mandatory statutory liability. Otherwise liability is limited to foreseeable, typical damage.",
        },
        {
          heading: "Applicable law",
          body: "German law applies. Mandatory consumer protection rules of your country of residence remain unaffected.",
        },
      ],
    },
    privacy: {
      badge: "Legal",
      title: "Privacy Policy",
      subtitle: "Information under Articles 13 and 14 GDPR.",
      updated: "Updated February 17, 2026",
      sections: [
        {
          heading: "Controller",
          body: `${business.legalName}\n${business.street}, ${business.city}, ${business.country}\nEmail: ${business.email}`,
        },
        {
          heading: "Data categories",
          body: "Account and contact data, authentication data, subscription records entered by users, usage logs, billing data, and support communication.",
        },
        {
          heading: "Purposes and legal basis",
          body: "Contract performance (Art. 6(1)(b) GDPR), legal obligations (Art. 6(1)(c) GDPR), legitimate interests such as service security and abuse prevention (Art. 6(1)(f) GDPR), and consent where required (Art. 6(1)(a) GDPR).",
        },
        {
          heading: "Recipients",
          body: "Data is processed by hosting, database, authentication, email, analytics, and payment providers strictly as required to operate the service under data processing agreements where applicable.",
        },
        {
          heading: "International transfers",
          body: "If data is transferred to countries outside the EEA, appropriate safeguards such as Standard Contractual Clauses are used.",
        },
        {
          heading: "Storage periods",
          body: "Data is stored only as long as needed for contract fulfillment and statutory retention obligations. Then data is deleted or anonymized.",
        },
        {
          heading: "Your rights",
          body: "You can request access, rectification, erasure, restriction, data portability, and object to processing. You can revoke consent at any time with future effect.",
        },
        {
          heading: "Supervisory authority",
          body: "You have the right to lodge a complaint with a data protection authority, including the authority responsible for Berlin.",
        },
      ],
    },
    refund: {
      badge: "Legal",
      title: "Refund and Withdrawal Policy",
      subtitle: "Consumer withdrawal rights, cancellations, and refunds.",
      updated: "Updated February 17, 2026",
      sections: [
        {
          heading: "Statutory withdrawal right for consumers",
          body: "Consumers have a right of withdrawal within 14 days from contract conclusion. To exercise withdrawal, send a clear statement by email to the contact listed on this page.",
        },
        {
          heading: "Expiry of withdrawal right",
          body: "For digital services, the withdrawal right may expire when service performance starts after your explicit consent and your acknowledgment that you lose the withdrawal right once performance begins (Section 356 BGB).",
        },
        {
          heading: "Cancellation of subscriptions",
          body: "Subscriptions can be canceled any time before the next renewal. Cancellation stops future renewals and remains active until the end of the current paid period.",
        },
        {
          heading: "Refund handling",
          body: "If a valid withdrawal is declared in time, payments are refunded via the original payment method within 14 days. Outside statutory rights, refunds are granted only where legally required or as a voluntary goodwill decision.",
        },
        {
          heading: "Model withdrawal form",
          body: "To: " + business.email + "\nI/We hereby withdraw from the contract concluded by me/us for the provision of the following service:\nOrdered on:\nName of consumer(s):\nAddress of consumer(s):\nDate:\nSignature (only if submitted on paper):",
        },
      ],
    },
    links: {
      imprint: "Imprint",
      terms: "Terms",
      privacy: "Privacy",
      refund: "Refunds",
      backHome: "Back to home",
    },
  },
  de: {
    imprint: {
      badge: "Rechtliches",
      title: "Impressum",
      subtitle: "Anbieterangaben gemaess Paragraph 5 DDG und Paragraph 18 Abs. 2 MStV.",
      updated: "Stand 17. Februar 2026",
      sections: [
        {
          heading: "Anbieter",
          body: `${business.legalName} (Einzelunternehmer), ${business.brand}\n${business.street}\n${business.city}\n${business.country}`,
        },
        {
          heading: "Kontakt",
          body: `E-Mail: ${business.email}\nTelefon: ${business.phone}`,
        },
        {
          heading: "Inhaltlich verantwortlich",
          body: `Verantwortlich gemaess Paragraph 18 Abs. 2 MStV:\n${business.legalName}\nAnschrift wie oben.`,
        },
        {
          heading: "Taetigkeit",
          body: "Betrieb eines Softwaredienstes zur Abo-Verwaltung sowie freiberufliche Webentwicklung.",
        },
        {
          heading: "Umsatzsteuer",
          body: "Umsatzsteuer-Identifikationsnummer gemaess Paragraph 27a UStG: nicht angegeben.",
        },
        {
          heading: "Verbraucherstreitbeilegung",
          body: "Wir sind nicht bereit und nicht verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen (Paragraph 36 VSBG).",
        },
        {
          heading: "EU-Online-Streitbeilegung",
          body: "Die EU-Plattform fuer Online-Streitbeilegung wurde zum 20. Juli 2025 durch die Verordnung (EU) 2024/3228 eingestellt.",
        },
      ],
    },
    terms: {
      badge: "Rechtliches",
      title: "Nutzungsbedingungen",
      subtitle: "Vertragsbedingungen fuer die Nutzung der Softwaredienste von Subzro.",
      updated: "Stand 17. Februar 2026",
      sections: [
        {
          heading: "Geltungsbereich und Anbieter",
          body: `${business.brand} wird von ${business.legalName} betrieben. Diese Bedingungen gelten fuer alle Nutzerinnen und Nutzer von ${business.website}.`,
        },
        {
          heading: "Vertragsschluss",
          body: "Der Vertrag kommt mit erfolgreicher Registrierung zustande, bei kostenpflichtigen Plaenen mit erfolgreichem Abschluss des Checkouts.",
        },
        {
          heading: "Preise, Abrechnung und Verlaengerung",
          body: "Es gelten die im Checkout angezeigten Preise. Bezahlte Abos verlaengern sich automatisch um die gewaehlte Laufzeit, sofern nicht vorher gekuendigt wird.",
        },
        {
          heading: "Kuendigung",
          body: "Eine Kuendigung ist jederzeit ueber das Billing Portal oder per E-Mail moeglich. Der Zugang bleibt bis zum Ende des bezahlten Zeitraums aktiv, soweit kein gesetzliches Widerrufsrecht greift.",
        },
        {
          heading: "Widerrufsrechte",
          body: "Fuer Verbraucher gelten die gesetzlichen Widerrufsrechte. Details stehen in der Erstattungs- und Widerrufsrichtlinie inklusive Musterformular.",
        },
        {
          heading: "Zulaessige Nutzung",
          body: "Die Nutzung fuer rechtswidrige Zwecke, Sicherheitsumgehung oder Missbrauch ist unzulaessig.",
        },
        {
          heading: "Verfuegbarkeit und Aenderungen",
          body: "Funktionen duerfen aus Sicherheits-, Rechts- oder Produktgruenden angepasst werden. Eine unterbrechungsfreie Verfuegbarkeit wird nicht garantiert.",
        },
        {
          heading: "Haftung",
          body: "Unbeschraenkte Haftung gilt bei Vorsatz, grober Fahrlaessigkeit, Verletzung von Leben, Koerper, Gesundheit und bei zwingender gesetzlicher Haftung. Im Uebrigen ist die Haftung auf vorhersehbare, vertragstypische Schaeden begrenzt.",
        },
        {
          heading: "Anwendbares Recht",
          body: "Es gilt deutsches Recht. Zwingende Verbraucherschutzvorschriften des Wohnsitzstaates bleiben unberuehrt.",
        },
      ],
    },
    privacy: {
      badge: "Rechtliches",
      title: "Datenschutzerklaerung",
      subtitle: "Informationen gemaess Artikel 13 und 14 DSGVO.",
      updated: "Stand 17. Februar 2026",
      sections: [
        {
          heading: "Verantwortlicher",
          body: `${business.legalName}\n${business.street}, ${business.city}, ${business.country}\nE-Mail: ${business.email}`,
        },
        {
          heading: "Datenkategorien",
          body: "Konto- und Kontaktdaten, Authentifizierungsdaten, vom Nutzer erfasste Abo-Daten, Nutzungsprotokolle, Abrechnungsdaten und Support-Kommunikation.",
        },
        {
          heading: "Zwecke und Rechtsgrundlagen",
          body: "Vertragserfuellung (Art. 6 Abs. 1 lit. b DSGVO), rechtliche Pflichten (Art. 6 Abs. 1 lit. c DSGVO), berechtigte Interessen wie IT-Sicherheit und Missbrauchsverhinderung (Art. 6 Abs. 1 lit. f DSGVO) sowie Einwilligung, sofern erforderlich (Art. 6 Abs. 1 lit. a DSGVO).",
        },
        {
          heading: "Empfaenger",
          body: "Zur Leistungserbringung werden Hosting-, Datenbank-, Authentifizierungs-, E-Mail-, Analyse- und Zahlungsanbieter eingesetzt, soweit erforderlich und vertraglich abgesichert.",
        },
        {
          heading: "Drittlandtransfer",
          body: "Bei Uebermittlungen ausserhalb des EWR werden geeignete Garantien wie Standardvertragsklauseln genutzt.",
        },
        {
          heading: "Speicherdauer",
          body: "Daten werden nur solange gespeichert, wie es fuer Vertragserfuellung und gesetzliche Aufbewahrungspflichten erforderlich ist. Danach erfolgt Loeschung oder Anonymisierung.",
        },
        {
          heading: "Betroffenenrechte",
          body: "Du hast Rechte auf Auskunft, Berichtigung, Loeschung, Einschraenkung, Datenuebertragbarkeit und Widerspruch. Einwilligungen koennen jederzeit fuer die Zukunft widerrufen werden.",
        },
        {
          heading: "Beschwerderecht",
          body: "Du kannst dich bei einer Datenschutzaufsichtsbehoerde beschweren, insbesondere bei der fuer Berlin zustaendigen Behoerde.",
        },
      ],
    },
    refund: {
      badge: "Rechtliches",
      title: "Erstattungs- und Widerrufsrichtlinie",
      subtitle: "Gesetzliche Widerrufsrechte, Kuendigung und Erstattung.",
      updated: "Stand 17. Februar 2026",
      sections: [
        {
          heading: "Gesetzliches Widerrufsrecht fuer Verbraucher",
          body: "Verbraucher haben ein Widerrufsrecht von 14 Tagen ab Vertragsschluss. Zur Ausuebung reicht eine eindeutige Erklaerung per E-Mail an die auf dieser Seite genannte Adresse.",
        },
        {
          heading: "Erloschen des Widerrufsrechts",
          body: "Bei digitalen Dienstleistungen kann das Widerrufsrecht erloeschen, wenn die Leistung nach ausdruecklicher Zustimmung und Bestaetigung des Verlusts des Widerrufsrechts begonnen hat (Paragraph 356 BGB).",
        },
        {
          heading: "Kuendigung von Abonnements",
          body: "Abos koennen bis vor der naechsten Verlaengerung gekuendigt werden. Nach Kuendigung endet nur die zukuenftige Verlaengerung, der Zugang bleibt bis Periodenende bestehen.",
        },
        {
          heading: "Erstattungsabwicklung",
          body: "Bei wirksamem Widerruf werden Zahlungen innerhalb von 14 Tagen ueber dasselbe Zahlungsmittel erstattet. Ausserhalb gesetzlicher Ansprueche erfolgen Erstattungen nur, wenn gesetzlich geboten oder freiwillig als Kulanz.",
        },
        {
          heading: "Muster-Widerrufsformular",
          body: "An: " + business.email + "\nHiermit widerrufe(n) ich/wir den von mir/uns abgeschlossenen Vertrag ueber die Erbringung der folgenden Dienstleistung:\nBestellt am:\nName des/der Verbraucher(s):\nAnschrift des/der Verbraucher(s):\nDatum:\nUnterschrift (nur bei Mitteilung auf Papier):",
        },
      ],
    },
    links: {
      imprint: "Impressum",
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
                  <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-black/70 sm:text-base">
                    {section.body}
                  </p>
                </article>
              </FadeIn>
            ))}
          </section>

          <FadeIn delay={0.35}>
            <footer className="mt-10 rounded-2xl border border-white/30 bg-white/40 p-5 text-sm backdrop-blur-sm">
              <div className="flex flex-wrap gap-4 text-black/70">
                <Link to="/impressum" className="transition hover:text-black">
                  {currentLocale.links.imprint}
                </Link>
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
