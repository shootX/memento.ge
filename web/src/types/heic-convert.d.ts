declare module "heic-convert" {
  type HeicConvertInput = {
    buffer: Buffer | ArrayBuffer;
    format: "JPEG" | "PNG";
    quality?: number;
  };

  export default function heicConvert(input: HeicConvertInput): Promise<ArrayBuffer>;
}
