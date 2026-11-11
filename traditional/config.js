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

  // {guest} becomes the name from the link (…/?name=anh%20Tuấn), or "bạn" when there is none
  invite: "Trân trọng kính mời {guest} đến chung vui cùng gia đình hai bên trong ngày chúng mình về chung một nhà.",

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
       so horizontal shots work best in positions 2, 6, 8, 12, 14. */
    gallery: [
      "../assets/photos/gallery-1.webp",                           // 1  under the veil
      { src: "../assets/photos/gallery-2.webp",  pos: "30% 60%" }, // 2  wine bar          (wide)
      "../assets/photos/gallery-8.webp",                           // 3  Osgoode courtyard
      "../assets/photos/gallery-4.webp",                           // 4  close-up
      "../assets/photos/gallery-9.webp",                           // 5  City Hall twirl
      { src: "../assets/photos/gallery-13.webp", pos: "50% 55%" }, // 6  streetcar tracks   (panorama)
      "../assets/photos/gallery-7.webp",                           // 7  veil walk
      { src: "../assets/photos/gallery-10.webp", pos: "35% 60%" }, // 8  wine bar, toast    (wide)
      { src: "../assets/photos/gallery-12.webp", pos: "50% 65%" }, // 9  Osgoode walk
      { src: "../assets/photos/gallery-15.webp", pos: "50% 65%" }, // 10 maple road
      { src: "../assets/photos/gallery-11.webp", pos: "50% 60%" }, // 11 through the door
      { src: "../assets/photos/gallery-6.webp",  pos: "50% 60%" }, // 12 City Hall ramp    (panorama)
      "../assets/photos/gallery-14.webp",                          // 13 bouquet & shoes in the sky
      { src: "../assets/photos/gallery-5.webp",  pos: "50% 60%" }  // 14 throwing leaves   (wide)
    ]
  },

  // Wedding venue (add more objects to list several places)
  venues: [
    {
      label: "Nơi tổ chức tiệc cưới",
      name: "Trung tâm Tiệc cưới & Hội nghị Mipec Palace",
      hall: "Sảnh 2",           // optional
      address: "229 Tây Sơn, phường Kim Liên, Hà Nội",
      time: "",                 // optional, e.g. "10:00 · Đón khách"
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Mipec+Palace+229+T%C3%A2y+S%C6%A1n+Kim+Li%C3%AAn+H%C3%A0+N%E1%BB%99i"
    }
  ],

  // Gift accounts. QR images go in ../assets/qr/ (leave qr "" to hide the image)
  banks: [
    { who: "groom", name: "Vietcombank", number: "0000000000", owner: "NGUYEN VAN A", qr: "../assets/qr/groom.webp" },
    { who: "bride", name: "Techcombank", number: "0000000000", owner: "TRAN THI B",  qr: "../assets/qr/bride.webp" }
  ],

  // Background music: put an mp3 in ../assets/music/ ("" to hide the player)
  music: "../assets/music/song.mp3",
  musicTitle: "小幸運 · A Little Happiness (Piano)",
  musicStart: 0,              // seconds — jump straight to the chorus

  leaves: true                // a few slow falling maple leaves
};
