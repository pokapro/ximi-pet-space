"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getPetImage } from "@/lib/pet-growth";

interface Student {
  id: string;
  name: string;
  seatNo: string | null;
  code: string;
  totalPoints: number;
  level: number;
  petName: string;
  petStage: string;
  mood: number;
}

export default function StudentsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [batchText, setBatchText] = useState("");
  const [showBatch, setShowBatch] = useState(false);

  function loadStudents() {
    setLoading(true);
    fetch(`/api/teacher/classes/${params.id}/students`)
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) setStudents(data.students);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    const timer = setTimeout(() => loadStudents(), 0);
    return () => clearTimeout(timer);
  }, [params.id]);

  async function addStudent() {
    if (!newName.trim()) return;
    const res = await fetch(`/api/teacher/classes/${params.id}/students`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });
    const data = await res.json();
    if (data.ok) {
      setNewName("");
      loadStudents();
    }
  }

  async function batchImport() {
    const names = batchText
      .split("\n")
      .map((n) => n.trim())
      .filter(Boolean);
    if (names.length === 0) return;

    const res = await fetch(`/api/teacher/classes/${params.id}/students`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ names }),
    });
    const data = await res.json();
    if (data.ok) {
      setBatchText("");
      setShowBatch(false);
      loadStudents();
    }
  }

  async function deleteStudent(id: string) {
    if (!confirm("确定删除这个学生？")) return;
    await fetch(`/api/teacher/classes/${params.id}/students`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId: id }),
    });
    loadStudents();
  }

  return (
    <main className="min-h-screen bg-[#f7f6f2] px-6 py-8">
      <section className="mx-auto max-w-4xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-emerald-700 underline cursor-pointer" onClick={() => router.push("/teacher/classes")}>
              &larr; 返回班级列表
            </p>
            <h1 className="mt-2 text-3xl font-black">学生管理</h1>
            <p className="mt-1 text-slate-500">共 {students.length} 名学生</p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <div className="flex gap-2">
            <input
              className="rounded-md border border-slate-300 bg-white px-4 py-2 outline-none focus:border-emerald-700"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addStudent()}
              placeholder="学生姓名"
            />
            <button
              onClick={addStudent}
              disabled={!newName.trim()}
              className="rounded-md bg-emerald-700 px-4 py-2 font-semibold text-white disabled:bg-slate-400"
            >
              添加
            </button>
          </div>
          <button
            onClick={() => setShowBatch(!showBatch)}
            className="rounded-md border border-slate-300 bg-white px-4 py-2 font-semibold"
          >
            {showBatch ? "取消批量导入" : "批量导入"}
          </button>
        </div>

        {showBatch && (
          <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-sm font-semibold text-emerald-800">批量导入学生</p>
            <p className="mt-1 text-xs text-emerald-600">每行一个姓名，一次性导入多个学生。</p>
            <textarea
              className="mt-3 w-full rounded-md border border-emerald-300 bg-white p-3 outline-none"
              value={batchText}
              onChange={(e) => setBatchText(e.target.value)}
              rows={5}
              placeholder={`张三\n李四\n王五`}
            />
            <button
              onClick={batchImport}
              disabled={!batchText.trim()}
              className="mt-2 rounded-md bg-emerald-700 px-4 py-2 font-semibold text-white disabled:bg-slate-400"
            >
              导入
            </button>
          </div>
        )}

        {loading ? (
          <p className="mt-8 text-center text-slate-500">加载中...</p>
        ) : students.length === 0 ? (
          <div className="mt-8 rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center">
            <img src="/pets/baby_01.png" alt="宠物蛋" className="mx-auto h-24 w-24 object-contain opacity-40" />
            <p className="mt-4 text-slate-500">还没有学生，添加第一位学生吧。</p>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {students.map((s) => (
              <div key={s.id} className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-2xl">{getMoodEmoji(s.mood)}</p>
                    <p className="mt-1 text-xs text-slate-500">Lv.{s.level}</p>
                    <img src={getPetImage(s.petStage as any)} alt={s.petName} className="mx-auto mt-1 h-8 w-8 object-contain" />
                  </div>
                  <div>
                    <p className="font-bold">{s.name}</p>
                    <p className="text-sm text-slate-500">
                      {s.seatNo ? `座号 ${s.seatNo}` : ""} · 查询码 {s.code}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-lg font-bold text-emerald-700">{s.totalPoints} 分</p>
                    <p className="text-xs text-slate-500">{s.petName}</p>
                  </div>
                  <button
                    onClick={() => deleteStudent(s.id)}
                    className="rounded-md border border-red-200 bg-white px-3 py-1 text-sm text-red-600"
                  >
                    删除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function getMoodEmoji(mood: number): string {
  if (mood >= 80) return "🤩";
  if (mood >= 60) return "😄";
  if (mood >= 40) return "😊";
  if (mood >= 20) return "😴";
  return "😢";
}
