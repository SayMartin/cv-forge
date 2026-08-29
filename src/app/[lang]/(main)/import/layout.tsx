import type { Metadata } from "next";
import { metaDictionary } from "@/lib/seo";

export async function generateMetadata({
  params,
}: LayoutProps<"/[lang]/import">): Promise<Metadata> {
  return { title: metaDictionary((await params).lang).meta.importCv };
}

export default function ImportLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
