# ბიზнесის ზღვრები — მფლობელის გადაწყვეტილება (Phase 1)

თითოეული პუნქტი: **რა ხდება ახლა** → **ვარიანტები** → **რекომендация** (ბიზнес წესის შეცვლა არ ვაკეთეთ აუდიტში).

---

## Q1. უფასო / გადაუხდელი ივენთი

**ახლა:** `eventAllowsUpload` — ატვირთვა მხოლოდ `isPaid` + ვადის (`expiresAt`) შემოწმებით.  
**ვარიანტები:** (ა) ყოველთვის paid საჭირო; (ბ) grace period; (გ) demo ივენთი მუდმივად უფასო.  
**რекომендация:** (ა) production-ში; demo მხოლოდ `ensure:demo` / staging.

## Q2. Admin `isPaid` toggle

**ახლა:** `PATCH /api/admin/events/[id]` პირდაპირ ცვლის `isPaid`, `paidAt`, `expiresAt` — გადახდის webhook-ის გ side-step.  
**ვარიანტები:** (ა) manual support only; (ბ) მხოლოდ audit log + reason; (გ) ამოღება UI-დან.  
**რекომендация:** (ბ) + ლოგი; refund ბანკში ცალკე.

## Q3. Host token rotation

**ახლა:** hostToken/slideshowToken ერთხელ იქმნება; rotation API არა.  
**ვარიანტები:** (ა) დაკარგვისას support manually DB; (ბ) «გაუქმება ბმული» host UI-ში.  
**რекომендация:** (ბ) მომავალ ფაზაში.

## Q4. Gallery password vs guest slug

**ახლა:** `/gallery/[slug]` customSlug; guest upload `/e/{guestSlug}` — customSlug guest-ზე არ მუშაობს (SETUP.md).  
**ვარიანტები:** (ა) დოკუმენტაცია; (ბ) guest-იც customSlug-ით.  
**რекომендация:** (ბ) UX-ისთვის, თუ marketing ამას პირდაპირ აძლევს.

## Q5. Co-host უფლებების სCOPE

**ახლა:** co-host = იგივე mutation host API (owner/co-host check).  
**ვარიანტები:** (ა) სრული; (ბ) read-only co-host; (გ) role matrix.  
**რекომендация:** (გ) დიდი ორგანიზაციებისთვის.

## Q6. Partner commission & payout

**ახლა:** `PartnerReferral.commissionGel`, status pending/paid — payout automation არ ჩანს.  
**ვარიანტები:** manual accounting vs automated.  
**რекომендация:** manual + monthly report Phase 1.

## Q7. Expired event — მედია წაშლა

**ახლა:** `expiresAt` + retention plan-ით; hard delete job არ ჩანს cron-ში.  
**ვარიანტები:** (ა) soft block upload only; (ბ) cron delete storage.  
**რекომендация:** (ბ) GDPR/შეთანხმების მიხედვით განსაზღვროთ.

## Q8. Refund policy

**ახლა:** BOG admin refund API; Stripe/TBC refund UI partial.  
**ვარიანტები:** 14 დღე / no refund / manual only.  
**რекომендация:** მფლობელმა დაადასტუროს პოლიტიკა; კოდი არ შევცვალეთ.

## Q9. Disposable camera `revealAt`

**ახლა:** shotsPerGuest + revealAt logic guest UI/API-ში.  
**ვარიანტები:** timezone Asia/Tbilisi vs UTC server.  
**რекომендация:** explicit `Europe/Tbilisi` display + store UTC.

## Q10. Rate limits production scale

**ახლა:** in-memory/IP rate limits (`consumeApi`, upload, login).  
**ვარიანტები:** Redis vs edge vs current.  
**რекომендация:** Redis multi-instance production-ზე — Q10 + performance აუდიტი.

---

*დანართი: plan ფასები/ლიმიტები `src/lib/plans.ts` — აუდიტში **არ შეცვლილა**.*
