import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/data/users";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("ai-analyzer-session")?.value;
    const user = getSessionUser(token);
    if (!user) {
      return NextResponse.json({ user: null });
    }

    return NextResponse.json({ user: { email: user.email, name: user.name, isSubscriber: user.isSubscriber, searchCount: user.searchCount } });
  } catch {
    return NextResponse.json({ user: null });
  }
}
