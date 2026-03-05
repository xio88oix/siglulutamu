"use client";

import { useState, useEffect, useCallback } from "react";

type Tab = "users" | "drivers" | "races" | "raceResults" | "positionPoints";

interface User { id: number; name: string; is_admin: number; }
interface Driver { id: number; name: string; team: string; }
interface Race { id: number; round: number; name: string; date: string; status: string; }
interface RaceResult { id: number; race_id: number; driver_id: number; position: number; driver_name: string; team: string; }
interface PositionPoint { id: number; finishing_place: number; points: number; }

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("users");

  const tabs: { key: Tab; label: string }[] = [
    { key: "users", label: "Users" },
    { key: "drivers", label: "Drivers" },
    { key: "races", label: "Races" },
    { key: "raceResults", label: "Race Results" },
    { key: "positionPoints", label: "Position Points" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
      <div className="flex gap-2 flex-wrap">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.key ? "bg-red-600 text-white" : "bg-white text-gray-700 hover:bg-gray-100 shadow"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="bg-white rounded-xl shadow p-6">
        {tab === "users" && <UsersSection />}
        {tab === "drivers" && <DriversSection />}
        {tab === "races" && <RacesSection />}
        {tab === "raceResults" && <RaceResultsSection />}
        {tab === "positionPoints" && <PositionPointsSection />}
      </div>
    </div>
  );
}

// ── Users ──────────────────────────────────────────────────────────────────

function UsersSection() {
  const [users, setUsers] = useState<User[]>([]);
  const [form, setForm] = useState({ name: "", password: "", isAdmin: false });
  const [editId, setEditId] = useState<number | null>(null);

  const load = () => fetch("/api/admin/users").then(r => r.json()).then(setUsers);
  useEffect(() => { load(); }, []);

  async function save() {
    if (editId) {
      await fetch(`/api/admin/users/${editId}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setEditId(null);
    } else {
      await fetch("/api/admin/users", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    }
    setForm({ name: "", password: "", isAdmin: false });
    load();
  }

  async function remove(id: number) {
    if (!confirm("Delete this user?")) return;
    await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    load();
  }

  function startEdit(u: User) {
    setEditId(u.id);
    setForm({ name: u.name, password: "", isAdmin: !!u.is_admin });
  }

  return (
    <div className="space-y-6">
      <h2 className="font-semibold text-lg">Users</h2>
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Name</label>
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className="border rounded px-2 py-1.5 text-sm" placeholder="Username" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Password {editId && "(leave blank to keep)"}</label>
          <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            className="border rounded px-2 py-1.5 text-sm" placeholder="Password" />
        </div>
        <label className="flex items-center gap-1.5 text-sm">
          <input type="checkbox" checked={form.isAdmin} onChange={e => setForm(f => ({ ...f, isAdmin: e.target.checked }))} className="accent-red-600" />
          Admin
        </label>
        <button onClick={save} className="bg-red-600 text-white px-4 py-1.5 rounded text-sm hover:bg-red-700">
          {editId ? "Update" : "Add User"}
        </button>
        {editId && <button onClick={() => { setEditId(null); setForm({ name: "", password: "", isAdmin: false }); }} className="text-sm text-gray-500 hover:text-gray-700">Cancel</button>}
      </div>
      <table className="w-full text-sm">
        <thead className="text-gray-500 border-b">
          <tr><th className="text-left py-2">Name</th><th className="text-left py-2">Role</th><th className="py-2"></th></tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id} className="border-b last:border-0">
              <td className="py-2">{u.name}</td>
              <td className="py-2">{u.is_admin ? "Admin" : "Player"}</td>
              <td className="py-2 flex gap-2 justify-end">
                <button onClick={() => startEdit(u)} className="text-blue-600 hover:underline text-xs">Edit</button>
                <button onClick={() => remove(u.id)} className="text-red-600 hover:underline text-xs">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Drivers ────────────────────────────────────────────────────────────────

function DriversSection() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [form, setForm] = useState({ name: "", team: "" });
  const [editId, setEditId] = useState<number | null>(null);

  const load = () => fetch("/api/admin/drivers").then(r => r.json()).then(setDrivers);
  useEffect(() => { load(); }, []);

  async function save() {
    if (editId) {
      await fetch(`/api/admin/drivers/${editId}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setEditId(null);
    } else {
      await fetch("/api/admin/drivers", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    }
    setForm({ name: "", team: "" });
    load();
  }

  async function remove(id: number) {
    if (!confirm("Delete this driver?")) return;
    await fetch(`/api/admin/drivers/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="space-y-6">
      <h2 className="font-semibold text-lg">Drivers</h2>
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Name</label>
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className="border rounded px-2 py-1.5 text-sm" placeholder="Driver name" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Team</label>
          <input value={form.team} onChange={e => setForm(f => ({ ...f, team: e.target.value }))}
            className="border rounded px-2 py-1.5 text-sm" placeholder="Team name" />
        </div>
        <button onClick={save} className="bg-red-600 text-white px-4 py-1.5 rounded text-sm hover:bg-red-700">
          {editId ? "Update" : "Add Driver"}
        </button>
        {editId && <button onClick={() => { setEditId(null); setForm({ name: "", team: "" }); }} className="text-sm text-gray-500">Cancel</button>}
      </div>
      <table className="w-full text-sm">
        <thead className="text-gray-500 border-b">
          <tr><th className="text-left py-2">Name</th><th className="text-left py-2">Team</th><th className="py-2"></th></tr>
        </thead>
        <tbody>
          {drivers.map(d => (
            <tr key={d.id} className="border-b last:border-0">
              <td className="py-2">{d.name}</td>
              <td className="py-2 text-gray-500">{d.team}</td>
              <td className="py-2 flex gap-2 justify-end">
                <button onClick={() => { setEditId(d.id); setForm({ name: d.name, team: d.team }); }} className="text-blue-600 hover:underline text-xs">Edit</button>
                <button onClick={() => remove(d.id)} className="text-red-600 hover:underline text-xs">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Races ──────────────────────────────────────────────────────────────────

function RacesSection() {
  const [races, setRaces] = useState<Race[]>([]);
  const [form, setForm] = useState({ round: "", name: "", date: "", status: "open" });
  const [editId, setEditId] = useState<number | null>(null);

  const load = () => fetch("/api/admin/races").then(r => r.json()).then(setRaces);
  useEffect(() => { load(); }, []);

  async function save() {
    if (editId) {
      await fetch(`/api/admin/races/${editId}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, round: Number(form.round) }),
      });
      setEditId(null);
    } else {
      await fetch("/api/admin/races", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, round: Number(form.round) }),
      });
    }
    setForm({ round: "", name: "", date: "", status: "open" });
    load();
  }

  async function remove(id: number) {
    if (!confirm("Delete this race?")) return;
    await fetch(`/api/admin/races/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="space-y-6">
      <h2 className="font-semibold text-lg">Races</h2>
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Round</label>
          <input type="number" value={form.round} onChange={e => setForm(f => ({ ...f, round: e.target.value }))}
            className="border rounded px-2 py-1.5 text-sm w-20" placeholder="1" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Name</label>
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className="border rounded px-2 py-1.5 text-sm" placeholder="Australian GP" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Date</label>
          <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
            className="border rounded px-2 py-1.5 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Status</label>
          <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
            className="border rounded px-2 py-1.5 text-sm">
            <option value="open">Open</option>
            <option value="closed">Closed</option>
          </select>
        </div>
        <button onClick={save} className="bg-red-600 text-white px-4 py-1.5 rounded text-sm hover:bg-red-700">
          {editId ? "Update" : "Add Race"}
        </button>
        {editId && <button onClick={() => { setEditId(null); setForm({ round: "", name: "", date: "", status: "open" }); }} className="text-sm text-gray-500">Cancel</button>}
      </div>
      <table className="w-full text-sm">
        <thead className="text-gray-500 border-b">
          <tr>
            <th className="text-left py-2">Round</th>
            <th className="text-left py-2">Name</th>
            <th className="text-left py-2">Date</th>
            <th className="text-left py-2">Status</th>
            <th className="py-2"></th>
          </tr>
        </thead>
        <tbody>
          {races.map(r => (
            <tr key={r.id} className="border-b last:border-0">
              <td className="py-2">Round {r.round}</td>
              <td className="py-2">{r.name}</td>
              <td className="py-2 text-gray-500">{r.date}</td>
              <td className="py-2">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${r.status === "open" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                  {r.status}
                </span>
              </td>
              <td className="py-2 flex gap-2 justify-end">
                <button onClick={() => { setEditId(r.id); setForm({ round: r.round.toString(), name: r.name, date: r.date, status: r.status }); }} className="text-blue-600 hover:underline text-xs">Edit</button>
                <button onClick={() => remove(r.id)} className="text-red-600 hover:underline text-xs">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Race Results ───────────────────────────────────────────────────────────

function RaceResultsSection() {
  const [races, setRaces] = useState<Race[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedRaceId, setSelectedRaceId] = useState<string>("");
  const [results, setResults] = useState<RaceResult[]>([]);
  const [form, setForm] = useState({ driverId: "", position: "" });

  useEffect(() => {
    fetch("/api/admin/races").then(r => r.json()).then((data: Race[]) => {
      setRaces(data);
      if (data.length > 0) setSelectedRaceId(data[0].id.toString());
    });
    fetch("/api/admin/drivers").then(r => r.json()).then(setDrivers);
  }, []);

  const loadResults = useCallback((raceId: string) => {
    if (!raceId) return;
    fetch(`/api/admin/race-results?raceId=${raceId}`).then(r => r.json()).then(setResults);
  }, []);

  useEffect(() => { loadResults(selectedRaceId); }, [selectedRaceId, loadResults]);

  async function addResult() {
    await fetch("/api/admin/race-results", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ raceId: Number(selectedRaceId), driverId: Number(form.driverId), position: Number(form.position) }),
    });
    setForm({ driverId: "", position: "" });
    loadResults(selectedRaceId);
  }

  async function remove(id: number) {
    await fetch(`/api/admin/race-results/${id}`, { method: "DELETE" });
    loadResults(selectedRaceId);
  }

  return (
    <div className="space-y-6">
      <h2 className="font-semibold text-lg">Race Results</h2>
      <div>
        <label className="block text-xs text-gray-500 mb-1">Select Race</label>
        <select value={selectedRaceId} onChange={e => setSelectedRaceId(e.target.value)}
          className="border rounded px-2 py-1.5 text-sm">
          {races.map(r => <option key={r.id} value={r.id}>Round {r.round} – {r.name}</option>)}
        </select>
      </div>
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Driver</label>
          <select value={form.driverId} onChange={e => setForm(f => ({ ...f, driverId: e.target.value }))}
            className="border rounded px-2 py-1.5 text-sm">
            <option value="">— Select —</option>
            {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Finishing Position</label>
          <input type="number" min="1" max="22" value={form.position} onChange={e => setForm(f => ({ ...f, position: e.target.value }))}
            className="border rounded px-2 py-1.5 text-sm w-20" placeholder="1" />
        </div>
        <button onClick={addResult} className="bg-red-600 text-white px-4 py-1.5 rounded text-sm hover:bg-red-700">
          Add Result
        </button>
      </div>
      <table className="w-full text-sm">
        <thead className="text-gray-500 border-b">
          <tr>
            <th className="text-left py-2">Position</th>
            <th className="text-left py-2">Driver</th>
            <th className="text-left py-2">Team</th>
            <th className="py-2"></th>
          </tr>
        </thead>
        <tbody>
          {results.map(r => (
            <tr key={r.id} className="border-b last:border-0">
              <td className="py-2 font-bold">P{r.position}</td>
              <td className="py-2">{r.driver_name}</td>
              <td className="py-2 text-gray-500">{r.team}</td>
              <td className="py-2 text-right">
                <button onClick={() => remove(r.id)} className="text-red-600 hover:underline text-xs">Remove</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Position Points ────────────────────────────────────────────────────────

function PositionPointsSection() {
  const [points, setPoints] = useState<PositionPoint[]>([]);
  const [edited, setEdited] = useState<Record<number, number>>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/admin/position-points").then(r => r.json()).then(setPoints);
  }, []);

  async function save() {
    const updates = points.map(p => ({
      finishing_place: p.finishing_place,
      points: edited[p.finishing_place] ?? p.points,
    }));
    await fetch("/api/admin/position-points", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    fetch("/api/admin/position-points").then(r => r.json()).then(setPoints);
    setEdited({});
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-lg">Position Points</h2>
        <button onClick={save} className="bg-red-600 text-white px-4 py-1.5 rounded text-sm hover:bg-red-700">
          {saved ? "Saved!" : "Save Changes"}
        </button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {points.map(p => (
          <div key={p.finishing_place} className="flex items-center gap-2">
            <span className="text-sm text-gray-500 w-6 text-right">P{p.finishing_place}</span>
            <input
              type="number"
              value={edited[p.finishing_place] ?? p.points}
              onChange={e => setEdited(prev => ({ ...prev, [p.finishing_place]: Number(e.target.value) }))}
              className="border rounded px-2 py-1 text-sm w-16"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
