import { Link } from 'react-router-dom'
import { Container } from './Container'
import { Logo } from './Logo'

export function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white">
      <Container className="flex flex-col gap-6 py-10 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-xs">
          <Logo />
          <p className="mt-3 text-sm text-slate-500">
            Türkiye'nin spor tesisi rezervasyon platformu. Sahanı seç, saatini ayır, oyununu oyna.
          </p>
        </div>
        <div className="flex flex-wrap gap-x-12 gap-y-6">
          <div>
            <p className="text-sm font-semibold text-slate-900">Keşfet</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-500">
              <li>
                <Link to="/tesisler" className="hover:text-primary-600">
                  Tüm Tesisler
                </Link>
              </li>
              <li>
                <Link to="/tesisler?sport=hali-saha" className="hover:text-primary-600">
                  Halı Sahalar
                </Link>
              </li>
              <li>
                <Link to="/tesisler?sport=tenis" className="hover:text-primary-600">
                  Tenis Kortları
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">Tesis Sahibi misiniz?</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-500">
              <li>
                <Link to="/kayit?rol=tesis" className="hover:text-primary-600">
                  Tesisinizi Ekleyin
                </Link>
              </li>
              <li>
                <Link to="/panel" className="hover:text-primary-600">
                  Tesis Paneli
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">Kurumsal</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-500">
              <li>
                <Link to="/hakkimizda" className="hover:text-primary-600">
                  Biz Kimiz
                </Link>
              </li>
              <li>
                <Link to="/iletisim" className="hover:text-primary-600">
                  İletişim
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </Container>
      <div className="border-t border-slate-100 py-4">
        <Container>
          <p className="text-xs text-slate-400">
            © {new Date().getFullYear()} SahaSepeti. Tüm hakları saklıdır.
          </p>
        </Container>
      </div>
    </footer>
  )
}
