"use client";

import { useState, useEffect, useCallback } from "react";

interface Race {
  id: number;
  round: number;
  name: string;
  date: string;
  status: string;
}

interface Driver {
  id: number;
  name: string;
  team: string;
}

interface Pick {
  driver_id: number;
  name: string;
  team: string;
}

interface RacePick {
  id: number;
  user_id: number;
  race_id: number;
  points: number;
  picks: Pick[];
}

export default function HomePage() {
  const [races, setRaces] = useState<Race[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedRaceId, setSelectedRaceId] = useState<number | null>(null);
  const [currentPick, setCurrentPick] = useState<RacePick | null>(null);
  const [picks, setPicks] = useState<[number, number, number]>([-1, -1, -1]);
  const [propagate, setPropagate] = useState(true);
  const [overlay, setOverlay] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/races?status=open").then(r => r.json()).then((data: Race[]) => {
      setRaces(data);
      if (data.length > 0) {
        const nextRace = data.find(r => new Date(r.date) >= new Date()) || data[0];
        setSelectedRaceId(nextRace.id);
      }
    });
    fetch("/api/drivers").then(r => r.json()).then(setDrivers);
  }, []);

  const loadPick = useCallback((raceId: number) => {
    fetch(`/api/picks?raceId=${raceId}`)
      .then(r => r.json())
      .then((data: RacePick | null) => {
        setCurrentPick(data);
        if (data?.picks) {
          const ids = data.picks.map(p => p.driver_id);
          setPicks([ids[0] ?? -1, ids[1] ?? -1, ids[2] ?? -1]);
        } else {
          setPicks([-1, -1, -1]);
        }
      });
  }, []);

  useEffect(() => {
    if (selectedRaceId) loadPick(selectedRaceId);
  }, [selectedRaceId, loadPick]);

  const selectedRace = races.find(r => r.id === selectedRaceId);

  async function handleSave() {
    if (picks.some(p => p === -1)) {
      setMessage("Please select all 3 drivers.");
      return;
    }
    if (new Set(picks).size !== 3) {
      setMessage("Each pick must be a different driver.");
      return;
    }
    setSaving(true);
    setMessage("");
    const res = await fetch("/api/picks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ raceId: selectedRaceId, driverIds: picks, propagate, overlay }),
    });
    setSaving(false);
    if (res.ok) {
      setMessage("Picks saved successfully!");
      if (selectedRaceId) loadPick(selectedRaceId);
    } else {
      const data = await res.json();
      setMessage(data.error || "Failed to save picks.");
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
      month: "long", day: "numeric", year: "numeric",
    });
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">My Driver Picks</h1>

      {/* Race selector */}
      <div className="bg-white rounded-xl shadow p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Race</label>
          <select
            value={selectedRaceId ?? ""}
            onChange={e => setSelectedRaceId(Number(e.target.value))}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 w-full max-w-xs"
          >
            {races.map(r => (
              <option key={r.id} value={r.id}>Round {r.round} – {r.name}</option>
            ))}
          </select>
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

      {/* Driver Picks */}
      <div className="bg-white rounded-xl shadow p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">Driver Picks</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {([0, 1, 2] as const).map(i => (
            <div key={i}>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pick {i + 1}</label>
              <select
                value={picks[i]}
                onChange={e => {
                  const newPicks = [...picks] as [number, number, number];
                  newPicks[i] = Number(e.target.value);
                  setPicks(newPicks);
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value={-1}>— Select Driver —</option>
                {drivers.map(d => (
                  <option key={d.id} value={d.id}>{d.name} ({d.team})</option>
                ))}
              </select>
            </div>
          ))}
        </div>

        <div className="space-y-2 pt-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={propagate}
              onChange={e => setPropagate(e.target.checked)}
              className="w-4 h-4 accent-red-600"
            />
            <span className="text-sm text-gray-700">
              Propagate these picks to remaining open races with no picks yet
            </span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={overlay}
              onChange={e => setOverlay(e.target.checked)}
              className="w-4 h-4 accent-red-600"
            />
            <span className="text-sm text-gray-700">
              Also overwrite picks on open races that already have picks
            </span>
          </label>
        </div>

        {message && (
          <p className={`text-sm font-medium ${message.includes("success") ? "text-green-600" : "text-red-600"}`}>
            {message}
          </p>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-2 rounded-lg transition-colors disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Picks"}
        </button>

        {currentPick && (
          <p className="text-xs text-gray-400">
            Current saved picks: {currentPick.picks.map(p => p.name).join(", ")}
          </p>
        )}
      </div>
    </div>
  );
}
