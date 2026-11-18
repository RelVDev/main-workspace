# Aturan agent untuk proyek ini
- Sumber kebenaran: docs/PLAN.md. Baca sebelum bekerja. Gaya: skill pixel-cinema-style.
- Kerjakan per fase (PLAN Bagian 14). Berhenti di setiap CHECKPOINT dan minta persetujuan user (kecuali user meminta langsung build penuh).
- Jangan membuat TTS atau suara karakter. Dubbing direkam manual oleh user.
- Jangan mengarang data/angka/hasil percobaan. Gunakan TODO(user) untuk data yang belum ada.
- Semua waktu dalam detik relatif scene, dijangkarkan ke ID baris dubbing. Tanpa Math.random().
- Perintah: npm run dev | npm run sync | npm run sfx | npm run render:preview | npm run render:final.
- Pakai skill remotion-best-practices dan /remotion-docs. MCP Remotion sudah dimatikan, jangan dipasang.
- Setelah tiap fase: render still/klip bukti, lapor singkat.
- Catat setiap aset bersumber luar di public/LICENSES.md.
