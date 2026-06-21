import { ZodError, type ZodType } from "zod";

export type FieldErrors = Record<string, string>;

export function zodFieldErrors(error: ZodError): FieldErrors {
  const fieldErrors: FieldErrors = {};

  for (const issue of error.issues) {
    const path = issue.path.join(".");
    if (!fieldErrors[path]) {
      fieldErrors[path] = issue.message;
    }
  }

  return fieldErrors;
}

export function firstZodError(error: ZodError): string {
  return error.issues[0]?.message ?? "Invalid input";
}

export type ParseResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors: FieldErrors };

export function parseInput<T>(schema: ZodType<T>, input: unknown): ParseResult<T> {
  const result = schema.safeParse(input);

  if (result.success) {
    return { success: true, data: result.data };
  }

  return {
    success: false,
    error: firstZodError(result.error),
    fieldErrors: zodFieldErrors(result.error),
  };
}

export function validationErrorResponse(result: Extract<ParseResult<unknown>, { success: false }>) {
  return {
    error: result.error,
    field_errors: result.fieldErrors,
  };
}
