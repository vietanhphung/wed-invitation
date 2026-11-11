/* =========================================================
   INTIMATE WEDDING — config for /intimate/
   Photos and music are shared with the main invitation (../assets/).
   ========================================================= */
window.WEDDING = {
  groom: "Phùng Việt Anh",
  bride: "Đinh Hương Giang",
  groomShort: "Việt Anh",          // used on polaroids, the seal and the countdown
  brideShort: "Hương Giang",

  // Guests see "Thân mời <name>" from links like …/intimate/?name=anh%20Tuấn
  defaultGuest: "Quý vị & Gia đình",

  date: "2026-12-16",              // YYYY-MM-DD — update if the intimate dinner is on another day
  time: "18:00",                   // HH:mm, 24h — placeholder
  utcOffset: "+07:00",
  lunar: "Nhằm ngày 08 tháng 11 năm Bính Ngọ",

  parents: {
    groom: ["Ông Phùng …", "Bà …"],  // placeholders
    bride: ["Ông Đinh …", "Bà …"]
  },

  event: {
    title: "Tiệc cưới thân mật",
    venue: "Trung tâm Tiệc cưới & Hội nghị Mipec Palace",
    hall: "Sảnh 2",
    address: "229 Tây Sơn, phường Kim Liên, Hà Nội",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Mipec+Palace+229+T%C3%A2y+S%C6%A1n+Kim+Li%C3%AAn+H%C3%A0+N%E1%BB%99i"
  },

  // Program of the evening (placeholders — edit freely, add or remove rows)
  schedule: [
    ["17:30", "Đón khách"],
    ["18:00", "Lễ thành hôn"],
    ["18:30", "Dùng tiệc"],
    ["19:30", "Chia sẻ & nâng ly"],
    ["20:30", "Chụp ảnh kỷ niệm"]
  ],
  dressCode: ["#ffffff", "#d8cbbb", "#6b1526"],   // "" or [] to hide

  photos: {
    envelope: "../assets/photos/cover.webp",      // polaroid tucked under the envelope
    saveDate: "../assets/photos/forest-1.webp",
    groom: "../assets/photos/gift-groom.webp",
    bride: "../assets/photos/gift-bride.webp",
    album: [
      "../assets/photos/gallery-1.webp", "../assets/photos/gallery-3.webp",
      "../assets/photos/gallery-4.webp", "../assets/photos/gallery-5.webp",
      "../assets/photos/city-1.webp", "../assets/photos/date.webp"
    ],
    thanks: "../assets/photos/closing.webp"
  },

  /* RSVP. Leave endpoint "" to send replies by Zalo instead: the reply text is
     copied and Zalo opens for `zalo` (a phone number). To collect replies in a
     Google Sheet, paste your Apps Script web-app URL — see README. */
  rsvp: {
    endpoint: "",
    zalo: ""                        // e.g. "0912345678"
  },

  banks: [
    { who: "groom", name: "Vietcombank", number: "0000000000", owner: "NGUYEN VAN A", qr: "../assets/qr/groom.webp" },
    { who: "bride", name: "Techcombank", number: "0000000000", owner: "TRAN THI B",  qr: "../assets/qr/bride.webp" }
  ],

  music: "../assets/music/song.mp3",
  musicTitle: "小幸運 · A Little Happiness (Piano)"
};
