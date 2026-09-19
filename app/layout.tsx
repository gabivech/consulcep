import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ConsulCEP | Consulte endereços pelo CEP",
  description: "Descubra um endereço pelo CEP ou encontre o CEP a partir de um endereço.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
