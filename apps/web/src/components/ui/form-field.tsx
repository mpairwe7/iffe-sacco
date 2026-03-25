import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { forwardRef } from "react";

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helpText?: string;
  icon?: LucideIcon;
}

export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  ({ label, error, helpText, icon: Icon, className, required, ...props }, ref) => {
    return (
      <div>
        <label className="block text-sm font-medium text-text mb-2">
          {label}{required && <span className="text-danger ml-0.5">*</span>}
        </label>
        <div className="relative">
          {Icon && (
            <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-light" />
          )}
          <input
            ref={ref}
            required={required}
            aria-invalid={!!error}
            aria-describedby={error ? `${props.name}-error` : undefined}
            className={cn(
              "w-full py-3 bg-white/60 dark:bg-white/5 border rounded-xl text-sm text-text placeholder:text-text-light focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white/80 dark:focus:bg-white/10",
              Icon ? "pl-12 pr-4" : "px-4",
              error ? "border-danger focus:ring-danger/20" : "border-white/40 dark:border-white/10",
              className
            )}
            {...props}
          />
        </div>
        {error && (
          <p id={`${props.name}-error`} role="alert" className="text-xs text-danger mt-1.5 flex items-center gap-1">
            {error}
          </p>
        )}
        {helpText && !error && (
          <p className="text-xs text-text-light mt-1.5">{helpText}</p>
        )}
      </div>
    );
  }
);
FormField.displayName = "FormField";
