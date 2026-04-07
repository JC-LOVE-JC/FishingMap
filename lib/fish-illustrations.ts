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
      return "M24 92C50 60 94 48 147 57C168 39 194 33 218 38L199 53L221 61L200 69L213 79C194 89 171 97 149 101C94 111 51 106 24 92Z";
    case "fast":
      return "M28 88C55 62 100 54 156 60L194 44L190 61L221 69L189 77L194 96L156 81C100 86 56 85 28 88Z";
    case "trout":
      return "M29 91C56 60 96 51 143 58C166 46 190 46 210 54L196 67L214 75L194 84L205 97C185 104 163 106 141 100C93 106 54 102 29 91Z";
    case "bass":
      return "M33 94C57 61 96 49 143 54C166 41 191 42 210 50L197 64L218 73L198 83L207 97C188 104 165 108 145 103C101 111 62 106 33 94Z";
    case "catfish":
      return "M26 95C54 61 95 51 145 58C168 46 193 47 213 55L201 69L220 78L198 88L207 101C189 107 167 110 145 105C95 113 54 109 26 95Z";
    case "reef":
      return "M35 94C57 61 94 49 138 53C160 40 185 40 205 49L193 62L214 71L194 81L205 94C186 100 163 104 142 98C101 107 66 104 35 94Z";
    default:
      return "";
  }
}

export function buildFishIllustrationDataUrl(name: string) {
  const kind = getSilhouetteKind(name);
  const isUnknown = kind === "unknown";
  const path = getSilhouettePath(kind);
  const tones = getIllustrationTones(kind);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 160" fill="none">
      <rect width="240" height="160" rx="24" fill="#09100C"/>
      <rect x="8" y="8" width="224" height="144" rx="20" fill="${tones.card}" stroke="rgba(255,255,255,0.08)"/>
      <path d="M24 126C52 118 82 116 114 120C145 124 170 124 202 114" stroke="rgba(255,255,255,0.08)" stroke-width="4" stroke-linecap="round"/>
      <path d="M26 120C54 112 84 109 116 114C146 119 171 118 204 108" stroke="rgba(255,255,255,0.12)" stroke-width="2.2" stroke-linecap="round"/>
      ${isUnknown
        ? `<path d="M36 92C61 61 101 50 148 56C171 43 196 43 216 51L204 65L223 74L203 84L212 98C193 105 170 108 149 103C102 111 63 108 36 92Z" fill="#0B0B0B"/>
           <circle cx="120" cy="80" r="20" fill="#101826"/>
           <path d="M118.4 88.8V85.9C118.4 82.8 119.4 80.5 123.2 77.8C126.3 75.5 127.7 73.9 127.7 71C127.7 67.2 125 64.7 120.2 64.7C116.5 64.7 113.5 65.9 110.8 68.1L106.9 62.5C110.5 59.4 115.2 57.7 121.2 57.7C130.9 57.7 138 63 138 71.3C138 77.2 135 80.7 129.7 83.9C126.3 85.9 125.8 87.2 125.8 89.5V91.5H118.4ZM122 105.7C118.8 105.7 116.3 103.2 116.3 100C116.3 96.8 118.8 94.3 122 94.3C125.2 94.3 127.7 96.8 127.7 100C127.7 103.2 125.2 105.7 122 105.7Z" fill="#fff"/>`
        : `<path d="${path}" fill="${tones.shadow}" opacity="0.82"/>
           <path d="${path}" fill="${tones.body}" opacity="0.98"/>
           <path d="M57 87C87 70 123 65 167 69" stroke="${tones.highlight}" stroke-width="5" stroke-linecap="round" opacity="0.85"/>
           <path d="M72 100C97 90 126 88 153 92" stroke="rgba(15,23,42,0.26)" stroke-width="3.4" stroke-linecap="round"/>
           <circle cx="154" cy="75" r="3.4" fill="#0F172A"/>
           <circle cx="153" cy="74" r="1.2" fill="white" fill-opacity="0.78"/>`}
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function getIllustrationTones(kind: FishSilhouetteKind) {
  switch (kind) {
    case "billfish":
      return { body: "#CBD5E1", card: "#101718", highlight: "#F8FAFC", shadow: "#94A3B8" };
    case "fast":
      return { body: "#D6D3D1", card: "#151716", highlight: "#FAFAF9", shadow: "#A8A29E" };
    case "trout":
      return { body: "#D1D5DB", card: "#121716", highlight: "#F9FAFB", shadow: "#9CA3AF" };
    case "bass":
      return { body: "#C7D2FE", card: "#11161A", highlight: "#EEF2FF", shadow: "#94A3B8" };
    case "catfish":
      return { body: "#D4D4D8", card: "#141515", highlight: "#FAFAFA", shadow: "#A1A1AA" };
    case "reef":
      return { body: "#E5E7EB", card: "#131717", highlight: "#F8FAFC", shadow: "#9CA3AF" };
    default:
      return { body: "#E5E7EB", card: "#111518", highlight: "#FFFFFF", shadow: "#9CA3AF" };
  }
}
