let unauthorizedHandler: (() => void) | null = null;
let handlingUnauthorized = false;

export function setUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler;
}

export function notifyUnauthorized() {
  if (handlingUnauthorized || !unauthorizedHandler) return;
  handlingUnauthorized = true;
  try {
    unauthorizedHandler();
  } finally {
    setTimeout(() => {
      handlingUnauthorized = false;
    }, 2000);
  }
}
