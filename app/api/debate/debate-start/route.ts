import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

interface RequestBody{
    topic:string;
    level:string;
    argueType:string;
    duration:string;
    uniqueId:string;
    debateName:string;
    userId:string;
}
export async function POST(req:NextRequest){
    const { topic, level, argueType, duration, uniqueId, debateName, userId } : RequestBody = await req.json();
    const debateId = crypto.randomUUID();

    let paymentData:{
        payType: string;
        userCredits:{ type:string; balance: number}[];
    }| null = null;

    try {
        await prisma.$transaction(async (tx) => {
            const credit = await tx.userCredit.findUnique({
                where: {
                    userId_type: {
                        userId,
                        type: "DE",
                    },
                },
            });

            const user = await tx.user.findUnique({
                where: { userId },
                select: {
                payType: true,
                userCredits: {
                    select: {
                    type: true,
                    balance: true,
                    },
                },
                },
            });

            if (!user) throw new Error("USER_NOT_FOUND");
            paymentData = {
                payType: user.payType,
                userCredits: user.userCredits,
            };

            if (!credit || credit.balance < 1) {
                throw new Error("INSUFFICIENT_CREDITS");
            }

            await tx.userCredit.update({
                where: {
                    userId_type: {
                        userId,
                        type: "DE",
                    },
                },
                data: {
                    balance: { decrement: 1 },
                },
            });

            await tx.debate.create({
                data: {
                    id:debateId,
                    userId,
                    debatename:debateName,
                    uniqueId,
                    topic:topic,
                    level:level,
                    argumentType:argueType,
                    duration:Number(duration),
                    score:0.0,
                    evaluationMessage:{}
                },
            });

            await tx.creditTransaction.create({
                data: {
                    userId,
                    type: "DE",
                    amount: 1,
                    action: "CONSUME",
                    reference: debateId,
                },
            });
        });

    return NextResponse.json( { message: "Success", uniqueId, paymentData }, { status: 200 });
    } catch (error: any) {
        console.error("Start debate error:", error);
        if (error.message === "INSUFFICIENT_CREDITS") {
            return NextResponse.json(
            {
                errorCode: "INSUFFICIENT_CREDITS",
                message: "You have INSUFFICIENT_CREDITS to start with.",
                uniqueId,
                paymentData,
            },
            { status: 402 }
            );
        }

        return NextResponse.json({ message: error.message || "Failed to start communication" }, { status: 400 });
    }
}