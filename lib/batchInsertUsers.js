import { prisma } from "@/lib/prisma";

const CHUNK_SIZE = 500;

export async function batchInsertUsers(users) {
  for (let i = 0; i < users.length; i += CHUNK_SIZE) {
    const chunk = users.slice(i, i + CHUNK_SIZE);

    await prisma.$transaction(async (tx) => {
      await tx.user.createMany({
        data: chunk.map((u) => ({
          id: crypto.randomUUID(),
          name: u.name,
          email: u.email,
          userId: u.userId,
          updatedAt: new Date(),
        })),
        skipDuplicates: true,
      });
    });
  }
}
