# გადახდები / Payments (TBC · BOG)

## ქართული

### რა არის ჩართული

- **TBC TPay Checkout API v1** — `https://api.tbcbank.ge/v1/tpay/` (sandbox: `TBC_ENV=sandbox`, სატესტო გასაღებები ecom.tbcpayments / developers.tbcbank.ge)
- **Bank of Georgia Online Payments** — OAuth2 + ecommerce orders (`payment_method`: card, google_pay, apple_pay)
- **PAYMENT_MOCK=1** — ლოკალური სიმულაცია e2e-სთვის, რეალური გასაღებების გარეშე
- **Apple Pay domain verification** — `/.well-known/apple-developer-merchantid-domain-association`

### სად მოიპოვო sandbox credentials

| ბანკი | პორტალი | რას იღებ |
|--------|---------|----------|
| **TBC** | [developers.tbcbank.ge](https://developers.tbcbank.ge/) · ecom.tbcpayments (merchant test) | `TBC_API_KEY`, `TBC_CLIENT_ID`, `TBC_CLIENT_SECRET` |
| **BOG** | [api.bog.ge](https://api.bog.ge/docs/) · BOG business / merchant onboarding | `BOG_CLIENT_ID`, `BOG_CLIENT_SECRET`, callback RSA public key |

### Env ცვლადები (სერვერზე, მაგ. qr.socialsave.cc)

```env
NEXT_PUBLIC_APP_URL=https://qr.socialsave.cc

# TBC
TBC_ENV=sandbox
TBC_API_KEY=
TBC_CLIENT_ID=
TBC_CLIENT_SECRET=
# TBC_PAYMENT_METHODS=5,6,7
TBC_CALLBACK_URL=https://qr.socialsave.cc/api/webhooks/tbc

# BOG
BOG_ENV=sandbox
BOG_CLIENT_ID=
BOG_CLIENT_SECRET=
BOG_CALLBACK_PUBLIC_KEY=
# BOG_PAYMENT_METHODS=card,google_pay,apple_pay

PAYMENT_MOCK=0
E2E_SECRET=local-e2e

APPLE_PAY_DOMAIN_ASSOCIATION=
# APPLE_PAY_DOMAIN_ASSOCIATION_FILE=
```

### Callback URL-ები

- TBC: `https://qr.socialsave.cc/api/webhooks/tbc`
- BOG: `https://qr.socialsave.cc/api/webhooks/bog`

### Apple Pay domain verification

1. TBC/BOG merchant კაბინეტიდან ჩამოტვირთე association ფაილი.
2. `APPLE_PAY_DOMAIN_ASSOCIATION` env ან ფაილის path.
3. შეამოწმე: `https://qr.socialsave.cc/.well-known/apple-developer-merchantid-domain-association`

---

## English

### Integrated providers

- **TBC TPay Checkout v1** — token, create payment with `methods`, redirect, callback, status polling, cancel where supported.
- **BOG Online Payments** — OAuth2, orders with card / Apple Pay / Google Pay, RSA callback verification, order details.
- **`PAYMENT_MOCK=1`** — `/pay/mock` simulates bank checkout for tests.

### Sandbox credentials

- **TBC:** [developers.tbcbank.ge](https://developers.tbcbank.ge/) → API key + OAuth client credentials.
- **BOG:** Merchant onboarding on BOG business portal → client id/secret + callback public key.

### Webhooks to register

- `https://qr.socialsave.cc/api/webhooks/tbc`
- `https://qr.socialsave.cc/api/webhooks/bog`

### Status mapping

- **BOG paid:** `completed`, `success`, `paid`, `approved`, `succeeded`
- **TBC paid:** `Succeeded`

Default **TBC method IDs** `5,6,7` — confirm in latest TBC docs before production.
