import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-col min-h-screen">

      {/* NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-10">
            <span className="text-xl font-bold text-gray-900 tracking-tight">trevo</span>
            <div className="hidden md:flex items-center gap-6 text-sm text-gray-600">
              <Link href="#ozellikler" className="hover:text-gray-900 transition-colors">Özellikler</Link>
              <Link href="#fiyatlar" className="hover:text-gray-900 transition-colors">Fiyatlar</Link>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/giris" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              Giriş yap
            </Link>
            <Link
              href="/kayit"
              className="text-sm bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Ücretsiz başla
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="pt-40 pb-24 px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-gray-100 text-gray-600 text-sm px-4 py-1.5 rounded-full mb-8">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            1.400+ işletme kullanıyor
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight mb-6">
            Müşterilerine profesyonel<br />
            <span className="text-indigo-600">deneyim sun</span>
          </h1>
          <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
            Dosya paylaş, hizmet sat, ekibini yönet. Hepsi senin markan altında.
            WhatsApp kaosuna son ver.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/kayit"
              className="bg-gray-900 text-white px-8 py-3.5 rounded-xl font-medium hover:bg-gray-700 transition-colors text-base"
            >
              7 gün ücretsiz dene
            </Link>
            <Link
              href="#ozellikler"
              className="text-gray-600 px-8 py-3.5 rounded-xl font-medium hover:bg-gray-100 transition-colors text-base border border-gray-200"
            >
              Nasıl çalışır?
            </Link>
          </div>
          <p className="text-sm text-gray-400 mt-4">Kredi kartı gerekmez</p>
        </div>
      </section>

      {/* DEMO MOCKUP */}
      <section className="pb-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="bg-gray-900 rounded-2xl overflow-hidden shadow-2xl">
            <div className="bg-gray-800 px-4 py-3 flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <div className="flex-1 bg-gray-700 rounded-md h-6 mx-4 flex items-center px-3">
                <span className="text-gray-400 text-xs">portal.senin-markan.com</span>
              </div>
            </div>
            <div className="p-8 grid grid-cols-3 gap-4">
              <div className="bg-gray-800 rounded-xl p-4 col-span-1">
                <div className="text-gray-400 text-xs mb-3">Projeler</div>
                {["Marka Tasarımı", "Web Sitesi", "Sosyal Medya"].map((item) => (
                  <div key={item} className="bg-gray-700 rounded-lg p-3 mb-2">
                    <div className="text-white text-xs font-medium">{item}</div>
                    <div className="text-gray-400 text-xs mt-1">Aktif</div>
                  </div>
                ))}
              </div>
              <div className="col-span-2 bg-gray-800 rounded-xl p-4">
                <div className="text-gray-400 text-xs mb-3">Dosyalar</div>
                {[
                  { name: "logo-final.ai", size: "2.4 MB", color: "bg-orange-500" },
                  { name: "katalog-v3.pdf", size: "8.1 MB", color: "bg-red-500" },
                  { name: "sosyal-paket.zip", size: "15 MB", color: "bg-purple-500" },
                ].map((file) => (
                  <div key={file.name} className="flex items-center gap-3 bg-gray-700 rounded-lg p-3 mb-2">
                    <div className={`w-8 h-8 ${file.color} rounded-lg flex items-center justify-center text-white text-xs font-bold`}>
                      {file.name.split(".")[1].toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="text-white text-xs font-medium">{file.name}</div>
                      <div className="text-gray-400 text-xs">{file.size}</div>
                    </div>
                    <button className="text-indigo-400 text-xs hover:text-indigo-300">İndir</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ÖZELLİKLER */}
      <section id="ozellikler" className="py-24 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">İşini büyütmek için her şey</h2>
            <p className="text-gray-500 text-lg">Üç güçlü araç, tek platform</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: "📁",
                title: "Dosya Paylaşımı",
                desc: "Müşterilerine profesyonel bir portal üzerinden dosya ilet. Kendi domain'in, kendi markan.",
                features: ["Sınırsız depolama", "Link ile paylaşım", "İndirme takibi"],
                color: "bg-blue-50 border-blue-100",
              },
              {
                icon: "💼",
                title: "Hizmet Satışı",
                desc: "Hizmetlerini paketleyip sat. Teklif gönder, fatura kes, ödeme al — hepsi otomatik.",
                features: ["Teklif şablonları", "Online ödeme", "Proje takibi"],
                color: "bg-indigo-50 border-indigo-100",
              },
              {
                icon: "👥",
                title: "Ekip Yönetimi",
                desc: "Freelancer ve çalışanlarını tek yerden yönet. Görev ata, ilerlemeyi takip et.",
                features: ["Görev yönetimi", "Zaman takibi", "Performans raporu"],
                color: "bg-purple-50 border-purple-100",
              },
            ].map((feature) => (
              <div key={feature.title} className={`${feature.color} border rounded-2xl p-8`}>
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-500 text-sm mb-6 leading-relaxed">{feature.desc}</p>
                <ul className="space-y-2">
                  {feature.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                      <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FİYATLAR */}
      <section id="fiyatlar" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Basit, şeffaf fiyatlandırma</h2>
            <p className="text-gray-500 text-lg">İlk 7 gün tamamen ücretsiz, kart gerekmez</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: "Başlangıç",
                price: "Ücretsiz",
                period: "",
                desc: "Denemek için",
                features: ["3 proje", "1 GB depolama", "Temel özellikler", "E-posta desteği"],
                cta: "Hemen başla",
                highlight: false,
              },
              {
                name: "Pro",
                price: "₺499",
                period: "/ay",
                desc: "Büyüyen ajanslar için",
                features: ["Sınırsız proje", "50 GB depolama", "Tüm özellikler", "Öncelikli destek", "Özel domain"],
                cta: "7 gün dene",
                highlight: true,
              },
              {
                name: "Stüdyo",
                price: "₺1.499",
                period: "/ay",
                desc: "Büyük ekipler için",
                features: ["Sınırsız proje", "500 GB depolama", "Tüm özellikler", "Özel hesap yöneticisi", "API erişimi", "White-label"],
                cta: "Görüşelim",
                highlight: false,
              },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl p-8 border ${
                  plan.highlight
                    ? "bg-gray-900 border-gray-900 text-white scale-105 shadow-xl"
                    : "bg-white border-gray-200"
                }`}
              >
                {plan.highlight && (
                  <div className="text-xs font-semibold text-indigo-400 mb-2 uppercase tracking-wider">En popüler</div>
                )}
                <div className={`text-sm mb-1 ${plan.highlight ? "text-gray-400" : "text-gray-500"}`}>{plan.name}</div>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className={`text-4xl font-bold ${plan.highlight ? "text-white" : "text-gray-900"}`}>{plan.price}</span>
                  <span className={`text-sm ${plan.highlight ? "text-gray-400" : "text-gray-500"}`}>{plan.period}</span>
                </div>
                <div className={`text-sm mb-6 ${plan.highlight ? "text-gray-400" : "text-gray-500"}`}>{plan.desc}</div>
                <Link
                  href="/kayit"
                  className={`block text-center py-3 rounded-xl font-medium text-sm mb-6 transition-colors ${
                    plan.highlight
                      ? "bg-white text-gray-900 hover:bg-gray-100"
                      : "bg-gray-900 text-white hover:bg-gray-700"
                  }`}
                >
                  {plan.cta}
                </Link>
                <ul className="space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className={`flex items-center gap-2 text-sm ${plan.highlight ? "text-gray-300" : "text-gray-600"}`}>
                      <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 bg-gray-900">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Bugün başla</h2>
          <p className="text-gray-400 text-lg mb-8">
            7 günlük ücretsiz deneme. Kart gerekmez. İstediğinde iptal et.
          </p>
          <Link
            href="/kayit"
            className="inline-block bg-white text-gray-900 px-10 py-4 rounded-xl font-semibold text-base hover:bg-gray-100 transition-colors"
          >
            Ücretsiz hesap aç
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-10 px-6 border-t border-gray-100">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-lg font-bold text-gray-900">trevo</span>
          <p className="text-sm text-gray-400">© 2026 Trevo. Tüm hakları saklıdır.</p>
          <div className="flex gap-6 text-sm text-gray-400">
            <Link href="/gizlilik" className="hover:text-gray-600">Gizlilik</Link>
            <Link href="/kullanim" className="hover:text-gray-600">Kullanım Şartları</Link>
          </div>
        </div>
      </footer>

    </main>
  );
}
