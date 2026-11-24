/* =========================================================
   WEDDING CONFIG — edit everything about your invitation here.
   (Plain JS instead of JSON so the page also works when you
   just double-click index.html, without a web server.)
   ========================================================= */
window.WEDDING = {
  groom: "Phùng Việt Anh",
  bride: "Đinh Hương Giang",

  // Ceremony date & time (local time at the venue)
  date: "2026-12-19",          // YYYY-MM-DD
  time: "09:00",                 // HH:mm, 24h
  utcOffset: "+07:00",         // Vietnam = +07:00, Toronto = -05:00 (winter)
  lunar: "Tức ngày 11 tháng 11 năm Bính Ngọ (âm lịch)", // "" to hide

  // Written in the parents' voice. {guest} becomes ?call= (Xưng Danh), else ?name=, else "Quý khách"
  invite: "Trân trọng kính mời {guest} tới chung vui với gia đình chúng tôi nhân ngày Việt Anh & Hương Giang về chung một nhà.",

  // The story, told in two places
  chapters: [
    {
      number: "I",
      place: "Toronto, Canada",
      title: ["Nơi", "thành phố"],
      text: "Khi Paris lên đèn, Toronto vẫn còn đón nắng. Giữa hai thành phố, hai nhịp sống và một đại dương xa cách, tình yêu của chúng mình lớn lên từ những cuộc gọi xuyên đêm, những lời hẹn ngày gặp lại và cả những tháng ngày chờ đợi."
    },
    {
      number: "II",
      place: "Vườn quốc gia Algonquin, Canada",
      title: ["Giữa", "rừng phong"],
      text: "Rồi mùa thu đến, nhuộm đỏ những cánh rừng phong nơi Toronto. Sau những tháng ngày yêu thương qua hai thành phố, qua những múi giờ và cả một đại dương xa cách, chúng mình nhận ra rằng, chẳng quan trọng hành trình đưa ta đến đâu, miễn là từ nay luôn có nhau đồng hành."
    }
  ],
  quote: ["Và rồi, mọi con đường", "đều dẫn", "về nhau."], // last part is the accent

  /* Photos — each entry is a path, or { src, pos } where pos is the focal
     point used when cropping, e.g. "50% 30%" (lower 2nd number = show more top).
     Originals live in photos/<same name>.jpg; rebuild with tools/rebuild_photos.sh */
  photos: {
    cover:   { src: "../assets/photos/hero.webp",    pos: "33% 50%" },   // first section (HY704980, under the veil)
    city:    ["../assets/photos/city-1.webp", "../assets/photos/city-2.webp"],
    forest:  ["../assets/photos/forest-1.webp", "../assets/photos/forest-2.webp"],
    wide:    { src: "../assets/photos/wide.webp",    pos: "50% 62%" },
    date:    { src: "../assets/photos/date.webp",    pos: "50% 50%" },
    closing: { src: "../assets/photos/closing.webp", pos: "50% 72%" },
    // gift cards (tall arch frames)
    giftGroom: { src: "../assets/photos/gift-groom.webp", pos: "50% 50%" },
    giftBride: { src: "../assets/photos/gift-bride.webp", pos: "50% 50%" },
    /* Album. The layout repeats every 6 photos: [tall, WIDE] [tall, tall, tall] [PANORAMA],
       so horizontal shots work best in positions 2, 6 and 8; leftover photos fill the last row. */
    gallery: [
      "../assets/photos/gallery-7.webp",                           // 1  veil walk (HY704916)
      { src: "../assets/photos/gallery-10.webp", pos: "35% 60%" }, // 2  wine bar, toast    (wide)
      "../assets/photos/gallery-8.webp",                           // 3  Osgoode courtyard
      "../assets/photos/gallery-9.webp",                           // 4  City Hall twirl
      { src: "../assets/photos/gallery-12.webp", pos: "50% 65%" }, // 5  Osgoode walk
      { src: "../assets/photos/gallery-6.webp",  pos: "50% 60%" }, // 6  City Hall ramp    (panorama)
      "../assets/photos/gallery-14.webp",                          // 7  bouquet & shoes in the sky
      { src: "../assets/photos/gallery-5.webp",  pos: "50% 60%" }, // 8  throwing leaves
      {src:"../assets/photos/gallery-16.webp",   pos: "50% 60%" },                          // 9  (add photo later)
      { src: "../assets/photos/gallery-15.webp", pos: "50% 72%" }  // 10 maple road        (panorama, last row)
    ]
  },

  // Wedding venue (add more objects to list several places)
  venues: [
    {
      label: "Lễ thành hôn",
      name: "Tư gia nhà trai",
      hall: "",                 // optional
      address: "Số 8 đường 4A, thôn Đông Thành, Hát Môn, Hà Nội",
      time: "9:00 · Thứ Bảy, 19.12.2026",
      mapsUrl: "https://maps.app.goo.gl/d161Go6gmjX9RSTW7"
    },
    {
      label: "Tiệc cưới",
      name: "Trung tâm Văn hóa – Thể thao xã Hát Môn",
      hall: "",
      address: "Thôn Tiền Giang, Hát Môn, Hà Nội",
      time: "10:00 · Thứ Bảy, 19.12.2026",
      mapsUrl: "https://www.google.com/maps/place/Trung+T%C3%A2m+V%C4%83n+Ho%C3%A1+-+Th%E1%BB%83+Thao+X%C3%A3+H%C3%A1t+M%C3%B4n/@21.1280849,105.6159094,17z/data=!4m6!3m5!1s0x3134f90051d1120b:0x503c11a51c5fed38!8m2!3d21.1280849!4d105.6159094!16s%2Fg%2F11xlmkyqpv"
    }
  ],

  // Gift accounts. QR images go in ../assets/qr/ (leave qr "" to hide the image)
  // No RSVP on this page.
  rsvp: { forms: {} },

  banks: [
    { who: "groom", name: "Vietcombank", number: "0000000000", owner: "NGUYEN VAN A", qr: "../assets/qr/groom.webp" },
    { who: "bride", name: "Techcombank", number: "0000000000", owner: "TRAN THI B",  qr: "../assets/qr/bride.webp" }
  ],

  // Background music: put an mp3 in ../assets/music/ ("" to hide the player)
  music: "../assets/music/song.mp3",
  musicTitle: "50 năm về sau - Piano",
  musicStart: 0,              // seconds — jump straight to the chorus

  leaves: true                // a few slow falling maple leaves
};
