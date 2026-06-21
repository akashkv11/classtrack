import { NextRequest, NextResponse } from "next/server";
import {
  clearSessionCookie,
  isRequestAuthenticated,
  setSessionCookie,
  verifyPassword,
} from "@/lib/auth";

export async function GET(request: NextRequest) {
  return NextResponse.json({
    authenticated: await isRequestAuthenticated(request),
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const password = typeof body.password === "string" ? body.password : "";

  if (!verifyPassword(password)) {
    return NextResponse.json(
      { success: false, error: "Invalid password" },
      { status: 401 },
    );
  }

  const response = NextResponse.json({ success: true });
  await setSessionCookie(response);
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  clearSessionCookie(response);
  return response;
}
