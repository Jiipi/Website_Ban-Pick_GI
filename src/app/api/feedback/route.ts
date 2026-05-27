import { NextResponse } from "next/server";

const ALLOWED_CATEGORIES = new Set(["bug", "feature", "balance", "content", "other"]);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const category = typeof body.category === "string" ? body.category : "other";
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const message = typeof body.body === "string" ? body.body.trim() : "";
    const contactUid = typeof body.contactUid === "string" ? body.contactUid.trim() : null;

    if (!ALLOWED_CATEGORIES.has(category)) {
      return NextResponse.json({ message: "Loại góp ý không hợp lệ" }, { status: 400 });
    }
    if (title.length < 3 || title.length > 200) {
      return NextResponse.json({ message: "Tiêu đề phải từ 3 đến 200 ký tự" }, { status: 400 });
    }
    if (message.length < 10 || message.length > 2000) {
      return NextResponse.json({ message: "Mô tả phải từ 10 đến 2000 ký tự" }, { status: 400 });
    }
    if (contactUid && !/^\d{6,12}$/.test(contactUid)) {
      return NextResponse.json({ message: "UID liên hệ không hợp lệ" }, { status: 400 });
    }

    console.info("feedback.received", {
      category,
      title,
      contactUid,
      bodyLength: message.length,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ message: "Payload không hợp lệ" }, { status: 400 });
  }
}
