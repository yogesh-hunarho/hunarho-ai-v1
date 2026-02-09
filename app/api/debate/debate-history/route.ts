import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

interface RequestBody{
    uniqueId:string;
}
export async function POST(req:NextRequest){
    const { uniqueId }:RequestBody = await req.json();
    try {
        const debate = await prisma.debate.findUnique({
            where: { uniqueId:uniqueId },
            select:{
                uniqueId: true,
                debatename:true,
                topic: true,
                level: true,
                argumentType:true,
                duration: true,
                score: true,
                createdAt:true,
                id:true,
                evaluation:true,
                evaluationMessage:true
            }
        });
    
        if (!debate) {
            return NextResponse.json({ error: 'Debate not found' },{ status:404 });
        }

        const debatemessage = await prisma.debateMessage.findMany({
            where: { debateId: debate.id, },
            select:{
                sender:true,
                content:true,
                timestamp:true
            }
        });

        return NextResponse.json({message: 'Debate history',history:debatemessage,debatedata:debate }, { status:200 })
    } catch {
        return NextResponse.json({error: 'Something went wrong'}, { status : 500})
    }
}