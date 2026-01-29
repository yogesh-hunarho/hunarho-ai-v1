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
        const interview = await prisma.interview.findMany({
            where: { userId:body.userId },
            select:{ 
                jobType:true,
                uniqueId:true
            },
            orderBy:{
                createdAt:"desc" 
            }
            
        });
    
        if (!interview) {
            return NextResponse.json({ error: 'Interview list not found' },{ status:404 });
        }
        
        return NextResponse.json({message: 'Interview list', debatedata:interview }, { status:200 })
    } catch {
        return NextResponse.json({error: 'Something went wrong'}, { status : 500})
    }
}