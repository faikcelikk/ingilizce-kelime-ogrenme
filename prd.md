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

[] Yazmalı cevap sistemiyle aktif hatırlama sağlamak
[] Seviye + harf filtreleri ile hedefli çalışma sunmak
[] Yanlış kelimeleri yakalayıp tekrar ettirerek kalıcı öğrenme sağlamak
[] Kullanıcıya net ilerleme ve istatistik göstermek
[] Basit, hızlı ve mobil uyumlu bir deneyim sunmak

---

## 3. Kullanıcı Senaryoları (User Stories)

[] Kullanıcı A1 ve A2 seçip EN→TR modunda random kelime çalışabilmeli
[] Kullanıcı sadece “A” ve “B” ile başlayan kelimeleri görmek isteyebilmeli
[] Kullanıcı cevap verdiğinde doğru/yanlış sonucunu anında görebilmeli
[] Kullanıcı yanlış yaptığı kelimeleri “Yanlışlarım” ekranında görebilmeli
[] Kullanıcı yanlış kelimeleri belirli aralıklarla tekrar karşısında bulabilmeli
[] Kullanıcı sadece yanlış kelimelerle “Tekrar Modu” başlatabilmeli
[] Kullanıcı gün sonunda kaç kelime çözdüğünü ve doğruluk oranını görebilmeli

---

## 4. Temel Özellikler

### 4.1 Quiz Modları

[] EN → TR modu
[] TR → EN modu
[] Karma mod (iki yön random karışık) (opsiyonel)

### 4.2 Random Kelime Getirme

[] Seçili havuzdan random kelime seçme
[] Aynı kelimeyi üst üste getirmeyi azaltma (son X kelimeyi “yakın geçmiş” sayıp tekrar göstermeme)

### 4.3 Seviye Grupları

[] A1, A2, B1, B2 kelime grupları
[] Çoklu seviye seçimi (checkbox)

### 4.4 Baş Harf Filtresi

[] Çoklu harf seçimi (A, B, C...)
[] Seçili seviye + harf kombinasyonu filtreleme
[] Filtre sonucu kelime yoksa kullanıcıya uyarı gösterme

### 4.5 Cevap Kontrolü

[] Büyük/küçük harf duyarsız kontrol
[] Baştaki/sondaki boşlukları temizleme
[] Bir kelime için birden fazla doğru cevap desteği (opsiyonel: “car/automobile” gibi)

---

## 5. Yanlış Takibi & Hata Analizi (Yeni)

### 5.1 Yanlış Kelimeleri Kaydetme

[] Kullanıcı yanlış yaptığında o kelime “Yanlışlarım” listesine eklenmeli
[] Her kelime için yanlış sayısı tutulmalı
[] Kullanıcı aynı kelimeyi tekrar yanlış yaparsa yanlış sayısı artmalı
[] Kullanıcı doğru yaptığında “yanlış havuzu”ndaki durumu güncellenmeli (ör: seans bazlı doğru sayısı)

### 5.2 Yanlışları Ayrı Görüntüleme

[] “Yanlışlarım” sayfası
[] Filtreleme: seviye / harf / en çok yanlış / en yeni
[] Kelime detay: doğru cevap, kullanıcı hatalı cevabı (son cevap), yanlış sayısı, son görülme tarihi
[] Kelimeyi “çözüldü” olarak işaretleyebilme (manuel) (opsiyonel)

### 5.3 Hataları Belirli Aralıklarla Tekrar Gösterme (Spaced Repetition)

[] Yanlış yapılan kelimeler için “tekrar zamanı” hesaplanmalı
[] Kullanıcı her oturum açtığında “Tekrar Etmen Gerekenler” listesi gösterilmeli
[] Tekrar aralıkları (basit MVP planı):

* 1. yanlış sonrası: 10 dakika sonra
* 2. yanlış sonrası: 1 gün sonra
* 3. yanlış sonrası: 3 gün sonra
* 4. yanlış sonrası: 7 gün sonra
     [] Kelime doğru yapılırsa tekrar aralığı uzamalı; tekrar yanlış yapılırsa daha kısa aralığa geri düşmeli

### 5.4 Tekrar Modu

[] “Sadece Tekrar” butonu (sadece zamanı gelmiş kelimeler)
[] “Sadece Yanlışlar” butonu (yanlış havuzundaki tüm kelimeler)
[] Tekrar modunda da EN→TR / TR→EN seçilebilmeli
[] Tekrar bitince özet gösterilmeli

---

## 6. İstatistikler

[] Toplam soru sayısı
[] Doğru sayısı / yanlış sayısı
[] Doğruluk oranı (%)
[] Seviye bazlı başarı oranı (A1-A2-B1-B2)
[] Harf bazlı başarı oranı (opsiyonel)
[] Günlük hedef: “Bugün 20 soru” gibi (opsiyonel)
[] Streak (günlük çalışma serisi) (opsiyonel ama güçlü)

---

## 7. Yönetim (Kelime Havuzu Yönetimi)

[] Kelime ekleme / düzenleme / silme (admin veya lokal JSON düzenleme)
[] Toplu ekleme: JSON/CSV import
[] Kelime alanları:

* İngilizce
* Türkçe
* Level (A1/A2/B1/B2)
* Tags (opsiyonel)
* Örnek cümle (opsiyonel)
* Not (opsiyonel)

---

## 8. UI/UX Gereksinimleri

[] Basit, hızlı, mobil uyumlu tasarım
[] Mod seçimi → seviye seçimi → harf seçimi → başla akışı
[] Cevap input alanına otomatik odak (focus)
[] Enter ile gönderme
[] Doğru/yanlış geri bildirim (metin + ikon)
[] “Doğru cevap şuydu” gösterimi
[] “Sonraki kelime” kısa gecikmeyle gelsin (opsiyonel ayar)

---

## 9. Teknik Gereksinimler

### 9.1 Teknoloji

[] Frontend: HTML + CSS + JavaScript (MVP) veya React (opsiyonel)
[] Veri saklama:

* MVP: LocalStorage (kullanıcı yanlışları ve istatistikleri kaydetmek için)
* Gelişmiş: Firebase/Auth + Firestore (kullanıcı hesabı ve bulut kayıt için)

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

[] Kullanıcı mod seçer
[] Seviye(ler) seçer
[] Harf(ler) seçer
[] Sistem uygun havuzu oluşturur
[] Öncelik sırası:

* “Tekrar zamanı gelmiş kelimeler” varsa önce onları sor (opsiyonel toggle)
* Yoksa normal havuzdan random sor
  [] Kullanıcı cevap verir
  [] Sistem kontrol eder
  [] İstatistik + tekrar planı güncellenir
  [] Sonraki soru

---

## 11. MVP (İlk Çıkış İçin Minimum)

[] EN→TR ve TR→EN modları
[] A1-A2-B1-B2 seviye seçimi
[] Baş harf filtresi
[] Random kelime üretimi
[] Doğru/yanlış kontrol + doğru cevabı gösterme
[] Yanlış kelimeleri kaydetme
[] “Yanlışlarım” ekranı
[] Spaced repetition: nextReviewAt hesaplama + “Tekrar Modu”
[] LocalStorage ile kayıt

---

## 12. Gelecek Geliştirmeler

[] Kullanıcı hesabı + bulut kayıt
[] Gelişmiş spaced repetition (SM-2 benzeri)
[] Telaffuz / audio
[] PWA offline destek
[] Özel kelime listeleri (kullanıcı kendi listesini oluşturabilsin)
[] AI öneri: zayıf kelimelere göre çalışma planı

---

İstersen hacı, bir sonraki adımda ben sana **MVP sprint görevlerini de** çıkarayım:

* “Gün 1: veri yapısı + UI”, “Gün 2: quiz motoru”, “Gün 3: yanlış havuzu + tekrar” gibi **tam yapılacak iş listesi** halinde.
