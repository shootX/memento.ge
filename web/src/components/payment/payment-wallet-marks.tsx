export function VisaMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 16" aria-hidden>
      <rect width="48" height="16" rx="3" fill="#1A1F71" />
      <path
        fill="#fff"
        d="M19.5 11.2l1.2-7.4h2l-1.2 7.4h-2zm9.8-7.2c-.4-.2-1-.3-1.8-.3-2 0-3.4 1-3.4 2.5 0 1.1 1 1.7 1.8 2 .8.4 1.1.6 1.1 1 0 .5-.7.8-1.3.8-1.1 0-1.7-.3-2.2-.5l-.3-.1-.3 2c.5.2 1.5.4 2.5.4 2.1 0 3.5-1 3.5-2.6 0-.9-.5-1.5-1.7-2.1-.7-.3-1.2-.5-1.2-.9 0-.3.3-.7 1-.7.8 0 1.4.2 1.8.3l.2.1.3-1.9zM36 3.8h-1.5c-.5 0-.8.1-1 .6l-2.8 6.8h2.1l.4-1.1h2.6l.2 1.1H37l-1-7.4zm-2.3 4.7l1.1-2.9.6 2.9h-1.7zM14.5 3.8l-2 7.4h-2.1l2-7.4h2.1z"
      />
    </svg>
  );
}

export function MastercardMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 20" aria-hidden>
      <circle cx="12" cy="10" r="8" fill="#EB001B" />
      <circle cx="20" cy="10" r="8" fill="#F79E1B" />
      <path fill="#FF5F00" d="M16 3.8a8 8 0 0 1 0 12.4 8 8 0 0 1 0-12.4z" opacity=".85" />
    </svg>
  );
}

export function ApplePayMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 44 18" aria-hidden>
      <rect width="44" height="18" rx="4" fill="#000" />
      <path
        fill="#fff"
        d="M10.2 4.2c-.4.5-1.1.9-1.8.8-.1-.7.2-1.4.6-1.9.4-.5 1.2-.9 1.8-.9.1.7-.2 1.4-.6 2zm.6 1c-.9-.1-1.7.5-2.1.5s-1.1-.5-1.9-.5c-1-.1-1.9.6-2.4 1.5-1 1.8-.3 4.4.7 5.8.5.7 1.1 1.5 1.9 1.5.8 0 1-.5 2-.5s1.2.5 2 .5c.8 0 1.3-.7 1.8-1.4.6-.8.8-1.6.8-1.7-.1 0-1.6-.6-1.6-2.5 0-1.6 1.2-2.3 1.3-2.4-1-.7-2.4-.8-2.9-.8zM22.5 5.5h2.7c1.6 0 2.7.9 2.7 2.4 0 1.6-1.1 2.5-2.9 2.5h-1.1V12h-1.4V5.5zm2.6 3.9c.9 0 1.5-.5 1.5-1.4s-.6-1.4-1.5-1.4h-1.2v2.8h1.2zM31.2 5.5h1.5l1.7 4.6 1.7-4.6H38l-2.6 6.5h-1.5l-2.7-6.5z"
      />
    </svg>
  );
}

export function GooglePayMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 44 18" aria-hidden>
      <rect width="44" height="18" rx="4" fill="#fff" stroke="#dadce0" />
      <path fill="#3C4043" d="M10 9.2V7.5h6.8v1.3H11.6v1h4.8v1.3H10zm9.2-1.7c.9 0 1.6.3 2 .9l-1 .8c-.3-.4-.7-.6-1.1-.6-.9 0-1.5.6-1.5 1.5s.6 1.5 1.5 1.5c.5 0 .9-.2 1.2-.6l1 .8c-.5.7-1.2 1.1-2.2 1.1-1.6 0-2.8-1.1-2.8-2.8s1.2-2.8 2.9-2.8zm4.8 0c1.6 0 2.8 1.1 2.8 2.8 0 .2 0 .4-.1.6h-4.3c.2.6.7 1 1.4 1 .6 0 1-.2 1.3-.6l.9.7c-.6.8-1.5 1.2-2.4 1.2-1.6 0-2.8-1.1-2.8-2.8s1.2-2.8 2.7-2.8zm1.9 2.3c-.2-.6-.7-1-1.3-1s-1.1.4-1.3 1h2.6zM32.5 6.5h1.2v1c.3-.7.9-1.1 1.7-1.1v1.3c-1 0-1.7.5-1.7 1.6V12h-1.2V6.5z" />
    </svg>
  );
}

export function PaymentMethodMarks({ className }: { className?: string }) {
  return (
    <div className={className}>
      <VisaMark className="h-4 w-auto" />
      <MastercardMark className="h-4 w-auto" />
      <ApplePayMark className="h-4 w-auto" />
      <GooglePayMark className="h-4 w-auto" />
    </div>
  );
}
