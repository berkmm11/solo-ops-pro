const NotFound = () => (
  <div className="flex min-h-screen items-center justify-center bg-background">
    <div className="text-center">
      <h1 className="mb-4 text-4xl font-bold text-foreground">404</h1>
      <p className="mb-4 text-xl text-muted-foreground">Sayfa bulunamadı</p>
      <a href="/" className="text-foreground underline hover:text-foreground/80">
        Ana Sayfaya Dön
      </a>
    </div>
  </div>
);

export default NotFound;
