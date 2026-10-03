# Memento აპი — პრობლემების რეესტრი (ფაზა 1)

ფორმატი: **ID | სად | მოსალოდნელი | ფაქტობრივი | გავლენა | სიმძიმე | მტკიცებულება | ძალისხმევა | სტატუსი**

**სიმძიმის შეჯამება (ღია):** კრიტიკული 0 · მაღალი 4 · საშუალო 9 · დაბალი 5 (**სულ 18 ღია**; **5 გამოსწორებული** ფაზა 1-ში)

---

| ID | სად | მოსალოდნელი | ფაქტობრივი | გავლენა | სიმძიმე | მტკიცებულება | ძალისხმევა | სტატუსი |
|----|-----|-------------|-------------|---------|---------|--------------|------------|---------|
| APP-001 | `app/_layout.tsx` deep link | `pay-complete` გადახდის შემდეგ სტატუსის განახლება | მარშრუტი არ იჭერება | გადახდა „დასრულდა“ მაგრამ UI ძველი | **მაღალი** | `MOBILE-API.md` returnUrl; კოდში მხოლოდ auth/guest | S | ღია |
| APP-002 | Auth ყველა ეკრანი | 401-ზე სესიის გასუფთავება + login | `getAuthMe` არ იძახება; 401 UI-ში არ იჭერება | ვადაგასული token — ცარიელი/შეცდომა | **მაღალი** | `api-contract.test` 401; UI gap | M | ღია |
| APP-003 | `app/host/events.tsx` | გამოსვლა | `clearSession` არსებობს, UI არა | ვერ გამოვიდეს ანგარიშიდან | **მაღალი** | `auth-store.ts` | S | ღია |
| APP-004 | `upload-queue` / camera | ოფლაინ/ბექგრაუნდ — რიგის შენახვა + retry | რიგი მხოლოდ RAM; AppState არ არის | ნაწილობრივი დაკარგა ატვირთვები | **მაღალი** | კოდი `camera.tsx` | L | ღია |
| APP-005 | `app/gallery/[slug].tsx` | პაროლის ველი i18n | ჰარდკოდი „პაროლი“ | ენის შერილი (en/ru) | საშუალო | ფაილი L69 | S | ღია |
| APP-006 | `app/host/[token]/pay.tsx` | `getPaymentStatus` polling | მხოლოდ browser open / mock preview | გადახდის სტატუსი არ ჩანს აპში | საშუალო | client method unused | M | ღია |
| APP-007 | Guestbook API | UI სტუმარს/ჰოსტს | `postGuestbook`, `getHostGuestbook` — არა | ფუნქცია backend-ზე, აპში არა | საშუალო | client.ts | M | ღია |
| APP-008 | Push | subscribe on login | `subscribePush` არ იძახება | არ მოდის push | საშუალო | app.json plugin არა | M | ღია |
| APP-009 | `app/onboarding.tsx` | პირველი გაშვება | მარშრუტი არსებობს, ლინკი არა | onboarding ვერ ხედავს | დაბალი | grep routes | S | ღია |
| APP-010 | `app/preview/*` | მხოლოდ dev/screenshots | production bundle-ში ჩანს | არასაჭირო surface | დაბალი | expo export routes | S | ღია |
| APP-011 | `app.json` | Expo schema valid | `newArchEnabled` დამატებითი ველი | expo-doctor fail | საშუალო | `npx expo-doctor` | S | ღია |
| APP-012 | `package.json` | SDK-თან შესაბამისი ვერსიები | async-storage 3.x, expo-image 3.x, jest 30… | build/CI რისკი | საშუალო | expo-doctor + npm outdated | M | ღია |
| APP-013 | Accessibility | ყველა ღილაკზე label, 44pt target | მხოლოდ `PrimaryButton` label; ghost/camera ნაწილი | VoiceOver/TalkBack სუსტი | საშუალო | `ui.tsx`, `CameraControlButton` | M | ნაწილობრივ |
| APP-014 | Font scaling | `allowFontScaling` სტრატეგია | სისტემური დიდი ტექსტი შეიძლება გატეხოს | a11y | საშუალო | typography | S | ღია |
| APP-015 | Host dashboard stats | რეალური guests/days | „—“ / hardcoded 90 preview-ში | შეცდომადანება | დაბალი | `host/[token]/index.tsx` | S | ღია |
| APP-016 | `getQrImageUrl` | სერვერის QR PNG | client helper; UI იყენებს `GuestQrCard` SVG | ორმაგი გზა | დაბალი | client.ts | S | ღია |
| APP-017 | Duplicate upload | სერვერი dedupe? | ორმაგი POST შესაძლებელია (double-tap upload) | დუბლიკატ ფოტო | საშუალო | ტესტი არა; ბიზნეს წესი backend | M | ღია |
| APP-018 | SecureStore web | ვებ დემო | SecureStore ვებზე შეზღუდული | ვებ screenshot-only | დაბალი | expo docs | — | მიღებული |
| APP-019 | Deep link evil slug | უარყოფა | ფაზა 1: host whitelist + `..` ბლოკი | ფიშინგი შემცირებული | — | `__tests__/deep-link.test.ts` | S | **გამოსწორებული** |
| APP-020 | Magic link error | შეცდომის UI | ფაზა 1: catch → login | ჩუმი fail | — | `_layout.tsx` | S | **გამოსწორებული** |
| APP-021 | Login double-tap | ერთი request | `busy` + disabled | ორმაგი magic-link | — | `host/login.tsx` | S | **გამოსწორებული** |
| APP-022 | Mock upload split | mock mode ყველა API | ადრე upload ყოველთვის live | არათანმიმდევრული დემო | — | `upload-queue.ts` | S | **გამოსწორებული** |
| APP-023 | Media library plist | ქართული აღწერა | plugin დამატებული ფაზა 1 | iOS rejection რისკი | — | `app.json` | S | **გამოსწორებული** |

*(APP-019–023 ჩათვლილია გამოსწორებულად; სიმძიმის ჯამში ზემოთ მხოლოდ ღია 20 პუნქტი.)*

**ძალისხმევა:** S = მცირე, M = საშუალო, L = დიდი
