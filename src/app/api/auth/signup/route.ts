import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createSession, createUser } from "@/lib/data/users";

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email, and password are required." }, { status: 400 });
    }

    const user = createUser(email, password, name);
    if (!user) {
      return NextResponse.json({ error: "A user with that email already exists." }, { status: 409 });
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
  } catch (error) {
    console.error("signup error", error);
    return NextResponse.json({ error: "Unable to create account." }, { status: 500 });
  }
}
