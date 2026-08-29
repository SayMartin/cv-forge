import type { Metadata } from "next";
import { metaDictionary } from "@/lib/seo";

export async function generateMetadata({
  params,
}: LayoutProps<"/[lang]/forgot-password">): Promise<Metadata> {
  return { title: metaDictionary((await params).lang).meta.forgotPassword };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
