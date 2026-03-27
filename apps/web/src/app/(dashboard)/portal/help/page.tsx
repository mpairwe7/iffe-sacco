import { HelpCircle, UserPlus, Wallet, CreditCard, CheckCircle, Calculator, ArrowDownToLine, ArrowUpFromLine, Heart, BarChart3, ArrowRight } from "lucide-react";

const helpArticles = [
  { title: "Adding a New Member", desc: "A step-by-step guide on how to register and onboard new members into the system.", icon: UserPlus, color: "primary" },
  { title: "Opening a Savings Account", desc: "How to open and assign savings accounts to members.", icon: Wallet, color: "success" },
  { title: "Applying for a Loan", desc: "Guide for users and admins on how to submit a loan application.", icon: CreditCard, color: "warning" },
  { title: "Loan Approval & Disbursal", desc: "How to review, approve, and release funds for loan applications.", icon: CheckCircle, color: "primary" },
  { title: "Using the Loan Calculator", desc: "How to use the built-in loan calculator to estimate repayments.", icon: Calculator, color: "info" },
  { title: "Depositing Funds", desc: "Step-by-step instructions for depositing money into member accounts.", icon: ArrowDownToLine, color: "success" },
  { title: "Withdrawing Funds", desc: "How to process fund withdrawals from member accounts safely.", icon: ArrowUpFromLine, color: "warning" },
  { title: "Social Welfare Pledges", desc: "How to manage and contribute to social welfare programs.", icon: Heart, color: "danger" },
  { title: "Generating System Reports", desc: "How to generate and export financial and activity reports.", icon: BarChart3, color: "info" },
];

const colorMap: Record<string, string> = {
  primary: "text-primary bg-primary/10",
  info: "text-info bg-info/10",
  success: "text-success bg-success/15",
  warning: "text-warning bg-warning/15",
  danger: "text-danger bg-danger/15",
};

export default function HelpPage() {
  return (
    <div className="space-y-8">
      <div className="text-center py-8">
        <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <HelpCircle className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-text">Help & Support</h1>
        <p className="text-text-muted mt-2 text-lg">Everything you need to know about using our system features.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {helpArticles.map((article) => (
          <div key={article.title} className="group glass-card rounded-xl p-6 hover:shadow-xl hover:border-primary/20 transition-all">
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 ${colorMap[article.color]}`}>
              <article.icon className="w-7 h-7" />
            </div>
            <h3 className="text-base font-semibold text-text mb-2 group-hover:text-primary transition-colors">{article.title}</h3>
            <p className="text-sm text-text-muted mb-4">{article.desc}</p>
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
              Learn more <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
