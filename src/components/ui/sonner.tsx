import { Toaster as Sonner } from "sonner";

const Toaster = () => {
  return (
    <Sonner
      position="top-right"
      expand={false}
      richColors
      closeButton
      duration={3000}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg group-[.toaster]:rounded-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          closeButton: "group-[.toast]:text-muted-foreground",
          success:
            "group-[.toaster]:!border-l-4 group-[.toaster]:!border-l-emerald-500",
          error:
            "group-[.toaster]:!border-l-4 group-[.toaster]:!border-l-red-500",
          info:
            "group-[.toaster]:!border-l-4 group-[.toaster]:!border-l-blue-500",
          warning:
            "group-[.toaster]:!border-l-4 group-[.toaster]:!border-l-amber-500",
        },
      }}
    />
  );
};

export { Toaster };
