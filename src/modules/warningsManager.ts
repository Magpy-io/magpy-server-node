import { WarningDataTypes } from "@src/api/types/WarningTypes";

const warnings = new Map<string, WarningDataTypes>();

export function GetLastWarningForUser(userId: string) {
  if (warnings.has(userId)) {
    const warning = warnings.get(userId);
    warnings.delete(userId);
    return warning;
  }
  return;
}

export function SetLastWarningForUser(
  userId: string,
  warning: WarningDataTypes
) {
  warnings.set(userId, warning);
}

export function HasWarningForUser(userId: string) {
  return warnings.has(userId);
}

export function ClearAllWarnings() {
  warnings.clear();
}
