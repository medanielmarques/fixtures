import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fixtures | Seu futebol, no seu calendário",
  description: "Escolha os jogos que você quer acompanhar e leve para seu calendário.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
