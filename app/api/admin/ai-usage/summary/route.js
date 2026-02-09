import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const where = {
    createdAt: {
      gte: from ? new Date(from) : undefined,
      lte: to ? new Date(to) : undefined,
    },
  };

  const data = await prisma.aIUsage.aggregate({
    where,
    _count: { id: true },
    _sum: { tokensUsed: true, cost: true },
  });

  return NextResponse.json(data);
}



// export async function GET() {
//   const result = await prisma.aIUsage.aggregate({
//     _count: { id: true },
//     _sum: {
//       tokensUsed: true,
//       cost: true,
//     },
//   });

//   return NextResponse.json({
//     totalCalls: result._count.id ?? 0,
//     totalTokens: result._sum.tokensUsed ?? 0,
//     totalCost: Number((result._sum.cost ?? 0).toFixed(6)),
//   });
// }
