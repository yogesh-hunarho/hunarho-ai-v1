import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

interface RequestBody{
    uniqueId:string;
}
export async function POST(req:NextRequest){
    const { uniqueId }:RequestBody = await req.json();
    try {
        const interview = await prisma.interview.findUnique({
            where: { uniqueId:uniqueId },
            select:{
                uniqueId: true,
                jobType:true,
                jobRole: true,
                jobDescription: true,
                duration: true,
                score: true,
                evaluation:true,
                createdAt:true,
                id:true,
                evaluationMessage:true,
            }
        });
    
        if (!interview) {
            return NextResponse.json({ error: 'interview not found' },{ status:404 });
        }

        const interviewmessage = await prisma.interviewMessage.findMany({
            where: { interviewId: interview.id },
            select:{
                sender:true,
                content:true,
                timestamp:true
            }
        });

        return NextResponse.json({message: 'Interview history', history: interviewmessage, interviewData: interview }, { status:200 })
    } catch {
        return NextResponse.json({error: 'Something went wrong'}, { status : 500})
    }
}