"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type Props = {
  title?: string;
  description?: string;
  trigger: React.ReactNode;
  onConfirm: () => Promise<void> | void;
};

export function ConfirmDeleteDialog({ title, description, trigger, onConfirm }: Props) {
  const tc = useTranslations("common");
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const resolvedTitle = title ?? tc("confirmDeleteTitle");
  const resolvedDescription = description ?? tc("confirmDeleteDescription");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent
        className="max-w-md"
        {...(!resolvedDescription && { "aria-describedby": undefined })}
      >
        <DialogHeader>
          <DialogTitle>{resolvedTitle}</DialogTitle>
          {resolvedDescription ? (
            <DialogDescription>{resolvedDescription}</DialogDescription>
          ) : null}
        </DialogHeader>

        <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:flex-wrap sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            disabled={pending}
            className="w-full sm:w-auto"
            onClick={() => setOpen(false)}
          >
            {tc("cancel")}
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={pending}
            className="w-full sm:w-auto"
            onClick={() => {
              startTransition(async () => {
                await onConfirm();
                setOpen(false);
              });
            }}
          >
            {tc("delete")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

