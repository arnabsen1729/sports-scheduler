const db = require("../models/index.js");

const getAllSports = async () => {
  const sports = await db.Sports.findAll();
  return sports;
};

const addSport = async (sportName) => {
  const newSport = await db.Sports.create({ name: sportName });
  return newSport;
};

(async () => {
  const allSports = await getAllSports();
  console.log(allSports);
  const newSport = await addSport("Tennis");
  console.log(newSport);
  const allSports2 = await getAllSports();
  console.log(allSports2);
})();
