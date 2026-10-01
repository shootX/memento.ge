process.env.NODE_ENV = "test";
process.env.SESSION_SECRET = "test-session-secret-32-characters!!";
process.env.MEDIA_SIGNING_SECRET = "test-media-signing-secret-32chars!!";
process.env.CSRF_SECRET = "test-csrf-secret-32-characters!!!";
process.env.DATABASE_URL =
  process.env.DATABASE_URL ??
  "postgresql://memento:memento@localhost:5432/memento_test";
process.env.STORAGE_BACKEND = "local";
process.env.LOCAL_STORAGE_PATH = "./data/test-uploads";
process.env.EMAIL_PROVIDER = "log";
process.env.FLITT_SECRET_KEY = "test_flitt_secret";
process.env.FLITT_MERCHANT_ID = "1549901";
