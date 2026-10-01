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
  primary: "btn-gradient border-0 text-white font-bold",
  secondary: "bg-violet-100 text-[var(--text-ink)] hover:bg-violet-200 font-bold",
  ghost: "bg-transparent hover:bg-pink-50 text-[var(--text-muted)]",
  outline:
    "border-2 border-pink-200 bg-white hover:bg-pink-50 text-[var(--text-ink)] font-bold",
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
    return cloneElement(children as ReactElement<{ className?: string }>, {
      className: cn(classes, (children as ReactElement).props.className),
    });
  }

  return (
    <button ref={ref} className={classes} {...props}>
      {children}
    </button>
  );
});
