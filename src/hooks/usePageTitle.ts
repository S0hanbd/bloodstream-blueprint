import { useEffect } from "react";

export function usePageTitle(title: string) {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = `${title} | UAP Blood Bank`;
    return () => {
      document.title = prevTitle;
    };
  }, [title]);
}
