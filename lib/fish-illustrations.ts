type FishSilhouetteKind =
  | "billfish"
  | "fast"
  | "reef"
  | "trout"
  | "bass"
  | "catfish"
  | "unknown";

function normalize(value: string) {
  return value.toLowerCase().trim();
}

function getSilhouetteKind(name: string): FishSilhouetteKind {
  const value = normalize(name);

  if (value.includes("marlin") || value.includes("sailfish") || value.includes("swordfish")) {
    return "billfish";
  }

  if (value.includes("tuna") || value.includes("mahi") || value.includes("wahoo") || value.includes("kingfish")) {
    return "fast";
  }

  if (value.includes("trout") || value.includes("salmon") || value.includes("pike") || value.includes("musk")) {
    return "trout";
  }

  if (value.includes("bass") || value.includes("dorado") || value.includes("tarpon") || value.includes("carp")) {
    return "bass";
  }

  if (value.includes("catfish") || value.includes("surubi") || value.includes("pacu")) {
    return "catfish";
  }

  if (
    value.includes("trevally") ||
    value.includes("bonefish") ||
    value.includes("permit") ||
    value.includes("snapper") ||
    value.includes("barramundi") ||
    value.includes("snook") ||
    value.includes("roosterfish")
  ) {
    return "reef";
  }

  return "unknown";
}

function getSilhouettePath(kind: FishSilhouetteKind) {
  switch (kind) {
    case "billfish":
      return "M31 67C53 48 89 44 133 51C152 39 176 35 204 38L193 51L205 57L193 63L205 69L190 74C178 83 163 90 147 93C102 103 62 96 31 67Z";
    case "fast":
      return "M34 66C58 49 98 44 146 50L175 39L174 52L208 61L174 70L175 84L145 73C97 78 58 78 34 66Z";
    case "trout":
      return "M37 65C58 48 91 43 128 47C152 38 177 39 198 46L187 57L205 65L186 73L196 84C177 90 156 91 134 84C94 90 60 85 37 65Z";
    case "bass":
      return "M40 68C58 48 89 40 126 43C145 34 169 34 190 40L182 51L200 57L192 64L203 72C186 80 165 83 145 78C111 86 73 85 40 68Z";
    case "catfish":
      return "M34 68C54 48 88 43 129 49C146 39 170 37 192 42L184 54L206 62L187 70L197 80C178 88 157 89 136 84C102 91 67 86 34 68Z";
    case "reef":
      return "M42 70C58 48 87 40 123 42C143 34 168 34 189 40L180 50L199 58L188 66L197 77C179 83 157 85 138 80C108 89 75 87 42 70Z";
    default:
      return "";
  }
}

export function buildFishIllustrationDataUrl(name: string) {
  const kind = getSilhouetteKind(name);
  const isUnknown = kind === "unknown";
  const path = getSilhouettePath(kind);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 160" fill="none">
      <rect width="240" height="160" rx="24" fill="#08110D"/>
      <rect x="8" y="8" width="224" height="144" rx="20" fill="#0F1C15"/>
      <rect x="8" y="8" width="224" height="144" rx="20" stroke="rgba(255,255,255,0.08)"/>
      ${isUnknown
        ? `<path d="M42 80C60 52 95 42 136 49C153 38 176 36 199 42L189 53L208 61L189 69L198 81C180 88 159 90 139 84C102 92 68 90 42 80Z" fill="#0B0B0B"/>
           <circle cx="118" cy="77" r="18" fill="#111827"/>
           <path d="M116.6 84.2V81.6C116.6 78.8 117.6 76.8 121 74.4C123.8 72.4 125 71 125 68.4C125 65 122.6 62.8 118.4 62.8C115.2 62.8 112.6 63.8 110.2 65.8L106.8 60.8C110 58 114 56.4 119.2 56.4C127.6 56.4 133.8 61 133.8 68.2C133.8 73.4 131.2 76.4 126.6 79.2C123.6 81 123.2 82.2 123.2 84.2V86H116.6ZM119.8 98.2C117 98.2 114.8 96 114.8 93.2C114.8 90.4 117 88.2 119.8 88.2C122.6 88.2 124.8 90.4 124.8 93.2C124.8 96 122.6 98.2 119.8 98.2Z" fill="#fff"/>`
        : `<path d="${path}" fill="#0B0B0B"/>
           <path d="${path}" fill="#E5E7EB" opacity="0.92"/>`}
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}
