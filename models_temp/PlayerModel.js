const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../connectDB.js");

class Players extends Model {}

Players.init(
  {
    name: {
      type: DataTypes.STRING,
    },
    email: {
      type: DataTypes.STRING,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
    },
    admin: {
      type: DataTypes.BOOLEAN,
    },
  },
  {
    sequelize,
  }
);

module.exports = Players;

Players.sync();
