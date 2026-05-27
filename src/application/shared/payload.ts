import { failure, success, type ServiceResult } from "@/application/shared/ServiceResult";
import { isTeamSide, type TeamSide } from "@/domain/common/types";

export function asPayload(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? value as Record<string, unknown> : {};
}

export function readString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function readClientId(payload: Record<string, unknown>): string {
  return readString(payload.clientId);
}

export function requireClientId(payload: Record<string, unknown>): ServiceResult<string> {
  const clientId = readClientId(payload);
  return clientId ? success(clientId) : failure(400, "Missing clientId");
}

export function requireTeam(value: unknown): ServiceResult<TeamSide> {
  return isTeamSide(value) ? success(value) : failure(400, "Invalid team");
}

export function isValidUid(value: string): boolean {
  return /^\d{9,10}$/.test(value);
}
