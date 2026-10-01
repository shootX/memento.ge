import { cn } from "@/lib/cn";
import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost" | "outline";

const variants: Record<Variant, string> = {
  primary:
    "bg-[var(--color-gold)] text-[var(--color-ink)] hover:bg-[var(--color-gold-soft)] shadow-sm",
  secondary:
    "bg-[var(--color-forest)] text-white hover:opacity-90",
  ghost: "bg-transparent hover:bg-black/5",
  outline:
    "border border-[var(--color-border)] bg-white/60 hover:bg-white",
};

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }
>(function Button({ className, variant = "primary", ...props }, ref) {
  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-all duration-200 active:scale-[0.98] disabled:opacity-50",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
});
