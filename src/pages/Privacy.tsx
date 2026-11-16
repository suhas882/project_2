import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { Card, PageHeader } from '@/components/ui';

export default function Privacy({ standalone }: { standalone?: boolean }) {
  const body = (
    <div className="mx-auto grid max-w-3xl gap-5">
      <PageHeader title="Privacy notice" subtitle="Prototype summary. The final notice is pending legal review." badge={false} />
      <Card className="grid gap-4 leading-relaxed text-ink-2">
        <p className="flex items-center gap-2 font-bold text-ink"><ShieldCheck className="size-5 text-brand" aria-hidden />Short version: you choose what is collected, we never sell health data, and you can export or delete everything.</p>
        <section><h2 className="font-bold text-ink">What this prototype stores</h2><p>Everything is stored in your own browser (local storage). The demo uses synthetic data for a fictional persona. Do not enter real health information.</p></section>
        <section><h2 className="font-bold text-ink">What leaves your browser</h2>
          <ul className="list-disc pl-5">
            <li>Food names you type, say or pick are sent to USDA FoodData Central to look up nutrients (through our local API server when it is running).</li>
            <li>Barcode numbers are sent to Open Food Facts.</li>
            <li>Voice input uses your browser's speech service; in Chrome, audio is processed by Google.</li>
            <li>Meal photos and lab report photos are processed in your browser with open-source models. Model files and OCR language data are downloaded from public CDNs. Photos are not uploaded.</li>
          </ul></section>
        <section><h2 className="font-bold text-ink">Consent</h2><p>Separate, plain-language choices for app use, wearable data, AI processing of photos and research sharing. Research is off by default. Every change is versioned and can be reversed in Settings.</p></section>
        <section><h2 className="font-bold text-ink">No selling, no ads, no tracking</h2><p>No sale of health data, no advertising SDKs and no third-party analytics in this app.</p></section>
        <section><h2 className="font-bold text-ink">Planned production design</h2><p>The production service is designed for Washington's My Health My Data Act and other privacy laws, with HIPAA-aligned controls on HIPAA-eligible AWS services (encryption with customer-managed keys, least-privilege access, audit logs). It is not certified under any standard. Counsel review comes before any real user data.</p></section>
        <section><h2 className="font-bold text-ink">Your controls</h2><p>Export your data (JSON, FHIR, CSV), view the access log, change consent, or delete everything from Settings.</p></section>
        <p className="text-sm">Remitra is a working name. This prototype is not affiliated with or endorsed by any government agency.</p>
      </Card>
      <Link to={standalone ? '/welcome' : '/settings'} className="font-semibold text-brand-700 underline">{standalone ? 'Back to onboarding' : 'Back to Settings'}</Link>
    </div>
  );
  return standalone ? <div className="min-h-dvh px-4 py-8">{body}</div> : body;
}
