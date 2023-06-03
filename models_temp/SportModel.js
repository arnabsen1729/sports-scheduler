const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../connectDB.js");

class Sports extends Model {}

Sports.init(
  {
    name: {
      type: DataTypes.STRING,
      unique: true,
    },
  },
  {
    sequelize,
  }
);

module.exports = Sports;

Sports.sync();
