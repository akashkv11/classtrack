import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { lookupParentResult, resultResponseHeaders } from "@/lib/assessments/sharing";

const schema = z.object({ name: z.string().trim().min(2).max(200), roll_no: z.number().int().positive().optional() });
export async function POST(request: NextRequest, context: { params: Promise<{ token: string }> }) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter at least two characters of the student’s name and select a matching student if prompted." }, { status: 400, headers: resultResponseHeaders });
  try {
    const { token } = await context.params;
    const result = await lookupParentResult(token, parsed.data.name, parsed.data.roll_no);
    const status = result.status === "unavailable" ? 404 : result.status === "not_found" ? 404 : 200;
    return NextResponse.json(result, { status, headers: resultResponseHeaders });
  } catch {
    return NextResponse.json({ error: "Results could not be loaded. Please try again." }, { status: 503, headers: resultResponseHeaders });
  }
}
