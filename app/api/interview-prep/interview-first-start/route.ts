import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { fetchInterview } from '@/lib/global-cache';

const RequestBodySchema = z.object({
  interviewId: z.string(),
});

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function getRoleText(jobRole?: string) {
  if (!jobRole) return "this role";
  return `the ${jobRole} role`;
}

const fresherTechnicalStarters = [
  "Let’s start. Tell me about a technical project you worked on recently.",
  "Please explain one project where you used your main technical skills.",
  "What technologies have you practiced the most during your studies?",
  "Tell me about a problem you solved in a project.",
  "Which technical skill are you most confident about and why?"
];

const fresherHRStarters = [
  "To begin, tell me a little about yourself.",
  "What made you interested in this career?",
  "Why did you choose this field of study?",
  "What are your strengths as a fresher?",
  "What are you looking to learn in your first job?"
];

const fresherMixedStarters = [
  "Tell me about yourself and what you have been learning recently.",
  "What skills have you developed that fit this role?",
  "Tell me about a project you enjoyed working on.",
  "Why are you interested in this role?",
  "What do you consider your strongest skill?"
];


function getInterviewStarter(interview: {
  yearsOfExperience?: number | null;
  interviewType: string;
  jobRole?: string | null;
}) {
  const greeting = getGreeting();
  const roleText = getRoleText(interview.jobRole ?? undefined);
  const isFresher = (interview.yearsOfExperience ?? 0) <= 1;

  let pool: string[] = [];

  if (isFresher) {
    if (interview.interviewType === "Technical") {
      pool = fresherTechnicalStarters;
    } else if (interview.interviewType === "HR") {
      pool = fresherHRStarters;
    } else {
      pool = fresherMixedStarters;
    }
  }

  const question = pool[Math.floor(Math.random() * pool.length)];
  return `${greeting}. We’ll be interviewing you for ${roleText}. ${question}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = RequestBodySchema.parse(await req.json());

    const interview = await fetchInterview(body.interviewId);
    if (!interview) {
      return NextResponse.json({ error: "Interview not found" }, { status: 404 });
    }

    // const aiResponse = "Hey, nice to meet you. I am ready to start the interview. Please introduce yourself first.";
    const aiResponse = getInterviewStarter(interview);
    const transactions = [];

    // Always create AI response message
    transactions.push(
      prisma.interviewMessage.create({
        data: {
          id: crypto.randomUUID(),
          interviewId: interview.id,
          userId: interview.userId,
          sender: "AI",
          content: aiResponse?.trim(),
        },
      })
    );

    await prisma.$transaction(transactions);

    return NextResponse.json({ response: aiResponse, success: true });

  } catch (err) {
    console.error("INTERVIEW_API_ERROR", err);
    return NextResponse.json({ error: "AI failed to generate response" }, { status: 502 });
  }
}