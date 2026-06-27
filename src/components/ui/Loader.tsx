const Loader = () => (
  <div className="flex flex-col items-center justify-center py-12">
    <div className="relative w-16 h-16">
      <div className="absolute inset-0 rounded-full border-4 border-cr-border" />
      <div className="absolute inset-0 rounded-full border-4 border-t-cr-gold animate-spin" />
      <div className="absolute inset-2 rounded-full border-2 border-t-cr-blue animate-spin duration-1000" style={{ animationDirection: "reverse" }} />
    </div>
    <p className="mt-4 text-cr-muted text-sm animate-pulse">Загрузка...</p>
  </div>
);

export { Loader };
export default Loader;