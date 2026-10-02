export type UploadErrorCode =
  | "FILE_TOO_LARGE"
  | "FILE_TOO_SMALL"
  | "FILE_TYPE_NOT_ALLOWED"
  | "INVALID_IMAGE"
  | "UNSUPPORTED_FORMAT"
  | "STORAGE_LIMIT";

export function maxMegabytesLabel(maxBytes: number): string {
  return String(Math.round(maxBytes / (1024 * 1024)));
}

export function uploadErrorMessageKa(code: UploadErrorCode, maxBytes?: number): string {
  switch (code) {
    case "FILE_TOO_LARGE":
      return maxBytes
        ? `ფაილი ძალიან დიდია. მაქსიმუმ ${maxMegabytesLabel(maxBytes)} MB.`
        : "ფაილი ძალიან დიდია.";
    case "FILE_TOO_SMALL":
      return "ფაილი ძალიან პატარაა ან დაზიანებულია.";
    case "FILE_TYPE_NOT_ALLOWED":
      return "ეს ფაილის ტიპი არ არის დაშვებული.";
    case "INVALID_IMAGE":
      return "სურათი ვერ გაიხსნა. სცადეთ სხვა ფოტო.";
    case "UNSUPPORTED_FORMAT":
      return "ფორმატი არ არის მხარდაჭერილი. გამოიყენეთ JPG, PNG, HEIC ან MP4.";
    case "STORAGE_LIMIT":
      return "ალბომის მეხსიერების ლიმიტი ამოიწურა.";
    default:
      return "ატვირთვა ვერ მოხერხდა.";
  }
}
