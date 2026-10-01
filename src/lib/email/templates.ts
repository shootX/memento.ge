export type EmailLocale = "ka" | "en" | "ru";

type TemplateVars = Record<string, string>;

const subjects: Record<string, Record<EmailLocale, string>> = {
  magic_link: {
    ka: "Memento — შესვლის ბმული",
    en: "Memento — sign in link",
    ru: "Memento — ссылка для входа",
  },
  cohost_invite: {
    ka: "Memento — თანაჰოსტის მოწვევა",
    en: "Memento — co-host invitation",
    ru: "Memento — приглашение соорганизатора",
  },
  package_expiry: {
    ka: "Memento — პაკეტის ვადა იწურება",
    en: "Memento — your plan is expiring soon",
    ru: "Memento — срок пакета истекает",
  },
};

function wrapHtml(locale: EmailLocale, title: string, bodyHtml: string): string {
  const footer =
    locale === "ka"
      ? "memento.ge — ქორწილის ფოტოალბომი"
      : locale === "ru"
        ? "memento.ge — фотоальбом для свадьбы"
        : "memento.ge — wedding photo album";
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/></head><body style="font-family:Georgia,serif;background:#faf8f5;padding:24px;color:#2d3a2e"><div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;padding:28px;border:1px solid #e8e0d5"><p style="letter-spacing:0.12em;font-size:11px;color:#c4a574">MEMENTO</p><h1 style="font-size:22px;margin:0 0 16px">${title}</h1>${bodyHtml}<p style="margin-top:32px;font-size:12px;color:#888">${footer}</p></div></body></html>`;
}

export function renderEmail(
  template: string,
  locale: EmailLocale,
  vars: TemplateVars,
): { subject: string; html: string; text: string } {
  const loc = subjects[template]?.[locale] ? locale : "ka";
  const subject = subjects[template]?.[loc] ?? `Memento — ${template}`;

  if (template === "magic_link") {
    const html = wrapHtml(
      loc,
      subject,
      `<p>${loc === "ka" ? "დააჭირეთ ღილაკს შესასვლელად:" : loc === "ru" ? "Нажмите, чтобы войти:" : "Click to sign in:"}</p><p><a href="${vars.verifyUrl}" style="display:inline-block;background:#3d4f3f;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none">Memento</a></p><p style="font-size:12px;color:#666">${vars.verifyUrl}</p>`,
    );
    return { subject, html, text: `${subject}\n${vars.verifyUrl}` };
  }

  if (template === "cohost_invite") {
    const html = wrapHtml(
      loc,
      subject,
      `<p>${loc === "ka" ? `მოწვევა ღონისძიებაზე «${vars.coupleNames}»:` : loc === "ru" ? `Приглашение на «${vars.coupleNames}»:` : `Invitation for «${vars.coupleNames}»:`}</p><p><a href="${vars.link}">${vars.link}</a></p>`,
    );
    return { subject, html, text: `${subject}\n${vars.link}` };
  }

  if (template === "package_expiry") {
    const html = wrapHtml(
      loc,
      subject,
      `<p>${loc === "ka" ? `«${vars.coupleNames}» — პაკეტის ვადა: ${vars.expiresAt}` : loc === "ru" ? `«${vars.coupleNames}» — срок до ${vars.expiresAt}` : `«${vars.coupleNames}» expires ${vars.expiresAt}`}</p><p><a href="${vars.hostUrl}">${vars.hostUrl}</a></p>`,
    );
    return { subject, html, text: `${subject}\n${vars.hostUrl}` };
  }

  return {
    subject,
    html: wrapHtml(loc, subject, `<pre>${JSON.stringify(vars)}</pre>`),
    text: JSON.stringify(vars),
  };
}
