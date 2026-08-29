import type { Metadata } from "next";
import { metaDictionary } from "@/lib/seo";

export async function generateMetadata({
  params,
}: LayoutProps<"/[lang]/sign-up">): Promise<Metadata> {
  return { title: metaDictionary((await params).lang).meta.signUp };
}

export default function SignUpLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
