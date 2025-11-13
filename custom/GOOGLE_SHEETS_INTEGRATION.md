# Integrasi Google Sheets untuk Kuis

## Cara Setup

### 1. Buat Google Apps Script

Buat script di Google Sheets dengan kode berikut:

```javascript
function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Sheet1");
  
  const params = e.parameter;
  const action = params.action || '';
  
  if (action === "tambah") {
    const timestamp = new Date();
    sheet.appendRow([
      params.iddata || '',
      timestamp,
      params.namaorng || '',
      params.nilai || '',
      params.nope || '',
      params.alamatorng || '',
      params.keterangan || ''
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({ 
      status: 'success', 
      message: 'Data berhasil disimpan' 
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  return ContentService.createTextOutput(JSON.stringify({ 
    status: 'error', 
    message: 'Action tidak valid' 
  })).setMimeType(ContentService.MimeType.JSON);
}
```

### 2. Deploy Web App

1. Klik **Deploy** → **New deployment**
2. Pilih tipe: **Web app**
3. Execute as: **Me**
4. Who has access: **Anyone**
5. Copy URL yang dihasilkan (format: `https://script.google.com/macros/s/.../exec`)

### 3. Format Kolom di Google Sheets

Buat header kolom di Sheet1:

| ID Data | Timestamp | Nama | Nilai | No HP | Alamat | Keterangan |
|---------|-----------|------|-------|-------|--------|------------|

---

## Cara Menggunakan di HTML

### Opsi 1: Menggunakan Attributes

```html
<confetti-quiz 
  web-app-url="https://script.google.com/macros/s/AKfycb.../exec"
  user-name="John Doe"
  user-phone="081234567890"
  user-address="Jakarta"
  questions='[
    {"question":"Siapa presiden pertama Indonesia?","answer":"soekarno"},
    {"question":"Ibukota Indonesia?","answer":"jakarta"}
  ]'>
</confetti-quiz>
```

### Opsi 2: Set via JavaScript

```html
<confetti-quiz id="myQuiz"></confetti-quiz>

<script type="module">
  const quiz = document.getElementById('myQuiz');
  
  // Set Google Sheets URL
  quiz.webAppUrl = 'https://script.google.com/macros/s/AKfycb.../exec';
  
  // Set user info
  quiz.userName = 'John Doe';
  quiz.userPhone = '081234567890';
  quiz.userAddress = 'Jakarta, Indonesia';
  
  // Set questions
  quiz.setAttribute('questions', JSON.stringify([
    { question: "Siapa presiden pertama Indonesia?", answer: "soekarno" },
    { question: "Ibukota Indonesia?", answer: "jakarta" }
  ]));
</script>
```

### Opsi 3: Form Input Sebelum Kuis

```html
<div id="user-form">
  <h2>Data Peserta</h2>
  <input type="text" id="nama" placeholder="Nama Lengkap" required>
  <input type="tel" id="nohp" placeholder="No HP">
  <input type="text" id="alamat" placeholder="Alamat">
  <button onclick="mulaiKuis()">Mulai Kuis</button>
</div>

<confetti-quiz 
  id="myQuiz" 
  style="display:none"
  web-app-url="https://script.google.com/macros/s/AKfycb.../exec">
</confetti-quiz>

<script>
  function mulaiKuis() {
    const quiz = document.getElementById('myQuiz');
    const form = document.getElementById('user-form');
    
    // Set user data
    quiz.userName = document.getElementById('nama').value;
    quiz.userPhone = document.getElementById('nohp').value;
    quiz.userAddress = document.getElementById('alamat').value;
    
    // Show quiz, hide form
    form.style.display = 'none';
    quiz.style.display = 'block';
  }
</script>
```

---

## Fitur

✅ **Otomatis kirim saat kuis selesai**
- Data terkirim hanya ketika user menyelesaikan semua soal
- Tidak akan kirim data jika kuis belum selesai

✅ **Data yang dikirim:**
- ID unik (timestamp)
- Nama peserta
- Nilai/skor
- No HP (opsional)
- Alamat (opsional)
- Keterangan (nama kuis, persentase, skor)

✅ **Mode no-cors**
- Menggunakan `mode: 'no-cors'` untuk menghindari error CORS
- Data tetap terkirim meski response tidak bisa dibaca

✅ **Fallback ke Anonymous**
- Jika `user-name` tidak diisi, akan menggunakan "Anonymous"

---

## Testing

1. Buka browser console (F12)
2. Selesaikan kuis
3. Lihat pesan: `✅ Hasil kuis terkirim ke Google Sheets`
4. Cek Google Sheets untuk melihat data masuk

---

## Troubleshooting

### Data tidak masuk ke Google Sheets

1. ✅ Pastikan URL Web App benar
2. ✅ Pastikan deployment setting: "Anyone" bisa akses
3. ✅ Cek script Google Apps Script tidak ada error
4. ✅ Pastikan nama sheet adalah "Sheet1" atau sesuaikan di script

### Error CORS

Gunakan `mode: 'no-cors'` (sudah diimplementasikan). Data akan tetap terkirim meski browser tidak bisa membaca response.

---

## Build dan Deploy

Setelah edit kode, jalankan:

```bash
npm run build
```

Lalu deploy file `build/` ke hosting Anda.
