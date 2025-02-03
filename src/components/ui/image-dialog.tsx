import Image from "next/image";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";

interface ImageDialogProps {
  isOpen: boolean;
  onClose: () => void;
  src: string;
  alt: string;
  caption: string;
}

export function ImageDialog({
  isOpen,
  onClose,
  src,
  alt,
  caption,
}: ImageDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{alt}</DialogTitle>
          <DialogDescription>{caption}</DialogDescription>
        </DialogHeader>
        <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg">
          <Image
            src={src}
            alt={alt}
            fill
            className="object-contain"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
            priority
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
