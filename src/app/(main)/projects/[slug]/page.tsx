import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const project = await prisma.project.findFirst({ where: { slug } });
  if (!project) return {};
  return {
    title: project.title,
    description: project.summary ?? undefined,
  };
}

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;
  const project = await prisma.project.findFirst({ where: { slug } });

  if (!project) notFound();

  return (
    <main className="max-w-3xl mx-auto px-6 py-16 space-y-8">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-black transition-colors"
      >
        ← Back
      </Link>

      {project.imageUrl && (
        <div className="relative w-full h-64 rounded-xl overflow-hidden bg-zinc-100">
          <Image
            src={project.imageUrl}
            alt={project.title}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 768px) 100vw, 768px"
          />
        </div>
      )}

      <div>
        <h1 className="text-3xl font-bold tracking-tight">{project.title}</h1>
        {project.summary && (
          <p className="mt-3 text-lg text-zinc-500 leading-relaxed">
            {project.summary}
          </p>
        )}
      </div>

      {(project.url || project.sourceUrl) && (
        <div className="flex gap-4">
          {project.url && (
            <a
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 items-center rounded-lg bg-black px-4 text-sm font-medium text-white hover:bg-zinc-700 transition-colors"
            >
              Live demo ↗
            </a>
          )}
          {project.sourceUrl && (
            <a
              href={project.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 items-center rounded-lg border border-zinc-300 px-4 text-sm font-medium hover:bg-zinc-50 transition-colors"
            >
              Source code ↗
            </a>
          )}
        </div>
      )}

      {project.skills && project.skills.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {project.skills.map((s) => (
            <span
              key={s}
              className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs text-zinc-600"
            >
              {s}
            </span>
          ))}
        </div>
      )}

      {project.body && (
        <article className="prose prose-zinc max-w-none">
          <p className="whitespace-pre-wrap">{project.body}</p>
        </article>
      )}
    </main>
  );
}
