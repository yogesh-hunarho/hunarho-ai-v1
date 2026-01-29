import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { name, email, userId } = await req.json();

    if (!email || !userId) {
      return NextResponse.json( { error: "userId and email are required" }, { status: 400 } );
    }

    const existing = await prisma.user.findUnique({ where: { userId } });

    if (existing) {
      return NextResponse.json( { error: "User already exists" }, { status: 409 } );
    }

    const freePlan = await prisma.plan.findUnique({
      where: { name: "Basic" },
      include: { credits: true },
    });

    if (!freePlan) {
      return NextResponse.json( { error: "Basic plan not configured" }, { status: 500 } );
    }

    const user = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          name,
          email,
          userId,
          payType: "Basic",
        },
      });

      await tx.userCredit.createMany({
        data: freePlan.credits.map((c) => ({
          userId: createdUser.userId,
          type: c.type,
          balance: c.amount,
        })),
      });

      return createdUser;
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json( { error: "Failed to create user" }, { status: 500 } );
  }
}



// import { NextRequest, NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";
// import {DEFAULT_AVAILABLE_DATA} from "@/data/default"

// export async function POST(req: NextRequest) {
//   try {
//     const { name, email, userId } = await req.json();

//     if (!email || !userId) {
//       return NextResponse.json(
//         { error: "userId and email are required" },
//         { status: 400 }
//       );
//     }

//     // Check if user already exists
//     const existingUser = await prisma.user.findUnique({
//       where: { userId },
//     });

//     if (existingUser) {
//       return NextResponse.json(
//         { error: "User with this userId already exists" },
//         { status: 409 }
//       );
//     }

//     // Create user
//     const user = await prisma.user.create({
//       data: {
//         id: crypto.randomUUID(),
//         name,
//         email,
//         userId,
//         payType: "Free",
//         availableData: DEFAULT_AVAILABLE_DATA,
//         updatedAt: new Date(),
//       },
//     });

//     return NextResponse.json(user, { status: 201 });
//   } catch {
//     return NextResponse.json(
//       { error: "Failed to create user" },
//       { status: 500 }
//     );
//   }
// }
