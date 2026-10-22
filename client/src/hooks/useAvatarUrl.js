import { useEffect, useState } from "react";
import { accountService } from "../services/accountService";

/**
 * Loads the signed-in user's profile photo as an object URL. `version` changes whenever the photo changes;
 * 0 or undefined means there is no photo (nothing is requested). Returns '' while loading or on failure,
 * so callers fall back to the initial.
 */
export default function useAvatarUrl(version) {
  const [url, setUrl] = useState("");

  useEffect(() => {
    if (!version) {
      setUrl("");
      return undefined;
    }
    let alive = true;
    accountService
      .avatar()
      .then((blob) => {
        if (alive) setUrl(URL.createObjectURL(blob));
      })
      .catch(() => {
        if (alive) setUrl("");
      });
    return () => {
      alive = false;
    };
  }, [version]);

  // Frees the previous object URL when a new one replaces it, and on unmount.
  useEffect(
    () => () => {
      if (url) URL.revokeObjectURL(url);
    },
    [url],
  );

  return url;
}
