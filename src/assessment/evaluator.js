import { compare } from "./operators.js";

const expressionPattern =
  /^(?<field>[A-Za-z0-9_]+)\s*(?<operator><=|>=|==|<|>)\s*(?<value>true|false|'[^']*'|[0-9.]+)$/;

function parseValue(raw) {
  if (raw === "true") {
    return true;
  }

  if (raw === "false") {
    return false;
  }

  if (raw.startsWith("'") && raw.endsWith("'")) {
    return raw.slice(1, -1);
  }

  return Number(raw);
}

function evaluateAtomicExpression(expression, intake) {
  const trimmed = expression.trim();
  const match = trimmed.match(expressionPattern);

  if (!match?.groups) {
    return { matched: false, unknownFields: [], reason: `Unsupported expression: ${expression}` };
  }

  const { field, operator, value } = match.groups;

  if (!(field in intake) || intake[field] === null || typeof intake[field] === "undefined") {
    return { matched: false, unknownFields: [field], reason: `Missing field: ${field}` };
  }

  return {
    matched: compare(intake[field], operator, parseValue(value)),
    unknownFields: [],
    reason: null
  };
}

function evaluateCondition(condition, intake) {
  const orParts = condition.split("||").map((part) => part.trim());
  const orResults = orParts.map((part) => evaluateAtomicExpression(part, intake));
  const unknownFields = [...new Set(orResults.flatMap((result) => result.unknownFields))];
  const matched = orResults.some((result) => result.matched);

  return { matched, unknownFields, reason: matched ? null : orResults.map((r) => r.reason).filter(Boolean) };
}

export function evaluateRule(rule, intake) {
  const results = rule.conditions.map((condition) => evaluateCondition(condition, intake));
  const unknownFields = [...new Set(results.flatMap((result) => result.unknownFields))];
  const matched = results.every((result) => result.matched);

  return {
    ruleId: rule.ruleId,
    matched,
    unknownFields,
    outcome: rule.outcome,
    projectType: rule.projectType,
    evidence: rule.evidence
  };
}
