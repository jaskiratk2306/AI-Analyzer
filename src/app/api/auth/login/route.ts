import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createSession, verifyUser } from "@/lib/data/users";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    const user = verifyUser(email, password);
    if (!user) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const token = createSession(user.email);
    const cookieStore = await cookies();
    cookieStore.set("ai-analyzer-session", token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      secure: process.env.NODE_ENV === "production",
    });

    return NextResponse.json({ ok: true, user: { email: user.email, name: user.name, isSubscriber: user.isSubscriber, searchCount: user.searchCount } });
  } catch {
    return NextResponse.json({ error: "Unable to sign in." }, { status: 500 });
  }
}
