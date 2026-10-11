import { useEffect, useState } from "react";
import { readDetectedCountry } from "./geo";

/** The saved country, read after mount (localStorage doesn't exist during
 * the static render). null until then, or when it was never detected. */
export function useDetectedCountry(): string | null {
  const [country, setCountry] = useState<string | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCountry(readDetectedCountry());
  }, []);
  return country;
}
