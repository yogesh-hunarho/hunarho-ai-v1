import { prisma } from "@/lib/prisma";
import { LRUCache } from "lru-cache";

const cache = new LRUCache<string, Debate>({
  max: 100,
  ttl: 1000 * 60 * 10,
});

const communicationCache = new LRUCache<string, Communication>({
  max: 100,
  ttl: 1000 * 60 * 10,
});

export interface Debate {
    argueType: string;
    topic: string;
    level: string;
    userId: string;
}

export interface Communication {
    prepType: string;
    difficultyLevel: string;
    focusArea: string;
    userId: string;
}

export async function fetchDebate(debateId: string): Promise<Debate | null> {
    const cachedDebate = cache.get(debateId);

    if (cachedDebate) {
        return cachedDebate;
    }

    const debate = await prisma.debate.findUnique({
        where: { uniqueId: debateId },
        select: { argumentType: true, topic: true, level: true, userId: true },
    });

    if (debate) {
        const mappedDebate = {
            argueType: debate.argumentType,
            topic: debate.topic,
            level: debate.level,
            userId: debate.userId,
        };
        cache.set(debateId, mappedDebate);
        return mappedDebate;
    }

    return null;
}

export async function fetchCommunication(communicationId: string): Promise<Communication | null> {
    const cacheKey = `comm_${communicationId}`;
    const cached = communicationCache.get(cacheKey);

    if (cached) {
        return cached;
    }

    const comm = await prisma.communication.findUnique({
        where: { uniqueId: communicationId },
        select: { prepType: true, difficultyLevel: true, focusArea: true, userId: true },
    });

    if (!comm) return null;

    communicationCache.set(cacheKey, comm);
    return comm;
}
export interface Interview {
    jobType: string;
    jobRole: string | null;
    jobDescription: string | null;
    techStack: string | null;
    yearsOfExperience: number;
    interviewType: string;
    userId: string;
}

const interviewCache = new LRUCache<string, Interview>({
    max: 100,
    ttl: 1000 * 60 * 10,
});

export async function fetchInterview(interviewId: string): Promise<Interview | null> {
    const cacheKey = `int_${interviewId}`;
    const cached = interviewCache.get(cacheKey);

    if (cached) {
        return cached;
    }

    const interview = await prisma.interview.findUnique({
        where: { uniqueId: interviewId },
        select: { 
            jobType: true, 
            jobRole: true,
            jobDescription: true, 
            techStack: true,
            yearsOfExperience: true,
            interviewType: true, 
            userId: true 
        },
    });

    if (!interview) return null;

    interviewCache.set(cacheKey, interview);
    return interview;
}
