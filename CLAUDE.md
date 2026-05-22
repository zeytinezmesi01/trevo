@AGENTS.md

## Commit edilmemesi gereken dosyalar

Aşağıdaki dosyalar git commit'lerine DAHİL EDİLMEMELİDİR. `git add` yaparken
dosyaları açıkça isimle ekle (`git add app lib components proxy.ts supabase`),
`git add -A` / `git add .` kullanma — aksi halde bunlar kazara commit'lenir.

- **`.claude/settings.local.json`** — Claude Code'un yerel/kullanıcıya özel
  ayarları (izinler, makineye özgü yapılandırma). Her geliştiricide farklıdır;
  repoya girerse başkalarının ortamını bozar ve gereksiz çakışma üretir.

- **`fix_prompt.md`** — geliştirme sırasında üretilen prompt taslakları / çalışma
  notları. Uygulama kodu değildir; repoyu kirletmemesi için commit edilmez.

- **`yapilacaklar.md`** — konuşulup ertelenen işlerin listesi (çalışma notu).
  Uygulama kodu değildir; commit edilmez.

Not: Bu dosyaların `.gitignore`'a eklenmesi daha kalıcı bir çözümdür.

## Yapılacaklar listesi

Geliştirme sırasında konuşulup "sonra yapılacak" diye ertelenen her iş
`yapilacaklar.md` dosyasına eklenir. Yeni bir özellik veya düzeltme planlanıp
hemen uygulanmadığında, kararın gerekçesiyle birlikte oraya not düşülür.
