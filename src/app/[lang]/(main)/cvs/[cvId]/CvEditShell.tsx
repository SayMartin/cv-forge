"use client";

import { useState } from "react";
import Link from "next/link";
import { Breadcrumbs, CrumbLink } from "@/components/Breadcrumbs";
import { CvSwitcher } from "./CvSwitcher";
import { CvEditor } from "./CvEditor";
import { useUnsavedChangesWarning, confirmLeave } from "./UnsavedChangesGuard";
import type { ComponentProps } from "react";

type CvEditorProps = ComponentProps<typeof CvEditor>;

interface Props extends Omit<CvEditorProps, "headerTrail" | "headerLink"> {
  cvs: { id: string; name: string }[];
}

export function CvEditShell({ cvs, cvId, initialName, ...editorProps }: Props) {
  const [liveName, setLiveName] = useState(initialName);

  // The guard lives here rather than in CvEditor because it has to cover the
  // links this shell renders — and, through the document-level listener, the
  // global nav as well.
  const [dirty, setDirty] = useState(false);
  useUnsavedChangesWarning(dirty);

  const liveCvs = cvs.map((cv) => (cv.id === cvId ? { ...cv, name: liveName } : cv));

  // The trail and the Preview link are handed to CvEditor rather than rendered
  // here, because they now share one sticky bar with Save and Revert — and those
  // read the form state CvEditor owns. Passing two nodes down is a far smaller
  // change than lifting fifteen pieces of state up to meet them here.
  return (
    <CvEditor
      cvId={cvId}
      initialName={initialName}
      onNameChange={setLiveName}
      onDirtyChange={setDirty}
      headerTrail={
        // The switcher doubles as the CV segment: this page had no heading at
        // all, and a select on its own reads as a control rather than a title.
        <Breadcrumbs>
          <CrumbLink href="/cvs">My CVs</CrumbLink>
          {/* A select navigates through the router, not through an anchor, so
              the click listener never sees it — it needs asking directly. */}
          <CvSwitcher
            cvs={liveCvs}
            currentId={cvId}
            onBeforeSwitch={() => !dirty || confirmLeave()}
          />
        </Breadcrumbs>
      }
      headerLink={
        <Link
          href={`/cvs/${cvId}/view`}
          className="text-sm bg-(--cl-accent) text-white rounded-lg px-4 py-1.5 hover:bg-(--cl-accent-hov) transition-colors shrink-0"
        >
          Preview →
        </Link>
      }
      {...editorProps}
    />
  );
}
