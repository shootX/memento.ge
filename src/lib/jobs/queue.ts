type Job = () => Promise<void>;

const queue: Job[] = [];
let running = false;

export function enqueue(job: Job) {
  queue.push(job);
  void drain();
}

async function drain() {
  if (running) return;
  running = true;
  while (queue.length > 0) {
    const job = queue.shift();
    if (job) {
      try {
        await job();
      } catch (e) {
        console.error("[queue]", e);
      }
    }
  }
  running = false;
}

export function enqueueThumbnail(
  fn: () => Promise<void>,
) {
  enqueue(fn);
}
