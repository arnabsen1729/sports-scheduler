"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Sessions extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Sessions.belongsTo(models.Players, {
        foreignKey: "createdBy",
        as: "creator",
      });

      Sessions.belongsTo(models.Sports, {
        foreignKey: "sportId",
        as: "sport",
      });

      Sessions.belongsToMany(models.Players, {
        through: "SessionPlayers",
        foreignKey: "SessionId",
        as: "players",
      });
    }

    static async getSessions() {
      const sessions = await Sessions.findAll();
      return sessions;
    }

    static async addSession(
      date,
      time,
      venue,
      playerCount,
      createdBy,
      sportId,
      players
    ) {
      const newSession = await Sessions.create({
        date: date,
        time: time,
        venue: venue,
        playerCount: playerCount,
        createdBy: createdBy,
        sportId: sportId,
      });

      const sessionPlayers = players.map((player) => {
        return {
          SessionId: newSession.id,
          PlayerId: player,
        };
      });

      await sequelize.models.SessionPlayers.bulkCreate(sessionPlayers);

      return newSession;
    }
  }
  Sessions.init(
    {
      date: DataTypes.DATE,
      time: DataTypes.TIME,
      venue: DataTypes.STRING,
      playerCount: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "Sessions",
    }
  );
  return Sessions;
};
