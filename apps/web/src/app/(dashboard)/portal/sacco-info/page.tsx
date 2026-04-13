"use client";

import { Info, MapPin, Mail, Phone, Clock, Building2 } from "lucide-react";

const saccoProfile = {
  name: "IFFE SACCO",
  tagline: "Empowering Financial Freedom",
  about:
    "IFFE SACCO is a member-owned cooperative that supports its members through savings, loans, and social welfare. Members pool resources to build financial resilience and support each other through key life events.",
  email: "info@iffeds.org",
  phone: "+256 700 000 000",
  address: "Kampala, Uganda",
  hours: "Mon – Fri · 08:00 to 17:00",
};

const offerings = [
  {
    title: "Savings Accounts",
    description: "Grow your savings with competitive interest rates and flexible deposit options.",
  },
  {
    title: "Member Loans",
    description: "Access business, personal, emergency, education, and housing loans at member-friendly rates.",
  },
  {
    title: "Social Welfare",
    description: "Mutual support through wedding and condolence contributions organised by the SACCO.",
  },
  {
    title: "Shares",
    description: "Build long-term ownership and a share of the SACCO's annual returns.",
  },
];

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <div>
        <p className="text-xs text-text-muted font-medium uppercase tracking-wider">{label}</p>
        <p className="text-sm text-text mt-0.5">{value}</p>
      </div>
    </div>
  );
}

export default function SaccoInfoPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Info className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">SACCO Info</h1>
          <p className="text-text-muted text-sm">About {saccoProfile.name} and how to reach the office.</p>
        </div>
      </div>

      <section className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Building2 className="w-4 h-4 text-primary" />
          </div>
          <h2 className="text-base font-bold text-gray-900 dark:text-white">About Us</h2>
        </div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary mb-2">{saccoProfile.tagline}</p>
        <p className="text-sm leading-7 text-text">{saccoProfile.about}</p>
      </section>

      <section className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl p-6">
        <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4">What We Offer</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {offerings.map((item) => (
            <div key={item.title} className="rounded-xl border border-border/60 bg-surface-alt/30 p-4">
              <p className="text-sm font-semibold text-text">{item.title}</p>
              <p className="text-xs text-text-muted mt-1 leading-5">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl p-6">
        <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4">Contact</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InfoRow icon={Mail} label="Email" value={saccoProfile.email} />
          <InfoRow icon={Phone} label="Phone" value={saccoProfile.phone} />
          <InfoRow icon={MapPin} label="Address" value={saccoProfile.address} />
          <InfoRow icon={Clock} label="Office Hours" value={saccoProfile.hours} />
        </div>
      </section>
    </div>
  );
}
