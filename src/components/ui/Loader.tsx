const Loader = () => (
  <div className="flex flex-col items-center justify-center py-12">
    <img
      src="/pekka-butterfly.gif"
      alt=""
      aria-hidden
      className="w-36 h-36 object-contain"
    />
    <p className="mt-4 text-cr-muted text-sm animate-pulse">Загрузка...</p>
  </div>
);

export { Loader };
export default Loader;
