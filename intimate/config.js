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
  defaultGuest: "Bạn và Gia đình",       // shown on the cover / invitation when there's no name
  defaultGuestInText: "bạn và gia đình", // used inside sentences (thank-you message)

  date: "2026-12-12",              // YYYY-MM-DD
  time: "15:00",                   // HH:mm, 24h
  utcOffset: "+07:00",
  lunar: "Nhằm ngày 04 tháng 11 năm Bính Ngọ",

  event: {
    title: "Tiệc cưới thân mật",
    venue: "The Black and White Villa",
    hall: "",                        // optional, e.g. a room or garden name
    address: "Center Road, Tam Đảo, Phú Thọ",
    mapsUrl: "https://www.google.com/maps?q=The+Black+and+White+Villa,+Center+Road,+Tam+%C4%90%E1%BA%A3o,+Ph%C3%BA+Th%E1%BB%8D&ftid=0x3134e72bbeffc693:0x38469b5a6fb5c19c"
  },

  // Program of the day (add or remove rows freely)
  schedule: [
    ["11:00 – 13:00", "Lên xe đoàn"],
    ["15:00", "Lễ thành hôn"],
    ["18:00", "Dùng tiệc"]
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
    thanks: { src: "../assets/photos/closing.webp", pos: "47% 50%" }   // pos centres the couple on narrow screens
  },

  music: "../assets/music/song.mp3",
  musicTitle: "小幸運 · A Little Happiness (Piano)"
};
