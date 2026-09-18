// Nepal's federal administrative divisions: 7 provinces and the 77 districts
// under them, as constituted after the 2017 restructuring.
//
// An address on a Nepali KYC or proposal form is written as district,
// municipality/rural municipality, ward number and tole — so the district has
// to come from this list rather than a free-text box, or the same district
// arrives spelled five ways and the address stops being an identifier at all.
//
// Names are the common English romanisations used on government forms. Two
// districts were split out of the old Nawalparasi and Rukum and are still
// often written the old way, so both carry their conventional qualifier:
// Nawalpur and Parasi (from Nawalparasi), Rukum East and Rukum West.
export const PROVINCES = [
  {
    id: "koshi",
    name: "Koshi",
    districts: [
      "Bhojpur", "Dhankuta", "Ilam", "Jhapa", "Khotang", "Morang", "Okhaldhunga",
      "Panchthar", "Sankhuwasabha", "Solukhumbu", "Sunsari", "Taplejung",
      "Terhathum", "Udayapur",
    ],
  },
  {
    id: "madhesh",
    name: "Madhesh",
    districts: [
      "Bara", "Dhanusha", "Mahottari", "Parsa", "Rautahat", "Saptari",
      "Sarlahi", "Siraha",
    ],
  },
  {
    id: "bagmati",
    name: "Bagmati",
    districts: [
      "Bhaktapur", "Chitwan", "Dhading", "Dolakha", "Kathmandu", "Kavrepalanchok",
      "Lalitpur", "Makwanpur", "Nuwakot", "Ramechhap", "Rasuwa", "Sindhuli",
      "Sindhupalchok",
    ],
  },
  {
    id: "gandaki",
    name: "Gandaki",
    districts: [
      "Baglung", "Gorkha", "Kaski", "Lamjung", "Manang", "Mustang", "Myagdi",
      "Nawalpur", "Parbat", "Syangja", "Tanahun",
    ],
  },
  {
    id: "lumbini",
    name: "Lumbini",
    districts: [
      "Arghakhanchi", "Banke", "Bardiya", "Dang", "Gulmi", "Kapilvastu",
      "Palpa", "Parasi", "Pyuthan", "Rolpa", "Rukum East", "Rupandehi",
    ],
  },
  {
    id: "karnali",
    name: "Karnali",
    districts: [
      "Dailekh", "Dolpa", "Humla", "Jajarkot", "Jumla", "Kalikot", "Mugu",
      "Rukum West", "Salyan", "Surkhet",
    ],
  },
  {
    id: "sudurpashchim",
    name: "Sudurpashchim",
    districts: [
      "Achham", "Baitadi", "Bajhang", "Bajura", "Dadeldhura", "Darchula",
      "Doti", "Kailali", "Kanchanpur",
    ],
  },
];

export const ALL_DISTRICTS = PROVINCES.flatMap((p) => p.districts).sort();

export function districtsOf(provinceId) {
  return PROVINCES.find((p) => p.id === provinceId)?.districts ?? [];
}

export function provinceOfDistrict(district) {
  return PROVINCES.find((p) => p.districts.includes(district))?.id ?? "";
}
