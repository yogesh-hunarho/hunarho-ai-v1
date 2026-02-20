import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const RequestBodySchema = z.object({
    userId: z.string(),
});

export async function POST(req:NextRequest){
    let body;
    try {
        body = RequestBodySchema.parse(await req.json());
    } catch {
        return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
    try {
        const communication = await prisma.communication.findMany({
            where: { userId:body.userId },
            select:{
                prepType:true,
                uniqueId:true
            },
            orderBy:{
                createdAt:"desc" 
            }
            
        });
    
        if (!communication) {
            return NextResponse.json({ error: 'Communication not found' },{ status:404 });
        }
        
        return NextResponse.json({message: 'Communication list', communicationdata:communication }, { status:200 })
    } catch {
        return NextResponse.json({error: 'Something went wrong'}, { status : 500})
    }
}