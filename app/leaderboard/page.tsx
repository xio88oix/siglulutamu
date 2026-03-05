"use client";

import { useState, useEffect } from "react";

interface LeaderboardEntry {
  rank: number;
  id: number;
  name: string;
  total_points: number;
  races_picked: number;
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [me, setMe] = useState<{ id: number } | null>(null);

  useEffect(() => {
    fetch("/api/leaderboard").then(r => r.json()).then(setLeaderboard);
    fetch("/api/auth/me").then(r => r.json()).then(setMe).catch(() => {});
  }, []);

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Leaderboard</h1>
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-red-700 text-white">
            <tr>
              <th className="px-6 py-3 text-left">Rank</th>
              <th className="px-6 py-3 text-left">Player</th>
              <th className="px-6 py-3 text-center">Races with Picks</th>
              <th className="px-6 py-3 text-right">Total Points</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((entry, i) => (
              <tr
                key={entry.id}
                className={`border-b last:border-0 transition-colors ${
                  entry.id === me?.id ? "bg-red-50" : i % 2 === 0 ? "bg-white" : "bg-gray-50"
                }`}
              >
                <td className="px-6 py-4 font-bold text-lg">
                  {medals[entry.rank - 1] || `#${entry.rank}`}
                </td>
                <td className="px-6 py-4 font-medium">
                  {entry.name}
                  {entry.id === me?.id && (
                    <span className="ml-2 text-xs text-red-600 font-normal">(you)</span>
                  )}
                </td>
                <td className="px-6 py-4 text-center text-gray-500">{entry.races_picked}</td>
                <td className="px-6 py-4 text-right font-bold text-xl text-red-600">
                  {entry.total_points}
                </td>
              </tr>
            ))}
            {leaderboard.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-400">
                  No results yet. Check back after the first race closes.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
