# Bank of Georgia (BOG) ონლაინ გადახდები — Memento

ოფიციალური API დოკუმენტაცია: [api.bog.ge/docs/en/payments/](https://api.bog.ge/docs/en/payments/)

## რა სჭირდება მერჩანტს

1. **ბიზნეს-პორტალში** (Bank of Georgia Business Manager) უნდა გქონდეთ აქტივირებული ონლაინ გადახდების სერვისი.
2. რეგისტრაციის შემდეგ ბანკი გაძლევთ **`client_id`** და **`client_secret`** — OAuth HTTP Basic Auth (username/password).
3. პორტალში დაარეგისტრირეთ **Callback URL**:

   - **`https://qr.socialsave.cc/api/payments/bog/callback`**
   - მომავალში memento.ge: **`https://memento.ge/api/payments/bog/callback`**

   `/api/webhooks/bog` — ძველი alias (იგივე handler).

4. Redirect URL-ები Memento აგზავნის create order-ში (ვებ ჰოსტი ან `memento://` მობილური).

## Env ცვლადები

| ცვლადი | აღწერა |
|--------|--------|
| `BOG_CLIENT_ID` | client_id |
| `BOG_CLIENT_SECRET` | client_secret |
| `BOG_ENV` | `production` (default) ან `sandbox` |
| `BOG_CALLBACK_PUBLIC_KEY` | optional PEM; default — BOG docs public key |
| `BOG_CALLBACK_URL` | optional callback override |
| `BOG_PAYMENT_METHODS` | optional, default `card,google_pay,apple_pay` |
| `PAYMENT_MOCK=1` | mock გადახდა |
| `NEXT_PUBLIC_APP_URL` | მაგ. `https://qr.socialsave.cc` |

## ნაკადი

1. OAuth token — `oauth2.bog.ge/.../token`, Basic auth, `grant_type=client_credentials`.
2. Create order — `/payments/v1/ecommerce/orders` → redirect `_links.redirect.href`.
3. Callback — `Callback-Signature` verify; paid მხოლოდ `order_status` **`completed`**.
4. Status fallback — `GET /api/host/:token/payment/status` → BOG `GET /receipt/:order_id`.
5. Refund — `POST /api/admin/payments/bog/refund` (admin session).

## ტესტები

`tests/billing-tbc-bog.test.ts`, `tests/fixtures/bog-*.json`.
