import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Dashboard — LocalMarket",
  description: "Manage orders, products, shops, and customers for LocalMarket.",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
