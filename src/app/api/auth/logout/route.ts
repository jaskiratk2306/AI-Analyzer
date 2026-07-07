import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { deleteSession } from "@/lib/data/users";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("ai-analyzer-session")?.value;
    deleteSession(token);
    cookieStore.set("ai-analyzer-session", "", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
      secure: process.env.NODE_ENV === "production",
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
