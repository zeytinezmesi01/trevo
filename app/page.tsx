import Link from 'next/link'
import Image from 'next/image'
import ThemeToggle from '@/components/landing/theme-toggle'
import ScrollRevealInit from '@/components/landing/scroll-reveal-init'

export default function Home() {
  return (
    <div className="relative">
      <ScrollRevealInit />

      {/* ═══════════════════════════════════════
          NAVIGATION
      ═══════════════════════════════════════ */}
      <nav className="nav-blur fixed top-0 left-0 right-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="#" className="flex items-center gap-2.5">
            <Image src="/logo.svg" alt="Trevo" width={28} height={28} className="rounded-lg" />
            <span className="font-display font-bold text-lg tracking-tight text-white">trevo</span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium" style={{ color: '#8a9ab5' }}>
            <Link href="#features" className="hover:text-white transition-colors">Özellikler</Link>
            <Link href="#how" className="hover:text-white transition-colors">Nasıl Çalışır</Link>
            <Link href="#pricing" className="hover:text-white transition-colors">Fiyatlar</Link>
            <Link href="#testimonials" className="hover:text-white transition-colors">Referanslar</Link>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/giris" className="hidden md:block text-sm hover:text-white transition-colors font-medium" style={{ color: '#8a9ab5' }}>
              Giriş Yap
            </Link>
            <ThemeToggle />
            <Link href="/kayit" className="btn-primary text-white text-sm font-display font-semibold px-4 py-2 rounded-lg">
              Ücretsiz Başla
            </Link>
          </div>
        </div>
      </nav>

      {/* ═══════════════════════════════════════
          HERO
      ═══════════════════════════════════════ */}
      <section className="relative min-h-screen flex flex-col items-center justify-center pt-24 pb-16 overflow-hidden grid-lines">
        <div className="hero-glow absolute inset-0 pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 tag-badge px-3 py-1.5 rounded-full mb-8 reveal">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-light" style={{ background: '#7aa0ff', animation: 'pulse 4s ease-in-out infinite' }} />
            Türkiye&apos;nin #1 Ajans Yönetim Platformu
          </div>

          {/* Headline */}
          <h1 className="font-display font-extrabold text-5xl md:text-7xl leading-tight tracking-tight mb-6 reveal" style={{ animationDelay: '0.1s' }}>
            Müşterilerinizle<br />
            <span className="gradient-text">profesyonelce</span><br />
            çalışın.
          </h1>

          {/* Subtext */}
          <p className="text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-10 reveal" style={{ color: '#8a9ab5', animationDelay: '0.2s' }}>
            Trevo, Türk ajanslar ve freelancer&apos;lar için tasarlanmış müşteri portalı platformudur.
            Dosya paylaşımı, proje yönetimi ve faturalarınızı tek çatı altında toplayın.
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 reveal" style={{ animationDelay: '0.3s' }}>
            <Link href="/kayit" className="btn-primary font-display font-semibold text-white px-7 py-3.5 rounded-xl text-base flex items-center gap-2.5 w-full sm:w-auto justify-center">
              Ücretsiz Başla
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8H13M13 8L9 4M13 8L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            <Link href="#how" className="btn-outline font-display font-semibold text-white px-7 py-3.5 rounded-xl text-base flex items-center gap-2.5 w-full sm:w-auto justify-center">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeOpacity="0.5" strokeWidth="1.2" />
                <path d="M6.5 5.5L11 8L6.5 10.5V5.5Z" fill="currentColor" />
              </svg>
              Demo İzle
            </Link>
          </div>

          {/* Dashboard Mockup */}
          <div className="reveal relative" style={{ animationDelay: '0.4s' }}>
            {/* Floating stats left */}
            <div className="hidden md:flex absolute -left-6 top-12 z-20 flex-col gap-3">
              <div className="stat-pill px-4 py-2.5 flex items-center gap-2.5 text-sm">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(79,125,255,0.2)' }}>
                  <svg width="14" height="14" fill="none" viewBox="0 0 14 14">
                    <path d="M1 10L4 6L7 8L10 4L13 7" stroke="#7aa0ff" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>
                <div>
                  <div className="text-white font-display font-bold text-sm">₺128,400</div>
                  <div className="text-sm" style={{ color: '#8a9ab5' }}>Bu ay gelir</div>
                </div>
              </div>
              <div className="stat-pill px-4 py-2.5 flex items-center gap-2.5 text-sm">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(52,211,153,0.2)' }}>
                  <svg width="14" height="14" fill="none" viewBox="0 0 14 14">
                    <circle cx="7" cy="5" r="2.5" stroke="#34d399" strokeWidth="1.2" />
                    <path d="M2 12c0-2.8 2.2-5 5-5s5 2.2 5 5" stroke="#34d399" strokeWidth="1.2" strokeLinecap="round" />
                  </svg>
                </div>
                <div>
                  <div className="text-white font-display font-bold text-sm">24 Müşteri</div>
                  <div className="text-sm" style={{ color: '#8a9ab5' }}>Aktif portal</div>
                </div>
              </div>
            </div>

            {/* Floating stats right */}
            <div className="hidden md:block absolute -right-6 top-12 z-20">
              <div className="stat-pill px-4 py-2.5 flex items-center gap-2.5 text-sm">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(167,139,250,0.2)' }}>
                  <svg width="14" height="14" fill="none" viewBox="0 0 14 14">
                    <rect x="2" y="2" width="4" height="4" rx="1" stroke="#a78bfa" strokeWidth="1.2" />
                    <rect x="8" y="2" width="4" height="4" rx="1" stroke="#a78bfa" strokeWidth="1.2" />
                    <rect x="2" y="8" width="4" height="4" rx="1" stroke="#a78bfa" strokeWidth="1.2" />
                    <rect x="8" y="8" width="4" height="4" rx="1" stroke="#a78bfa" strokeWidth="1.2" />
                  </svg>
                </div>
                <div>
                  <div className="text-white font-display font-bold text-sm">12 Proje</div>
                  <div className="text-sm" style={{ color: '#8a9ab5' }}>Devam ediyor</div>
                </div>
              </div>
            </div>

            {/* Main mockup */}
            <div className="mockup-container max-w-4xl mx-auto">
              <div className="mockup-bar px-4 py-3 flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="mockup-dot w-3 h-3" style={{ background: '#ff5f57' }} />
                  <div className="mockup-dot w-3 h-3" style={{ background: '#febc2e' }} />
                  <div className="mockup-dot w-3 h-3" style={{ background: '#28c840' }} />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="rounded-md px-4 py-1 text-xs font-mono" style={{ background: 'rgba(14,20,32,0.6)', border: '1px solid #1a2236', color: '#8a9ab5' }}>
                    app.trevo.com.tr/portal/brandlab
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-12 h-72 md:h-80">
                {/* Sidebar */}
                <div className="col-span-3 border-r p-4 flex-col gap-2 hidden md:flex" style={{ background: '#09101e', borderColor: '#1a2236' }}>
                  <div className="text-xs uppercase tracking-widest mb-2 font-semibold" style={{ color: '#8a9ab5' }}>Menü</div>
                  <div className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ background: 'rgba(79,125,255,0.1)' }}>
                    <div className="w-4 h-4 rounded" style={{ background: 'rgba(79,125,255,0.4)' }} />
                    <span className="text-xs text-white font-medium">Dashboard</span>
                  </div>
                  {['Projeler', 'Dosyalar', 'Faturalar', 'Mesajlar'].map((item) => (
                    <div key={item} className="flex items-center gap-2 rounded-lg px-3 py-2">
                      <div className="w-4 h-4 rounded" style={{ background: '#1a2236' }} />
                      <span className="text-xs" style={{ color: '#8a9ab5' }}>{item}</span>
                    </div>
                  ))}
                  <div className="mt-auto border-t pt-3 flex items-center gap-2" style={{ borderColor: '#1a2236' }}>
                    <div className="w-6 h-6 rounded-full" style={{ background: 'linear-gradient(135deg, #4f7dff, #7c3aed)' }} />
                    <span className="text-xs" style={{ color: '#8a9ab5' }}>BrandLab</span>
                  </div>
                </div>

                {/* Main content */}
                <div className="col-span-12 md:col-span-9 p-5 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-white font-display font-bold text-base">Hoş geldiniz, BrandLab 👋</div>
                      <div className="text-xs mt-0.5" style={{ color: '#8a9ab5' }}>Bugün 3 görev bekliyor</div>
                    </div>
                    <div className="flex gap-2">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ border: '1px solid #1a2236' }}>
                        <div className="w-1 h-1 rounded-full" style={{ background: '#4f7dff' }} />
                      </div>
                      <div className="w-7 h-7 rounded-full" style={{ background: 'linear-gradient(135deg, #4f7dff, #7c3aed)' }} />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Aktif Proje', value: '8', sub: '↑ 2 yeni', subColor: '#34d399' },
                      { label: 'Bekleyen Onay', value: '3', sub: 'İncelenmeli', subColor: '#fbbf24' },
                      { label: 'Toplam Gelir', value: '₺84K', sub: '↑ %23', subColor: '#34d399' },
                    ].map((stat) => (
                      <div key={stat.label} className="rounded-xl p-3" style={{ background: 'rgba(14,20,32,0.6)', border: '1px solid #1a2236' }}>
                        <div className="text-xs mb-1" style={{ color: '#8a9ab5' }}>{stat.label}</div>
                        <div className="text-white font-display font-bold text-xl">{stat.value}</div>
                        <div className="text-xs mt-1" style={{ color: stat.subColor }}>{stat.sub}</div>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="text-xs uppercase tracking-widest font-semibold" style={{ color: '#8a9ab5' }}>Son Dosyalar</div>
                    {[
                      { icon: '📄', name: 'Marka_Rehberi_v3.pdf', time: '2 sa önce' },
                      { icon: '🖼️', name: 'Logo_Revizyonlar.zip', time: 'Dün' },
                    ].map((file) => (
                      <div key={file.name} className="flex items-center justify-between rounded-lg px-3 py-2" style={{ background: 'rgba(14,20,32,0.5)', border: '1px solid #1a2236' }}>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded flex items-center justify-center text-xs" style={{ background: 'rgba(79,125,255,0.2)' }}>{file.icon}</div>
                          <span className="text-xs text-white">{file.name}</span>
                        </div>
                        <span className="text-xs" style={{ color: '#8a9ab5' }}>{file.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Glow */}
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-2/3 h-16 pointer-events-none" style={{ background: 'radial-gradient(ellipse, rgba(79,125,255,0.2) 0%, transparent 70%)' }} />
          </div>

          {/* Social proof */}
          <div className="mt-14 flex flex-col sm:flex-row items-center justify-center gap-6 text-sm reveal" style={{ animationDelay: '0.5s' }}>
            <div className="flex -space-x-2">
              {[
                'linear-gradient(135deg, #60a5fa, #4f46e5)',
                'linear-gradient(135deg, #a78bfa, #7c3aed)',
                'linear-gradient(135deg, #34d399, #0d9488)',
                'linear-gradient(135deg, #fbbf24, #f97316)',
              ].map((bg, i) => (
                <div key={i} className="w-8 h-8 rounded-full border-2" style={{ borderColor: '#080b11', background: bg }} />
              ))}
            </div>
            <span style={{ color: '#8a9ab5' }}>
              <span className="text-white font-semibold">400+ ajans</span> zaten Trevo kullanıyor
            </span>
            <span className="hidden sm:block" style={{ color: '#1a2236' }}>|</span>
            <div className="flex items-center gap-1">
              <span style={{ color: '#fbbf24' }}>★★★★★</span>
              <span className="ml-1" style={{ color: '#8a9ab5' }}>4.9/5 puan</span>
            </div>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-6xl mx-auto px-6"><div className="accent-line opacity-30" /></div>

      {/* ═══════════════════════════════════════
          FEATURES
      ═══════════════════════════════════════ */}
      <section id="features" className="py-28 relative">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16 reveal">
            <div className="inline-flex items-center gap-2 tag-badge px-3 py-1.5 rounded-full mb-5">Özellikler</div>
            <h2 className="font-display font-extrabold text-4xl md:text-5xl tracking-tight mb-4">
              Ajansınıza özel <span className="gradient-text">her şey</span>
            </h2>
            <p className="text-lg max-w-xl mx-auto" style={{ color: '#8a9ab5' }}>
              Müşteri ilişkilerini yönetmek için ihtiyacınız olan tüm araçlar, tek bir platformda.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                icon: (
                  <svg width="20" height="20" fill="none" viewBox="0 0 20 20">
                    <path d="M4 14L4 8C4 6.9 4.9 6 6 6L14 6" stroke="#7aa0ff" strokeWidth="1.5" strokeLinecap="round" />
                    <rect x="7" y="4" width="9" height="12" rx="2" stroke="#7aa0ff" strokeWidth="1.5" />
                    <path d="M10 10h3M10 13h2" stroke="#7aa0ff" strokeWidth="1.2" strokeLinecap="round" />
                  </svg>
                ),
                title: 'Dosya Paylaşımı',
                desc: 'Müşterilerinizle güvenli ve organize dosya paylaşımı. Versiyon takibi, yorum bırakma ve onay akışlarıyla çalışın.',
                tags: ['100GB depolama', 'Versiyon kontrolü'],
              },
              {
                icon: (
                  <svg width="20" height="20" fill="none" viewBox="0 0 20 20">
                    <circle cx="10" cy="10" r="7" stroke="#7aa0ff" strokeWidth="1.5" />
                    <path d="M10 7v3l2 2" stroke="#7aa0ff" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                ),
                title: 'Müşteri Portalı',
                desc: 'Her müşteriniz için özel, markalı portal. Proje durumu, faturalar ve iletişim geçmişi tek ekranda.',
                tags: ['Özel domain', 'Marka özelleştirme'],
              },
              {
                icon: (
                  <svg width="20" height="20" fill="none" viewBox="0 0 20 20">
                    <circle cx="7" cy="6" r="2.5" stroke="#7aa0ff" strokeWidth="1.4" />
                    <circle cx="13" cy="6" r="2.5" stroke="#7aa0ff" strokeWidth="1.4" />
                    <path d="M3 16c0-2.2 1.8-4 4-4h6c2.2 0 4 1.8 4 4" stroke="#7aa0ff" strokeWidth="1.4" strokeLinecap="round" />
                  </svg>
                ),
                title: 'Ekip Yönetimi',
                desc: 'Ekip üyelerinizi davet edin, rol ve yetkiler atayın. Kimin neye erişebileceğini tam olarak kontrol edin.',
                tags: ['Rol bazlı erişim', 'Aktivite log'],
              },
              {
                icon: (
                  <svg width="20" height="20" fill="none" viewBox="0 0 20 20">
                    <rect x="3" y="3" width="6" height="6" rx="1.5" stroke="#7aa0ff" strokeWidth="1.4" />
                    <rect x="11" y="3" width="6" height="6" rx="1.5" stroke="#7aa0ff" strokeWidth="1.4" />
                    <rect x="3" y="11" width="6" height="6" rx="1.5" stroke="#7aa0ff" strokeWidth="1.4" />
                    <rect x="11" y="11" width="6" height="6" rx="1.5" stroke="#7aa0ff" strokeWidth="1.4" />
                  </svg>
                ),
                title: 'Hizmet Yönetimi',
                desc: 'Sunduğunuz hizmetleri tanımlayın, paketler oluşturun ve müşterilerinize kolay seçim imkânı sunun.',
                tags: ['Hizmet kataloğu', 'Paket oluşturma'],
              },
              {
                icon: (
                  <svg width="20" height="20" fill="none" viewBox="0 0 20 20">
                    <path d="M3 14L8 9L11 12L16 6" stroke="#7aa0ff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M3 17H17" stroke="#7aa0ff" strokeWidth="1.2" strokeLinecap="round" />
                  </svg>
                ),
                title: 'Fatura & Ödeme',
                desc: 'Profesyonel faturalar oluşturun, ödeme hatırlatmaları gönderin. Gelir takibinizi otomatikleştirin.',
                tags: ['KDV hesaplama', 'Otomatik hatırlatıcı'],
              },
              {
                icon: (
                  <svg width="20" height="20" fill="none" viewBox="0 0 20 20">
                    <path d="M4 6h12M4 10h8M4 14h5" stroke="#7aa0ff" strokeWidth="1.5" strokeLinecap="round" />
                    <circle cx="16" cy="14" r="3" stroke="#7aa0ff" strokeWidth="1.4" />
                    <path d="M15 14l.8.8 1.7-1.6" stroke="#7aa0ff" strokeWidth="1.2" strokeLinecap="round" />
                  </svg>
                ),
                title: 'Onay Akışları',
                desc: 'Tasarım veya içerik onaylarını takip edin. Müşteriler doğrudan platformdan geri bildirim verebilir.',
                tags: ['E-imza', 'Yorum geçmişi'],
              },
            ].map((feature, i) => (
              <div key={feature.title} className="card-glass rounded-2xl p-6 reveal" style={{ transitionDelay: `${i * 0.05}s` }}>
                <div className="feature-icon-wrap w-11 h-11 rounded-xl flex items-center justify-center mb-5">
                  {feature.icon}
                </div>
                <h3 className="font-display font-bold text-white text-lg mb-2">{feature.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#8a9ab5' }}>{feature.desc}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {feature.tags.map((tag) => (
                    <span key={tag} className="text-xs px-2.5 py-1 rounded-md" style={{ background: 'rgba(26,34,54,0.6)', color: '#8a9ab5' }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          HOW IT WORKS
      ═══════════════════════════════════════ */}
      <section id="how" className="py-28 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 600px 400px at 80% 50%, rgba(79,125,255,0.07) 0%, transparent 70%)' }} />
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16 reveal">
            <div className="inline-flex items-center gap-2 tag-badge px-3 py-1.5 rounded-full mb-5">Nasıl Çalışır</div>
            <h2 className="font-display font-extrabold text-4xl md:text-5xl tracking-tight mb-4">
              3 adımda <span className="gradient-text">hazır</span>
            </h2>
            <p className="text-lg max-w-xl mx-auto" style={{ color: '#8a9ab5' }}>
              Kurulum süreci 10 dakikadan az sürer. Hemen başlayın, aynı gün müşterilerinizi davet edin.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative z-10">
            {[
              {
                num: '01',
                title: 'Hesabınızı açın',
                desc: 'E-posta adresinizle saniyeler içinde hesap oluşturun. Kredi kartı gerekmez, hemen başlayın.',
                preview: (
                  <div className="card-glass rounded-xl p-4 w-full mt-5">
                    <div className="flex flex-col gap-2">
                      <div className="h-8 rounded-lg flex items-center px-3" style={{ background: 'rgba(14,20,32,0.8)', border: '1px solid #1a2236' }}>
                        <span className="text-xs" style={{ color: '#8a9ab5' }}>ad.soyad@sirket.com</span>
                      </div>
                      <div className="h-8 rounded-lg flex items-center px-3" style={{ background: 'rgba(14,20,32,0.8)', border: '1px solid #1a2236' }}>
                        <span className="text-xs" style={{ color: '#8a9ab5' }}>•••••••••</span>
                      </div>
                      <div className="h-8 rounded-lg btn-primary flex items-center justify-center">
                        <span className="text-white text-xs font-semibold">Ücretsiz Başla →</span>
                      </div>
                    </div>
                  </div>
                ),
              },
              {
                num: '02',
                title: 'Müşteri portalı kurun',
                desc: 'Logonuzu ve renklerinizi girin. Özel alan adınızı bağlayın. Her müşteriye özel bir alan oluşturun.',
                preview: (
                  <div className="card-glass rounded-xl p-4 w-full mt-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-full" style={{ background: 'linear-gradient(135deg, #4f7dff, #7c3aed)' }} />
                      <div>
                        <div className="text-white text-xs font-semibold">BrandLab Ajans</div>
                        <div className="text-xs" style={{ color: '#8a9ab5' }}>portal.brandlab.com.tr</div>
                      </div>
                    </div>
                    <div className="flex gap-2 items-center">
                      <div className="flex-1 h-2 rounded-full" style={{ background: 'linear-gradient(90deg, #4f7dff, #7aa0ff)' }} />
                      <div className="text-xs" style={{ color: '#8a9ab5' }}>Hazır</div>
                    </div>
                  </div>
                ),
              },
              {
                num: '03',
                title: 'Müşterilerinizi davet edin',
                desc: 'E-posta ile davetiye gönderin. Müşterileriniz kendi portallarına erişip dosya ve proje takibi yapabilir.',
                preview: (
                  <div className="card-glass rounded-xl p-4 w-full mt-5">
                    {[
                      { done: true, text: 'Davetiye gönderildi' },
                      { done: true, text: 'Müşteri portala katıldı' },
                      { done: false, text: 'İlk proje oluşturuldu' },
                    ].map((step, i) => (
                      <div key={i} className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: step.done ? 'rgba(52,211,153,0.2)' : 'rgba(79,125,255,0.2)' }}>
                          {step.done ? (
                            <svg width="12" height="12" fill="none" viewBox="0 0 12 12">
                              <path d="M2 6l2.5 2.5L10 3.5" stroke="#34d399" strokeWidth="1.5" strokeLinecap="round" />
                            </svg>
                          ) : (
                            <div className="w-2 h-2 rounded-full" style={{ background: '#4f7dff', animation: 'pulse 2s infinite' }} />
                          )}
                        </div>
                        <span className={`text-xs ${step.done ? '' : 'text-white'}`} style={step.done ? { color: '#8a9ab5' } : {}}>{step.text}</span>
                      </div>
                    ))}
                  </div>
                ),
              },
            ].map((step, i) => (
              <div key={step.num} className="reveal flex flex-col items-center text-center md:text-left md:items-start" style={{ transitionDelay: `${i * 0.1}s` }}>
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ border: '1px solid rgba(79,125,255,0.4)', background: 'rgba(79,125,255,0.1)' }}>
                    <span className="font-display font-extrabold text-lg" style={{ color: '#4f7dff' }}>{step.num}</span>
                  </div>
                  {i < 2 && (
                    <div className="hidden md:block flex-1 h-px" style={{ background: 'linear-gradient(90deg, rgba(79,125,255,0.4), rgba(79,125,255,0.05))' }} />
                  )}
                </div>
                <h3 className="font-display font-bold text-white text-xl mb-3">{step.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#8a9ab5' }}>{step.desc}</p>
                {step.preview}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          PRICING
      ═══════════════════════════════════════ */}
      <section id="pricing" className="py-28 relative">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 700px 500px at 50% 100%, rgba(79,125,255,0.06) 0%, transparent 70%)' }} />
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16 reveal">
            <div className="inline-flex items-center gap-2 tag-badge px-3 py-1.5 rounded-full mb-5">Fiyatlandırma</div>
            <h2 className="font-display font-extrabold text-4xl md:text-5xl tracking-tight mb-4">
              Şeffaf <span className="gradient-text">fiyatlandırma</span>
            </h2>
            <p className="text-lg" style={{ color: '#8a9ab5' }}>Gizli ücret yok. İstediğiniz zaman iptal edebilirsiniz.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Free */}
            <div className="card-glass rounded-2xl p-7 reveal flex flex-col">
              <div className="mb-6">
                <div className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: '#8a9ab5' }}>Ücretsiz</div>
                <div className="flex items-end gap-1 mb-1">
                  <span className="font-display font-extrabold text-4xl text-white">₺0</span>
                  <span className="text-sm mb-1.5" style={{ color: '#8a9ab5' }}>/ay</span>
                </div>
                <p className="text-sm" style={{ color: '#8a9ab5' }}>Başlamak için mükemmel</p>
              </div>
              <ul className="flex flex-col gap-3 mb-8 flex-1">
                {['3 müşteri portalı', '5GB depolama', 'Dosya paylaşımı', 'Trevo markası ile'].map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm">
                    <svg className="check-icon flex-shrink-0" width="16" height="16" fill="none" viewBox="0 0 16 16">
                      <circle cx="8" cy="8" r="6" stroke="#4f7dff" strokeWidth="1.2" />
                      <path d="M5.5 8l1.5 1.5L10.5 6" stroke="#4f7dff" strokeWidth="1.3" strokeLinecap="round" />
                    </svg>
                    <span style={{ color: '#8a9ab5' }}>{f}</span>
                  </li>
                ))}
                {['Özel domain', 'Fatura yönetimi'].map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm opacity-40">
                    <svg width="16" height="16" fill="none" viewBox="0 0 16 16">
                      <circle cx="8" cy="8" r="6" stroke="#8a9ab5" strokeWidth="1.2" />
                      <path d="M5.5 10.5L10.5 5.5M10.5 10.5L5.5 5.5" stroke="#8a9ab5" strokeWidth="1.2" strokeLinecap="round" />
                    </svg>
                    <span style={{ color: '#8a9ab5' }}>{f}</span>
                  </li>
                ))}
              </ul>
              <Link href="/kayit" className="btn-outline rounded-xl py-3 text-center text-sm font-display font-semibold text-white">
                Ücretsiz Başla
              </Link>
            </div>

            {/* Pro - Featured */}
            <div className="pricing-featured card-glass rounded-2xl p-7 reveal flex flex-col" style={{ transitionDelay: '0.1s' }}>
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="tag-badge px-3 py-1 rounded-full text-xs font-bold font-display whitespace-nowrap">En Popüler</span>
              </div>
              <div className="mb-6">
                <div className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: '#4f7dff' }}>Pro</div>
                <div className="flex items-end gap-1 mb-1">
                  <span className="font-display font-extrabold text-4xl text-white">₺499</span>
                  <span className="text-sm mb-1.5" style={{ color: '#8a9ab5' }}>/ay</span>
                </div>
                <p className="text-sm" style={{ color: '#8a9ab5' }}>Büyüyen ajanslar için</p>
              </div>
              <ul className="flex flex-col gap-3 mb-8 flex-1">
                {['20 müşteri portalı', '100GB depolama', 'Özel domain', 'Fatura & ödeme takibi', 'Onay akışları', 'E-posta desteği'].map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm">
                    <svg className="check-icon flex-shrink-0" width="16" height="16" fill="none" viewBox="0 0 16 16">
                      <circle cx="8" cy="8" r="6" stroke="#4f7dff" strokeWidth="1.2" />
                      <path d="M5.5 8l1.5 1.5L10.5 6" stroke="#4f7dff" strokeWidth="1.3" strokeLinecap="round" />
                    </svg>
                    <span className="text-white">{f}</span>
                  </li>
                ))}
              </ul>
              <Link href="/kayit" className="btn-primary rounded-xl py-3 text-center text-sm font-display font-semibold text-white">
                14 Gün Ücretsiz Dene
              </Link>
            </div>

            {/* Agency */}
            <div className="card-glass rounded-2xl p-7 reveal flex flex-col" style={{ transitionDelay: '0.2s' }}>
              <div className="mb-6">
                <div className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: '#8a9ab5' }}>Ajans</div>
                <div className="flex items-end gap-1 mb-1">
                  <span className="font-display font-extrabold text-4xl text-white">₺1.499</span>
                  <span className="text-sm mb-1.5" style={{ color: '#8a9ab5' }}>/ay</span>
                </div>
                <p className="text-sm" style={{ color: '#8a9ab5' }}>Ölçeklenen ekipler için</p>
              </div>
              <ul className="flex flex-col gap-3 mb-8 flex-1">
                {['Sınırsız müşteri portalı', '1TB depolama', 'Sınırsız ekip üyesi', 'Gelişmiş raporlama', 'API erişimi', 'Öncelikli destek'].map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm">
                    <svg className="check-icon flex-shrink-0" width="16" height="16" fill="none" viewBox="0 0 16 16">
                      <circle cx="8" cy="8" r="6" stroke="#4f7dff" strokeWidth="1.2" />
                      <path d="M5.5 8l1.5 1.5L10.5 6" stroke="#4f7dff" strokeWidth="1.3" strokeLinecap="round" />
                    </svg>
                    <span style={{ color: '#8a9ab5' }}>{f}</span>
                  </li>
                ))}
              </ul>
              <Link href="#" className="btn-outline rounded-xl py-3 text-center text-sm font-display font-semibold text-white">
                Satışla Görüş
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          TESTIMONIALS
      ═══════════════════════════════════════ */}
      <section id="testimonials" className="py-28 relative">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16 reveal">
            <div className="inline-flex items-center gap-2 tag-badge px-3 py-1.5 rounded-full mb-5">Referanslar</div>
            <h2 className="font-display font-extrabold text-4xl md:text-5xl tracking-tight mb-4">
              Ajanslar ne <span className="gradient-text">düşünüyor</span>?
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                quote: '"Trevo\'dan önce müşterilerimizle WhatsApp üzerinden dosya gönderip alıyorduk. Şimdi her şey o kadar profesyonel ki müşterilerimiz bize daha fazla güveniyor. İlk ayda 2 yeni büyük müşteri kazandık."',
                initials: 'AK',
                name: 'Alp Kaya',
                company: 'Kaya Creative Studio, İstanbul',
                gradient: 'linear-gradient(135deg, #a78bfa, #4f46e5)',
                delay: '0s',
              },
              {
                quote: '"Ekibimizle birlikte 15 farklı müşterimizi Trevo üzerinden yönetiyoruz. Fatura takibi ve onay süreçleri inanılmaz kolaylaştı. Ayda en az 20 saat zaman kazanıyoruz artık."',
                initials: 'SÖ',
                name: 'Selin Öztürk',
                company: 'Pixel Ajans, Ankara',
                gradient: 'linear-gradient(135deg, #34d399, #0d9488)',
                delay: '0.1s',
              },
              {
                quote: '"Freelancer olarak çalışıyorum ve Trevo gerçekten işimi bambaşka bir seviyeye taşıdı. Müşterilerim beni artık daha ciddiye alıyor, kurumsal bir görüntüm var. Fiyatı da çok uygun."',
                initials: 'MY',
                name: 'Mert Yıldız',
                company: 'Freelance Tasarımcı, İzmir',
                gradient: 'linear-gradient(135deg, #fbbf24, #f97316)',
                delay: '0.2s',
              },
            ].map((t) => (
              <div key={t.name} className="testimonial-card rounded-2xl p-7 reveal flex flex-col" style={{ transitionDelay: t.delay }}>
                <div className="flex mb-4">
                  <span style={{ color: '#4f7dff', fontSize: '1.25rem' }}>★★★★★</span>
                </div>
                <blockquote className="text-sm leading-relaxed flex-1 mb-6" style={{ color: 'rgba(255,255,255,0.8)' }}>
                  {t.quote}
                </blockquote>
                <div className="flex items-center gap-3 border-t pt-5" style={{ borderColor: 'rgba(26,34,54,0.6)' }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-display font-bold text-sm" style={{ background: t.gradient }}>
                    {t.initials}
                  </div>
                  <div>
                    <div className="text-white text-sm font-semibold">{t.name}</div>
                    <div className="text-xs" style={{ color: '#8a9ab5' }}>{t.company}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          CTA BANNER
      ═══════════════════════════════════════ */}
      <section className="py-20 relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-6">
          <div className="reveal relative rounded-3xl overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(79,125,255,0.15) 0%, rgba(79,125,255,0.05) 100%)', border: '1px solid rgba(79,125,255,0.25)' }}>
            <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 500px 300px at 0% 50%, rgba(79,125,255,0.2) 0%, transparent 60%)' }} />
            <div className="relative z-10 p-12 md:p-16 text-center">
              <h2 className="font-display font-extrabold text-3xl md:text-5xl tracking-tight text-white mb-4">
                Bugün başlayın.<br />Ücretsiz.
              </h2>
              <p className="text-lg mb-8 max-w-lg mx-auto" style={{ color: '#8a9ab5' }}>
                Kredi kartı gerekmez. 5 dakikada kurulum. İstediğiniz zaman iptal.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/kayit" className="btn-primary font-display font-bold text-white px-8 py-4 rounded-xl text-base flex items-center gap-2.5">
                  Ücretsiz Hesap Aç
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8H13M13 8L9 4M13 8L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
                <span className="text-sm" style={{ color: '#8a9ab5' }}>
                  veya{' '}
                  <Link href="#" className="hover:underline" style={{ color: '#7aa0ff' }}>
                    demo talep edin
                  </Link>
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          FOOTER
      ═══════════════════════════════════════ */}
      <footer className="border-t py-16" style={{ borderColor: '#1a2236' }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-10 mb-12">
            <div className="md:col-span-1">
              <Link href="#" className="flex items-center gap-2.5 mb-4">
                <Image src="/logo.svg" alt="Trevo" width={28} height={28} className="rounded-lg" />
                <span className="font-display font-bold text-lg tracking-tight text-white">trevo</span>
              </Link>
              <p className="text-sm leading-relaxed" style={{ color: '#8a9ab5' }}>
                Türk ajanslar ve freelancer&apos;lar için profesyonel müşteri portalı.
              </p>
              <div className="flex gap-3 mt-5">
                {[
                  <path key="tw" d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />,
                  <><path key="li1" d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z" /><circle key="li2" cx="4" cy="4" r="2" /></>,
                ].map((icon, i) => (
                  <a key={i} href="#" className="w-8 h-8 rounded-lg flex items-center justify-center hover:border-accent transition-colors" style={{ border: '1px solid #1a2236' }}>
                    <svg width="14" height="14" fill="currentColor" style={{ color: '#8a9ab5' }} viewBox="0 0 24 24">{icon}</svg>
                  </a>
                ))}
              </div>
            </div>

            {[
              {
                title: 'Ürün',
                links: ['Özellikler', 'Fiyatlandırma', 'Değişiklik Günlüğü', 'Yol Haritası'],
              },
              {
                title: 'Şirket',
                links: ['Hakkımızda', 'Blog', 'Kariyer', 'İletişim'],
              },
              {
                title: 'Yasal',
                links: ['Gizlilik Politikası', 'Kullanım Şartları', 'KVKK', 'Çerez Politikası'],
              },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="font-display font-semibold text-white text-sm mb-4">{col.title}</h4>
                <ul className="flex flex-col gap-3">
                  {col.links.map((link) => (
                    <li key={link}>
                      <Link href="#" className="text-sm hover:text-white transition-colors" style={{ color: '#8a9ab5' }}>
                        {link}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="accent-line opacity-20 mb-8" />
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            <p className="text-sm" style={{ color: '#8a9ab5' }}>© 2025 Trevo Teknoloji A.Ş. Tüm hakları saklıdır.</p>
            <p className="text-sm" style={{ color: '#8a9ab5' }}>🇹🇷 İstanbul&apos;dan sevgiyle yapıldı</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
