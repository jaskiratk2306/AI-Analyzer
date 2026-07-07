import { NextResponse } from "next/server";
import { subscribeUser } from "@/lib/data/users";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    const user = subscribeUser(email);
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    return NextResponse.json({ ok: true, user: { email: user.email, isSubscriber: user.isSubscriber } });
  } catch {
    return NextResponse.json({ error: "Unable to process subscription." }, { status: 500 });
  }
}
