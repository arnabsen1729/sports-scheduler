const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../connectDB.js");

class Sessions extends Model {}

Sessions.init(
  {
    sportId: {
      type: DataTypes.INTEGER,
      foreignKey: {
        references: {
          table: "sports",
          column: "id",
        },
      },
    },
    date: {
      type: DataTypes.DATE,
    },
    time: {
      type: DataTypes.TIME,
    },
    venue: {
      type: DataTypes.STRING,
    },
    createdBy: {
      type: DataTypes.INTEGER,
      foreignKey: {
        references: {
          table: "players",
          column: "id",
        },
      },
    },
    players: {
      type: DataTypes.ARRAY(DataTypes.INTEGER),
    },
    maxPlayers: {
      type: DataTypes.INTEGER,
    },
  },
  {
    sequelize,
  }
);

module.exports = Sessions;

Sessions.sync();
