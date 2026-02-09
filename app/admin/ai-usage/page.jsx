'use client';

import { useEffect, useState } from "react";

export default function AIUsageAdminPage() {
  const [summary, setSummary] = useState(null);
  const [models, setModels] = useState([]);
//   const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [summaryRes, modelRes,] = await Promise.all([
          fetch("/api/admin/ai-usage/summary"),
          fetch("/api/admin/ai-usage/by-model"),
        //   fetch("/api/admin/ai-usage/top-users"),
        ]);

        setSummary(await summaryRes.json());
        setModels(await modelRes.json());
        // setUsers(await userRes.json());
      } catch (err) {
        console.error("Failed to load AI usage", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) {
    return <div className="p-6">Loading AI usage…</div>;
  }

  return (
    <div className="p-6 space-y-8 text-black">
      <h1 className="text-2xl font-semibold">AI Usage Dashboard</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Total API Calls" value={summary?._count?.id} />
        <StatCard title="Total Tokens Used" value={summary?._sum?.tokensUsed} />
        <StatCard
          title="Total Cost ($)"
          value={summary?._sum?.cost?.toFixed(6)}
        />
      </div>

      {/* Usage by Model */}
      <section>
        <h2 className="text-xl font-medium mb-3">Usage by Model</h2>
        <Table
          headers={["Model", "Calls", "Tokens", "Cost ($)"]}
          rows={models.map(m => [
            m.model,
            m.calls,
            m.tokens,
            m.cost.toFixed(6),
          ])}
        />
      </section>

      {/* Top Users */}
      {/* <section>
        <h2 className="text-xl font-medium mb-3">Top Users</h2>
        <Table
          headers={["User ID", "Calls", "Tokens", "Cost ($)"]}
          rows={users.map(u => [
            u.userId,
            u.calls,
            u.tokens,
            u.cost.toFixed(6),
          ])}
        />
      </section> */}
    </div>
  );
}

function StatCard({ title, value }) {
  return (
    <div className="rounded-xl border p-4 shadow-sm bg-white">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="text-2xl font-bold mt-1">{value ?? "-"}</div>
    </div>
  );
}

function Table({ headers, rows }) {
  return (
    <div className="overflow-x-auto border rounded-lg">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-100">
          <tr>
            {headers.map(h => (
              <th key={h} className="px-4 py-2 text-left font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t">
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-2">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
