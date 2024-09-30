const { Bot, session } = require("grammy");
const { sequelize, User, Requests } = require("./models");
require("dotenv").config();

const bot = new Bot(process.env.BOT_TOKEN);

function initial() {
	return {
		answers: [],
		currentQuestionIndex: 0,
		questions: [],
		telegramId: null,
	};
}

bot.use(session({ initial }));

sequelize.sync().then(() => console.log("Database synced"));
(async () => {
	await sequelize.sync({ alter: true });
})();

bot.command("start", async (ctx) => {
	const telegramId = ctx.match; // Извлекаем telegramId из команды
	console.log(ctx);
	console.log(bot);
	let user = await User.findOne({ where: { telegramId } });

	if (!user || !telegramId) {
		return await ctx.reply("Некорректная ссылка");
	}

	if (!user.isSubscribed) {
		return await ctx.reply("Тариф не подключен");
	}

	const questions = user.questions;

	if (!questions || questions.length === 0) {
		return ctx.reply("Список вопросов пуст.");
	}

	// Сохраняем вопросы в сессии
	ctx.session.questions = questions;
	ctx.session.telegramId = telegramId;

	// Начинаем с первого вопроса
	await askQuestion(ctx, 0, questions);
});

// Функция для задавания вопросов
async function askQuestion(ctx, questionIndex) {
	const questions = ctx.session.questions; // Берем вопросы из сессии
	const telegramId = ctx.session.telegramId;
	console.log(ctx.from);
	if (questionIndex >= questions.length) {
		// Все вопросы заданы, формируем заявку
		ctx.reply("Спасибо за ваши ответы! Создаем заявку...");
		await createRequest(ctx.session.answers, telegramId, ctx.from.username);
		return;
	}

	// Задаем текущий вопрос
	await ctx.reply(questions[questionIndex]);

	// Сохраняем текущий индекс вопроса в сессии
	ctx.session.currentQuestionIndex = questionIndex;
}

// Обработка ответов на вопросы
bot.on("message", async (ctx) => {
	// Получаем индекс текущего вопроса из сессии
	const questionIndex = ctx.session.currentQuestionIndex;

	if (questionIndex === undefined) return; // Если индекс не установлен, выходим

	// Сохраняем ответ пользователя
	ctx.session.answers.push({
		question: ctx.session.questions[questionIndex], // Сохраняем сам вопрос и ответ
		response: ctx.message.text,
	});

	// Переходим к следующему вопросу
	await askQuestion(ctx, questionIndex + 1);
});

// Функция для создания заявки на сервер
async function createRequest(answers, ownerId, sender) {
	// Создаем заявку
	await Requests.create({
		date: new Date(),
		answers: answers,
		ownerId: ownerId,
		sender,
	});

	// Подтверждение пользователю
	bot.api.sendMessage(ownerId, "Ваша заявка успешно создана!");
}

// Запуск бота
bot.start();
