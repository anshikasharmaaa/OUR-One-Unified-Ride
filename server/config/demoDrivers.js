"use strict";
const hash = require("../utils/hash");
// FICTIONAL people and plates for the simulated booking only. The UI always labels them "Demo driver".
const POOL = {
  bike: [
    { name: "Aman Jaiswal", vehicleModel: "Honda Shine 125" },
    { name: "Deepak Rawat", vehicleModel: "TVS Apache 160" },
  ],
  auto: [
    { name: "Ramesh Solanki", vehicleModel: "Bajaj RE Auto" },
    { name: "Kishore Yadav", vehicleModel: "Piaggio Ape Auto" },
  ],
  economy_cab: [
    { name: "Imran Qureshi", vehicleModel: "Maruti Dzire" },
    { name: "Vikas Chouhan", vehicleModel: "Hyundai Aura" },
  ],
  premium_cab: [
    { name: "Harpreet Sethi", vehicleModel: "Toyota Innova Crysta" },
    { name: "Nikhil Bhatt", vehicleModel: "Honda City" },
  ],
};
function pickDriver(vehicleType, seed) {
  const list = POOL[vehicleType];
  if (!list) return null;
  const h = hash(seed);
  return {
    ...list[h % list.length],
    rating: Number((4.5 + (h % 5) / 10).toFixed(1)), // fictional
    plate: `MP 09 DM ${1000 + (h % 9000)}`, // fictional
    isSimulated: true,
  };
}
module.exports = { pickDriver };
