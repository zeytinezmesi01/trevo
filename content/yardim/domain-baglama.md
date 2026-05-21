Kendi domain'inizi Trevo'ya bağlayarak uygulamayı kendi markanızla kullanabilirsiniz. Bu sayede müşterileriniz Trevo yerine sizin markanızı görür.

## Domain Nasıl Bağlanır?

1. **Ayarlar > Marka** sayfasına gidin
2. **"Domain"** alanına domain adresinizi yazın
   - Örnek: `fatura.sirketiniz.com`
   - Alt domain kullanmanız önerilir (`trevo.sirketiniz.com` gibi)
3. **Kaydet** butonuna tıklayın

## DNS Ayarları

Domain sağlayıcınızın panelinde bir **CNAME kaydı** oluşturun:

| Alan | Değer |
|------|-------|
| Tür | CNAME |
| Ad/Anahtar | alt domain adınız (ör: `fatura`) |
| Hedef/Değer | size e-posta ile bildirilen yönlendirme adresi |

## Sık Sorulan Sorular

**DNS değişikliği ne kadar sürede etki eder?**
Genellikle birkaç saat içinde yayılır, ancak bazı sağlayıcılarda 24 saati bulabilir.

**Ana domain kullanabilir miyim?**
Önerilmez. Alt domain kullanmanız (ör. `fatura.sirketiniz.com`) teknik olarak daha sağlıklıdır.

**SSL sertifikası gerekiyor mu?**
Trevo otomatik olarak SSL sertifikası sağlar. Ek bir işlem yapmanız gerekmez.

**Domain'i değiştirebilir miyim?**
Evet, istediğiniz zaman Ayarlar'dan domain adresinizi güncelleyebilirsiniz.
