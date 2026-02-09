// import { NextRequest, NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";

// const DEFAULT_CREDITS = [
//   { type: "AT", balance: 3 },
//   { type: "CS", balance: 3 },
//   { type: "IV", balance: 3 },
//   { type: "DE", balance: 3 },
// ]
// export async function POST(req: NextRequest) {
//   const users = await req.json();

//   try {
//     await prisma.$transaction(async (tx) => {
//       for (const u of users) {
//         const user = await tx.user.upsert({
//           where: { userId: u.userId },
//           update: {},
//           create: {
//             id: crypto.randomUUID(),
//             userId: u.userId,
//             email: u.email,
//             name: u.name ?? null,
//             payType: "Basic",
//           },
//         });

//         for (const c of DEFAULT_CREDITS) {
//           await tx.userCredit.upsert({
//             where: {
//               userId_type: {
//                 userId: user.userId,
//                 type: c.type,
//               },
//             },
//             update: {},
//             create: {
//               userId: user.userId,
//               type: c.type,
//               balance: c.balance,
//             },
//           });

//           await tx.creditTransaction.create({
//             data: {
//               userId: user.userId,
//               type: c.type,
//               amount: c.balance,
//               action: "GRANT",
//               reference: "DEFAULT_FREE_PLAN",
//             },
//           });
//         }
//       }
//     });

//     return NextResponse.json({ success: true }, { status: 201 });
//   } catch (error) {
//     console.error(error);
//     return NextResponse.json( { error: "Failed to insert users" }, { status: 500 } );
//   }
// }



import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

const BATCH_SIZE = 25;
const CONCURRENCY = 4;

async function processBatch(users: any[], results: any[]) {
  for (const u of users) {
    let finalResult: any = null;

    try {
      await prisma.$transaction(async (tx) => {
        const existing = await tx.user.findUnique({
          where: { email: u.email },
        });

        if (existing && existing.userId !== u.userId) {
          throw new Error("EMAIL_CONFLICT_DIFFERENT_USER");
        }

        // ✅ SKIPPED
        if (
          existing &&
          existing.userId === u.userId &&
          existing.name === (u.name ?? null)
        ) {
          finalResult = {
            email: u.email,
            status: "SKIPPED",
            reason: "ALREADY_EXISTS_NO_CHANGE",
          };
          return;
        }

        let user;

        if (existing) {
          user = await tx.user.update({
            where: { email: u.email },
            data: {
              name: u.name ?? null,
            },
          });

          finalResult = {
            email: u.email,
            status: "UPDATED",
          };
        } else {
          user = await tx.user.create({
            data: {
              userId: u.userId,
              email: u.email,
              name: u.name ?? null,
              payType: "Basic",
            },
          });

          finalResult = {
            email: u.email,
            status: "CREATED",
          };
        }

        // ✅ Grant credits ONLY for newly created users
        if (finalResult.status === "CREATED") {
          for (const c of DEFAULT_CREDITS) {
            await tx.userCredit.create({
              data: {
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

      // ✅ Push ONCE per user
      if (finalResult) {
        results.push(finalResult);
      }
    } catch (error: any) {
      let reason = "UNKNOWN_ERROR";

      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        reason = "EMAIL_ALREADY_EXISTS";
      }

      if (error.message === "EMAIL_CONFLICT_DIFFERENT_USER") {
        reason = "EMAIL_CONFLICT_DIFFERENT_USER";
      }

      results.push({
        email: u.email,
        status: "FAILED",
        reason,
      });

      await prisma.userImportAudit.create({
        data: {
          email: u.email,
          userId: u.userId ?? null,
          reason,
          payload: u,
          source: "ADMIN_BULK_IMPORT",
        },
      });
    }
  }
}

async function runWithConcurrency<T>(
  batches: T[][],
  limit: number,
  handler: (batch: T[]) => Promise<void>
) {
  const executing: Promise<void>[] = [];

  for (const batch of batches) {
    const p = handler(batch);
    executing.push(p);

    if (executing.length >= limit) {
      await Promise.race(executing);
      executing.splice(
        executing.findIndex((e) => e === p),
        1
      );
    }
  }

  await Promise.all(executing);
}

const DEFAULT_CREDITS = [
  { type: "AT", balance: 3 },
  { type: "CS", balance: 3 },
  { type: "IV", balance: 3 },
  { type: "DE", balance: 3 },
];

export async function POST(req: NextRequest) {
  const users = await req.json();

  const batches = chunkArray(users, BATCH_SIZE);
  const results: any[] = [];

  await runWithConcurrency(batches, CONCURRENCY, async (batch) => {
    await processBatch(batch, results);
  });

  return NextResponse.json({
    total: users.length,
    created: results.filter(r => r.status === "CREATED").length,
    updated: results.filter(r => r.status === "UPDATED").length,
    skipped: results.filter(r => r.status === "SKIPPED").length,
    failed: results.filter(r => r.status === "FAILED"),
  });
}