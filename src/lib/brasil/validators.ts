export function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

export function formatCep(value: string) {
  const digits = onlyDigits(value).slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

export function isValidCpf(cpf: string) {
  const digits = onlyDigits(cpf);

  if (digits.length !== 11) return false;
  if (/^(\d)\1+$/.test(digits)) return false;

  let soma = 0;

  for (let i = 0; i < 9; i++) {
    soma += Number(digits[i]) * (10 - i);
  }

  let primeiroDigito = 11 - (soma % 11);
  if (primeiroDigito >= 10) primeiroDigito = 0;

  if (primeiroDigito !== Number(digits[9])) return false;

  soma = 0;

  for (let i = 0; i < 10; i++) {
    soma += Number(digits[i]) * (11 - i);
  }

  let segundoDigito = 11 - (soma % 11);
  if (segundoDigito >= 10) segundoDigito = 0;

  return segundoDigito === Number(digits[10]);
}

export function isValidCnpj(cnpj: string) {
  const digits = onlyDigits(cnpj);

  if (digits.length !== 14) return false;
  if (/^(\d)\1+$/.test(digits)) return false;

  const calcularDigito = (base: string, pesos: number[]) => {
    const soma = base
      .split("")
      .reduce((total, digit, index) => total + Number(digit) * pesos[index], 0);

    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };

  const primeiro = calcularDigito(
    digits.slice(0, 12),
    [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  );

  const segundo = calcularDigito(
    digits.slice(0, 12) + primeiro,
    [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  );

  return primeiro === Number(digits[12]) && segundo === Number(digits[13]);
}
