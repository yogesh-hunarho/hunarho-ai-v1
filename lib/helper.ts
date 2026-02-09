export function getDateFilter(req: Request) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  return {
    createdAt: {
      gte: from ? new Date(from) : undefined,
      lte: to ? new Date(to) : undefined,
    },
  };
}
