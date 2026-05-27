import { NextResponse } from "next/server";

type HttpResult =
  | { ok: true; data: unknown }
  | { ok: false; status: number; message: string };

export function jsonResult(result: HttpResult): NextResponse {
  if (!result.ok) {
    return NextResponse.json({ message: result.message }, { status: result.status });
  }
  return NextResponse.json(result.data);
}
