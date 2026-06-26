export type ActionResult = {
  ok: boolean;
  message: string;
  id?: string;
  errors?: Record<string, string>;
};

export function emptyToNull(value: unknown) {
  if (typeof value === "string" && value.trim() === "") {
    return null;
  }

  if (value === undefined) {
    return null;
  }

  return value;
}

export function numberOrNull(value: unknown) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const number = Number(value);

  if (Number.isNaN(number)) {
    return null;
  }

  return number;
}

export function formatZodErrors(error: unknown): Record<string, string> {
  const result: Record<string, string> = {};

  if (
    typeof error === "object" &&
    error !== null &&
    "issues" in error &&
    Array.isArray((error as { issues: unknown[] }).issues)
  ) {
    for (const issue of (error as { issues: Array<{ path?: unknown[]; message?: string }> }).issues) {
      const key = issue.path?.join(".") || "form";
      result[key] = issue.message || "Campo inválido.";
    }
  }

  return result;
}

export function getMissingFields(
  payload: Record<string, unknown>,
  fields: Array<{ campo: string; label: string }>
) {
  return fields
    .filter((field) => {
      const value = payload[field.campo];

      if (value === null || value === undefined) return true;
      if (typeof value === "string" && value.trim() === "") return true;

      return false;
    })
    .map((field) => ({
      campo: field.campo,
      mensagem: `Cadastro incompleto: preencher ${field.label}.`,
    }));
}
