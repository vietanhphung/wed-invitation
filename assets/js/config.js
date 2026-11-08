/* =========================================================
   WEDDING CONFIG — edit everything about your invitation here.
   (Plain JS instead of JSON so the page also works when you
   just double-click index.html, without a web server.)
   ========================================================= */
window.WEDDING = {
  groom: "Phùng Việt Anh",
  bride: "Đinh Hương Giang",

  // Ceremony date & time (local time at the venue)
  date: "2026-12-16",          // YYYY-MM-DD
  time: "10:00",               // HH:mm, 24h — placeholder, update with the real time
  utcOffset: "+07:00",         // Vietnam = +07:00, Toronto = -05:00 (winter)
  lunar: "Tức ngày 08 tháng 11 năm Bính Ngọ (âm lịch)", // "" to hide

  invite: "Trân trọng kính mời bạn đến chung vui cùng gia đình hai bên trong ngày chúng mình về chung một nhà.",

  // The story, told in two places
  chapters: [
    {
      number: "I",
      place: "Toronto, ON",
      title: ["Giữa", "thành phố"],
      text: "Giữa những con phố đông người và ánh đèn không bao giờ tắt, chúng mình tìm thấy nhau — một nhịp sống vội vàng bỗng chậm lại."
    },
    {
      number: "II",
      place: "Algonquin Park",
      title: ["Giữa", "rừng phong"],
      text: "Rồi mùa thu đến, lá phong đỏ rực cả cánh rừng. Chúng mình hiểu rằng, đi đâu cũng được, miễn là đi cùng nhau."
    }
  ],
  quote: ["Và rồi, mọi con đường", "đều dẫn", "về nhau."], // last part is the accent

  /* Photos — each entry is a path, or { src, pos } where pos is the focal
     point used when cropping, e.g. "50% 30%" (lower 2nd number = show more top).
     Originals live in photos/<same name>.jpg; rebuild with tools/rebuild_photos.sh */
  photos: {
    cover:   { src: "assets/photos/cover.webp",   pos: "50% 45%" },
    city:    ["assets/photos/city-1.webp", "assets/photos/city-2.webp"],
    forest:  ["assets/photos/forest-1.webp", "assets/photos/forest-2.webp"],
    wide:    { src: "assets/photos/wide.webp",    pos: "50% 62%" },
    date:    { src: "assets/photos/date.webp",    pos: "50% 50%" },
    closing: { src: "assets/photos/closing.webp", pos: "50% 72%" },
    // gift cards (tall arch frames)
    giftGroom: { src: "assets/photos/gift-groom.webp", pos: "50% 50%" },
    giftBride: { src: "assets/photos/gift-bride.webp", pos: "50% 50%" },
    gallery: [
      "assets/photos/gallery-1.webp",                          // under the veil
      { src: "assets/photos/gallery-2.webp", pos: "30% 60%" }, // wine bar
      "assets/photos/gallery-3.webp",                          // forest kiss
      "assets/photos/gallery-4.webp",                          // close-up
      "assets/photos/gallery-5.webp",                          // throwing leaves
      { src: "assets/photos/gallery-6.webp", pos: "50% 60%" }  // City Hall ramp
    ]
  },

  // Wedding venue (add more objects to list several places)
  venues: [
    {
      label: "Nơi tổ chức tiệc cưới",
      name: "Tên nhà hàng / trung tâm tiệc cưới",
      address: "Số nhà, đường, phường / xã, tỉnh / thành phố",
      time: "",                 // optional, e.g. "10:00 · Đón khách"
      mapsUrl: ""               // Google Maps link — the "Chỉ đường" button appears once set
    }
  ],

  // Gift accounts. QR images go in assets/qr/ (leave qr "" to hide the image)
  banks: [
    { who: "groom", name: "Vietcombank", number: "0000000000", owner: "NGUYEN VAN A", qr: "assets/qr/groom.webp" },
    { who: "bride", name: "Techcombank", number: "0000000000", owner: "TRAN THI B",  qr: "assets/qr/bride.webp" }
  ],

  // Background music: put an mp3 in assets/music/ ("" to hide the player)
  music: "assets/music/song.mp3",
  musicTitle: "小幸運 · A Little Happiness (Piano)",
  musicStart: 0,              // seconds — jump straight to the chorus

  leaves: true                // a few slow falling maple leaves
};
