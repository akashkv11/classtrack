import assert from "node:assert/strict";
import test from "node:test";
import { parentPhoneCallUrl, parentPhoneInputValue } from "./phone";
import { studentFormSchema, studentCreateSchema, studentUpdateSchema } from "./validation/schemas";

const form = { full_name: "Test Student", parent_phone: "9876543210", is_active: true };

test("student form and API require ten local phone digits or an empty optional phone", () => {
  for (const parent_phone of ["9876543210", ""]) {
    assert.ok(studentFormSchema.safeParse({ ...form, parent_phone }).success);
    const create = studentCreateSchema.parse({ ...form, parent_phone });
    const update = studentUpdateSchema.parse({ parent_phone });
    assert.equal(create.parent_phone, parent_phone || null);
    assert.equal(update.parent_phone, parent_phone || null);
  }
  for (const parent_phone of ["987654321", "98765432101", "+919876543210", "abcdef1234", "98765 43210"]) {
    assert.equal(studentFormSchema.safeParse({ ...form, parent_phone }).success, false);
    assert.equal(studentCreateSchema.safeParse({ ...form, parent_phone }).success, false);
    assert.equal(studentUpdateSchema.safeParse({ parent_phone }).success, false);
  }
});

test("editing visible fields preserves stored email, roll number, and admission number", () => {
  const input = studentFormSchema.parse(form);
  const update = studentUpdateSchema.parse(input);
  assert.equal("email" in update, false);
  assert.equal("admission_no" in update, false);
  assert.equal("roll_no" in update, false);
  assert.equal(studentUpdateSchema.parse({ parent_phone: null }).parent_phone, null);
  const create = studentCreateSchema.parse({ ...form, admission_no: "999", roll_no: 999 });
  assert.equal("admission_no" in create, false);
  assert.equal("roll_no" in create, false);
});

test("local numbers open the dialer and existing Indian prefixes do not get duplicated", () => {
  for (const phone of ["9876543210", "919876543210", "+91 98765 43210", "00919876543210"]) {
    assert.equal(parentPhoneInputValue(phone), "9876543210");
    assert.equal(parentPhoneCallUrl(phone), "tel:+919876543210");
  }
  assert.equal(parentPhoneInputValue(null), "");
  assert.equal(parentPhoneCallUrl("+44 7700 900123"), "tel:+447700900123");
});
