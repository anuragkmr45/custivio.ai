import { textField, type ApiRecord } from "@/lib/api/records";

export function buildCustomFieldValues(
  form: FormData,
  fields: ApiRecord[],
): Record<string, unknown> {
  const values: Record<string, unknown> = {};

  for (const field of fields) {
    const key = textField(field, "key", "");
    if (!key) continue;
    const fieldType = textField(field, "fieldType", "text");
    const formKey = `custom.${key}`;

    if (fieldType === "boolean") {
      values[key] = form.get(formKey) === "on";
      continue;
    }

    if (fieldType === "multiselect") {
      const selected = form
        .getAll(formKey)
        .map(String)
        .map((value) => value.trim())
        .filter(Boolean);
      if (selected.length > 0) values[key] = selected;
      continue;
    }

    const raw = String(form.get(formKey) ?? "").trim();
    if (!raw) continue;
    values[key] = fieldType === "number" ? Number(raw) : raw;
  }

  return values;
}
