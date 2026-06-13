function toNumberIfPossible(value) {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string" && value.trim() !== "" && !Number.isNaN(Number(value))) {
    return Number(value);
  }

  return value;
}

export function compare(left, operator, right) {
  const a = toNumberIfPossible(left);
  const b = toNumberIfPossible(right);

  switch (operator) {
    case "<=":
      return a <= b;
    case "<":
      return a < b;
    case ">=":
      return a >= b;
    case ">":
      return a > b;
    case "==":
      return a === b;
    default:
      throw new Error(`Unsupported operator: ${operator}`);
  }
}
