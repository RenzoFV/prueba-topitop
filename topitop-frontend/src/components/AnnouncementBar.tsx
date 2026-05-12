export function AnnouncementBar({ message }: { message?: string }) {
  return (
    <div className="bg-foreground text-background">
      <div className="mx-auto flex h-9 max-w-7xl items-center justify-center px-4 text-xs tracking-wide">
        <span className="text-background/90">
          {message ?? (
            <>
              Portal interno Topitop{" "}
              <span className="text-brand">·</span> Acceso restringido a personal autorizado
            </>
          )}
        </span>
      </div>
    </div>
  );
}
