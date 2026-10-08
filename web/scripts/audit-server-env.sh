# Sourced by audit load/a11y scripts — not for production.
export DATABASE_URL="${DATABASE_URL:-postgresql://memento:memento@localhost:5432/memento}"
export ADMIN_PASSWORD_HASH='$2b$12$9xlwxf.kxq03ktSCTfULa.SEHDoSmEoNmvd.wwrtQ6zkmiRYMyYgu'
export ADMIN_PASSWORD=dev-admin-change-me
export E2E_RATE_LIMIT_FREE=1
export PAYMENT_MOCK=1
export STORAGE_BACKEND=local
export LOCAL_STORAGE_PATH=./data/e2e-uploads
export UV_THREADPOOL_SIZE="${UV_THREADPOOL_SIZE:-4}"
export SHARP_CONCURRENCY="${SHARP_CONCURRENCY:-4}"
export MEDIA_DERIVATIVE_CONCURRENCY="${MEDIA_DERIVATIVE_CONCURRENCY:-4}"
