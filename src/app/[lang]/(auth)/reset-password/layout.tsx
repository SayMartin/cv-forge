import type { Metadata } from "next";
import { metaDictionary } from "@/lib/seo";

export async function generateMetadata({
  params,
}: LayoutProps<"/[lang]/reset-password">): Promise<Metadata> {
  return { title: metaDictionary((await params).lang).meta.resetPassword };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
