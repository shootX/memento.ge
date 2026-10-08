export type GuestUploadUiStatus =
  | "queued"
  | "uploading"
  | "retrying"
  | "failed"
  | "completed";

export function isSuccessfulUploadStatus(status: GuestUploadUiStatus): boolean {
  return status === "completed";
}

export function xhrMapsToCompleted(httpStatus: number): boolean {
  return httpStatus >= 200 && httpStatus < 300;
}
