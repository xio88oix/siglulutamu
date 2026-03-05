"use client";

import { useState, useEffect, useCallback } from "react";

interface Race {
  id: number;
  round: number;
  name: string;
  date: string;
  status: string;
}

interface User {
  id: number;
  name: string;
}

interface PickDetail {
  driver_id: number;
  name: string;
  team: string;
  position: number | null;
  earned_points: number | null;
}

interface RaceResult {
  id: number;
  user_id: number;
  race_id: number;
  points: number;
  picks: PickDetail[];
}

export default function ResultsPage() {
  const [races, setRaces] = useState<Race[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedRaceId, setSelectedRaceId] = useState<number | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>("me");
  const [me, setMe] = useState<User | null>(null);
  const [result, setResult] = useState<RaceResult | null>(null);

  useEffect(() => {
    fetch("/api/races?status=closed").then(r => r.json()).then((data: Race[]) => {
      setRaces(data);
      if (data.length > 0) setSelectedRaceId(data[data.length - 1].id);
    });
    fetch("/api/auth/me").then(r => r.json()).then((u: User) => {
      setMe(u);
      fetch("/api/users").then(r => r.json()).then(setUsers).catch(() => {});
    });
  }, []);

  const loadResult = useCallback((raceId: number, userId: string) => {
    const uid = userId === "me" ? "" : `&userId=${userId}`;
    fetch(`/api/results?raceId=${raceId}${uid}`)
      .then(r => r.json())
      .then(setResult);
  }, []);

  useEffect(() => {
    if (selectedRaceId) loadResult(selectedRaceId, selectedUserId);
  }, [selectedRaceId, selectedUserId, loadResult]);

  const selectedRace = races.find(r => r.id === selectedRaceId);

  function formatDate(dateStr: string) {
    return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
      month: "long", day: "numeric", year: "numeric",
    });
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Race Results</h1>

      <div className="bg-white rounded-xl shadow p-6 space-y-4">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Race</label>
            <select
              value={selectedRaceId ?? ""}
              onChange={e => setSelectedRaceId(Number(e.target.value))}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              {races.map(r => (
                <option key={r.id} value={r.id}>Round {r.round} – {r.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">View picks for</label>
            <select
              value={selectedUserId}
              onChange={e => setSelectedUserId(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="me">Me ({me?.name})</option>
              {users.filter(u => u.id !== me?.id).map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>
        </div>

        {selectedRace && (
          <div className="grid grid-cols-3 gap-4 bg-gray-50 rounded-lg p-4">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Round</p>
              <p className="font-semibold text-gray-800">Round {selectedRace.round}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Race</p>
              <p className="font-semibold text-gray-800">{selectedRace.name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Date</p>
              <p className="font-semibold text-gray-800">{formatDate(selectedRace.date)}</p>
            </div>
          </div>
        )}
      </div>

      {result ? (
        <div className="bg-white rounded-xl shadow p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">Driver Picks</h2>
            <div className="text-right">
              <p className="text-xs text-gray-500">Total Points</p>
              <p className="text-3xl font-bold text-red-600">{result.points}</p>
            </div>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-2">Driver</th>
                <th className="pb-2">Team</th>
                <th className="pb-2 text-center">Finish</th>
                <th className="pb-2 text-right">Points</th>
              </tr>
            </thead>
            <tbody>
              {result.picks.map((pick, i) => (
                <tr key={i} className="border-b last:border-0">
                  <td className="py-2 font-medium">{pick.name}</td>
                  <td className="py-2 text-gray-500">{pick.team}</td>
                  <td className="py-2 text-center">
                    {pick.position != null ? `P${pick.position}` : "–"}
                  </td>
                  <td className="py-2 text-right font-semibold text-red-600">
                    {pick.earned_points ?? 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow p-6 text-gray-500 text-center">
          No picks found for this race.
        </div>
      )}
    </div>
  );
}
