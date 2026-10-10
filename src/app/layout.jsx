import './globals.css';
import { Poppins } from 'next/font/google';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  style: ['normal', 'italic'],
  variable: '--font-poppins',
  display: 'swap',
});

export const metadata = {
  title: 'Dear Adore Digital Invitation',
  description: 'Dear Adore luxury boutique studio and custom project atelier.',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },
};

export const viewport = {
  themeColor: '#7F1D1D',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" className={`${poppins.variable}`}>
      <body>
        <div className="app-root" style={{ fontFamily: 'var(--font-poppins), sans-serif' }}>
          <main>{children}</main>
          <Footer />
          <Navbar />
        </div>
      </body>
    </html>
  );
}
