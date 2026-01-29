import { PLAN_PRICES } from "@/data/default";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
type PlanType = keyof typeof PLAN_PRICES;

interface PaymentRequestBody {
  planType: PlanType;
  payment_id: string;
  order_id: string;
  userId: string;
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as PaymentRequestBody;
  const { planType, payment_id, order_id, userId } = body;
  
  const plan = PLAN_PRICES[planType];
  if (!plan) {
    return NextResponse.json({ message: "Invalid plan type" }, { status: 400 });
  }

  try {
    await prisma.$transaction(async (tx) => {
      // 1️⃣ Store payment
      await tx.payment.create({
        data: {
          userId,
          provider: "razorpay",
          paymentId: payment_id,
          orderId: order_id,
          planType,
          amount: plan.price,
          currency: "INR",
          status: "PAID",
        },
      });

      const credits: { type: string; amount: number }[] = [
        { type: "AT", amount: plan.AT },
        { type: "CS", amount: plan.CS },
        { type: "IV", amount: plan.IV },
      ];

      for (const c of credits) {
        // upsert balance
        await tx.userCredit.upsert({
          where: {
            userId_type: {
              userId,
              type:c.type ,
            },
          },
          update: {
            balance: { increment: c.amount },
          },
          create: {
            userId,
            type: c.type,
            balance: c.amount,
          },
        });

        // transaction log
        await tx.creditTransaction.create({
          data: {
            userId,
            type: c.type,
            amount: c.amount,
            action: "GRANT",
            reference: payment_id,
          },
        });
      }
    });

    return NextResponse.json( { message: "Payment successful", success: true }, { status: 200 } );
  } catch (error) {
    console.error(error);
    return NextResponse.json( { message: "Internal server error", success: false }, { status: 500 } );
  }
}



// export async function POST(req: NextRequest) {
//   const body = await req.json();
//   const { planType, payment_id, order_id, userId }: PaymentType = body;

//   if (!PLAN_PRICES[planType]) {
//     return NextResponse.json({ message: "Invalid plan type" }, { status: 400 });
//   }

//   try {
//     const user = await prisma.user.findUnique({
//       where: { id: userId as string },
//     });

//     if (!user) {
//       return NextResponse.json(
//         { message: "User not found", success: false },
//         { status: 404 }
//       );
//     }

//     const { minutes, price } = PLAN_PRICES[planType];
//     const paymentAmount = price;

//     // await prisma.user.update({
//     //   where: { id: userId as string },
//     //   data: {
//     //     availableMinutes: user.availableMinutes + minutes,
//     //     isPaid: price > 0 ? planType : "Free",
//     //   },
//     // });

//     await prisma.payment.create({
//       data: {
//         userId: userId as string,
//         planType,
//         amount: paymentAmount,
//         payment_id,
//         order_id,
//       },
//     });

//     return NextResponse.json({ message: "Success",success: true }, { status: 200 } );
//   } catch (error) {
//     return NextResponse.json(
//       { message: "Internal server error", success: false },
//       { status: 500 }
//     );
//   }
// }
