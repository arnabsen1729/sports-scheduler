"use strict";
const { Model, Op } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Players extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Players.hasMany(models.Sessions, {
        foreignKey: "createdBy",
        as: "createdSessions",
      });

      Players.belongsToMany(models.Sessions, {
        through: "SessionPlayers",
        foreignKey: "PlayerId",
        as: "sessions",
      });
    }

    static async getPlayers() {
      const players = await Players.findAll();
      return players;
    }

    static async addPlayer(
      playerName,
      playerEmail,
      playerPassword,
      playerRole
    ) {
      const newPlayer = await Players.create({
        name: playerName,
        email: playerEmail,
        password: playerPassword,
        role: playerRole,
      });
      return newPlayer;
    }

    async getUpcomingSessions() {
      const sessions = await this.getSessions({
        where: {
          date: {
            [Op.gte]: new Date(),
          },
        },
      });
      return sessions;
    }

    async getUpcomingSessionsBySport(sportId) {
      const sessions = await this.getSessions({
        where: {
          date: {
            [Op.gte]: new Date(),
          },
        },
        include: [
          {
            model: sequelize.models.Sports,
            as: "sport",
            where: {
              id: sportId,
            },
          },
        ],
      });
      return sessions;
    }

    async getPastSessionsBySport(sportId) {
      const sessions = await this.getSessions({
        where: {
          date: {
            [Op.lt]: new Date(),
          },
        },
        include: [
          {
            model: sequelize.models.Sports,
            as: "sport",
            where: {
              id: sportId,
            },
          },
        ],
      });

      return sessions;
    }
  }
  Players.init(
    {
      name: DataTypes.STRING,
      email: DataTypes.STRING,
      password: DataTypes.STRING,
      role: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "Players",
    }
  );
  return Players;
};
