import "./globals.css";
import AppProvider from "@/components/AppProvider";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata = {
  title: { default: "ShopHub – Shop Smart. Save More. Delivered Fast.", template: "%s | ShopHub" },
  description:
    "ShopHub is your one-stop online shop for electronics, fashion, home, sports, books and gaming. Great deals, secure payment and fast delivery.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <AppProvider>
          <Header />
          <main className="min-h-[60vh]">{children}</main>
          <Footer />
        </AppProvider>
      </body>
    </html>
  );
}
