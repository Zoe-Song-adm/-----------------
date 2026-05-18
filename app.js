const STORAGE_KEY = "sanmin-volunteer-v3";
const LEGACY_V2 = "sanmin-volunteer-v2";
const MAX_FILE_BYTES = 3 * 1024 * 1024;

const workTypeLabels = { teaching: "教学", meeting: "会议", event: "校园活动", other: "其他" };
const lifeCategoryLabels = { dining: "餐饮", transport: "交通", notice: "通知", other: "其他" };
const statusLabels = { active: "在册", inactive: "已离任", upcoming: "待开展", ongoing: "进行中", done: "已完成" };
const clockTypeLabels = { in: "上班", out: "下班" };
const leaveStatusLabels = { pending: "待审批", approved: "已批准", rejected: "已驳回" };
const repairStatusLabels = { pending: "待处理", processing: "处理中", done: "已完成" };

let state = loadState();
let aptExistingImages = [];

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return normalizeState(JSON.parse(raw));
  } catch (_) {}

  try {
    const v2 = localStorage.getItem(LEGACY_V2);
    if (v2) {
      const migrated = migrateV2(JSON.parse(v2));
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
      } catch (_) {}
      return migrated;
    }
  } catch (_) {}

  return emptyState();
}

function emptyState() {
  return {
    volunteers: [],
    work: [],
    life: [],
    clockRecords: [],
    workFiles: [],
    apartments: [],
    repairs: [],
    leaves: [],
  };
}

function normalizeState(s) {
  const base = emptyState();
  Object.keys(base).forEach((k) => {
    base[k] = Array.isArray(s[k]) ? s[k] : base[k];
  });
  base.volunteers = base.volunteers.map(normalizeVolunteer);
  return base;
}

function normalizeVolunteer(v) {
  return {
    ...v,
    spanishName: v.spanishName || "",
    birthday: v.birthday || "",
    passport: v.passport || "",
    sendSchool: v.sendSchool || "",
    teachSchool: v.teachSchool || "",
    termStart: v.termStart || "",
    termEnd: v.termEnd || "",
    origin: v.origin || "",
    email: v.email || "",
    skills: v.skills || "",
    arrival: v.arrival || "",
    note: v.note || "",
  };
}

function migrateV2(old) {
  const s = emptyState();
  s.volunteers = (old.volunteers || []).map(normalizeVolunteer);
  s.work = old.work || [];
  s.life = (old.life || []).filter((l) => l.category !== "housing");
  return s;
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    alert("保存失败，存储空间可能已满。请删除部分图片或文件后重试。");
    throw e;
  }
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr.includes("T") ? dateStr : dateStr + "T00:00:00");
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString("zh-CN", { year: "numeric", month: "short", day: "numeric" });
}

function formatDateTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  return d.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function volunteerName(id) {
  const v = state.volunteers.find((x) => x.id === id);
  return v ? v.name : "未知";
}

function volunteerLabel(v) {
  const extra = v.spanishName ? ` (${v.spanishName})` : "";
  return v.name + extra;
}

function fillVolunteerSelect(selectEl, required = true) {
  const vols = state.volunteers.filter((v) => v.status === "active");
  const opts =
    (!required ? '<option value="">请选择</option>' : "") +
    vols.map((v) => `<option value="${v.id}">${escapeHtml(volunteerLabel(v))}</option>`).join("");
  selectEl.innerHTML =
    opts || '<option value="" disabled>请先添加志愿者</option>';
}

function readFileAsData(file) {
  return new Promise((resolve, reject) => {
    if (file.size > MAX_FILE_BYTES) {
      reject(new Error(`「${file.name}」超过 3MB 限制`));
      return;
    }
    const reader = new FileReader();
    reader.onload = () =>
      resolve({ name: file.name, type: file.type, data: reader.result });
    reader.onerror = () => reject(new Error(`读取「${file.name}」失败`));
    reader.readAsDataURL(file);
  });
}

async function readFilesFromInput(input) {
  const files = [...(input.files || [])];
  const results = [];
  for (const f of files) {
    results.push(await readFileAsData(f));
  }
  return results;
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function estimateDataUrlSize(dataUrl) {
  if (!dataUrl) return 0;
  const base64 = dataUrl.split(",")[1] || "";
  return Math.ceil((base64.length * 3) / 4);
}

/* Main & sub tabs */
document.querySelectorAll(".nav-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const tab = btn.dataset.tab;
    document.querySelectorAll(".nav-btn").forEach((b) => {
      b.classList.toggle("active", b === btn);
      b.setAttribute("aria-selected", b === btn);
    });
    document.querySelectorAll(".panel").forEach((p) => {
      p.classList.toggle("active", p.id === tab);
      p.hidden = p.id !== tab;
    });
  });
});

function initSubNav(panelId) {
  const panel = document.getElementById(panelId);
  panel.querySelectorAll(".sub-nav-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const sub = btn.dataset.sub;
      panel.querySelectorAll(".sub-nav-btn").forEach((b) => b.classList.toggle("active", b === btn));
      panel.querySelectorAll(".sub-panel").forEach((sp) => {
        sp.classList.toggle("active", sp.id === sub);
        sp.hidden = sp.id !== sub;
      });
    });
  });
}

initSubNav("work");
initSubNav("life");

/* Modals */
function openModal(id) {
  document.getElementById(id).showModal();
}

function closeModal(id) {
  document.getElementById(id).close();
}

document.querySelectorAll(".close-modal").forEach((btn) => {
  btn.addEventListener("click", () => closeModal(btn.dataset.close));
});

document.querySelectorAll(".modal").forEach((modal) => {
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.close();
  });
});

/* Clock */
function updateClockDisplay() {
  const now = new Date();
  document.getElementById("clock-now").textContent = now.toLocaleTimeString("zh-CN", { hour12: false });
  document.getElementById("clock-date").textContent = now.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });
}

setInterval(updateClockDisplay, 1000);
updateClockDisplay();

function getTodayClockStatus(volunteerId) {
  const today = new Date().toISOString().slice(0, 10);
  const records = state.clockRecords
    .filter((r) => r.volunteerId === volunteerId && r.datetime.startsWith(today))
    .sort((a, b) => a.datetime.localeCompare(b.datetime));
  const lastIn = [...records].reverse().find((r) => r.type === "in");
  const lastOut = [...records].reverse().find((r) => r.type === "out");
  return { records, lastIn, lastOut };
}

function updateClockHint() {
  const vid = document.getElementById("clock-volunteer").value;
  const hint = document.getElementById("clock-status-hint");
  if (!vid) {
    hint.textContent = "请选择志愿者后打卡";
    return;
  }
  const { records, lastIn, lastOut } = getTodayClockStatus(vid);
  if (!records.length) {
    hint.textContent = "今日尚未打卡";
    return;
  }
  const parts = records.map((r) => `${clockTypeLabels[r.type]} ${formatDateTime(r.datetime)}`);
  let status = `今日记录：${parts.join("；")}`;
  if (lastIn && (!lastOut || lastOut.datetime < lastIn.datetime)) {
    status += " · 当前状态：已上班";
  } else if (lastOut) {
    status += " · 当前状态：已下班";
  }
  hint.textContent = status;
}

document.getElementById("clock-volunteer").addEventListener("change", updateClockHint);

function doClock(type) {
  const vid = document.getElementById("clock-volunteer").value;
  if (!vid) {
    alert("请先选择志愿者");
    return;
  }
  const now = new Date().toISOString();
  state.clockRecords.unshift({
    id: uid(),
    volunteerId: vid,
    type,
    datetime: now,
    createdAt: Date.now(),
  });
  saveState();
  renderClock();
  updateClockHint();
  alert(`${clockTypeLabels[type]}打卡成功\n${formatDateTime(now)}`);
}

document.getElementById("btn-clock-in").addEventListener("click", () => doClock("in"));
document.getElementById("btn-clock-out").addEventListener("click", () => doClock("out"));

function deleteClock(id) {
  if (!confirm("确定删除该打卡记录？")) return;
  state.clockRecords = state.clockRecords.filter((r) => r.id !== id);
  saveState();
  renderClock();
  updateClockHint();
}

function renderClock() {
  fillVolunteerSelect(document.getElementById("clock-volunteer"));
  const tbody = document.getElementById("clock-tbody");
  const list = [...state.clockRecords].sort((a, b) => b.datetime.localeCompare(a.datetime)).slice(0, 100);
  tbody.innerHTML = list
    .map(
      (r) => `
    <tr>
      <td>${escapeHtml(volunteerName(r.volunteerId))}</td>
      <td><span class="badge clock-${r.type}">${clockTypeLabels[r.type]}</span></td>
      <td>${formatDateTime(r.datetime)}</td>
      <td><button type="button" class="btn sm danger" data-del-clock="${r.id}">删除</button></td>
    </tr>`
    )
    .join("");
  document.getElementById("empty-clock").classList.toggle("visible", list.length === 0);
  tbody.querySelectorAll("[data-del-clock]").forEach((btn) => {
    btn.addEventListener("click", () => deleteClock(btn.dataset.delClock));
  });
  updateClockHint();
}

/* Work files */
document.getElementById("btn-upload-work-file").addEventListener("click", () => {
  fillVolunteerSelect(document.getElementById("wf-volunteer"));
  document.getElementById("form-work-file").reset();
  openModal("modal-work-file");
});

document.getElementById("form-work-file").addEventListener("submit", async (e) => {
  e.preventDefault();
  const vid = document.getElementById("wf-volunteer").value;
  const fileInput = document.getElementById("wf-file");
  if (!vid || !fileInput.files?.length) return;
  try {
    const [file] = await readFilesFromInput(fileInput);
    state.workFiles.unshift({
      id: uid(),
      volunteerId: vid,
      desc: document.getElementById("wf-desc").value.trim(),
      fileName: file.name,
      fileType: file.type,
      fileData: file.data,
      uploadedAt: Date.now(),
    });
    saveState();
    closeModal("modal-work-file");
    renderWorkFiles();
  } catch (err) {
    alert(err.message);
  }
});

function downloadWorkFile(id) {
  const f = state.workFiles.find((x) => x.id === id);
  if (!f) return;
  const a = document.createElement("a");
  a.href = f.fileData;
  a.download = f.fileName;
  a.click();
}

function deleteWorkFile(id) {
  if (!confirm("确定删除该文件？")) return;
  state.workFiles = state.workFiles.filter((x) => x.id !== id);
  saveState();
  renderWorkFiles();
}

function renderWorkFiles() {
  const list = document.getElementById("work-file-list");
  const files = [...state.workFiles].sort((a, b) => b.uploadedAt - a.uploadedAt);
  list.innerHTML = files
    .map((f) => {
      const size = formatFileSize(estimateDataUrlSize(f.fileData));
      const isImage = (f.fileType || "").startsWith("image/");
      const preview = isImage
        ? `<img src="${f.fileData}" alt="" class="file-thumb" />`
        : `<span class="file-icon">📄</span>`;
      return `
    <article class="file-card">
      ${preview}
      <div class="file-info">
        <strong>${escapeHtml(f.fileName)}</strong>
        <p class="meta-line">${escapeHtml(volunteerName(f.volunteerId))} · ${formatDateTime(new Date(f.uploadedAt).toISOString())} · ${size}</p>
        ${f.desc ? `<p class="desc">${escapeHtml(f.desc)}</p>` : ""}
        <div class="card-actions">
          <button type="button" class="btn sm primary" data-dl-file="${f.id}">下载</button>
          <button type="button" class="btn sm danger" data-del-file="${f.id}">删除</button>
        </div>
      </div>
    </article>`;
    })
    .join("");
  document.getElementById("empty-work-files").classList.toggle("visible", files.length === 0);
  list.querySelectorAll("[data-dl-file]").forEach((btn) => {
    btn.addEventListener("click", () => downloadWorkFile(btn.dataset.dlFile));
  });
  list.querySelectorAll("[data-del-file]").forEach((btn) => {
    btn.addEventListener("click", () => deleteWorkFile(btn.dataset.delFile));
  });
}

/* Work tasks */
const formWork = document.getElementById("form-work");

document.getElementById("btn-add-work").addEventListener("click", () => {
  document.getElementById("modal-work-title").textContent = "添加工作";
  formWork.reset();
  document.getElementById("work-id").value = "";
  document.getElementById("w-date").value = new Date().toISOString().slice(0, 10);
  openModal("modal-work");
});

function editWork(id) {
  const w = state.work.find((x) => x.id === id);
  if (!w) return;
  document.getElementById("modal-work-title").textContent = "编辑工作";
  document.getElementById("work-id").value = w.id;
  document.getElementById("w-title").value = w.title;
  document.getElementById("w-type").value = w.type || "other";
  document.getElementById("w-date").value = w.date;
  document.getElementById("w-location").value = w.location || "";
  document.getElementById("w-lead").value = w.lead || "";
  document.getElementById("w-status").value = w.status;
  document.getElementById("w-desc").value = w.desc || "";
  openModal("modal-work");
}

function deleteWork(id) {
  if (!confirm("确定删除该工作记录？")) return;
  state.work = state.work.filter((x) => x.id !== id);
  saveState();
  renderWork();
}

formWork.addEventListener("submit", (e) => {
  e.preventDefault();
  const id = document.getElementById("work-id").value;
  const data = {
    id: id || uid(),
    title: document.getElementById("w-title").value.trim(),
    type: document.getElementById("w-type").value,
    date: document.getElementById("w-date").value,
    location: document.getElementById("w-location").value.trim(),
    lead: document.getElementById("w-lead").value.trim(),
    status: document.getElementById("w-status").value,
    desc: document.getElementById("w-desc").value.trim(),
    createdAt: id ? state.work.find((x) => x.id === id)?.createdAt : Date.now(),
  };
  if (id) {
    const idx = state.work.findIndex((x) => x.id === id);
    if (idx >= 0) state.work[idx] = data;
  } else {
    state.work.unshift(data);
  }
  saveState();
  closeModal("modal-work");
  renderWork();
});

document.getElementById("filter-work-type").addEventListener("change", renderWork);

function renderWork() {
  const typeFilter = document.getElementById("filter-work-type").value;
  let list = [...state.work].sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  if (typeFilter) list = list.filter((w) => w.type === typeFilter);

  document.getElementById("stat-work-active").textContent = state.work.filter((w) => w.status === "ongoing").length;
  document.getElementById("stat-work-upcoming").textContent = state.work.filter((w) => w.status === "upcoming").length;
  document.getElementById("stat-work-done").textContent = state.work.filter((w) => w.status === "done").length;

  const grid = document.getElementById("work-cards");
  grid.innerHTML = list
    .map(
      (w) => `
    <article class="item-card">
      <div class="card-top">
        <span class="badge type-${w.type}">${workTypeLabels[w.type] || "其他"}</span>
        <span class="badge ${w.status}">${statusLabels[w.status]}</span>
      </div>
      <h3>${escapeHtml(w.title)}</h3>
      <p class="meta-line">📅 ${formatDate(w.date)}${w.location ? " · 📍 " + escapeHtml(w.location) : ""}</p>
      ${w.lead ? `<p class="meta-line">👤 ${escapeHtml(w.lead)}</p>` : ""}
      <p class="desc">${escapeHtml(w.desc || "暂无说明")}</p>
      <div class="card-actions">
        <button type="button" class="btn sm ghost" data-edit-w="${w.id}">编辑</button>
        <button type="button" class="btn sm danger" data-del-w="${w.id}">删除</button>
      </div>
    </article>`
    )
    .join("");
  document.getElementById("empty-work").classList.toggle("visible", list.length === 0);
  grid.querySelectorAll("[data-edit-w]").forEach((btn) => {
    btn.addEventListener("click", () => editWork(btn.dataset.editW));
  });
  grid.querySelectorAll("[data-del-w]").forEach((btn) => {
    btn.addEventListener("click", () => deleteWork(btn.dataset.delW));
  });
}

/* Apartments */
function renderAptPreview(images) {
  const el = document.getElementById("apt-preview");
  const all = [...aptExistingImages, ...(images || [])];
  el.innerHTML = all
    .map(
      (img, i) => `
    <figure class="preview-item">
      <img src="${img.data}" alt="${escapeHtml(img.name)}" />
      ${i < aptExistingImages.length ? `<button type="button" class="preview-remove" data-rm-apt-img="${i}">×</button>` : ""}
    </figure>`
    )
    .join("");
  el.querySelectorAll("[data-rm-apt-img]").forEach((btn) => {
    btn.addEventListener("click", () => {
      aptExistingImages.splice(Number(btn.dataset.rmAptImg), 1);
      renderAptPreview();
    });
  });
}

document.getElementById("btn-add-apartment").addEventListener("click", () => {
  document.getElementById("modal-apartment-title").textContent = "登记公寓";
  document.getElementById("form-apartment").reset();
  document.getElementById("apartment-id").value = "";
  aptExistingImages = [];
  fillVolunteerSelect(document.getElementById("apt-volunteer"));
  renderAptPreview([]);
  openModal("modal-apartment");
});

function editApartment(id) {
  const a = state.apartments.find((x) => x.id === id);
  if (!a) return;
  document.getElementById("modal-apartment-title").textContent = "编辑公寓";
  document.getElementById("apartment-id").value = a.id;
  fillVolunteerSelect(document.getElementById("apt-volunteer"));
  document.getElementById("apt-volunteer").value = a.volunteerId;
  document.getElementById("apt-address").value = a.address;
  document.getElementById("apt-phone").value = a.phone;
  document.getElementById("apt-room").value = a.room || "";
  document.getElementById("apt-note").value = a.note || "";
  aptExistingImages = [...(a.images || [])];
  document.getElementById("apt-images").value = "";
  renderAptPreview([]);
  openModal("modal-apartment");
}

document.getElementById("form-apartment").addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = document.getElementById("apartment-id").value;
  let newImages = [];
  try {
    newImages = await readFilesFromInput(document.getElementById("apt-images"));
  } catch (err) {
    alert(err.message);
    return;
  }
  const data = {
    id: id || uid(),
    volunteerId: document.getElementById("apt-volunteer").value,
    address: document.getElementById("apt-address").value.trim(),
    phone: document.getElementById("apt-phone").value.trim(),
    room: document.getElementById("apt-room").value.trim(),
    note: document.getElementById("apt-note").value.trim(),
    images: [...aptExistingImages, ...newImages],
    createdAt: id ? state.apartments.find((x) => x.id === id)?.createdAt : Date.now(),
  };
  if (id) {
    const idx = state.apartments.findIndex((x) => x.id === id);
    if (idx >= 0) state.apartments[idx] = data;
  } else {
    state.apartments.unshift(data);
  }
  try {
    saveState();
    closeModal("modal-apartment");
    renderApartments();
  } catch (_) {}
});

function deleteApartment(id) {
  if (!confirm("确定删除该公寓登记？")) return;
  state.apartments = state.apartments.filter((x) => x.id !== id);
  saveState();
  renderApartments();
}

function renderApartments() {
  const list = document.getElementById("apartment-list");
  const items = [...state.apartments].sort((a, b) => b.createdAt - a.createdAt);
  list.innerHTML = items
    .map((a) => {
      const imgs = (a.images || [])
        .slice(0, 4)
        .map((img) => `<img src="${img.data}" alt="" class="apt-thumb" />`)
        .join("");
      return `
    <article class="apartment-card">
      <div class="apt-images">${imgs || '<span class="no-img">暂无图片</span>'}</div>
      <div class="apt-body">
        <h3>${escapeHtml(volunteerName(a.volunteerId))}${a.room ? ` · 房间 ${escapeHtml(a.room)}` : ""}</h3>
        <p class="meta-line">📍 ${escapeHtml(a.address)}</p>
        <p class="meta-line">📞 前台：${escapeHtml(a.phone)}</p>
        ${a.note ? `<p class="desc">${escapeHtml(a.note)}</p>` : ""}
        <div class="card-actions">
          <button type="button" class="btn sm ghost" data-edit-apt="${a.id}">编辑</button>
          <button type="button" class="btn sm danger" data-del-apt="${a.id}">删除</button>
        </div>
      </div>
    </article>`;
    })
    .join("");
  document.getElementById("empty-apartment").classList.toggle("visible", items.length === 0);
  list.querySelectorAll("[data-edit-apt]").forEach((btn) => {
    btn.addEventListener("click", () => editApartment(btn.dataset.editApt));
  });
  list.querySelectorAll("[data-del-apt]").forEach((btn) => {
    btn.addEventListener("click", () => deleteApartment(btn.dataset.delApt));
  });
}

/* Repairs */
document.getElementById("btn-add-repair").addEventListener("click", () => {
  document.getElementById("form-repair").reset();
  document.getElementById("repair-id").value = "";
  document.getElementById("repair-status").value = "pending";
  fillVolunteerSelect(document.getElementById("repair-volunteer"));
  openModal("modal-repair");
});

document.getElementById("form-repair").addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = document.getElementById("repair-id").value;
  let images = [];
  try {
    images = await readFilesFromInput(document.getElementById("repair-images"));
  } catch (err) {
    alert(err.message);
    return;
  }
  const data = {
    id: id || uid(),
    volunteerId: document.getElementById("repair-volunteer").value,
    item: document.getElementById("repair-item").value.trim(),
    desc: document.getElementById("repair-desc").value.trim(),
    status: document.getElementById("repair-status").value,
    images: id ? [...(state.repairs.find((x) => x.id === id)?.images || []), ...images] : images,
    createdAt: id ? state.repairs.find((x) => x.id === id)?.createdAt : Date.now(),
  };
  if (id) {
    const idx = state.repairs.findIndex((x) => x.id === id);
    if (idx >= 0) state.repairs[idx] = { ...state.repairs[idx], ...data };
  } else {
    state.repairs.unshift(data);
  }
  try {
    saveState();
    closeModal("modal-repair");
    renderRepairs();
  } catch (_) {}
});

function editRepair(id) {
  const r = state.repairs.find((x) => x.id === id);
  if (!r) return;
  document.getElementById("repair-id").value = r.id;
  fillVolunteerSelect(document.getElementById("repair-volunteer"));
  document.getElementById("repair-volunteer").value = r.volunteerId;
  document.getElementById("repair-item").value = r.item;
  document.getElementById("repair-desc").value = r.desc;
  document.getElementById("repair-status").value = r.status;
  document.getElementById("repair-images").value = "";
  openModal("modal-repair");
}

function deleteRepair(id) {
  if (!confirm("确定删除该报修？")) return;
  state.repairs = state.repairs.filter((x) => x.id !== id);
  saveState();
  renderRepairs();
}

function renderRepairs() {
  const list = document.getElementById("repair-list");
  const items = [...state.repairs].sort((a, b) => b.createdAt - a.createdAt);
  list.innerHTML = items
    .map((r) => {
      const imgs = (r.images || [])
        .slice(0, 3)
        .map((img) => `<img src="${img.data}" class="apt-thumb" alt="" />`)
        .join("");
      return `
    <article class="item-card">
      <div class="card-top">
        <span class="badge repair-${r.status}">${repairStatusLabels[r.status]}</span>
      </div>
      <h3>${escapeHtml(r.item)}</h3>
      <p class="meta-line">👤 ${escapeHtml(volunteerName(r.volunteerId))} · ${formatDateTime(new Date(r.createdAt).toISOString())}</p>
      <p class="desc">${escapeHtml(r.desc)}</p>
      ${imgs ? `<div class="apt-images">${imgs}</div>` : ""}
      <div class="card-actions">
        <button type="button" class="btn sm ghost" data-edit-repair="${r.id}">编辑</button>
        <button type="button" class="btn sm danger" data-del-repair="${r.id}">删除</button>
      </div>
    </article>`;
    })
    .join("");
  document.getElementById("empty-repair").classList.toggle("visible", items.length === 0);
  list.querySelectorAll("[data-edit-repair]").forEach((btn) => {
    btn.addEventListener("click", () => editRepair(btn.dataset.editRepair));
  });
  list.querySelectorAll("[data-del-repair]").forEach((btn) => {
    btn.addEventListener("click", () => deleteRepair(btn.dataset.delRepair));
  });
}

/* Leave */
document.getElementById("btn-add-leave").addEventListener("click", () => {
  document.getElementById("modal-leave-title").textContent = "申请请假";
  document.getElementById("form-leave").reset();
  document.getElementById("leave-id").value = "";
  document.getElementById("leave-status").value = "pending";
  fillVolunteerSelect(document.getElementById("leave-volunteer"));
  openModal("modal-leave");
});

function editLeave(id) {
  const l = state.leaves.find((x) => x.id === id);
  if (!l) return;
  document.getElementById("modal-leave-title").textContent = "编辑请假";
  document.getElementById("leave-id").value = l.id;
  fillVolunteerSelect(document.getElementById("leave-volunteer"));
  document.getElementById("leave-volunteer").value = l.volunteerId;
  document.getElementById("leave-start").value = l.start;
  document.getElementById("leave-end").value = l.end;
  document.getElementById("leave-reason").value = l.reason;
  document.getElementById("leave-status").value = l.status;
  openModal("modal-leave");
}

function deleteLeave(id) {
  if (!confirm("确定删除该请假记录？")) return;
  state.leaves = state.leaves.filter((x) => x.id !== id);
  saveState();
  renderLeaves();
}

document.getElementById("form-leave").addEventListener("submit", (e) => {
  e.preventDefault();
  const start = document.getElementById("leave-start").value;
  const end = document.getElementById("leave-end").value;
  if (start >= end) {
    alert("结束时间必须晚于开始时间");
    return;
  }
  const id = document.getElementById("leave-id").value;
  const data = {
    id: id || uid(),
    volunteerId: document.getElementById("leave-volunteer").value,
    start,
    end,
    reason: document.getElementById("leave-reason").value.trim(),
    status: document.getElementById("leave-status").value,
    createdAt: id ? state.leaves.find((x) => x.id === id)?.createdAt : Date.now(),
  };
  if (id) {
    const idx = state.leaves.findIndex((x) => x.id === id);
    if (idx >= 0) state.leaves[idx] = data;
  } else {
    state.leaves.unshift(data);
  }
  saveState();
  closeModal("modal-leave");
  renderLeaves();
});

function renderLeaves() {
  const tbody = document.getElementById("leave-tbody");
  const list = [...state.leaves].sort((a, b) => b.start.localeCompare(a.start));
  tbody.innerHTML = list
    .map(
      (l) => `
    <tr>
      <td>${escapeHtml(volunteerName(l.volunteerId))}</td>
      <td>${formatDateTime(l.start)}</td>
      <td>${formatDateTime(l.end)}</td>
      <td class="cell-reason">${escapeHtml(l.reason)}</td>
      <td><span class="badge leave-${l.status}">${leaveStatusLabels[l.status]}</span></td>
      <td>
        <button type="button" class="btn sm ghost" data-edit-leave="${l.id}">编辑</button>
        <button type="button" class="btn sm danger" data-del-leave="${l.id}">删除</button>
      </td>
    </tr>`
    )
    .join("");
  document.getElementById("empty-leave").classList.toggle("visible", list.length === 0);
  tbody.querySelectorAll("[data-edit-leave]").forEach((btn) => {
    btn.addEventListener("click", () => editLeave(btn.dataset.editLeave));
  });
  tbody.querySelectorAll("[data-del-leave]").forEach((btn) => {
    btn.addEventListener("click", () => deleteLeave(btn.dataset.delLeave));
  });
}

/* Life notices */
const formLife = document.getElementById("form-life");

document.getElementById("btn-add-life").addEventListener("click", () => {
  document.getElementById("modal-life-title").textContent = "发布生活通知";
  formLife.reset();
  document.getElementById("life-id").value = "";
  document.getElementById("l-date").value = new Date().toISOString().slice(0, 10);
  openModal("modal-life");
});

function editLife(id) {
  const item = state.life.find((x) => x.id === id);
  if (!item) return;
  document.getElementById("modal-life-title").textContent = "编辑通知";
  document.getElementById("life-id").value = item.id;
  document.getElementById("l-title").value = item.title;
  document.getElementById("l-category").value = item.category || "notice";
  document.getElementById("l-date").value = item.date || "";
  document.getElementById("l-contact").value = item.contact || "";
  document.getElementById("l-content").value = item.content || "";
  openModal("modal-life");
}

function deleteLife(id) {
  if (!confirm("确定删除？")) return;
  state.life = state.life.filter((x) => x.id !== id);
  saveState();
  renderLife();
}

formLife.addEventListener("submit", (e) => {
  e.preventDefault();
  const id = document.getElementById("life-id").value;
  const data = {
    id: id || uid(),
    title: document.getElementById("l-title").value.trim(),
    category: document.getElementById("l-category").value,
    date: document.getElementById("l-date").value,
    contact: document.getElementById("l-contact").value.trim(),
    content: document.getElementById("l-content").value.trim(),
    createdAt: id ? state.life.find((x) => x.id === id)?.createdAt : Date.now(),
  };
  if (id) {
    const idx = state.life.findIndex((x) => x.id === id);
    if (idx >= 0) state.life[idx] = data;
  } else {
    state.life.unshift(data);
  }
  saveState();
  closeModal("modal-life");
  renderLife();
});

document.getElementById("filter-life-category").addEventListener("change", renderLife);

function renderLife() {
  const catFilter = document.getElementById("filter-life-category").value;
  let list = [...state.life].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  if (catFilter) list = list.filter((l) => l.category === catFilter);
  const grid = document.getElementById("life-cards");
  grid.innerHTML = list
    .map(
      (l) => `
    <article class="item-card">
      <div class="card-top">
        <span class="badge life-${l.category}">${lifeCategoryLabels[l.category] || "其他"}</span>
        ${l.date ? `<span class="meta">${formatDate(l.date)}</span>` : ""}
      </div>
      <h3>${escapeHtml(l.title)}</h3>
      <p class="desc">${escapeHtml(l.content)}</p>
      ${l.contact ? `<p class="meta-line">📞 ${escapeHtml(l.contact)}</p>` : ""}
      <div class="card-actions">
        <button type="button" class="btn sm ghost" data-edit-l="${l.id}">编辑</button>
        <button type="button" class="btn sm danger" data-del-l="${l.id}">删除</button>
      </div>
    </article>`
    )
    .join("");
  document.getElementById("empty-life").classList.toggle("visible", list.length === 0);
  grid.querySelectorAll("[data-edit-l]").forEach((btn) => {
    btn.addEventListener("click", () => editLife(btn.dataset.editL));
  });
  grid.querySelectorAll("[data-del-l]").forEach((btn) => {
    btn.addEventListener("click", () => deleteLife(btn.dataset.delL));
  });
}

/* Volunteers */
const formVolunteer = document.getElementById("form-volunteer");

document.getElementById("btn-add-volunteer").addEventListener("click", () => {
  document.getElementById("modal-volunteer-title").textContent = "添加志愿者";
  formVolunteer.reset();
  document.getElementById("volunteer-id").value = "";
  document.getElementById("v-hours").value = "0";
  document.getElementById("v-teach-school").value = "秘鲁中华三民联校";
  openModal("modal-volunteer");
});

function editVolunteer(id) {
  const v = state.volunteers.find((x) => x.id === id);
  if (!v) return;
  document.getElementById("modal-volunteer-title").textContent = "编辑志愿者";
  document.getElementById("volunteer-id").value = v.id;
  document.getElementById("v-name").value = v.name;
  document.getElementById("v-spanish").value = v.spanishName || "";
  document.getElementById("v-birthday").value = v.birthday || "";
  document.getElementById("v-passport").value = v.passport || "";
  document.getElementById("v-send-school").value = v.sendSchool || "";
  document.getElementById("v-teach-school").value = v.teachSchool || "";
  document.getElementById("v-term-start").value = v.termStart || "";
  document.getElementById("v-term-end").value = v.termEnd || "";
  document.getElementById("v-origin").value = v.origin || "";
  document.getElementById("v-phone").value = v.phone || "";
  document.getElementById("v-email").value = v.email || "";
  document.getElementById("v-skills").value = v.skills || "";
  document.getElementById("v-arrival").value = v.arrival || "";
  document.getElementById("v-hours").value = v.hours ?? 0;
  document.getElementById("v-status").value = v.status;
  document.getElementById("v-note").value = v.note || "";
  openModal("modal-volunteer");
}

function deleteVolunteer(id) {
  if (!confirm("确定删除该志愿者？相关打卡、文件等记录仍会保留。")) return;
  state.volunteers = state.volunteers.filter((x) => x.id !== id);
  saveState();
  renderVolunteers();
  renderAllSelects();
}

formVolunteer.addEventListener("submit", (e) => {
  e.preventDefault();
  const id = document.getElementById("volunteer-id").value;
  const data = normalizeVolunteer({
    id: id || uid(),
    name: document.getElementById("v-name").value.trim(),
    spanishName: document.getElementById("v-spanish").value.trim(),
    birthday: document.getElementById("v-birthday").value,
    passport: document.getElementById("v-passport").value.trim(),
    sendSchool: document.getElementById("v-send-school").value.trim(),
    teachSchool: document.getElementById("v-teach-school").value.trim(),
    termStart: document.getElementById("v-term-start").value,
    termEnd: document.getElementById("v-term-end").value,
    origin: document.getElementById("v-origin").value.trim(),
    phone: document.getElementById("v-phone").value.trim(),
    email: document.getElementById("v-email").value.trim(),
    skills: document.getElementById("v-skills").value.trim(),
    arrival: document.getElementById("v-arrival").value,
    hours: Number(document.getElementById("v-hours").value) || 0,
    status: document.getElementById("v-status").value,
    note: document.getElementById("v-note").value.trim(),
    createdAt: id ? state.volunteers.find((x) => x.id === id)?.createdAt : Date.now(),
  });
  if (id) {
    const idx = state.volunteers.findIndex((x) => x.id === id);
    if (idx >= 0) state.volunteers[idx] = data;
  } else {
    state.volunteers.unshift(data);
  }
  saveState();
  closeModal("modal-volunteer");
  renderVolunteers();
  renderAllSelects();
});

document.getElementById("search-volunteer").addEventListener("input", renderVolunteers);

function formatTerm(v) {
  if (v.termStart && v.termEnd) return `${formatDate(v.termStart)} — ${formatDate(v.termEnd)}`;
  if (v.termStart) return `${formatDate(v.termStart)} 起`;
  return "—";
}

function renderVolunteers() {
  const q = document.getElementById("search-volunteer").value.trim().toLowerCase();
  let list = state.volunteers;
  if (q) {
    list = list.filter(
      (v) =>
        v.name.toLowerCase().includes(q) ||
        (v.spanishName && v.spanishName.toLowerCase().includes(q)) ||
        (v.passport && v.passport.toLowerCase().includes(q)) ||
        (v.sendSchool && v.sendSchool.toLowerCase().includes(q)) ||
        (v.teachSchool && v.teachSchool.toLowerCase().includes(q)) ||
        (v.phone && v.phone.includes(q)) ||
        (v.skills && v.skills.toLowerCase().includes(q))
    );
  }

  const active = state.volunteers.filter((v) => v.status === "active");
  document.getElementById("stat-volunteers").textContent = active.length || state.volunteers.length;
  const totalHours = state.volunteers.reduce((s, v) => s + (v.hours || 0), 0);
  document.getElementById("stat-hours").innerHTML = totalHours + '<span class="unit">h</span>';

  const grid = document.getElementById("volunteer-cards");
  grid.innerHTML = list
    .map(
      (v) => `
    <article class="volunteer-card">
      <div class="vol-header">
        <div>
          <h3>${escapeHtml(v.name)}</h3>
          ${v.spanishName ? `<p class="spanish-name">${escapeHtml(v.spanishName)}</p>` : ""}
        </div>
        <span class="badge ${v.status}">${statusLabels[v.status]}</span>
      </div>
      <dl class="info-dl">
        <dt>生日</dt><dd>${v.birthday ? formatDate(v.birthday) : "—"}</dd>
        <dt>任期</dt><dd>${formatTerm(v)}</dd>
        <dt>护照号</dt><dd>${escapeHtml(v.passport || "—")}</dd>
        <dt>派出院校</dt><dd>${escapeHtml(v.sendSchool || "—")}</dd>
        <dt>任教学校</dt><dd>${escapeHtml(v.teachSchool || "—")}</dd>
        <dt>任教科目</dt><dd>${escapeHtml(v.skills || "—")}</dd>
        <dt>手机</dt><dd>${escapeHtml(v.phone || "—")}</dd>
        <dt>服务时长</dt><dd>${v.hours || 0} 小时</dd>
      </dl>
      ${v.note ? `<p class="desc note-block">${escapeHtml(v.note)}</p>` : ""}
      <div class="card-actions">
        <button type="button" class="btn sm ghost" data-edit-v="${v.id}">编辑</button>
        <button type="button" class="btn sm danger" data-del-v="${v.id}">删除</button>
      </div>
    </article>`
    )
    .join("");
  document.getElementById("empty-volunteers").classList.toggle("visible", list.length === 0);
  grid.querySelectorAll("[data-edit-v]").forEach((btn) => {
    btn.addEventListener("click", () => editVolunteer(btn.dataset.editV));
  });
  grid.querySelectorAll("[data-del-v]").forEach((btn) => {
    btn.addEventListener("click", () => deleteVolunteer(btn.dataset.delV));
  });
}

function renderAllSelects() {
  fillVolunteerSelect(document.getElementById("clock-volunteer"));
  updateClockHint();
}

function renderAll() {
  renderClock();
  renderWorkFiles();
  renderWork();
  renderApartments();
  renderRepairs();
  renderLeaves();
  renderLife();
  renderVolunteers();
  renderAllSelects();
}

function seedDemo() {
  if (
    state.volunteers.length ||
    state.work.length ||
    state.clockRecords.length
  )
    return;

  const now = Date.now();
  const today = new Date().toISOString().slice(0, 10);

  const v1 = uid();
  const v2 = uid();

  state.volunteers = [
    {
      id: v1,
      name: "陈晓明",
      spanishName: "Chen Xiaoming",
      birthday: "1998-05-12",
      passport: "E12345678",
      sendSchool: "暨南大学华文学院",
      teachSchool: "秘鲁中华三民联校",
      termStart: "2025-08-01",
      termEnd: "2026-07-31",
      origin: "中国",
      phone: "+51 999 123 456",
      email: "",
      skills: "汉语、书法",
      arrival: "2025-08-01",
      hours: 120,
      status: "active",
      note: "",
      createdAt: now,
    },
    {
      id: v2,
      name: "林美玲",
      spanishName: "Lin Meiling",
      birthday: "1999-11-03",
      passport: "E87654321",
      sendSchool: "华侨大学",
      teachSchool: "秘鲁中华三民联校",
      termStart: "2025-09-01",
      termEnd: "2026-08-31",
      origin: "中国",
      phone: "+51 999 234 567",
      email: "",
      skills: "数学",
      arrival: "2025-09-15",
      hours: 80,
      status: "active",
      note: "",
      createdAt: now,
    },
  ];

  state.work = [
    {
      id: uid(),
      title: "一年级汉语课",
      type: "teaching",
      date: today,
      location: "A101",
      lead: "陈晓明",
      status: "ongoing",
      desc: "每周一至周五上午授课。",
      createdAt: now,
    },
  ];

  state.apartments = [
    {
      id: uid(),
      volunteerId: v1,
      address: "Av. Javier Prado Este 4200, San Borja, Lima",
      phone: "+51 1 234 5678",
      room: "305",
      note: "入住时请向前台出示护照。",
      images: [],
      createdAt: now,
    },
  ];

  state.life = [
    {
      id: uid(),
      title: "工作日午餐安排",
      category: "dining",
      date: today,
      contact: "",
      content: "学校食堂 12:00-13:00 供应午餐。",
      createdAt: now,
    },
  ];

  saveState();
}

seedDemo();
renderAll();
