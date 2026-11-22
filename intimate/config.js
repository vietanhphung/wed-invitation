/* =========================================================
   INTIMATE WEDDING CONFIG (Tam Đảo, 12/12/2026) — standalone; edit everything here.
   (Plain JS instead of JSON so the page also works when you
   just double-click index.html, without a web server.)
   ========================================================= */
window.WEDDING = {
  pageTitle: "Thiệp mời",
  calendarTitle: "Tiệc cưới thân mật",
  eventHours: 6,               // calendar entry 15:15 → 21:15

  groom: "Phùng Việt Anh",
  bride: "Đinh Hương Giang",

  // Ceremony date & time (local time at the venue)
  date: "2026-12-12",          // YYYY-MM-DD
  time: "15:15",               // HH:mm, 24h — the ceremony
  utcOffset: "+07:00",         // Vietnam = +07:00, Toronto = -05:00 (winter)
  lunar: "Tức ngày 04 tháng 11 năm Bính Ngọ (âm lịch)", // "" to hide

  // Written in the couple's voice. {guest} becomes ?call= (Xưng Danh), else ?name=, else "Bạn"
  // "chúng mình" becomes "chúng em" when ?call= starts with anh/chị/thầy/cô/chú…; ?self= overrides
  invite: "Chúng mình trân trọng mời {guest} tới chung vui trong buổi tiệc cưới thân mật của Việt Anh & Hương Giang tại Tam Đảo.",

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

  // Wedding venue
  venues: [
    {
      label: "Nơi tổ chức",
      name: "The Black and White Villa",
      hall: "",                 // optional
      address: "Center Road, Tam Đảo, Phú Thọ",
      time: "",
      mapsUrl: "https://www.google.com/maps?q=The+Black+and+White+Villa,+Center+Road,+Tam+%C4%90%E1%BA%A3o,+Ph%C3%BA+Th%E1%BB%8D&ftid=0x3134e72bbeffc693:0x38469b5a6fb5c19c"
    }
  ],

  // No RSVP form for the intimate dinner yet (the section is not on this page).
  rsvp: { forms: {} },

  // Lịch trình — `day` marks an entry on another day
  schedule: [
    { time: "13:30", title: "Xe đón khách tại Hà Nội", note: "Khởi hành lên Tam Đảo" },
    { time: "15:15", title: "Lễ Vows", note: "Trao lời thề nguyện & trò chơi gắn kết" },
    { time: "18:00", title: "Tiệc tối", note: "Tiệc buffet tại villa" },
    { time: "20:00", title: "Xe đưa khách về Hà Nội", note: "Dành cho khách về trong ngày" },
    { time: "21:00", title: "Tiệc sau cưới", note: "Bể bơi, xông hơi, karaoke, bi-a…" },
    { time: "10:30", day: "13/12", title: "Xe đưa khách về Hà Nội", note: "Dành cho khách nghỉ lại qua đêm" }
  ],

  // Thực đơn — [Vietnamese name, French name]
  menu: [
    { course: "Khai vị", dishes: [
      ["Súp kem bí đỏ với ba chỉ xông khói nướng giòn", "Soupe crème de potiron au bacon croustillant"],
      ["Sa lát tôm, xoài, bưởi và rau rocket", "Salade de crevettes à la mangue, pamplemousse et roquette"],
      ["Sa lát rau củ sốt dầu giấm balsamic", "Salade de crudités"],
      ["Phở cuốn", "Rouleaux de phở au bœuf"]
    ] },
    { course: "Đồ nguội", dishes: [
      ["Pa tê đồng quê và thịt heo rillettes", "Pâté de campagne et rillettes de porc"],
      ["Xúc xích Lyon, xúc xích tỏi, salami và chorizo", "Rosette de Lyon, saucisson à l'ail, salami, chorizo"],
      ["Bánh mì với bơ ớt ngọt", "Pain et beurre au piment doux confit"]
    ] },
    { course: "Món chính", dishes: [
      ["Bò hầm vang đỏ kiểu Bourgogne", "Bœuf bourguignon"],
      ["Gà ta quay rút xương sốt hạt dẻ", "Poulet rôti désossé, sauce aux marrons"],
      ["Cá hồi áp chảo sốt bơ nâu chanh leo", "Filet de saumon poêlé, beurre noisette et fruit de la passion"]
    ] },
    { course: "Món ăn kèm", dishes: [
      ["Đậu Pháp xào tỏi", "Haricots verts sautés à l'ail"],
      ["Khoai tây bi chiên bơ", "Pommes rissolées"],
      ["Mì Ý sốt carbonara", "Spaghetti carbonara"]
    ] },
    { course: "Tráng miệng", dishes: [
      ["Bánh mousse dâu tây và sô-cô-la", "Mousse de fraises et chocolat"],
      ["Bánh tart chanh", "Tartelette au citron"],
      ["Đĩa trái cây nhiệt đới", "Plateau de fruits exotiques"]
    ] },
    { course: "Đồ uống", dishes: [
      ["Nước ép táo · Nước ép cam · Nước khoáng", ""]
    ] }
  ],

  // Tiện ích tại villa (shown in "Lời thương mến")
  amenities: [
    { label: "Bể bơi", photo: "../assets/photos/villa-pool.webp" },
    { label: "Sân pickleball", photo: "../assets/photos/villa-pickleball.webp" },
    { label: "Phòng xông hơi", photo: "../assets/photos/villa-sauna.webp" },
    { label: "Karaoke & bi-a", photo: { src: "../assets/photos/villa-karaoke.webp", pos: "38% 50%" } },   // karaoke corner + pool table
    { label: "Phòng ngủ", photo: "../assets/photos/villa-bedroom.webp" }
  ],

  // Bride & groom photos in "Lời thương mến" (bank details are not shown on this page)

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
