import { NextRequest, NextResponse } from "next/server";
import {
  parentCommunicationClassIdQuerySchema,
  parseInput,
  validationErrorResponse,
} from "@/lib/validation";

export function parseRequiredClassIdQuery(request: NextRequest) {
  const classId = request.nextUrl.searchParams.get("class_id");
  const parsed = parseInput(parentCommunicationClassIdQuerySchema, {
    class_id: classId ?? "",
  });

  if (!parsed.success) {
    return {
      ok: false as const,
      response: NextResponse.json(validationErrorResponse(parsed), { status: 400 }),
    };
  }

  return { ok: true as const, classId: parsed.data.class_id };
}
