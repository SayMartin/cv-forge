"use client";

import { useState } from "react";
import Link from "next/link";
import { CvSwitcher } from "./CvSwitcher";
import { CvEditor } from "./CvEditor";
import type { ComponentProps } from "react";

type CvEditorProps = ComponentProps<typeof CvEditor>;

interface Props extends CvEditorProps {
  cvs: { id: string; name: string }[];
}

export function CvEditShell({ cvs, cvId, initialName, ...editorProps }: Props) {
  const [liveName, setLiveName] = useState(initialName);

  const liveCvs = cvs.map((cv) => (cv.id === cvId ? { ...cv, name: liveName } : cv));

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <CvSwitcher cvs={liveCvs} currentId={cvId} />
        <Link
          href={`/cvs/${cvId}/view`}
          className="text-sm bg-(--cl-accent) text-white rounded-lg px-4 py-2 hover:bg-(--cl-accent-hov) transition-colors shrink-0"
        >
          Preview →
        </Link>
      </div>

      <CvEditor
        cvId={cvId}
        initialName={initialName}
        onNameChange={setLiveName}
        {...editorProps}
      />
    </>
  );
}
