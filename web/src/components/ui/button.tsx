import { cn } from "@/lib/cn";
import {
  ButtonHTMLAttributes,
  cloneElement,
  forwardRef,
  isValidElement,
  ReactElement,
} from "react";

type Variant = "primary" | "secondary" | "ghost" | "outline";
type Size = "sm" | "md";

const variants: Record<Variant, string> = {
  primary: "btn-gradient border-0 font-bold",
  secondary: "bg-[var(--surface-warm)] text-[var(--fg)] hover:bg-[var(--bg-elevated)] font-bold",
  ghost: "bg-transparent hover:bg-white/5 text-[var(--muted)]",
  outline:
    "border border-[var(--border)] bg-transparent hover:bg-white/5 text-[var(--fg)] font-bold",
};

const sizes: Record<Size, string> = {
  sm: "px-4 py-2 text-xs",
  md: "px-6 py-3 text-sm",
};

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: Variant;
    size?: Size;
    asChild?: boolean;
  }
>(function Button(
  { className, variant = "primary", size = "md", asChild, children, ...props },
  ref,
) {
  const classes = cn(
    "inline-flex items-center justify-center gap-2 rounded-full transition-all duration-200 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none",
    variants[variant],
    sizes[size],
    className,
  );

  if (asChild && isValidElement(children)) {
    const child = children as ReactElement<{ className?: string }>;
    return cloneElement(child, {
      className: cn(classes, child.props.className),
    });
  }

  return (
    <button ref={ref} className={classes} {...props}>
      {children}
    </button>
  );
});
