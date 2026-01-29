import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const userId = String(body.userId);
  const { AT = 0, CS = 0, IV = 0 } = body;

  try {
    await prisma.$transaction(async (tx) => {

        const deductions: { type: string; amount: number }[] = [
            { type: "AT", amount: AT },
            { type: "CS", amount: CS },
            { type: "IV", amount: IV },
        ].filter(d => d.amount > 0)

        for (const d of deductions) {
            const credit = await tx.userCredit.findUnique({
                where: {
                    userId_type: {
                        userId,
                        type: d.type,
                    },
                },
            });

            if (!credit || credit.balance < d.amount) {
                throw new Error("INSUFFICIENT_CREDITS");
            }

            await tx.userCredit.update({
                where: {
                    userId_type: {
                        userId,
                        type: d.type,
                    },
                },
                data: {
                    balance: { decrement: d.amount },
                },
            });

            await tx.creditTransaction.create({
                data: {
                    userId,
                    type: d.type,
                    amount: -d.amount,
                    action: "CONSUME",
                },
            });
        }
    });
    const user = await prisma.user.findUnique({
        where: { userId: userId as string },
        select: {
            payType: true,
            userCredits: {
                select: {
                    type: true,
                    balance: true
                }
            }
        },
    });

    return NextResponse.json( { message: "Credits deducted successfully",success:true, data: user }, { status: 200 } );
} catch (error) {
    console.error(error);
    return NextResponse.json( { message: "Something went wrong", success:false, data:[] }, { status: 500 } );
  }
}
