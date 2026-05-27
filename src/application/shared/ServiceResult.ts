export type ServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; message: string };

export function success<T>(data: T): ServiceResult<T> {
  return { ok: true, data };
}

export function failure<T = never>(status: number, message: string): ServiceResult<T> {
  return { ok: false, status, message };
}
