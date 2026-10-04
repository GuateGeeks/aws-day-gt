import { HttpsError, type CallableRequest } from "firebase-functions/v2/https";
import type { Role } from "../../../shared/types";

export function isAllowedRole(role: unknown, allowed: Role[]): boolean {
  return typeof role === "string" && allowed.includes(role as Role);
}

export function requireUid(request: CallableRequest<unknown>): string {
  if (!request.auth) throw new HttpsError("unauthenticated", "UNAUTHENTICATED");
  return request.auth.uid;
}

export function requireRole(request: CallableRequest<unknown>, allowed: Role[]): string {
  const uid = requireUid(request);
  const role = request.auth?.token.role ?? "participant";
  if (!isAllowedRole(role, allowed)) throw new HttpsError("permission-denied", "FORBIDDEN");
  return uid;
}
