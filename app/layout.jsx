import './globals.css';

export const metadata = {
  title: 'Lotus Electronics | Recruitment Assessment',
  robots: { index: false, follow: false },
};

export const viewport = {
  themeColor: '#f6faf8',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
