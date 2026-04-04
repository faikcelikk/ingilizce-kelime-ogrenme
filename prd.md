Aşağıya PRD’yi **baştan, daha tam ve “yanlışları kaydet + aralıklı tekrar (spaced repetition)”** özellikleri eklenmiş şekilde yeniden yazdım. Ek olarak senin sistemine çok yakışacak birkaç tamamlayıcı özelliği de dahil ettim (MVP’ye uygun, abartmadan).

---

# prd.md

# İngilizce Kelime Öğrenme Web Uygulaması (Seviye + Filtre + Yanlış Takibi + Aralıklı Tekrar)

---

## 1. Proje Özeti

İngilizce kelime öğrenmeye yönelik bir web sitesi geliştirmek istiyorum. Bu sistemde kullanıcıya kelimeler soru formatında gösterilecek ve kullanıcı karşılığını yazarak cevap verecek. Sistem iki temel mod sunacak:

* **İngilizce → Türkçe**: İngilizce kelime gösterilir, kullanıcı Türkçe anlamını yazar.
* **Türkçe → İngilizce**: Türkçe kelime gösterilir, kullanıcı İngilizce karşılığını yazar.

Kullanıcının cevabı anında kontrol edilerek doğru/yanlış sonucu gösterilecek; süreç boyunca puan, doğru–yanlış sayısı, doğruluk oranı gibi istatistikler tutulacak. Kelimeler **random** gelecektir. Kelime havuzu **A1, A2, B1, B2** seviyelerine göre ayrılacak; kullanıcı istediği seviyeyi veya birden fazla seviyeyi seçebilecek. Ayrıca kullanıcı **baş harf filtresi** ile (örn: sadece A, B harfleri) kelime getirmeyi seçebilecek.

Ek olarak sistem, kullanıcının **yanlış yaptığı kelimeleri otomatik olarak kaydedecek**, bu kelimeleri ayrı bir sayfada gösterecek ve belirli aralıklarla (spaced repetition) **tekrar karşısına çıkaracaktır**.

---

## 2. Hedefler

[x] Yazmalı cevap sistemiyle aktif hatırlama sağlamak
[x] Seviye + harf filtreleri ile hedefli çalışma sunmak
[x] Yanlış kelimeleri yakalayıp tekrar ettirerek kalıcı öğrenme sağlamak
[x] Kullanıcıya net ilerleme ve istatistik göstermek
[x] Basit, hızlı ve mobil uyumlu bir deneyim sunmak

---

## 3. Kullanıcı Senaryoları (User Stories)

[x] Kullanıcı A1 ve A2 seçip EN→TR modunda random kelime çalışabilmeli
[x] Kullanıcı sadece “A” ve “B” ile başlayan kelimeleri görmek isteyebilmeli
[x] Kullanıcı cevap verdiğinde doğru/yanlış sonucunu anında görebilmeli
[x] Kullanıcı yanlış yaptığı kelimeleri “Yanlışlarım” ekranında görebilmeli
[x] Kullanıcı yanlış kelimeleri belirli aralıklarla tekrar karşısında bulabilmeli
[x] Kullanıcı sadece yanlış kelimelerle “Tekrar Modu” başlatabilmeli
[x] Kullanıcı gün sonunda kaç kelime çözdüğünü ve doğruluk oranını görebilmeli

---

## 4. Temel Özellikler

### 4.1 Quiz Modları

[x] EN → TR modu
[x] TR → EN modu
[x] Karma mod (iki yön random karışık) (opsiyonel)

### 4.2 Random Kelime Getirme

[x] Seçili havuzdan random kelime seçme
[x] Aynı kelimeyi üst üste getirmeyi azaltma (son X kelimeyi “yakın geçmiş” sayıp tekrar göstermeme)

### 4.3 Seviye Grupları

[x] A1, A2, B1, B2 kelime grupları
[x] Çoklu seviye seçimi (checkbox)

### 4.4 Baş Harf Filtresi

[x] Çoklu harf seçimi (A, B, C...)
[x] Seçili seviye + harf kombinasyonu filtreleme
[x] Filtre sonucu kelime yoksa kullanıcıya uyarı gösterme

### 4.5 Cevap Kontrolü

[x] Büyük/küçük harf duyarsız kontrol
[x] Baştaki/sondaki boşlukları temizleme
[x] Bir kelime için birden fazla doğru cevap desteği (opsiyonel: “car/automobile” gibi)

---

## 5. Yanlış Takibi & Hata Analizi (Yeni)

### 5.1 Yanlış Kelimeleri Kaydetme

[x] Kullanıcı yanlış yaptığında o kelime “Yanlışlarım” listesine eklenmeli
[x] Her kelime için yanlış sayısı tutulmalı
[x] Kullanıcı aynı kelimeyi tekrar yanlış yaparsa yanlış sayısı artmalı
[x] Kullanıcı doğru yaptığında “yanlış havuzu”ndaki durumu güncellenmeli (ör: seans bazlı doğru sayısı)

### 5.2 Yanlışları Ayrı Görüntüleme

[x] “Yanlışlarım” sayfası
[x] Filtreleme: seviye / harf / en çok yanlış / en yeni
[x] Kelime detay: doğru cevap, kullanıcı hatalı cevabı (son cevap), yanlış sayısı, son görülme tarihi
[x] Kelimeyi “çözüldü” olarak işaretleyebilme (manuel) (opsiyonel)

### 5.3 Hataları Belirli Aralıklarla Tekrar Gösterme (Spaced Repetition)

[x] Yanlış yapılan kelimeler için “tekrar zamanı” hesaplanmalı
[x] Kullanıcı her oturum açtığında “Tekrar Etmen Gerekenler” listesi gösterilmeli
[x] Tekrar aralıkları (basit MVP planı):

* 1. yanlış sonrası: 10 dakika sonra
* 2. yanlış sonrası: 1 gün sonra
* 3. yanlış sonrası: 3 gün sonra
* 4. yanlış sonrası: 7 gün sonra
     [x] Kelime doğru yapılırsa tekrar aralığı uzamalı; tekrar yanlış yapılırsa daha kısa aralığa geri düşmeli

### 5.4 Tekrar Modu

[x] “Sadece Tekrar” butonu (sadece zamanı gelmiş kelimeler)
[x] “Sadece Yanlışlar” butonu (yanlış havuzundaki tüm kelimeler)
[x] Tekrar modunda da EN→TR / TR→EN seçilebilmeli
[x] Tekrar bitince özet gösterilmeli

---

## 6. İstatistikler

[x] Toplam soru sayısı
[x] Doğru sayısı / yanlış sayısı
[x] Doğruluk oranı (%)
[x] Seviye bazlı başarı oranı (A1-A2-B1-B2)
[x] Harf bazlı başarı oranı (opsiyonel)
[x] Günlük hedef: “Bugün 20 soru” gibi (opsiyonel)
[x] Streak (günlük çalışma serisi) (opsiyonel ama güçlü)

---

## 7. Yönetim (Kelime Havuzu Yönetimi)

[x] Kelime ekleme / düzenleme / silme (admin veya lokal JSON düzenleme)
[x] Toplu ekleme: JSON/CSV import (Hızlı Metin ile Listelere Eklendi)
[x] Kelime alanları:

* İngilizce
* Türkçe
* Level (A1/A2/B1/B2)
* Tags (opsiyonel)
* Örnek cümle (opsiyonel)
* Not (opsiyonel)

---

## 8. UI/UX Gereksinimleri

[x] Basit, hızlı, mobil uyumlu tasarım
[x] Mod seçimi → seviye seçimi → harf seçimi → başla akışı
[x] Cevap input alanına otomatik odak (focus)
[x] Enter ile gönderme
[x] Doğru/yanlış geri bildirim (metin + ikon)
[x] “Doğru cevap şuydu” gösterimi
[x] “Sonraki kelime” kısa gecikmeyle gelsin (opsiyonel ayar)

---

## 9. Teknik Gereksinimler

### 9.1 Teknoloji

[x] Frontend: HTML + CSS + JavaScript (MVP) veya React (opsiyonel) - (Next.js 14 Eklendi)
[x] Veri saklama:

* MVP: LocalStorage (kullanıcı yanlışları ve istatistikleri kaydetmek için)
* Gelişmiş: Firebase/Auth + Firestore (kullanıcı hesabı ve bulut kayıt için) - (Yerine Local SQLite veritabanı (oxford3000.db ve app.db) kullanıldı)

### 9.2 Örnek Veri Yapıları

**Kelime (Word)**

```json
{
  "id": "w_001",
  "en": "apple",
  "tr": "elma",
  "level": "A1",
  "tags": ["food"],
  "example": "I eat an apple."
}
```

**Kullanıcı İlerlemesi (Progress)**

```json
{
  "wordId": "w_001",
  "wrongCount": 2,
  "correctStreak": 1,
  "lastAnswer": "alma",
  "lastSeenAt": "2026-02-26T19:20:00Z",
  "nextReviewAt": "2026-02-27T19:20:00Z"
}
```

---

## 10. Sistem Akışı

[x] Kullanıcı mod seçer
[x] Seviye(ler) seçer
[x] Harf(ler) seçer
[x] Sistem uygun havuzu oluşturur
[x] Öncelik sırası:

* “Tekrar zamanı gelmiş kelimeler” varsa önce onları sor (opsiyonel toggle)
* Yoksa normal havuzdan random sor
  [x] Kullanıcı cevap verir
  [x] Sistem kontrol eder
  [x] İstatistik + tekrar planı güncellenir
  [x] Sonraki soru

---

## 11. MVP (İlk Çıkış İçin Minimum)

[x] EN→TR ve TR→EN modları
[x] A1-A2-B1-B2 seviye seçimi
[x] Baş harf filtresi
[x] Random kelime üretimi
[x] Doğru/yanlış kontrol + doğru cevabı gösterme
[x] Yanlış kelimeleri kaydetme
[x] “Yanlışlarım” ekranı
[x] Spaced repetition: nextReviewAt hesaplama + “Tekrar Modu”
[x] LocalStorage ile kayıt (ve SQLite desteği eklendi)

---

## 12. Gelecek Geliştirmeler

[ ] Kullanıcı hesabı + bulut kayıt (henüz MVP aşamasındayız)
[x] Gelişmiş spaced repetition (SM-2 benzeri algoritmalar kuruldu)
[x] Telaffuz / audio (Speech API ile eklendi)
[ ] PWA offline destek
[x] Özel kelime listeleri (kullanıcı kendi listesini oluşturabilsin)
[x] AI öneri: zayıf kelimelere göre çalışma planı (AI Cümle Modu ve AI Asistan Eklendi)

---

## 13. PRD'de Olmayıp Sonradan Eklenen Değerli Özellikler

[x] **Typo Toleransı (Levenshtein Mesafesi):** Kullanıcı kelimenin 1-2 harfini yanlış yazsa bile algoritma bunu fark eder ve kullanıcının yazım yanlışı yaptığını anlayıp kelimeyi doğru kabul edebilir.
[x] **Hızlı (Otomatik) Liste Oluşturma:** Kullanıcı İngilizce=Türkçe formatında metin olarak kelimeleri yapıştırdığında, eğer kelime veritabanında yoksa bile arka planda veritabanına eklenir ve yepyeni bir grup saniyeler içinde oluşturulur.
[x] **AI Cümle Pratiği Modu:** Yapay zeka kullanıcının seviyesine uygun, o kelimeleri barındıran cümle örnekleri üreterek boşluk doldurmaca oynamasını sağlar.
[x] **Ses Ayarları (Aksan ve Hız):** Text-to-speech özelliği sadece eklendiyle kalmadı, kullanıcı ister İngiliz (UK), ister Amerikan (US), ister Avustralya (AU) aksanıyla farklı hızlarda (Yavaş, Normal, Hızlı) sesleri dinleyebilir.
[x] **Yan Anlam (Alternative Meanings) Desteği:** Bir kelimenin sadece bir karşılığı olmak zorunda değildir. (Örn: "Aunt" için hem "Teyze" hem "Hala" doğru yanıt sayılır).
[x] **Dark / Light Tema Modu:** Gece kullanımları için göz yormayan modern Dark Mod eklentisi.
[x] **Gömülü SQLite (Oxford 3000):** Kelime havuzunu statik JSON'dan, daha büyük kapasitelere hizmet edebilecek "Better SQLite" veritabanına taşındı ve ~3000 profesyonel İngilizce kelimesi entegre edildi.

---

İstersen hacı, bir sonraki adımda ben sana **MVP sprint görevlerini de** çıkarayım:

* “Gün 1: veri yapısı + UI”, “Gün 2: quiz motoru”, “Gün 3: yanlış havuzu + tekrar” gibi **tam yapılacak iş listesi** halinde.
*(Not: Sistem genel olarak tamamlandı ve kullanılmaya başlandı bile!)*
