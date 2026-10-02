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
  host_link: {
    ka: "Memento — ჰოსტის ლინკი",
    en: "Memento — your host link",
    ru: "Memento — ссылка хоста",
  },
};

function wrapHtml(locale: EmailLocale, title: string, bodyHtml: string): string {
  const footer =
    locale === "ka"
      ? "memento.ge — ქორწილის ფოტოალბომი"
      : locale === "ru"
        ? "memento.ge — фотоальбом для свадьбы"
        : "memento.ge — wedding photo album";
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/></head><body style="font-family:Manrope,Noto Sans Georgian,sans-serif;background:#f7f7f2;padding:24px;color:#121212"><div style="max-width:520px;margin:0 auto;background:#fff;border-radius:16px;padding:28px;border:1px solid rgba(0,0,0,0.08);box-shadow:0 12px 32px rgba(0,0,0,0.06)"><p style="letter-spacing:0.12em;font-size:11px;color:#c4ff0d;background:#161616;display:inline-block;padding:4px 10px;border-radius:999px">MEMENTO</p><h1 style="font-size:22px;margin:16px 0 16px">${title}</h1>${bodyHtml}<p style="margin-top:32px;font-size:12px;color:#5c6366">${footer}</p></div></body></html>`;
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
      `<p>${loc === "ka" ? "დააჭირეთ ღილაკს შესასვლელად:" : loc === "ru" ? "Нажмите, чтобы войти:" : "Click to sign in:"}</p><p><a href="${vars.verifyUrl}" style="display:inline-block;background:#c4ff0d;color:#121212;padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:700">Memento</a></p><p style="font-size:12px;color:#666">${vars.verifyUrl}</p>`,
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

  if (template === "host_link") {
    const html = wrapHtml(
      loc,
      subject,
      `<p>${loc === "ka" ? `ღონისძიება «${vars.coupleNames}» — ჰოსტის პანელი:` : loc === "ru" ? `Событие «${vars.coupleNames}» — панель:` : `Event «${vars.coupleNames}» — host panel:`}</p><p><a href="${vars.hostUrl}" style="display:inline-block;background:#c4ff0d;color:#121212;padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:700">Host</a></p><p style="font-size:12px;color:#666">${vars.hostUrl}</p>`,
    );
    return { subject, html, text: `${subject}\n${vars.hostUrl}` };
  }

  return {
    subject,
    html: wrapHtml(loc, subject, `<pre>${JSON.stringify(vars)}</pre>`),
    text: JSON.stringify(vars),
  };
}
