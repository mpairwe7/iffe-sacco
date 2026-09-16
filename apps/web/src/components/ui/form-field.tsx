import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { forwardRef, useId } from "react";

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helpText?: string;
  icon?: LucideIcon;
}

export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  ({ label, error, helpText, icon: Icon, className, required, id: customId, ...props }, ref) => {
    const generatedId = useId();
    const inputId = customId || props.name || generatedId;
    const errorId = `${inputId}-error`;
    const helpId = `${inputId}-help`;

    const describedBy =
      [error ? errorId : null, helpText && !error ? helpId : null].filter(Boolean).join(" ") || undefined;

    return (
      <div>
        <label htmlFor={inputId} className="block text-sm font-semibold text-text mb-2.5">
          {label}
          {required && (
            <span className="text-danger ml-0.5" aria-hidden="true">
              *
            </span>
          )}
        </label>
        <div className="relative">
          {Icon && (
            <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-light" aria-hidden="true" />
          )}
          <input
            ref={ref}
            id={inputId}
            required={required}
            aria-invalid={!!error}
            aria-describedby={describedBy}
            className={cn(
              "w-full py-3.5 bg-white/60 dark:bg-white/5 border rounded-lg text-sm text-text placeholder:text-text-light focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white/80 dark:focus:bg-white/10",
              Icon ? "pl-12 pr-4" : "px-4",
              error ? "border-danger focus:ring-danger/20" : "border-white/40 dark:border-white/10",
              className,
            )}
            {...props}
          />
        </div>
        {error && (
          <p id={errorId} role="alert" className="text-sm text-danger mt-1.5 flex items-center gap-1">
            {error}
          </p>
        )}
        {helpText && !error && (
          <p id={helpId} className="text-xs text-text-muted mt-1.5">
            {helpText}
          </p>
        )}
      </div>
    );
  },
);
FormField.displayName = "FormField";
