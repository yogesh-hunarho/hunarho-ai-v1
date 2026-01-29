import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const RequestBodySchema = z.object({
    userId: z.string(),
});

export async function GET(req:NextRequest){
    let body;
    try {
        body = RequestBodySchema.parse(await req.json());
    } catch {
        return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
    try {
        const debate = await prisma.debate.findMany({
            where: { userId:body.userId },
            select:{ 
                debatename:true,
                uniqueId:true
            },
            orderBy:{
                createdAt:"desc" 
            }
            
        });
    
        if (!debate) {
            return NextResponse.json({ error: 'Debate not found' },{ status:404 });
        }
        
        return NextResponse.json({message: 'Debate list', debatedata:debate }, { status:200 })
    } catch {
        return NextResponse.json({error: 'Something went wrong'}, { status : 500})
    }
}