

document.addEventListener("DOMContentLoaded", () => {
  const page = document.body.dataset.page;

  if (page === "beranda") {
    loadPengumumanTerbaru("beranda-pengumuman-list", 3);
  }

  if (page === "profil") {
    loadProfil();
  }

  if (page === "guru") {
    loadGuruPublic();
  }

  if (page === "siswa") {
    loadSiswaPublic();
  }

  if (page === "pengumuman") {
    loadPengumumanTerbaru("pengumuman-list");
  }

  if (page === "kegiatan") {
    loadKegiatanPublic();
  }

  if (page === "jadwal") {
    loadJadwal();
  }

  if (document.getElementById("jadwal-table-body")) {
    loadJadwalAdmin();
    initJadwalAdmin();
  }
});

/* =========================================================
   PENGUMUMAN
========================================================= */

async function loadPengumumanTerbaru(elementId, limit = null) {
  const list = document.getElementById(elementId);
  if (!list) return;

  try {
    const response = await fetch(`${API_URL}/pengumuman`);
    const result = await response.json();

    if (!result.success) {
      list.innerHTML = list.tagName === "UL"
        ? `<li class="announcement-empty">Gagal memuat data pengumuman.</li>`
        : `<div class="announcement-empty">Gagal memuat data pengumuman.</div>`;
      return;
    }

    let data = result.data || [];
    if (limit) data = data.slice(0, limit);

    if (!data.length) {
      list.innerHTML = list.tagName === "UL"
        ? `<li class="announcement-empty">Belum ada pengumuman yang tersedia.</li>`
        : `<div class="announcement-empty">Belum ada pengumuman yang tersedia.</div>`;
      return;
    }

    const isList = list.tagName === "UL";
    list.innerHTML = data.map(item => {
      const title = escapeHTML(item.judul || "Pengumuman");
      const isi = escapeHTML(item.isi || "");
      const date = formatTanggal(item.tanggal);
      const foto = item.foto || item.gambar || "";
      const mediaUrl = foto ? `${BASE_URL}/uploads/${foto}` : "";
      const mediaExtension = foto ? foto.split(".").pop().toLowerCase() : "";
      const isPdf = mediaExtension === "pdf";
      const mediaHTML = mediaUrl
        ? (isPdf
          ? `<a class="announcement-media-link" href="${escapeHTML(mediaUrl)}" target="_blank" rel="noopener noreferrer">Lihat lampiran PDF</a>`
          : `<img class="announcement-media" src="${escapeHTML(mediaUrl)}" alt="${title}" loading="lazy">`)
        : "";

      const content = `
        <div class="announcement-date">${escapeHTML(date)}</div>
        <div class="announcement-content">
          <strong>${title}</strong>
          <p>${isi}</p>
          ${mediaHTML}
        </div>
        <span class="announcement-arrow">→</span>
      `;
      return isList
        ? `<li class="announcement-item">${content}</li>`
        : `<article class="announcement-item">${content}</article>`;
    }).join("");
  } catch (error) {
    console.error("Gagal memuat pengumuman:", error);
    list.innerHTML = list.tagName === "UL"
      ? `<li class="announcement-empty">Gagal memuat data pengumuman.</li>`
      : `<div class="announcement-empty">Gagal memuat data pengumuman.</div>`;
  }
}

/* =========================================================
   KEGIATAN
========================================================= */

async function loadKegiatanPublic() {
  const list = document.getElementById("kegiatan-list");
  if (!list) return;

  try {
    const response = await fetch(`${API_URL}/kegiatan`);
    const result = await response.json();

    if (!result.success || !result.data || result.data.length === 0) {
      list.innerHTML = `<div class="announcement-empty">Belum ada kegiatan yang tersedia.</div>`;
      return;
    }

    list.innerHTML = result.data.map(item => {
      const media = item.foto ? `${BASE_URL}/uploads/${item.foto}` : "";
      const isVideo = /\.(mp4|webm|ogg|mov|m4v)$/i.test(item.foto || "");
      const mediaHTML = media
        ? (isVideo
          ? `<video class="activity-video" controls preload="metadata" playsinline><source src="${escapeHTML(media)}"></video>`
          : `<img src="${escapeHTML(media)}" alt="${escapeHTML(item.judul || "Dokumentasi kegiatan")}" loading="lazy">`)
        : `<div class="activity-placeholder"><span>Dokumentasi</span></div>`;
      return `
        <article class="activity-card">
          <div class="activity-media">
            ${mediaHTML}
            <span class="activity-date">${escapeHTML(formatTanggal(item.tanggal))}</span>
          </div>
          <div class="activity-body">
            <span class="section-kicker">KEGIATAN SEKOLAH</span>
            <h3>${escapeHTML(item.judul || "Kegiatan Sekolah")}</h3>
            <p>${escapeHTML(item.deskripsi || "Dokumentasi kegiatan sekolah.")}</p>
          </div>
        </article>
      `;
    }).join("");
  } catch (error) {
    console.error("Gagal memuat kegiatan:", error);
    list.innerHTML = `<div class="announcement-empty">Gagal memuat data kegiatan.</div>`;
  }
}

/* =========================================================
   PROFIL
========================================================= */

async function loadProfil() {
  const defaultProfil = "SMP Negeri 4 Boja Satu Atap merupakan satuan pendidikan jenjang Sekolah Menengah Pertama (SMP) negeri yang berlokasi di Pasigitan, Kecamatan Boja, Kabupaten Kendal, Jawa Tengah. Sebutan “Satu Atap” digunakan karena satuan pendidikan SMP berada dalam satu lingkungan pendidikan dengan sekolah dasar pada lokasi yang sama. Dengan berada dalam satu kawasan, lingkungan dan fasilitas pendidikan dapat dimanfaatkan secara terpadu untuk mendukung kegiatan belajar mengajar.";
  const defaultFasilitas = [
    "Ruang kelas",
    "Perpustakaan",
    "Laboratorium",
    "Ruang komputer",
    "Musholla",
    "UKS (Unit Kesehatan Sekolah)",
    "Kamar mandi / WC",
    "Lapangan olahraga"
  ];

  try {
    const response = await fetch(`${API_URL}/profil`);
    const result = await response.json();
    const data = result.data || result || {};
    let profil = data.profil || data.deskripsi || defaultProfil;

    if (/SMP Negeri 4 Boja merupakan sekolah menengah pertama/i.test(profil)) {
      profil = defaultProfil;
    }

    const fasilitasText = data.fasilitas || defaultFasilitas.join("\n");
    const dataFisikText = data.data_fisik || "Data fisik sekolah belum tersedia.";

    setText("profil-isi", profil);
    setText("profil-visi", data.visi || "Visi sekolah belum tersedia.");
    setHTML("profil-misi", formatTextToList(data.misi || "Misi sekolah belum tersedia."));
    setHTML("profil-fasilitas", formatTextToList(fasilitasText));
    setHTML("profil-data-fisik", formatTextToList(dataFisikText));
  } catch (error) {
    console.error("Gagal memuat profil:", error);
    tampilkanProfilDefault();
  }
}

function tampilkanProfilDefault() {
  setText("profil-isi", "SMP Negeri 4 Boja Satu Atap merupakan satuan pendidikan jenjang Sekolah Menengah Pertama (SMP) negeri yang berlokasi di Pasigitan, Kecamatan Boja, Kabupaten Kendal, Jawa Tengah. Sebutan “Satu Atap” digunakan karena satuan pendidikan SMP berada dalam satu lingkungan pendidikan dengan sekolah dasar pada lokasi yang sama. Dengan berada dalam satu kawasan, lingkungan dan fasilitas pendidikan dapat dimanfaatkan secara terpadu untuk mendukung kegiatan belajar mengajar.");
  setText("profil-visi", "Visi sekolah belum tersedia.");
  setHTML("profil-misi", "<p>Misi sekolah belum tersedia.</p>");
  setHTML("profil-fasilitas", `
    <ul class="list profile-feature-list">
      <li>Ruang kelas</li>
      <li>Perpustakaan</li>
      <li>Laboratorium</li>
      <li>Ruang komputer</li>
      <li>Musholla</li>
      <li>UKS (Unit Kesehatan Sekolah)</li>
      <li>Kamar mandi / WC</li>
      <li>Lapangan olahraga</li>
    </ul>
  `);
  setHTML("profil-data-fisik", "<p>Data fisik sekolah belum tersedia.</p>");
}

/* =========================================================
   DATA GURU - HALAMAN PUBLIK
========================================================= */

async function loadGuruPublic() {
  const tbody = document.getElementById("guru-public-body");
  const organisasi = document.getElementById("guru-organisasi");
  if (!tbody && !organisasi) return;

  try {
    const response = await fetch(`${API_URL}/guru`);
    const result = await response.json();
    const data = (result.data || []).slice().sort((a, b) =>
      String(a.nama_guru || "").localeCompare(String(b.nama_guru || ""), "id", { sensitivity: "base" })
    );

    if (!result.success || data.length === 0) {
      if (tbody) tbody.innerHTML = `<tr><td colspan="3">Belum ada data guru.</td></tr>`;
      if (organisasi) organisasi.innerHTML = `<div class="org-empty">Belum ada data guru yang dapat ditampilkan.</div>`;
      return;
    }

    if (tbody) {
      tbody.innerHTML = data.map(item => `
        <tr>
          <td>${escapeHTML(item.nama_guru || "-")}</td>
          <td>${escapeHTML(item.mata_pelajaran || "-")}</td>
          <td>${escapeHTML(item.jabatan || "-")}</td>
        </tr>
      `).join("");
    }

    const guruGrid = document.getElementById("guru-card-grid");
    if (guruGrid) {
      guruGrid.innerHTML = data.map(item => `
        <article class="guru-info-card">
          <div class="guru-info-avatar">${escapeHTML((item.nama_guru || "?").trim().charAt(0).toUpperCase())}</div>
          <div class="guru-info-body">
            <strong>${escapeHTML(item.nama_guru || "-")}</strong>
            <span>${escapeHTML(item.jabatan || "Guru")}</span>
            <em>${escapeHTML(item.mata_pelajaran || "-")}</em>
          </div>
        </article>
      `).join("");
    }

    if (organisasi) renderOrganisasiGuru(data);
  } catch (error) {
    console.error("Gagal memuat data guru:", error);
    if (tbody) tbody.innerHTML = `<tr><td colspan="3">Gagal memuat data guru.</td></tr>`;
    if (organisasi) organisasi.innerHTML = `<div class="org-empty">Gagal memuat struktur organisasi.</div>`;
  }
}

function renderOrganisasiGuru(data) {
  const target = document.getElementById("guru-organisasi");
  if (!target) return;

  const normalize = value => String(value || "").toLowerCase().trim();

  const isMapelOnly = (item) => {
    const j = normalize(item.jabatan);
    if (!j) return true;
    return /(matematika|pjok|ppkn|pancasila|prakarya|bahasa|ipa|ips|seni|agama|informatika|\bbk\b|bimbingan|olahraga|sains|biologi|fisika|kimia|sejarah|geografi|ekonomi|sbdp|tik)/.test(j)
      && !/(kepala|wakil|bendahara|tata usaha|operator|pustaka|laboran|admin|penjaga|koordinator|sekretaris|humas|sarana|kesiswaan|kurikulum)/.test(j);
  };

  const isStruktural = (item) => {
    const j = normalize(item.jabatan);
    if (!j || isMapelOnly(item)) return false;
    return /(kepala|wakil|wakasek|bendahara|tata usaha|operator|pustaka|perpustakaan|laboran|admin|penjaga|koordinator|sekretaris|humas|kehumasan|sarana|kesiswaan|kurikulum|ketua)/.test(j);
  };

  const struktural = (data || []).filter(isStruktural);

  const kepala = struktural.filter(item => {
    const j = normalize(item.jabatan);
    return /kepala sekolah/.test(j) && !/wakil/.test(j) && !/pustaka|perpustakaan|labor/.test(j);
  });

  // Wakil Kepala Sekolah utama (jabatan persis / umum), dipisah sendiri
  const wakilUtama = struktural.filter(item => {
    const j = normalize(item.jabatan);
    return (/^wakil kepala sekolah$/.test(j) || /^wakasek$/.test(j) || j === "wakil kepala")
      && !/(sarana|prasarana|kesiswaan|kehumasan|humas|kurikulum|bidang)/.test(j);
  });

  // Wakil bidang lain
  const wakilBidang = struktural.filter(item => {
    const j = normalize(item.jabatan);
    if (wakilUtama.includes(item)) return false;
    return /wakil|wakasek/.test(j);
  });

  const staff = struktural.filter(item =>
    !kepala.includes(item) && !wakilUtama.includes(item) && !wakilBidang.includes(item)
  );

  const renderLevel = (items, fallback, levelClass = "") => {
    if (!items.length) return `<div class="org-empty">${fallback}</div>`;
    return items.map(item => `
      <div class="org-person ${levelClass}">
        <strong>${escapeHTML(item.nama_guru || "-")}</strong>
        <span>${escapeHTML(item.jabatan || "-")}</span>
      </div>
    `).join("");
  };

  const wakilBidangSection = wakilBidang.length ? `
      <div class="org-connector"></div>
      <div class="org-tree-level org-level-mid">
        <div class="org-level-label">Wakil Bidang</div>
        <div class="org-level-nodes">${renderLevel(wakilBidang, "", "org-person-mid")}</div>
      </div>
  ` : "";

  target.innerHTML = `
    <div class="org-tree">
      <div class="org-tree-level org-level-top">
        <div class="org-level-label">Kepala Sekolah</div>
        <div class="org-level-nodes">${renderLevel(kepala, "Kepala sekolah belum dicantumkan.", "org-person-top")}</div>
      </div>
      <div class="org-connector"></div>
      <div class="org-tree-level org-level-mid org-level-wakil-utama">
        <div class="org-level-label">Wakil Kepala Sekolah</div>
        <div class="org-level-nodes">${renderLevel(wakilUtama, "Wakil kepala sekolah belum dicantumkan.", "org-person-mid org-person-single")}</div>
      </div>
      ${wakilBidangSection}
      <div class="org-connector"></div>
      <div class="org-tree-level org-level-bottom">
        <div class="org-level-label">Tenaga Kependidikan</div>
        <div class="org-level-nodes">${renderLevel(staff, "Belum ada tenaga kependidikan struktural.")}</div>
      </div>
    </div>
  `;
}

/* =========================================================
   DATA SISWA - HALAMAN PUBLIK
========================================================= */

async function loadSiswaPublic() {
  const target = document.getElementById("siswa-class-grid");
  if (!target) return;

  try {
    const response = await fetch(`${API_URL}/siswa`);
    const result = await response.json();
    const data = result.data || [];

    if (!result.success) {
      target.innerHTML = `<div class="card student-class-card"><p>Gagal memuat data siswa.</p></div>`;
      return;
    }

    const groups = { VII: [], VIII: [], IX: [] };

    data.forEach(item => {
      const kelas = normalizeTingkatKelas(item.kelas);
      if (groups[kelas]) groups[kelas].push(item);
    });

    Object.values(groups).forEach(items => {
      items.sort((a, b) => String(a.nama_siswa || "").localeCompare(String(b.nama_siswa || ""), "id", { sensitivity: "base" }));
    });

    target.innerHTML = Object.entries(groups).map(([kelas, items]) => `
      <article class="card student-class-card">
        <div class="student-class-header">
          <h2>Kelas ${kelas}</h2>
          <span class="student-count">${items.length} siswa</span>
        </div>
        <ul class="student-list">
          ${items.length ? items.map(item => `
            <li>
              <span class="student-name">${escapeHTML(item.nama_siswa || "-")}</span>
              <span class="student-status">${escapeHTML(item.status || "Aktif")}</span>
            </li>
          `).join("") : `<li class="student-empty">Belum ada data siswa kelas ${kelas}.</li>`}
        </ul>
      </article>
    `).join("");
  } catch (error) {
    console.error("Gagal memuat data siswa:", error);
    target.innerHTML = `<div class="card student-class-card"><p>Gagal memuat data siswa.</p></div>`;
  }
}

function normalizeTingkatKelas(value) {
  const text = String(value || "").trim().toUpperCase();

  // VIII harus dicek sebelum VII karena "VIII" juga diawali "VII".
  if (/^VIII(?:\s|$)/.test(text) || /^8(?:\s|[A-Z]|$)/.test(text)) return "VIII";
  if (/^VII(?:\s|$)/.test(text) || /^7(?:\s|[A-Z]|$)/.test(text)) return "VII";
  if (/^IX(?:\s|$)/.test(text) || /^9(?:\s|[A-Z]|$)/.test(text)) return "IX";

  return "";
}

/* =========================================================
   JADWAL - HALAMAN PUBLIK
========================================================= */

async function loadJadwal() {
  const pelajaranList = document.getElementById("jadwal-pelajaran-list");
  const ekskulList = document.getElementById("jadwal-ekskul-list");
  if (!pelajaranList && !ekskulList) return;

  try {
    const response = await fetch(`${API_URL}/jadwal`);
    const result = await response.json();

    if (!result.success) {
      tampilkanJadwalGagal(pelajaranList, ekskulList);
      return;
    }

    const data = result.data || [];
    const pelajaran = data.filter(item => String(item.jenis || "").toLowerCase() === "pelajaran");
    const ekskul = data.filter(item => String(item.jenis || "").toLowerCase() === "ekstrakurikuler");
    const kelasUrutan = ["VII", "VIII", "IX"];
    const hariUrutan = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

    if (pelajaranList) {
      const groupedKelas = { VII: [], VIII: [], IX: [] };
      pelajaran.forEach(item => {
        const kelas = normalizeTingkatKelas(item.kelas);
        if (groupedKelas[kelas]) groupedKelas[kelas].push(item);
      });

      pelajaranList.innerHTML = kelasUrutan.map(kelas => {
        const items = groupedKelas[kelas];
        if (!items.length) {
          return `
            <article class="class-schedule-card">
              <div class="class-schedule-header">
                <div><span class="section-kicker">TINGKAT</span><h3>Kelas ${kelas}</h3></div>
                <span class="class-schedule-count">0 jadwal</span>
              </div>
              <div class="class-schedule-empty">Belum ada jadwal pelajaran untuk kelas ${kelas}.</div>
            </article>`;
        }

        const byDay = {};
        items.forEach(item => {
          if (!byDay[item.hari]) byDay[item.hari] = [];
          byDay[item.hari].push(item);
        });

        const dayBlocks = hariUrutan.filter(hari => byDay[hari]?.length).map(hari => {
          const rows = [...byDay[hari]].sort((a,b) => String(a.jam_mulai || "").localeCompare(String(b.jam_mulai || "")));
          return `
            <div class="class-day-block">
              <div class="class-day-heading">${escapeHTML(hari)}</div>
              <div class="class-day-rows">
                ${rows.map(item => `
                  <div class="class-schedule-row">
                    <div class="class-schedule-time">${escapeHTML(item.jam_mulai || "-")}<span>–</span>${escapeHTML(item.jam_selesai || "-")}</div>
                    <div class="class-schedule-subject">
                      <strong>${escapeHTML(item.mata_pelajaran || "-")}</strong>
                      <span>${escapeHTML(item.guru || "Guru belum dicantumkan")}</span>
                    </div>
                  </div>
                `).join("")}
              </div>
            </div>`;
        }).join("");

        return `
          <article class="class-schedule-card">
            <div class="class-schedule-header">
              <div><span class="section-kicker">TINGKAT</span><h3>Kelas ${kelas}</h3></div>
              <span class="class-schedule-count">${items.length} jadwal</span>
            </div>
            <div class="class-schedule-body">${dayBlocks}</div>
          </article>`;
      }).join("");
    }

    if (ekskulList) {
      if (!ekskul.length) {
        ekskulList.innerHTML = `<div class="schedule-empty">Belum ada jadwal ekstrakurikuler.</div>`;
      } else {
        const sorted = [...ekskul].sort((a, b) => hariUrutan.indexOf(a.hari) - hariUrutan.indexOf(b.hari));
        ekskulList.innerHTML = sorted.map(item => `
          <article class="schedule-extra-card">
            <div class="schedule-extra-icon">★</div>
            <div>
              <strong>${escapeHTML(item.mata_pelajaran || "-")}</strong>
              <span>${escapeHTML(item.hari || "-")} · Semua Kelas</span>
            </div>
          </article>
        `).join("");
      }
    }
  } catch (error) {
    console.error("Gagal memuat jadwal:", error);
    tampilkanJadwalGagal(pelajaranList, ekskulList);
  }
}

function tampilkanJadwalGagal(pelajaranList, ekskulList) {
  if (pelajaranList) pelajaranList.innerHTML = `<div class="schedule-empty">Gagal memuat jadwal pelajaran.</div>`;
  if (ekskulList) ekskulList.innerHTML = `<div class="schedule-empty">Gagal memuat jadwal ekstrakurikuler.</div>`;
}

/* =========================================================
   JADWAL - DASHBOARD ADMIN
========================================================= */

let jadwalData = [];

function getToken() {
  return localStorage.getItem("adminToken") || localStorage.getItem("token") || "";
}

function initJadwalAdmin() {
  const btnTambah = document.getElementById("btn-open-jadwal-modal");
  const btnClose = document.getElementById("btn-close-jadwal-modal");
  const btnCancel = document.getElementById("btn-cancel-jadwal-modal");
  const form = document.getElementById("form-jadwal");

  if (btnTambah) {
    btnTambah.addEventListener("click", openTambahJadwalModal);
  }

  if (btnClose) {
    btnClose.addEventListener("click", closeJadwalModal);
  }

  if (btnCancel) {
    btnCancel.addEventListener("click", closeJadwalModal);
  }

  if (form) {
    form.addEventListener("submit", simpanJadwal);
  }
}

async function loadJadwalAdmin() {
  const tbody = document.getElementById("jadwal-table-body");

  if (!tbody) return;

  try {
    const response = await fetch(`${API_URL}/jadwal/admin`, {
      headers: {
        Authorization: `Bearer ${getToken()}`
      }
    });

    const result = await response.json();

    if (!result.success) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8">Gagal memuat data jadwal.</td>
        </tr>
      `;
      return;
    }

    jadwalData = result.data || [];

    if (jadwalData.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8">Belum ada data jadwal.</td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = jadwalData.map(item => `
      <tr>
        <td>${escapeHTML(item.mata_pelajaran || item.nama_jadwal || "-")}</td>
        <td>${escapeHTML(item.jenis || "-")}</td>
        <td>${escapeHTML(item.periode || "-")}</td>
        <td>${escapeHTML(item.kelas || "-")}</td>
        <td>${escapeHTML(item.hari || "-")}</td>
        <td>
          ${escapeHTML(item.jam_mulai || "-")}
          -
          ${escapeHTML(item.jam_selesai || "-")}
        </td>
        <td>${escapeHTML(item.guru || "-")}</td>
        <td>
          <span class="action" onclick="openEditJadwalModal(${item.id})">
            Edit
          </span>
          ·
          <span class="action-danger" onclick="hapusJadwal(${item.id})">
            Hapus
          </span>
        </td>
      </tr>
    `).join("");

  } catch (error) {
    console.error("Gagal memuat jadwal admin:", error);

    tbody.innerHTML = `
      <tr>
        <td colspan="8">Tidak dapat terhubung ke server.</td>
      </tr>
    `;
  }
}

/* =========================================================
   MODAL JADWAL
========================================================= */

function openTambahJadwalModal() {
  const modal = document.getElementById("modal-jadwal");
  const form = document.getElementById("form-jadwal");

  if (!modal || !form) return;

  form.reset();

  document.getElementById("jadwal-id").value = "";
  document.getElementById("jadwal-modal-title").textContent = "Tambah Jadwal";
  document.getElementById("jadwal-message").textContent = "";

  modal.classList.add("show");
}

function openEditJadwalModal(id) {
  const item = jadwalData.find(data => Number(data.id) === Number(id));

  if (!item) {
    alert("Data jadwal tidak ditemukan.");
    return;
  }

  const modal = document.getElementById("modal-jadwal");

  if (!modal) return;

  document.getElementById("jadwal-id").value = item.id;
  document.getElementById("jenis-jadwal").value = item.jenis || "Pelajaran";
  document.getElementById("periode-jadwal").value = item.periode || "";
  document.getElementById("mata-pelajaran-jadwal").value = item.mata_pelajaran || "";
  document.getElementById("kelas-jadwal").value = item.kelas || "";
  document.getElementById("hari-jadwal").value = item.hari || "";
  document.getElementById("jam-mulai-jadwal").value = item.jam_mulai || "";
  document.getElementById("jam-selesai-jadwal").value = item.jam_selesai || "";
  document.getElementById("guru-jadwal").value = item.guru || "";
  document.getElementById("keterangan-jadwal").value = item.keterangan || "";

  document.getElementById("jadwal-modal-title").textContent = "Edit Jadwal";
  document.getElementById("jadwal-message").textContent = "";

  modal.classList.add("show");
}

function closeJadwalModal() {
  const modal = document.getElementById("modal-jadwal");

  if (modal) {
    modal.classList.remove("show");
  }
}

/* =========================================================
   SIMPAN JADWAL
========================================================= */

async function simpanJadwal(event) {
  event.preventDefault();

  const id = document.getElementById("jadwal-id").value;
  const message = document.getElementById("jadwal-message");

  const jenis = document.getElementById("jenis-jadwal").value;
  const periode = document.getElementById("periode-jadwal").value.trim();
  const mata_pelajaran = document.getElementById("mata-pelajaran-jadwal").value.trim();
  const kelas = document.getElementById("kelas-jadwal").value;
  const hari = document.getElementById("hari-jadwal").value;
  const jam_mulai = document.getElementById("jam-mulai-jadwal").value;
  const jam_selesai = document.getElementById("jam-selesai-jadwal").value;
  const guru = document.getElementById("guru-jadwal").value.trim();
  const keterangan = document.getElementById("keterangan-jadwal").value.trim();

  if (!jenis || !periode || !mata_pelajaran || !kelas || !hari || !jam_mulai || !jam_selesai) {
    message.style.color = "#dc2626";
    message.textContent = "Data jadwal yang wajib diisi belum lengkap.";
    return;
  }

  if (jam_selesai <= jam_mulai) {
    message.style.color = "#dc2626";
    message.textContent = "Jam selesai harus lebih besar dari jam mulai.";
    return;
  }

  const data = {
    periode,
    jenis,
    hari,
    jam_mulai,
    jam_selesai,
    kelas,
    mata_pelajaran,
    guru,
    keterangan
  };

  try {
    const url = id
      ? `${API_URL}/jadwal/${id}`
      : `${API_URL}/jadwal`;

    const method = id ? "PUT" : "POST";

    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (!result.success) {
      message.style.color = "#dc2626";
      message.textContent = result.message || "Gagal menyimpan jadwal.";
      return;
    }

    message.style.color = "#15803d";
    message.textContent = id
      ? "Jadwal berhasil diperbarui."
      : "Jadwal berhasil ditambahkan.";

    await loadJadwalAdmin();

    setTimeout(() => {
      closeJadwalModal();
    }, 600);

  } catch (error) {
    console.error("Gagal menyimpan jadwal:", error);

    message.style.color = "#dc2626";
    message.textContent = "Tidak dapat terhubung ke server.";
  }
}

/* =========================================================
   HAPUS JADWAL
========================================================= */

async function hapusJadwal(id) {
  if (!confirm("Yakin ingin menghapus jadwal ini?")) {
    return;
  }

  try {
    const response = await fetch(`${API_URL}/jadwal/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${getToken()}`
      }
    });

    const result = await response.json();

    if (!result.success) {
      alert(result.message || "Gagal menghapus jadwal.");
      return;
    }

    await loadJadwalAdmin();

  } catch (error) {
    console.error("Gagal menghapus jadwal:", error);
    alert("Tidak dapat terhubung ke server.");
  }
}

/* =========================================================
   HELPER
========================================================= */

function setText(id, value) {
  const element = document.getElementById(id);

  if (element) {
    element.textContent = value || "-";
  }
}

function setHTML(id, value) {
  const element = document.getElementById(id);

  if (element) {
    element.innerHTML = value || "-";
  }
}

function formatTextToList(text) {
  if (!text) return "-";

  const items = String(text)
    .split("\n")
    .map(item => item.trim())
    .filter(item => item.length > 0);

  if (items.length <= 1) {
    return `<p>${escapeHTML(text)}</p>`;
  }

  return `
    <ul class="list">
      ${items.map(item => `
        <li>${escapeHTML(item)}</li>
      `).join("")}
    </ul>
  `;
}

function formatTanggal(tanggal) {
  if (!tanggal) return "-";

  const date = new Date(tanggal);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
}

function escapeHTML(value) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}