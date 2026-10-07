import Image from 'next/image';
import Link from 'next/link';
import { desc, eq } from 'drizzle-orm';
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Clover,
  CreditCard,
  MessageCircle,
  Music,
  Palette,
  PenLine,
  Star,
  Timer,
} from 'lucide-react';
import { db } from '../db';
import { products, reviews } from '../db/schema';
import { DEFAULT_ADDITIONAL_FEATURES, DEFAULT_ESSENTIAL_FEATURES } from '../data/katalogData';

export const metadata = {
  title: 'Dear Adore — Undangan Digital Eksklusif',
  description:
    'Pilih tema undangan digital Dear Adore, lengkapi detail acara, dan bagikan undangan dengan RSVP, musik, serta video dari ponsel Anda.',
};

// ponytail: ISR (60s) keeps the home page static-fast; ceiling is a 1-minute lag after admin edits. Move to tag-based revalidation if edits must show instantly.
export const revalidate = 60;

const steps = [
  {
    icon: Palette,
    title: 'Pilih Tema',
    text: 'Jelajahi katalog tema untuk berbagai acara, lalu lihat preview-nya persis seperti yang akan dilihat tamu Anda.',
  },
  {
    icon: PenLine,
    title: 'Isi Detail',
    text: 'Lengkapi fitur esensial seperti detail acara, RSVP, musik, dan video, lalu tambahkan fitur opsional sesuai kebutuhan.',
  },
  {
    icon: CreditCard,
    title: 'Bayar & Pantau',
    text: 'Bayar lewat QRIS, BCA VA, atau Mandiri VA, lalu pantau status pesanan Anda kapan saja dari halaman Akun.',
  },
];

const formatCurrency = (amount) => `Rp ${amount.toLocaleString('id-ID')}`;

const toSlug = (title) => title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

async function loadHomeData() {
  try {
    const [items, feedback] = await Promise.all([
      db.select().from(products).where(eq(products.status, 'Aktif')).orderBy(desc(products.createdAt)),
      db.select().from(reviews).where(eq(reviews.status, 'Approved')).orderBy(desc(reviews.createdAt)).limit(3),
    ]);

    return { items, feedback };
  } catch {
    // Home must still render when the database is unreachable.
    return { items: [], feedback: [] };
  }
}

export default async function Home() {
  const { items, feedback } = await loadHomeData();
  const heroProduct = items.find((item) => item.previewImage);
  const featured = items.slice(0, 4);

  return (
    <div className="home-page">
      {/* HERO */}
      <section className="home-hero">
        <div>
          <h1 className="home-hero-title">
            Undangan digital yang <em>terasa personal</em>, tampil elegan.
          </h1>

          <p className="home-hero-sub">
            Pilih tema dari katalog kami, isi detail acara Anda, lalu bagikan undangan lengkap dengan RSVP, musik, dan video langsung dari ponsel.
          </p>

          <div className="home-hero-actions">
            <Link id="home-hero-katalog" href="/katalog" className="home-btn primary">
              Jelajahi Katalog
              <ArrowRight size={18} />
            </Link>
            <a id="home-hero-cara-pesan" href="#cara-pesan" className="home-btn ghost">
              Lihat Cara Pesan
            </a>
          </div>
        </div>

        <div className="home-hero-visual">
          <div className="home-hero-blob" />

          <div className="home-hero-phone">
            <div className="phone-png-frame-container">
              <div className="phone-screen-scroll">
                {heroProduct ? (
                  <Image
                    src={heroProduct.previewImage}
                    alt={`Preview tema ${heroProduct.name}`}
                    fill
                    sizes="300px"
                    style={{ objectFit: 'cover' }}
                    priority
                  />
                ) : (
                  <div className="home-phone-fallback">
                    <Clover size={36} color="var(--color-primary)" />
                    <small>Undangan Digital</small>
                    <strong>
                      Dear <span>Adore</span>
                    </strong>
                  </div>
                )}
              </div>

              <div className="phone-png-overlay">
                <Image src="/mock-ip.png" alt="" fill sizes="300px" className="phone-png-img" priority />
              </div>
            </div>
          </div>

          <span className="home-chip a">
            <MessageCircle size={14} />
            RSVP &amp; Ucapan
          </span>
          <span className="home-chip b">
            <Music size={14} />
            Musik
          </span>
          <span className="home-chip c">
            <Timer size={14} />
            Countdown
          </span>
        </div>
      </section>

      {/* FEATURED COLLECTION (live) */}
      {featured.length > 0 && (
        <section className="home-section" aria-labelledby="home-koleksi-title">
          <div className="home-head">
            <div>
              <p className="home-kicker">Koleksi terbaru</p>
              <h2 id="home-koleksi-title" className="home-h2">
                Tema pilihan untuk Anda
              </h2>
            </div>

            <Link id="home-koleksi-semua" href="/katalog" className="home-link">
              Lihat semua
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="katalog-grid">
            {featured.map((item) => (
              <Link key={item.id} href={`/katalog/${toSlug(item.name)}`} className="home-card-link">
                <article className="katalog-card">
                  <div className="katalog-card-image-wrap">
                    <Image
                      src={item.previewImage || 'https://via.placeholder.com/400x600'}
                      alt={item.name}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      className="katalog-card-image"
                    />
                    <div className="katalog-card-overlay" />
                    <span className="home-card-arrow" aria-hidden="true">
                      <ArrowUpRight size={16} />
                    </span>
                  </div>

                  <div className="katalog-card-content">
                    <h3 className="katalog-card-title">{item.name}</h3>
                    <div className="katalog-card-price-row">
                      <span className="katalog-card-price">{formatCurrency(item.price)}</span>
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* HOW TO ORDER */}
      <section id="cara-pesan" className="home-section" aria-labelledby="home-cara-title">
        <div className="home-head">
          <div>
            <p className="home-kicker">Cara pesan</p>
            <h2 id="home-cara-title" className="home-h2">
              Tiga langkah menuju undangan Anda
            </h2>
          </div>
        </div>

        <ol className="home-steps" style={{ listStyle: 'none' }}>
          {steps.map((step, index) => (
            <li key={step.title} className="home-step">
              <span className="home-step-num" aria-hidden="true">
                {index + 1}
              </span>
              <div className="home-step-icon">
                <step.icon size={22} />
              </div>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* FEATURES */}
      <section className="home-section" aria-labelledby="home-fitur-title">
        <div className="home-features">
          <div>
            <p className="home-kicker">Fitur</p>
            <h2 id="home-fitur-title" className="home-h2">
              Semua yang Anda butuhkan, sudah termasuk.
            </h2>
            <p className="home-features-lead">
              Setiap undangan sudah dibekali fitur esensial. Butuh lebih? Tambahkan fitur opsional saat memesan.
            </p>

            <ul className="home-check-list">
              {DEFAULT_ESSENTIAL_FEATURES.map((feature) => (
                <li key={feature}>
                  <span className="home-tick">
                    <Check size={13} strokeWidth={3} />
                  </span>
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          <div className="home-addons">
            <p className="home-addons-title">Fitur tambahan opsional</p>
            <div className="home-addon-grid">
              {DEFAULT_ADDITIONAL_FEATURES.map((feature) => (
                <span key={feature} className="home-addon">
                  {feature}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* REVIEWS (live, approved only) */}
      {feedback.length > 0 && (
        <section className="home-section" aria-labelledby="home-testimoni-title">
          <div className="home-head">
            <div>
              <p className="home-kicker">Testimoni</p>
              <h2 id="home-testimoni-title" className="home-h2">
                Kata mereka yang sudah memesan
              </h2>
            </div>
          </div>

          <div className="home-reviews">
            {feedback.map((review) => (
              <figure key={review.id} className="home-review">
                <div className="home-stars" role="img" aria-label={`Rating ${review.rating} dari 5`}>
                  {Array.from({ length: 5 }, (_, index) => (
                    <Star key={index} size={15} className={index < review.rating ? 'on' : 'off'} />
                  ))}
                </div>

                <blockquote>“{review.comment}”</blockquote>

                <figcaption>
                  <span className="home-avatar" aria-hidden="true">
                    {review.clientName.trim().charAt(0).toUpperCase()}
                  </span>
                  <div>
                    <strong>{review.clientName}</strong>
                    <span>Tema {review.themeName}</span>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      {/* CLOSING CTA */}
      <section className="home-section">
        <div className="home-cta">
          <h2>Siap membagikan kabar bahagia Anda?</h2>
          <p>Mulai dengan memilih tema favorit Anda, lalu lengkapi detail acara dalam beberapa langkah mudah.</p>
          <Link id="home-cta-katalog" href="/katalog" className="home-btn light">
            Pilih Tema Sekarang
            <ArrowRight size={18} />
          </Link>
        </div>

        <p className="home-foot">© {new Date().getFullYear()} Dear Adore · Undangan Digital</p>
      </section>
    </div>
  );
}
