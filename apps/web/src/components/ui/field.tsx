/**
 * Field — accessible form field wrapper.
 *
 * Wires label, input, description, and error message together with
 * aria-describedby so screen readers announce the full context when the
 * user focuses the input.
 *
 * Use in place of raw <label>+<input> pairs in forms. Example:
 *
 *   <Field
 *     id="amount"
 *     label="Amount"
 *     description="Enter the deposit amount in UGX"
 *     error={errors.amount?.message}
 *   >
 *     <Input id="amount" {...register("amount")} />
 *   </Field>
 */
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface FieldProps {
  id: string;
  label: string;
  description?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

export function Field({ id, label, description, error, required, children, className }: FieldProps) {
  const describedBy = [
    description ? `${id}-description` : null,
    error ? `${id}-error` : null,
  ]
    .filter(Boolean)
    .join(" ") || undefined;

  return (
    <div className={cn("grid gap-1.5", className)}>
      <label htmlFor={id} className="text-sm font-medium">
        {label}
        {required && (
          <span className="ml-1 text-destructive" aria-hidden="true">
            *
          </span>
        )}
        {required && <span className="sr-only"> (required)</span>}
      </label>

      {/* The child input is expected to accept `aria-describedby` and
          `aria-invalid` via props spreading from the parent form. */}
      <FieldSlot describedBy={describedBy} invalid={Boolean(error)}>
        {children}
      </FieldSlot>

      {description && (
        <p id={`${id}-description`} className="text-xs text-muted-foreground">
          {description}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * Passes aria attributes down into the first child element via cloneElement.
 * Keeps Field ergonomic without forcing every input to pull the id/error
 * props from the parent form state.
 */
import { Children, cloneElement, isValidElement } from "react";

function FieldSlot({
  children,
  describedBy,
  invalid,
}: {
  children: ReactNode;
  describedBy?: string;
  invalid: boolean;
}) {
  const child = Children.only(children);
  if (!isValidElement(child)) return <>{children}</>;
  return cloneElement(child as any, {
    "aria-describedby": describedBy,
    "aria-invalid": invalid || undefined,
  });
}
