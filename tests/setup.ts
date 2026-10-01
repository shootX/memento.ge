process.env.NODE_ENV = "test";
process.env.SESSION_SECRET = "test-session-secret-32-characters!!";
process.env.MEDIA_SIGNING_SECRET = "test-media-signing-secret-32chars!!";
process.env.CSRF_SECRET = "test-csrf-secret-32-characters!!!";
process.env.DATABASE_URL = "file:./test.db";
process.env.STORAGE_BACKEND = "local";
process.env.LOCAL_STORAGE_PATH = "./data/test-uploads";
