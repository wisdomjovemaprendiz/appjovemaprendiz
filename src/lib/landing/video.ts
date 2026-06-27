export type NormalizedVideo = {
  originalUrl: string | null;
  embedUrl: string | null;
  provider: string | null;
};

function cleanUrl(value: string | null | undefined) {
  const text = String(value || "").trim();
  return text.length > 0 ? text : null;
}

export function normalizeLandingVideoUrl(value: string | null | undefined): NormalizedVideo {
  const originalUrl = cleanUrl(value);

  if (!originalUrl) {
    return {
      originalUrl: null,
      embedUrl: null,
      provider: null,
    };
  }

  try {
    const url = new URL(originalUrl);
    const host = url.hostname.replace(/^www\./, "").toLowerCase();

    if (host === "youtu.be") {
      const id = url.pathname.replace("/", "").trim();

      if (id) {
        return {
          originalUrl,
          embedUrl: `https://www.youtube.com/embed/${id}`,
          provider: "youtube",
        };
      }
    }

    if (host.includes("youtube.com")) {
      if (url.pathname.startsWith("/embed/")) {
        const id = url.pathname.split("/embed/")[1]?.split("/")[0];

        return {
          originalUrl,
          embedUrl: id ? `https://www.youtube.com/embed/${id}` : originalUrl,
          provider: "youtube",
        };
      }

      if (url.pathname.startsWith("/shorts/")) {
        const id = url.pathname.split("/shorts/")[1]?.split("/")[0];

        if (id) {
          return {
            originalUrl,
            embedUrl: `https://www.youtube.com/embed/${id}`,
            provider: "youtube",
          };
        }
      }

      const id = url.searchParams.get("v");

      if (id) {
        return {
          originalUrl,
          embedUrl: `https://www.youtube.com/embed/${id}`,
          provider: "youtube",
        };
      }
    }

    if (host.includes("vimeo.com")) {
      const id = url.pathname.split("/").filter(Boolean)[0];

      if (id) {
        return {
          originalUrl,
          embedUrl: `https://player.vimeo.com/video/${id}`,
          provider: "vimeo",
        };
      }
    }

    return {
      originalUrl,
      embedUrl: null,
      provider: "link",
    };
  } catch {
    return {
      originalUrl,
      embedUrl: null,
      provider: "invalid",
    };
  }
}