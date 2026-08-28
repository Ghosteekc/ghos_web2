import { useLocation } from "react-router-dom";

/** Лёгкий enter при смене route (opacity + translateY). */
export function PageEnter({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  return (
    <div key={pathname} className="page-enter">
      {children}
    </div>
  );
}
