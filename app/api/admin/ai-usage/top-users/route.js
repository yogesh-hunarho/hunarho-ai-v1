// import { prisma } from "@/lib/prisma";
// import { NextResponse } from "next/server";

// export async function GET() {
//   const data = await prisma.aIUsage.groupBy({
//     by: ["userId"],
//     _count: { id: true },
//     _sum: {
//       tokensUsed: true,
//       cost: true,
//     },
//     orderBy: {
//       _sum: { cost: "desc" },
//     },
//     take: 10,
//   });

//   return NextResponse.json(
//     data.map(row => ({
//       userId: row.userId,
//       calls: row._count.id,
//       tokens: row._sum.tokensUsed ?? 0,
//       cost: Number((row._sum.cost ?? 0).toFixed(6)),
//     }))
//   );
// }


import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");

  const where = type ? { type } : {};

  // 1️⃣ Aggregate AI usage per user
  const usage = await prisma.aIUsage.groupBy({
    by: ["userId"],
    where,
    _count: { id: true },
    _sum: {
      tokensUsed: true,
      cost: true,
    },
    orderBy: {
      _sum: { cost: "desc" },
    },
    take: 10,
  });

  // 2️⃣ Get user details
  const userIds = usage.map(u => u.userId);

  const users = await prisma.user.findMany({
    where: {
      id: { in: userIds },
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  // 3️⃣ Map users by ID for fast lookup
  const userMap = new Map(
    users.map(user => [user.id, user])
  );

  // 4️⃣ Merge data
  const result = usage.map(row => {
    const user = userMap.get(row.userId);

    return {
      userId: row.userId,
      name: user?.name ?? "Unknown",
      email: user?.email ?? null,
      calls: row._count.id,
      tokens: row._sum.tokensUsed ?? 0,
      cost: Number((row._sum.cost ?? 0).toFixed(6)),
    };
  });

  return NextResponse.json(result);
}
