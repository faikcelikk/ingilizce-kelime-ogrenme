# İngilizce Kelime Öğrenme MVP Planı

## Faz 1: Temel Kurulum ve Teknik Altyapı
- [x] Frontend: HTML + CSS + JavaScript (MVP) veya React/Next.js kurulumu
- [x] Veri saklama: LocalStorage entegrasyonu (kullanıcı yanlışları, istatistikler ve ilerleme kayıtları için)
- [x] Örnek kelime veri yapısının oluşturulması (id, en, tr, level, tags, example gibi alanları içerecek JSON yapısı)

## Faz 2: Kullanıcı Arayüzü (UI) ve Filtreler
- [x] Bölüm tasarımı: Basit, hızlı ve mobil uyumlu temel arayüz
- [x] Quiz Modları: EN → TR ve TR → EN geçişlerinin yapılması
- [x] Karma Mod: İki yönün rastgele karıştığı mod seçeneği (opsiyonel)
- [x] Seviye Seçimi: A1, A2, B1, B2 kelime grupları için çoklu seçim (checkbox)
- [x] Baş Harf Filtresi: Çoklu harf seçimi (A, B, C...)
- [x] Filtre Mantığı: Seçili seviye + harf kombinasyonuna göre kelime havuzunu filtreleme
- [x] Filtre sonucu kelime bulunamazsa kullanıcıya uyarı gösterilmesi
- [x] Temel Akış: Mod seçimi → Seviye seçimi → Harf seçimi → Başla akışının UI üzerinde tamamlanması

## Faz 3: Quiz Motoru ve Cevap Kontrolü
- [x] Havuzdan rastgele soru getirilmesi
- [x] Aynı kelimenin üst üste ya da çok yakın zamanda tekrar gelmesini engelleyecek "yakın geçmiş" kontrolü
- [x] Kullanıcı arayüzünde cevap alanına otomatik odaklanma (focus) ve Enter tuşu ile cevap gönderme
- [x] Cevap formatlama: Büyük/küçük harf duyarsız kontrol ve baştaki/sondaki boşlukların temizlenmesi (trim)
- [x] Çoklu doğru desteği: Bir kelimenin birden fazla doğru çevirisinin olması (ör. car/automobile)
- [x] Anında geri bildirim: Doğru veya yanlış yapıldığının anında ekranda gösterilmesi (metin + ikon)
- [x] "Doğru cevap şuydu" gösterimi (yanlış bilindiğinde)
- [x] Cevap sonrası bir sonraki kelimeye kısa bir gecikmeyle (delay) otomatik geçiş

## Faz 4: Yanlış Takibi ve Hata Analizi
- [x] İlk veritabanı/state kaydı: Yanlış yapılan kelimenin "Yanlışlarım" listesine otomatik kaydedilmesi
- [x] Her kelimenin yanlış sayısının tutulması (tekrar hata yapıldığında artması)
- [x] Hatalı kelimenin sisteme verilen son yanlış cevabının kaydedilmesi
- [x] "Yanlışlarım" sayfası: Tüm hatalı kelimelerin bir arada listelenmesi
- [x] Filtreleme/Sıralama: Yanlışları seviye, baş harf, en çok yanlış veya en yeniye göre filtreleyebilme
- [x] Kelime detay kartı: Kelimenin orijinali, doğru cevabı, kullanıcının son cevabı, yanlış sayısı ve son görülme tarihinin gösterilmesi
- [x] Manuel Müdahale: Kullanıcının listedeki bir kelimeyi manuel olarak "çözüldü" işaretleyebilmesi (opsiyonel)

## Faz 5: Aralıklı Tekrar (Spaced Repetition) ve Tekrar Modu
- [x] Tekrar algoritması: Yanlış yapan kelimeler için ilk hatada 10 dk, sonra 1 gün, 3 gün, 7 gün gibi aralıklı `nextReviewAt` hesaplaması
- [x] Kullanıcı doğru bildikçe kelimenin tekrar aralığının uzaması, yanlış yaparsa başa dönmesi
- [x] Önceliklendirme: Yeni soru getirileceği zaman öncelikle "tekrar zamanı gelmiş" kelime varsa onun sorulması
- [x] Uygulama açılışında / ana sayfada "Tekrar Etmen Gerekenler" listesinin özet halinde gösterilmesi
- [x] "Sadece Tekrar" butonu: Kullanıcının sadece süresi gelmiş telafi kelimelerini baştan sona çözmesi
- [x] "Sadece Yanlışlar" butonu: Süresinden bağımsız olarak havuzdaki tüm yanlışların sorulması
- [x] Tekrar modlarının sonunda kaç doğru/yanlış yapıldığına dair kısa bir özet (summary) gösterimi

## Faz 6: İstatistikler ve Oyunlaştırma
- [x] Anlık skor ve istatistik state'lerinin oluşturulması
- [x] Toplam çözülen soru sayısının, doğru/yanlış sayısının ve doğruluk yüzdesinin (%) hesaplanıp UI'da gösterilmesi
- [x] Seviye bazlı (A1-A2-B1-B2) başarı oranlarının gösterimi
- [x] Harf bazlı başarı oranlarının gösterimi (opsiyonel)
- [x] Günlük hedef (Bugün 20 soru vb.) modülünün oluşturulması (opsiyonel)
- [x] Çalışma serisi (Streak) gün sayacı ve arayüzde serinin gösterilmesi (opsiyonel)

## Faz 7: Kelime Havuzu Yönetimi
- [x] İçerik Yönetimi: Admin arayüzü veya gizli bir sayfadan (veya direkt JSON müdahalesiyle) kelime ekleme, düzenleme ve silme
- [x] Gelişmiş içerik ekleme: Dışarıdan JSON veya CSV import etme mekanizması (opsiyonel)

## Gelecek Geliştirmeler (V2+)
- [x] Kullanıcı hesabı yapısı oluşturulması ve Firebase Auth entegrasyonu
- [x] LocalStorage yerine veya ona ek olarak Firestore (Bulut) veri tabanına senkronizasyon
- [x] SM-2 gibi daha gelişmiş bir Spaced Repetition algoritmasına geçilmesi
- [x] Web Speech API / Ses dosyaları ile İngilizce sesli okuma (Telaffuz) desteği
- [x] İnternetsiz çalışma için PWA (Progressive Web App) manifest ve service worker kurulumu
- [x] Kullanıcıların "Seyahat Kelimeleri", "Yazılım Terimleri" gibi özel listeler oluşturabilmesi
- [x] AI entegrasyonu: Kullanıcının yanlış profiline bakarak zayıf olduğu konuları tespit edip ona özel çalışma planı çıkarması (OpenAI/OpenRouter)
