import prisma from "@/lib/prisma";

export async function logAudit(
  userId: string | null,
  action: string,
  resourceType?: string,
  resourceId?: string,
  details?: Record<string, unknown>,
  ipAddress?: string
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        resourceType: resourceType ?? null,
        resourceId: resourceId ?? null,
        details: details ? JSON.parse(JSON.stringify(details)) : undefined,
        ipAddress: ipAddress ?? null,
      },
    });
  } catch (error) {
    // Log to console but don't throw - audit should not break main flow
    console.error("Failed to write audit log:", error);
  }
}
