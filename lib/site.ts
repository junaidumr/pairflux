export const SITE_NAME = "PeerBeam";
export const SITE_TAGLINE = "AirDrop for the web — instant peer-to-peer sharing";
export const SITE_DESCRIPTION =
  "Share files, text, and links directly between browsers with WebRTC. No accounts, no cloud uploads, no server storage.";
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://peer-beam-eta.vercel.app";
export const CONTACT_EMAIL = "hello@peerbeam.app";

export const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/features", label: "Features" },
  { href: "/about", label: "About" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
] as const;

export const FOOTER_LINKS = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
  { href: "/contact", label: "Contact" },
] as const;

export const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Open PeerBeam",
    description:
      "Visit the app on any modern browser. No download or account required — pick a room or use the default.",
  },
  {
    step: "02",
    title: "Discover & pair",
    description:
      "Devices on the same room appear instantly. Pair once with a 3-digit code or QR scan for trusted transfers.",
  },
  {
    step: "03",
    title: "Share directly",
    description:
      "Drop files, send messages, or share links over an encrypted WebRTC data channel — browser to browser.",
  },
] as const;

export const HOME_FEATURES = [
  {
    title: "Instant discovery",
    description: "Peers appear in real time on the same room. No accounts, no setup wizards.",
  },
  {
    title: "Direct WebRTC",
    description: "Files move browser-to-browser over encrypted data channels—not our servers.",
  },
  {
    title: "Any file type",
    description: "Photos, folders, large videos. Chunked transfer with ACK and resume support.",
  },
  {
    title: "Multi-peer",
    description: "Broadcast to everyone in the room or pick one device for targeted sharing.",
  },
] as const;

export const ALL_FEATURES = [
  {
    title: "Peer-to-Peer Transfer",
    description:
      "Files travel directly between browsers over WebRTC data channels. The server only helps with discovery and handshake — never stores your data.",
  },
  {
    title: "End-to-End Security",
    description:
      "Transfers use encrypted SCTP data channels. Pairing codes ensure you connect to the right device before any data flows.",
  },
  {
    title: "QR Pairing",
    description:
      "Generate a QR code on one device and scan it on another to join the same room and initiate pairing in seconds.",
  },
  {
    title: "Device Discovery",
    description:
      "See every device in your room in real time. Names and avatars update live as peers join or leave.",
  },
  {
    title: "File Sharing",
    description:
      "Drag and drop any file type — images, documents, videos, or entire folders. Large files are chunked with acknowledgements and backpressure.",
  },
  {
    title: "Text Sharing",
    description:
      "Send messages and clipboard text to paired peers instantly over the same P2P connection used for files.",
  },
  {
    title: "Link Sharing",
    description:
      "Share URLs with one click. Recipients get clickable links in the built-in chat panel.",
  },
  {
    title: "No Account Required",
    description:
      "Open the app and start sharing. No email, no password, no profile — your browser is your identity.",
  },
  {
    title: "Cross Platform Support",
    description:
      "Works on desktop and mobile browsers — Windows, macOS, Linux, iOS, and Android. Same room, any device.",
  },
] as const;

export const FAQ_ITEMS = [
  {
    question: "Is PeerBeam free?",
    answer:
      "Yes. PeerBeam is completely free to use. There are no subscriptions, premium tiers, or hidden fees. Open the app and start sharing.",
  },
  {
    question: "Are files stored on servers?",
    answer:
      "No. PeerBeam never uploads your files to a server. A lightweight signaling service helps browsers find each other and exchange WebRTC handshake data. All file content travels directly peer-to-peer.",
  },
  {
    question: "How secure is PeerBeam?",
    answer:
      "Transfers use WebRTC encrypted data channels (DTLS-SRTP / SCTP). Devices must pair with a one-time code before exchanging data. The signaling server sees only connection metadata — never file contents.",
  },
  {
    question: "Does it work on mobile?",
    answer:
      "Yes. PeerBeam works in mobile browsers including Safari on iOS and Chrome on Android. For the best experience, keep both devices on the same room and complete pairing before sending large files.",
  },
  {
    question: "How does pairing work?",
    answer:
      "One device generates a 3-digit pairing code. The other device enters that code to establish a trusted session. After pairing, devices reconnect automatically when they see each other in the same room.",
  },
  {
    question: "Is registration required?",
    answer:
      "No registration is required. Each browser generates a local device name and ID. No email, phone number, or personal information is collected.",
  },
  {
    question: "What browsers are supported?",
    answer:
      "PeerBeam supports current versions of Chrome, Firefox, Safari, Edge, and other Chromium-based browsers. WebRTC data channels must be enabled (default in all modern browsers).",
  },
] as const;
