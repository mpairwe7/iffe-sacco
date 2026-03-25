import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <div className="glass-card rounded-3xl p-8 shadow-xl max-h-[70vh] overflow-y-auto">
      <Link href="/register" className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-primary mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Register
      </Link>
      <h2 className="text-2xl font-bold text-text mb-4">Privacy Policy</h2>
      <div className="prose prose-sm text-text-muted space-y-4">
        <p>Last updated: March 26, 2026</p>
        <h3 className="text-base font-semibold text-text">1. Information We Collect</h3>
        <p>We collect personal information including name, email, phone number, national ID, and financial transaction data necessary to provide our SACCO services.</p>
        <h3 className="text-base font-semibold text-text">2. How We Use Your Data</h3>
        <p>Your data is used to manage your account, process transactions, calculate interest, facilitate loans, and communicate important account updates.</p>
        <h3 className="text-base font-semibold text-text">3. Data Security</h3>
        <p>We employ 256-bit SSL encryption, secure data storage, and regular security audits to protect your information. Access is restricted to authorized personnel only.</p>
        <h3 className="text-base font-semibold text-text">4. Data Sharing</h3>
        <p>We do not sell your personal data. We may share data with regulatory authorities as required by law, and with service providers who assist in platform operations.</p>
        <h3 className="text-base font-semibold text-text">5. Your Rights</h3>
        <p>You have the right to access, correct, and request deletion of your personal data. Contact us at privacy@iffeds.org for data-related requests.</p>
        <h3 className="text-base font-semibold text-text">6. Cookie Policy</h3>
        <p>We use essential cookies for authentication and session management. No third-party tracking cookies are used.</p>
      </div>
    </div>
  );
}
