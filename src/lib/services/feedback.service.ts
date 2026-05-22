import prisma from "@/lib/prisma";
import type { FeedbackType } from "@prisma/client";

// ─── Types ───

export type CreateFeedbackInput = {
  playerId: string;
  teamId: string;
  feedbackType: FeedbackType;
  message: string;
  relatedEvaluationId?: string;
  relatedTaskId?: string;
};

// ─── CRUD ───

export async function createFeedback(data: CreateFeedbackInput, coachId: string) {
  // Check if player is in infantile category → auto-send to parent
  const sentToParent = await shouldSendToParent(data.playerId, data.teamId);

  const feedback = await prisma.personalizedFeedback.create({
    data: {
      coachId,
      playerId: data.playerId,
      teamId: data.teamId,
      feedbackType: data.feedbackType,
      message: data.message,
      relatedEvaluationId: data.relatedEvaluationId ?? null,
      relatedTaskId: data.relatedTaskId ?? null,
      sentToParent,
    },
    include: {
      player: { select: { id: true, fullName: true, position: true } },
      coach: { select: { id: true, fullName: true } },
      evaluation: { select: { id: true, evaluationDate: true, overallAvg: true } },
      task: { select: { id: true, title: true } },
    },
  });

  return feedback;
}

export async function getFeedback(filters: {
  teamId?: string;
  playerId?: string;
  feedbackType?: string;
}) {
  const where: Record<string, unknown> = {};
  if (filters.teamId) where.teamId = filters.teamId;
  if (filters.playerId) where.playerId = filters.playerId;
  if (filters.feedbackType) where.feedbackType = filters.feedbackType as FeedbackType;

  return prisma.personalizedFeedback.findMany({
    where,
    include: {
      player: { select: { id: true, fullName: true, position: true } },
      coach: { select: { id: true, fullName: true } },
      evaluation: { select: { id: true, evaluationDate: true, overallAvg: true } },
      task: { select: { id: true, title: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getFeedbackById(id: string) {
  return prisma.personalizedFeedback.findUnique({
    where: { id },
    include: {
      player: { select: { id: true, fullName: true, position: true, photoUrl: true } },
      coach: { select: { id: true, fullName: true } },
      team: { select: { id: true, name: true } },
      evaluation: { select: { id: true, evaluationDate: true, overallAvg: true, context: true } },
      task: { select: { id: true, title: true, status: true } },
    },
  });
}

// ─── Parent notification helper ───

async function shouldSendToParent(playerId: string, teamId: string): Promise<boolean> {
  // Check if the team belongs to an infantile category
  const teamCategories = await prisma.teamCategory.findMany({
    where: { teamId },
    include: { category: { select: { name: true } } },
  });

  const infantileKeywords = ["infantil", "sub-8", "sub-10", "sub-12", "sub-14", "benjamín", "alevín", "prebenjamín"];
  const isInfantile = teamCategories.some((tc) =>
    infantileKeywords.some((kw) => tc.category.name.toLowerCase().includes(kw))
  );

  if (!isInfantile) return false;

  // Check if the player has a parent registered
  const parentLink = await prisma.parentPlayer.findFirst({
    where: { playerId },
  });

  return !!parentLink;
}

// ─── Get parent contacts for a player ───

export async function getParentContacts(playerId: string) {
  const parentLinks = await prisma.parentPlayer.findMany({
    where: { playerId },
    include: {
      parent: {
        select: { id: true, fullName: true, email: true, phone: true },
      },
    },
  });

  return parentLinks.map((pl) => ({
    parentId: pl.parent.id,
    name: pl.parent.fullName,
    email: pl.parent.email,
    phone: pl.parent.phone,
    relationship: pl.relationship,
  }));
}
