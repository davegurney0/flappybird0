# SİKTİR GİT KÖYÜNE

Mobil tarayıcı öncelikli, dikey ekranda oynanan Phaser arcade oyunu.

Projede splash ekranı, ana menü, ayarlar paneli, tamamen oynanabilir Flappy
döngüsü, gelişmiş zorluk yönetimi, yedi farklı engel türü, yerel rekor kaydı,
aynı run içinde değişen beş dünya, beş aşamalı Evolution sistemi, coin
ekonomisi, dört power-up, altı kalıcı kozmetik skin ve gelişmiş arcade ana
menüsü, günlük görevler ile sürümlü oyuncu profili bulunur.
Oyun 432×768 mantıksal alanı korurken 2× yüksek çözünürlükte render edilir.

## Gereksinimler

- Node.js 22.13 veya daha yeni bir sürüm
- npm

## Çalıştırma

```bash
npm install
npm run dev
```

Terminalde gösterilen yerel adresi tarayıcıda aç.

## Kontroller

- Mobil: ekrana dokun
- Masaüstü: mouse ile tıkla veya `Space` tuşuna bas
- `Esc` / `Backspace`: oyun alanından ana menüye dön
- Ana menü: ok tuşlarıyla seçim yap, `Enter` veya `Space` ile onayla

Yatay kullanım uyarısı yalnızca mobil cihazlarda gösterilir; masaüstü
tarayıcılarında pencerenin oranı ne olursa olsun oyun erişilebilir kalır.

Oyun alanındaki `MENÜ`, `TEKRAR` ve `ANA MENÜ` kontrolleri flap girdisinden
ayrıdır; UI butonlarına dokunmak kuşu zıplatmaz.

## Oynanış mimarisi

- `src/config/gameBalance.js`: gravity, flap kuvveti, engel hızı, spawn aralığı,
  gap boyutu ve engel davranışlarının temel denge değerleri
- `src/config/difficultyConfig.js`: skor eşikleri, zone'lar, engel ağırlıkları,
  cooldown'lar, güvenli kombinasyonlar ve pool boyutları
- `src/config/zoneConfig.js`: beş dünyanın skor eşikleri, renkleri, parallax
  hızları ve geçiş süreleri
- `src/config/evolutionConfig.js`: evrim eşikleri, görünüm tokenları, efektler
  ve küçük oynanış avantajları
- `src/config/pickupConfig.js`: coin değerleri, pool sınırları, power-up
  süreleri, spawn aralıkları ve etki güçleri
- `src/config/menuConfig.js`: altı menü sayfası, başarımlar ve kayıtlardan
  türetilen ilerleme özeti
- `src/config/missionConfig.js`: günlük görev havuzu, hedefler, ödüller ve
  oyun event'lerinden ilerleme kuralları
- `src/config/skinConfig.js`: altı skin, fiyatlar, rarity renkleri ve yalnızca
  kozmetik görünüm tokenları
- `src/config/saveConfig.js`: save şeması, varsayılan profil, doğrulama ve
  sürüm migration zinciri
- `src/game/entities/KoyluKus.js`: beş ayrı prosedürel görünüm, dinamik hitbox
  ve seçili skinle birleşen evrime bağlı uçuş hissi
- `src/game/graphics/birdSkinGraphics.js`: menü preview'ları ve kuş
  aksesuarlarının prosedürel çizimi
- `src/managers/SkinManager.js`: satın alınan ve seçilen skinlerin kalıcı
  kaydı, doğrulaması ve satın alma işlemleri
- `src/managers/EvolutionManager.js`: aynı run içindeki tek yönlü evrim akışı
- `src/systems/EvolutionEffectsSystem.js`: pooled trail/particle, flash,
  duyuru ve ses event'i
- `src/systems/PickupSystem.js`: güvenli/riskli coin patternleri, düşük
  sıklıktaki power-up üretimi ve pooled pickup yaşam döngüsü
- `src/managers/PowerUpManager.js`: Shield, Slow Motion, Coin Magnet ve
  Double Score süreleri ile etkileri
- `src/managers/SaveManager.js`: `localStorage` erişiminin tek sahibi olan,
  bozuk JSON'dan güvenle dönen ve eski ayrı kayıtları taşıyan merkezi kayıt
  katmanı
- `src/managers/PlayerProfileManager.js`: oyun, ölüm, flap, coin, engel,
  evolution ve oynama süresi sayaçlarını toplu kaydeden oyuncu profili
- `src/managers/MissionManager.js`: günlük görev atama, ilerleme ve elle ödül
  alma akışını oyun sahnelerinden bağımsız yöneten katman
- `src/services/missions/LocalDailyMissionProvider.js`: cihazın yerel tarihine
  göre her gün üç görev seçen değiştirilebilir görev sağlayıcısı
- `src/managers/WalletManager.js`: run coinlerini ölüm/çıkış anında merkezi
  save bakiyesine aktaran ekonomi
- `src/managers/DifficultyManager.js`: skor, süre ve zone'a göre yumuşak
  zorluk artışı; sınırlı dünya hızı ve gap ölçekleme
- `src/game/obstacles/ObstacleSpawner.js`: kontrollü rastgelelik, mesafe ve
  kombinasyon güvenliği sağlayan merkezi üretim sistemi
- `src/game/obstacles/`: pooled normal, hareketli, daralan, çift, rüzgâr,
  pervane ve uyarılı lazer engelleri
- `src/systems/FlapInputSystem.js`: tap, mouse ve Space için tek input akışı
- `src/systems/WorldZoneSystem.js`: üç katmanlı parallax, crossfade, yağmur,
  dekoratif şimşek ve performans dostu dünya yaşam döngüsü
- `src/systems/MenuBackgroundSystem.js`: hareketli bulutlar ve dekoratif uçan
  kuş kullanan hafif menü arka planı
- `src/managers/ScoreManager.js`: skor ve merkezi save içindeki rekor
- `src/ui/GameOverPanel.js`: tekrar ve ana menü akışı
- `src/ui/MenuPagePanel.js`: yeniden kullanılan KUŞLAR, MAĞAZA, GÖREVLER,
  BAŞARIMLAR, İSTATİSTİK ve AYARLAR paneli
- `src/ui/ZoneAnnouncement.js`: bir saniyelik bölge duyuruları

## Ana menü

- Üst alanda hafif animasyonlu oyun başlığı, kalıcı coin bakiyesi ve rekor
  birlikte gösterilir.
- Büyük `OYNA` butonunun altında altı hedefe ulaşan sade 3×2 navigasyon
  bulunur.
- Altı sayfanın Phaser nesneleri `MenuScene` açılırken bir kez hazırlanır.
  Sayfalar arasında geçişte aynı panelin görünürlüğü ve metinleri güncellenir;
  tekrar açmalarda yeni panel veya input dinleyicisi birikmez.
- Kuşlar ve istatistik ekranları gerçek rekor/evolution/zone ilerlemesini,
  mağaza ve diğer ilerleme ekranları kalıcı coin bakiyesini kullanır.
- `KUŞLAR` ekranında altı skinin preview, isim, rarity ve sahiplik durumu
  görünür; sahip olunan bir skin tek dokunuşla seçilir ve seçili kart belirgin
  bir rarity çerçevesi taşır.
- `MAĞAZA` ekranı kalıcı coin bakiyesinden harcar. Ücretli bir skin için önce
  ayrı bir onay penceresi açılır; bakiye yetersizse hiçbir kayıt değişmeden
  kısa uyarı gösterilir.
- Köylü varsayılan olarak açıktır. Muhtar `500`, Almancı `1000`, Mafya
  Güvercini `1750`, Uzay Köylüsü `2500`, Altın Muhtar `5000` coin'dir.
- Common, Rare, Epic ve Legendary yalnızca görünüm/parıltı dilidir; skinler
  fizik, hitbox, skor veya power-up gücü sağlamaz.
- Hover büyümesi yalnızca ince işaretçili masaüstü cihazlarda çalışır.
  Dokunma alanları mobil için büyüktür; pressed state bütün cihazlarda
  görünür.
- İşletim sisteminde azaltılmış hareket tercihi açıksa sonsuz arka plan ve
  başlık animasyonları azaltılır.
- Ayarlar ekranında müzik, ses efektleri, titreşim ve azaltılmış hareket
  tercihleri ayrı ayrı kaydedilir.
- `İLERLEMEYİ SIFIRLA` önce ikinci bir onay ekranı açar; onaylanırsa rekor,
  coin, skin, görev/başarım ve profil istatistikleri varsayılana döner.

## Günlük görevler

- Cihazın yerel tarihine göre her gün görev havuzundan üç benzersiz görev
  seçilir. Aynı tarih içinde seçim ve ilerleme kalıcıdır.
- Havuz; tek run skorunu, günlük coin toplamını, oyun sayısını, CYBER KUŞ'a
  ulaşmayı, Shield kullanmayı, engel geçmeyi ve tek run coin toplamını kapsar.
- Her kayıtta `progress`, `target`, `reward`, `completed` ve `claimed` durumu
  bulunur.
- Tamamlanan görev ödülü otomatik eklenmez. `GÖREVLER` ekranındaki `AL`
  butonu, görevi claimed yapıp ödül coinini aynı save güncellemesinde ekler.
- Bu sürüm cihazın yerel tarihi ve `localStorage` verisiyle çalışan yerel bir
  ekonomidir; çevrim içi doğrulama veya hile koruması iddiası taşımaz.
- `MissionManager`, yalnızca görev sağlayıcısının
  `getCurrentMissionSet()` sözleşmesini kullanır. İleride yerel sağlayıcı
  server-side günlük görev sağlayıcısıyla değiştirilirken oyun ve menü
  event bağlantılarının yeniden yazılması gerekmez.

## Save ve oyuncu profili

- Bütün kalıcı veri tek `sgk.save` JSON belgesinde tutulur; başka hiçbir oyun
  dosyası doğrudan tarayıcı depolamasına erişmez.
- Save; `schemaVersion`, rekor, coin, seçili/açık skinler, oyun/ölüm/flap
  sayaçları, toplanan coin, geçilen engel, en yüksek evolution, oynama süresi,
  görevler, başarımlar ve ayarları içerir.
- Eski `sgk.*.v1` kayıtları ilk açılışta coin, rekor, skin ve ayarlar
  kaybolmadan yeni şemaya taşınır.
- Bozuk JSON, eksik property, geçersiz skin, `NaN`, `Infinity`, `undefined`
  ve yanlış veri tipleri save'i veya oyunun açılışını bozamaz.
- Migration zinciri yeni schema sürümleri eklenebilecek biçimde ayrıdır.

## Dünyalar

- Skor `0–14`: KÖY
- Skor `15–29`: AKŞAM
- Skor `30–49`: GECE ŞEHRİ
- Skor `50–74`: FIRTINA
- Skor `75+`: UZAY / DELİLİK

Her dünyada uzak, orta ve yakın olmak üzere üç ayrı parallax katmanı bulunur.
Dünya değişiminde scene yeniden başlamaz; arka planlar 2,6 saniyede crossfade
olur ve bir saniyelik duyuru gösterilir. Fırtınadaki yağmur ile şimşek yalnızca
görseldir ve oyuncuya hasar vermez. Uzay bölgesinde yeni üretilen kapılar neon
renk paletine geçer.

## Evolution

- Skor `0–14`: KÖYLÜ KUŞ
- Skor `15–34`: TURBO KUŞ
- Skor `35–59`: CYBER KUŞ
- Skor `60–99`: DELİ KUŞ
- Skor `100+`: KÖYÜN EFENDİSİ

Her aşamada kuşun rengi, kanadı, gözü, trail'i ve particle görünümü değişir.
Evrim sırasında oyun durmaz; kısa flash, pooled particle burst,
`EVRİMLEŞTİN LAN!` duyurusu ve `sgk:sound:evolution` event'i çalışır.
Turbo flap kuvvetini yalnızca `%2,5` civarında keskinleştirir, Cyber hitbox'ı
çok az küçültür, Deli Kuş ise ilerideki coin sistemi için magnet mesafesini
artırır. Bütün avantajlar `evolutionConfig.js` içinde sınırlıdır.

## Coin ve power-up

- Standart coin `1`, geçiş kenarındaki risk coinleri `3` coin verir.
- Coin toplamak zorunlu değildir; coin patternleri güvenli rotayı gösterirken
  ekstra ödül geçilebilir ama daha dar konuma yerleşir.
- Coinler dönme, parıltı ve toplandığında pop animasyonu kullanır.
- Run içinde toplanan coinler ölümde veya ana menüye çıkışta yalnızca bir kez
  kalıcı bakiyeye eklenir.
- `Shield`, bir engel çarpışmasını engeller ve kuşun çevresinde görünür.
- `Slow Motion`, kuş fiziği ve flap kontrolünü değiştirmeden dünyayı kısa
  süreliğine yavaşlatır.
- `Coin Magnet`, yakındaki coinleri çeker ve Evolution magnet avantajıyla
  birlikte çalışır.
- `Double Score`, aktifken geçilen engelleri `+2` skor olarak sayar.
- Power-up üretimi skor, süre, obstacle aralığı, cooldown ve pity sınırıyla
  kontrol edilir; arka arkaya aynı ikon üretilmez.
- Sağ üstteki kompakt HUD, run coinini ve aktif power-up sürelerini gösterir.

## Zorluk ve engeller

- Skor `0–9`: yalnızca Normal Gate
- Skor `10–19`: Moving Gate eklenir
- Skor `20–34`: Closing Gate eklenir
- Skor `35–49`: Wind Zone ve Fan açılır
- Skor `50+`: Double Gate ve warning veren Laser Gate açılır

Dünya hızı skor ve süreyle yumuşak biçimde artar, fakat
`maxObstacleSpeed` değerini aşmaz. Spawn seçimleri seed'li ağırlıklı seçim,
engel cooldown'ları, yasaklı geçişler, maksimum tekrar ve güvenli gap kayması
kurallarıyla sınırlandırılır.

## Proje kontrolleri

```bash
npm run lint
npm test
npm run build
```

Production çıktısı `dist/` klasöründe oluşur. Build, Cloudflare Pages için
statik oyunu ve Sites için gerekli küçük Worker girişini birlikte üretir.

## Klasör yapısı

```text
src/
├── config/       Merkezi oyun sabitleri ve Phaser yapılandırması
├── game/         Karakter, grafik ve pooled engel modülleri
├── managers/     Save, profil, ekonomi, ayar ve oynanış yöneticileri
├── scenes/       Boot, Preload, Menu ve Game sahneleri
├── systems/      Tarayıcı ve cihaz seviyesindeki sistemler
├── ui/           Tekrar kullanılabilir oyun arayüzü bileşenleri
├── utils/        Input ve sahne geçişi yardımcıları
├── main.js       Uygulama giriş noktası
└── styles.css    Canvas, safe-area ve orientation stilleri

public/assets/
├── audio/
├── backgrounds/
├── sprites/
└── ui/
```

## Cloudflare Pages

- Build command: `npm run build`
- Build output directory: `dist`
- Root directory: proje kökü

Kodda React, Vue veya başka bir UI frameworkü kullanılmaz. Şimdilik bütün
görseller Phaser Graphics ile prosedürel olarak oluşturulur.
