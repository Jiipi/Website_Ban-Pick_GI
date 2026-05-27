export type ImageFetchResult =
  | { ok: true; contentType: string; body: ArrayBuffer }
  | { ok: false };

export interface ChibiImageGateway {
  fetchImage(src: string): Promise<ImageFetchResult>;
}
