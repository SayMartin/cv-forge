import type { Metadata } from "next";
import { metaDictionary } from "@/lib/seo";

export async function generateMetadata({
  params,
}: LayoutProps<"/[lang]/sign-in">): Promise<Metadata> {
  return { title: metaDictionary((await params).lang).meta.signIn };
}

export default function SignInLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
