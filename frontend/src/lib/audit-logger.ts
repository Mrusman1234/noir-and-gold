import { Prisma } from "@prisma/client";
import crypto from "crypto";

export interface SecurityEventParams {
  action: string;
  entityType: string;
  entityId: string;
  actorId: string;
  actorEmail: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  previousState?: unknown;
  newState: unknown;
  reason?: string | null;
}

export type PrismaTransactionClient = Prisma.TransactionClient;

/**
 * Append-only security audit log writer.
 * Records security-sensitive operations (e.g., price modifications, product archival, role changes)
 * to the SecurityAuditLog table inside an existing Prisma transaction.
 */
export async function logSecurityEvent(
  tx: PrismaTransactionClient,
  params: SecurityEventParams
) {
  const previousState =
    params.previousState !== undefined && params.previousState !== null
      ? typeof params.previousState === "string"
        ? params.previousState
        : JSON.stringify(params.previousState)
      : null;

  const newState =
    typeof params.newState === "string"
      ? params.newState
      : JSON.stringify(params.newState);

  return tx.securityAuditLog.create({
    data: {
      id: crypto.randomUUID(),
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      actorId: params.actorId,
      actorEmail: params.actorEmail,
      ipAddress: params.ipAddress ?? null,
      userAgent: params.userAgent ?? null,
      previousState,
      newState,
      reason: params.reason ?? null,
    },
  });
}
