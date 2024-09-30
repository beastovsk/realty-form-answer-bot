// models.js
const { Sequelize, DataTypes } = require("sequelize");
require("dotenv").config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
	dialect: "postgres",
	dialectOptions: {
		ssl: {
			require: true,
			rejectUnauthorized: false, // Set this to 'true' if you have proper certificates
		},
	},
	logging: false, // Disable logging; set to true to enable SQL query logging
});

const User = sequelize.define("User", {
	id: {
		type: DataTypes.STRING,
		unique: true,
		allowNull: false,
		primaryKey: true,
	},
	telegramId: {
		type: DataTypes.STRING, // Используй STRING, если id Telegram может быть большим числом
		unique: true, // Каждый telegramId должен быть уникальным
		allowNull: false,
	},
	isSubscribed: {
		type: DataTypes.BOOLEAN,
		defaultValue: false,
	},
	subscriptionPlan: {
		type: DataTypes.STRING,
		defaultValue: null,
	},
	subscriptionStarts: {
		type: DataTypes.DATE,
		defaultValue: null,
	},
	subscriptionEnds: {
		type: DataTypes.DATE,
		defaultValue: null,
	},
	questions: {
		type: DataTypes.ARRAY(DataTypes.STRING),
		defaultValue: [],
	},
});

const Requests = sequelize.define("Requests", {
	date: {
		type: DataTypes.DATE,
	},
	answers: {
		type: DataTypes.ARRAY(DataTypes.JSON),
	},
	ownerId: {
		type: DataTypes.STRING, // Должен совпадать с типом id из User
		allowNull: false,
	},
	sender: {
		type: DataTypes.STRING,
	},
});

User.hasMany(Requests, { foreignKey: "ownerId" });
Requests.belongsTo(User, { foreignKey: "ownerId" });

module.exports = { sequelize, User, Requests };
