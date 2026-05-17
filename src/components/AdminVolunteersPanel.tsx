"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";

type Volunteer = {
  id: string;
  name: string;
  email: string;
  cohortYear: number;
  isActive: boolean;
  profile: {
    birthday: string | null;
    termStart: string | null;
    termEnd: string | null;
    passportNo: string | null;
    dispatchUniversity: string | null;
    teachingSchool: string | null;
    spanishName: string | null;
    phone: string | null;
  } | null;
  apartment: {
    address: string;
    frontDeskPhone: string;
    images: string[];
  } | null;
  _count: {
    clockRecords: number;
    workFiles: number;
    repairRequests: number;
    leaveRequests: number;
  };
};

type WorkFile = {
  id: string;
  originalName: string;
  url?: string;
  storedName: string;
  description: string | null;
  createdAt: string;
  user?: { name: string; cohortYear: number };
};

export function AdminVolunteersPanel() {
  const [cohortYear, setCohortYear] = useState<string>("");
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [files, setFiles] = useState<WorkFile[]>([]);

  async function load() {
    const q = cohortYear ? `?cohortYear=${cohortYear}` : "";
    const res = await fetch(`/api/admin/volunteers${q}`);
    const data = await res.json();
    setVolunteers(data.volunteers || []);
  }

  useEffect(() => {
    load();
  }, [cohortYear]);

  async function loadFiles(userId: string) {
    const res = await fetch(`/api/work/files?userId=${userId}`);
    const data = await res.json();
    const list = (data.files || []).map(
      (f: WorkFile & { userId?: string }) => ({
        ...f,
        url: `/api/files/work/${userId}/${f.storedName}`,
      })
    );
    setFiles(list);
    setExpanded(userId);
  }

  const years = Array.from(
    new Set(volunteers.map((v) => v.cohortYear))
  ).sort((a, b) => b - a);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm font-medium text-stone-600">按届筛选：</label>
        <select
          className="input w-auto"
          value={cohortYear}
          onChange={(e) => setCohortYear(e.target.value)}
        >
          <option value="">全部届别</option>
          {years.map((y) => (
            <option key={y} value={y}>
              {y} 届
            </option>
          ))}
        </select>
        <span className="text-sm text-stone-500">
          共 {volunteers.length} 人（含历届档案）
        </span>
      </div>

      <div className="space-y-4">
        {volunteers.map((v) => (
          <div key={v.id} className="card">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h3 className="text-lg font-semibold">
                  {v.name}
                  {v.profile?.spanishName && (
                    <span className="ml-2 text-stone-500">
                      ({v.profile.spanishName})
                    </span>
                  )}
                </h3>
                <p className="text-sm text-stone-500">
                  {v.email} · {v.cohortYear} 届
                </p>
              </div>
              <button
                type="button"
                className="btn-secondary text-xs"
                onClick={() =>
                  expanded === v.id ? setExpanded(null) : loadFiles(v.id)
                }
              >
                {expanded === v.id ? "收起" : "查看工作文件"}
              </button>
            </div>

            <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
              <Info label="生日" value={fmtDate(v.profile?.birthday)} />
              <Info
                label="任期"
                value={`${fmtDate(v.profile?.termStart)} — ${fmtDate(v.profile?.termEnd)}`}
              />
              <Info label="护照号" value={v.profile?.passportNo} />
              <Info label="派出院校" value={v.profile?.dispatchUniversity} />
              <Info label="任教学校" value={v.profile?.teachingSchool} />
              <Info label="电话" value={v.profile?.phone} />
              <Info
                label="公寓"
                value={
                  v.apartment
                    ? `${v.apartment.address}（前台 ${v.apartment.frontDeskPhone}）`
                    : "未登记"
                }
              />
              <Info
                label="统计"
                value={`打卡 ${v._count.clockRecords} · 文件 ${v._count.workFiles} · 报修 ${v._count.repairRequests} · 请假 ${v._count.leaveRequests}`}
              />
            </div>

            {expanded === v.id && (
              <ul className="mt-4 space-y-2 border-t border-stone-100 pt-4">
                {files.length === 0 ? (
                  <li className="text-sm text-stone-500">暂无工作文件</li>
                ) : (
                  files.map((f) => (
                    <li
                      key={f.id}
                      className="flex justify-between text-sm"
                    >
                      <span>
                        {f.originalName}
                        {f.description && ` · ${f.description}`}
                      </span>
                      <a
                        href={f.url}
                        className="text-brand-700 hover:underline"
                        target="_blank"
                        rel="noreferrer"
                      >
                        下载
                      </a>
                    </li>
                  ))
                )}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <p>
      <span className="text-stone-500">{label}：</span>
      {value || "—"}
    </p>
  );
}

function fmtDate(d?: string | null) {
  if (!d) return "—";
  return format(new Date(d), "yyyy-MM-dd");
}
