import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const DEFAULT_CREDITS = [
  { type: "AT", balance: 3 },
  { type: "CS", balance: 3 },
  { type: "IV", balance: 3 },
  { type: "DE", balance: 3 },
]
export async function POST(req: NextRequest) {
  const users = await req.json();

  try {
    await prisma.$transaction(async (tx) => {
      for (const u of users) {
        const user = await tx.user.upsert({
          where: { userId: u.userId },
          update: {},
          create: {
            id: crypto.randomUUID(),
            userId: u.userId,
            email: u.email,
            name: u.name ?? null,
            payType: "Basic",
          },
        });

        for (const c of DEFAULT_CREDITS) {
          await tx.userCredit.upsert({
            where: {
              userId_type: {
                userId: user.userId,
                type: c.type,
              },
            },
            update: {},
            create: {
              userId: user.userId,
              type: c.type,
              balance: c.balance,
            },
          });

          await tx.creditTransaction.create({
            data: {
              userId: user.userId,
              type: c.type,
              amount: c.balance,
              action: "GRANT",
              reference: "DEFAULT_FREE_PLAN",
            },
          });
        }
      }
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json( { error: "Failed to insert users" }, { status: 500 } );
  }
}


// import { NextRequest, NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";
// import { DEFAULT_AVAILABLE_DATA } from "@/data/default";

// const MAX_BATCH = 4000;
// const CHUNK_SIZE = 500;

// export async function POST(req: NextRequest) {
//   try {
//     const users = await req.json();

//     if (!Array.isArray(users) || users.length === 0) {
//       return NextResponse.json(
//         { 
//           error: "Users array is required",
//           exampleData:[
//             {
//               "name": "User One",
//               "email": "user1@test.com",
//               "userId": "u1"
//             },
//             {
//               "name": "User Two",
//               "email": "user2@test.com",
//               "userId": "u2"
//             }
//           ],
//           maxBatch:`Maximum ${MAX_BATCH} users allowed per request`
//         },
//         { status: 400 }
//       );
//     }

//     if (users.length > MAX_BATCH) {
//       return NextResponse.json(
//         { error: `Maximum ${MAX_BATCH} users allowed per request` },
//         { status: 400 }
//       );
//     }

//     let totalInserted = 0;

//     for (let i = 0; i < users.length; i += CHUNK_SIZE) {
//       const chunk = users.slice(i, i + CHUNK_SIZE);

//       const result = await prisma.$transaction(async (tx) => {
//         return await tx.user.createMany({
//           data: chunk.map((u) => ({
//             id: crypto.randomUUID(),
//             name: u.name ?? null,
//             email: u.email,
//             userId: u.userId,
//             payType: "Free",
//             availableData: DEFAULT_AVAILABLE_DATA,
//             updatedAt: new Date(),
//           })),
//           skipDuplicates: true,
//         });
//       });

//       totalInserted += result.count;
//     }

//     return NextResponse.json(
//       {
//         success: true,
//         requested: users.length,
//         inserted: totalInserted,
//         skipped: users.length - totalInserted,
//       },
//       { status: 201 }
//     );
//   } catch (error) {
//     console.error("Batch insert failed:", error);

//     return NextResponse.json(
//       { error: "Failed to insert users" },
//       { status: 500 }
//     );
//   }
// }