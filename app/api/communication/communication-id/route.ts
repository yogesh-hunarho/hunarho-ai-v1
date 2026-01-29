import { prisma } from "@/lib/prisma";
import { NextRequest,NextResponse } from "next/server";

export async function POST(req:NextRequest){
    const { uniqueId } = await req.json()

    const findDebate = await  prisma.communication.findUnique({
        where : { uniqueId}
    })

    try {
        if(findDebate){
            return NextResponse.json({ message: "success", find: true } , { status : 200})
        }else{
            return NextResponse.json({ message: "fail", find: false } , { status : 404 })
        }
    } catch {
        return NextResponse.json({ message: "fail", find: false } , { status : 404 })
    }
}