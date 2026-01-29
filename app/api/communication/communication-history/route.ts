import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

interface RequestBody{
    uniqueId:string;
}
export async function POST(req:NextRequest){
    const { uniqueId }:RequestBody = await req.json();
    try {
        const communication = await prisma.communication.findUnique({
            where: { uniqueId:uniqueId },
            select:{
                uniqueId: true,
                prepType: true,
                difficultyLevel: true,
                focusArea: true,
                userId: true,
            }
        });
    
        if (!communication) {
            return NextResponse.json({ error: 'Communication not found' },{ status:404 });
        }

        const communicationmessage = await prisma.communicationMessage.findMany({
            where: { communicationId: uniqueId, },
            select:{
                sender:true,
                content:true,
                timestamp:true
            }
        });

        return NextResponse.json({message: 'Communication history',history:communicationmessage ,communicationdata:communication }, { status:200 })
    } catch {
        return NextResponse.json({error: 'Something went wrong'}, { status : 500})
    }
}