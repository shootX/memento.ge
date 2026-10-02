"use client";

import { siApplepay, siGooglepay, siMastercard, siVisa } from "simple-icons";

type IconData = { title: string; hex: string; path: string };

function BrandIcon({
  icon,
  className,
  monochrome,
}: {
  icon: IconData;
  className?: string;
  monochrome?: boolean;
}) {
  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      aria-label={icon.title}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path fill={monochrome ? "currentColor" : `#${icon.hex}`} d={icon.path} />
    </svg>
  );
}

export function VisaMark({ className }: { className?: string }) {
  return <BrandIcon icon={siVisa} className={[ "h-4 w-7", className].filter(Boolean).join(" ")} />;
}

export function MastercardMark({ className }: { className?: string }) {
  return (
    <BrandIcon icon={siMastercard} className={["h-4 w-7", className].filter(Boolean).join(" ")} />
  );
}

export function ApplePayMark({ className }: { className?: string }) {
  return (
    <span className="inline-flex h-4 items-center rounded bg-black px-1 text-white">
      <BrandIcon icon={siApplepay} className={["h-3 w-8", className].filter(Boolean).join(" ")} monochrome />
    </span>
  );
}

export function GooglePayMark({ className }: { className?: string }) {
  return (
    <BrandIcon icon={siGooglepay} className={["h-4 w-9", className].filter(Boolean).join(" ")} />
  );
}

export function PaymentMethodMarks({ className }: { className?: string }) {
  return (
    <div className={className}>
      <VisaMark />
      <MastercardMark />
      <ApplePayMark />
      <GooglePayMark />
    </div>
  );
}
