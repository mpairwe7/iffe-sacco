"use client";

import { useState } from "react";
import { HelpCircle, Wallet, CreditCard, Calculator, ArrowDownToLine, ArrowUpFromLine, Heart, BarChart3, ChevronDown, FileText } from "lucide-react";

const helpArticles = [
  {
    title: "My Savings Accounts",
    desc: "How to view and manage your savings.",
    icon: Wallet,
    color: "success",
    steps: [
      "Navigate to My Savings from the sidebar menu.",
      "View your account balances, interest rate, and account numbers.",
      "Each account card shows your current balance and account type.",
      "Your savings earn interest automatically based on the rate shown.",
    ],
  },
  {
    title: "Depositing Funds",
    desc: "How to deposit money into your account.",
    icon: ArrowDownToLine,
    color: "success",
    steps: [
      "Go to My Savings → Deposit Funds from the sidebar.",
      "Select the account you want to deposit into.",
      "Enter the deposit amount and choose a payment method.",
      "Submit your deposit request — it will be processed by the admin.",
      "You will see the deposit reflected once approved.",
    ],
  },
  {
    title: "Withdrawing Funds",
    desc: "How to withdraw money from your account.",
    icon: ArrowUpFromLine,
    color: "warning",
    steps: [
      "Go to My Savings → Withdraw Funds from the sidebar.",
      "Select the account and enter the withdrawal amount.",
      "Submit the withdrawal request for admin approval.",
      "Once approved, funds will be disbursed to you.",
      "Note: You cannot withdraw more than your available balance.",
    ],
  },
  {
    title: "Applying for a Loan",
    desc: "How to apply for a loan through the system.",
    icon: CreditCard,
    color: "primary",
    steps: [
      "Navigate to My Loans → Loan Overview from the sidebar.",
      "Click 'Apply for Loan' and select the loan type (business, personal, emergency, education, or housing).",
      "Enter the loan amount and preferred repayment term in months.",
      "Submit your application — the admin will review and approve or reject it.",
      "Once approved, funds will be disbursed to your account.",
    ],
  },
  {
    title: "Loan Calculator",
    desc: "Estimate your loan repayments before applying.",
    icon: Calculator,
    color: "info",
    steps: [
      "Go to My Loans → Loan Overview.",
      "Use the loan calculator section to enter a loan amount and term.",
      "The calculator shows estimated monthly payments and total interest.",
      "This helps you plan before submitting an actual loan application.",
    ],
  },
  {
    title: "Social Welfare Programs",
    desc: "How to contribute to welfare and community programs.",
    icon: Heart,
    color: "danger",
    steps: [
      "Navigate to Social Welfare from the sidebar.",
      "Browse available welfare programs and their progress.",
      "Click 'Make a Pledge' on any active program to contribute.",
      "Enter your pledge amount (minimum USh 1,000) and confirm.",
      "Your pledge will be recorded and the program progress updated.",
    ],
  },
  {
    title: "Viewing Transactions",
    desc: "How to check your transaction history.",
    icon: BarChart3,
    color: "info",
    steps: [
      "Navigate to My Transactions from the sidebar.",
      "View all your deposits, withdrawals, and transfers.",
      "Use the search and filters to find specific transactions.",
      "Each transaction shows the date, type, amount, and status.",
    ],
  },
  {
    title: "Account & Profile",
    desc: "How to manage your profile and change your password.",
    icon: FileText,
    color: "primary",
    steps: [
      "Click your profile icon in the top-right corner and select 'Profile'.",
      "Update your personal details like name, email, and phone number.",
      "To change your password, go to Profile → Change Password.",
      "Enter your current password and your new password to update it.",
    ],
  },
];

const colorMap: Record<string, string> = {
  primary: "text-primary bg-primary/10",
  info: "text-info bg-info/10",
  success: "text-success bg-success/15",
  warning: "text-warning bg-warning/15",
  danger: "text-danger bg-danger/15",
};

export default function HelpPage() {
  const [expanded, setExpanded] = useState<string | null>(null);

  function toggle(title: string) {
    setExpanded(expanded === title ? null : title);
  }

  return (
    <div className="space-y-8">
      <div className="text-center py-8">
        <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <HelpCircle className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-text">Help & Support</h1>
        <p className="text-text-muted mt-2 text-lg">Everything you need to know about using your account.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {helpArticles.map((article) => {
          const isOpen = expanded === article.title;
          return (
            <div key={article.title} className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl overflow-hidden transition-all hover:shadow-md">
              <button
                type="button"
                onClick={() => toggle(article.title)}
                className="w-full flex items-start gap-4 p-5 text-left"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${colorMap[article.color]}`}>
                  <article.icon className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{article.title}</h3>
                  <p className="text-xs text-text-muted mt-0.5">{article.desc}</p>
                </div>
                <ChevronDown className={`w-5 h-5 text-text-muted shrink-0 mt-1 transition-transform ${isOpen ? "rotate-180" : ""}`} />
              </button>
              {isOpen && (
                <div className="px-5 pb-5 pt-0">
                  <ol className="space-y-2 border-t border-gray-100 dark:border-gray-800 pt-4">
                    {article.steps.map((step, i) => (
                      <li key={i} className="flex gap-3 text-sm text-text">
                        <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
