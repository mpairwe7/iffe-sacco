import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <div className="glass-card rounded-xl p-8 shadow-xl max-h-[70vh] overflow-y-auto">
      <Link href="/register" className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-primary mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Register
      </Link>
      <h2 className="text-2xl font-bold text-text mb-4">Terms of Service</h2>
      <div className="prose prose-sm text-text-muted space-y-4">
        <p>Last updated: March 26, 2026</p>
        <h3 className="text-base font-semibold text-text">1. Acceptance of Terms</h3>
        <p>By accessing and using the IFFE SACCO platform, you agree to be bound by these Terms of Service and all applicable laws and regulations.</p>
        <h3 className="text-base font-semibold text-text">2. Account Registration</h3>
        <p>You must provide accurate and complete information during registration. You are responsible for maintaining the confidentiality of your account credentials.</p>
        <h3 className="text-base font-semibold text-text">3. Financial Services</h3>
        <p>IFFE SACCO provides savings, loan, and transaction services subject to regulatory compliance. All financial transactions are governed by applicable banking and cooperative society laws.</p>
        <h3 className="text-base font-semibold text-text">4. Privacy & Data Protection</h3>
        <p>We are committed to protecting your personal and financial data in accordance with applicable data protection regulations. See our Privacy Policy for details.</p>
        <h3 className="text-base font-semibold text-text">5. Limitation of Liability</h3>
        <p>IFFE SACCO shall not be liable for any indirect, incidental, or consequential damages arising from the use of our services.</p>
        <h3 className="text-base font-semibold text-text">6. Governing Law</h3>
        <p>These terms are governed by the laws of the Republic of Kenya and applicable cooperative society regulations.</p>
      </div>
    </div>
  );
}
