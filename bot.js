const { TOKEN, GRP_ID } = require('./.secret.js')
const { Telegraf, Markup } = require('telegraf') // TODO: add buttons with Markup
const Extra = require('telegraf/extra')
const Web3 = require('web3')
const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')
const request = require('request')

// bscscan API
const bscscanapi = 'https://api.bscscan.com/api'

// address for the yCAKE Agora Token contract
const contract_address = '0xB32e35AfFc06FB8928537a64dc8BdE18d4d720b9'
const groupName = 'yCAKE Gang'
const tokenName = 'yCAKE'

// the yCAKE token contract
let contract

// this helps us use markdown in our messages
const markdown = Extra.markdown()

// initializing the chatbot with our API token
const bot = new Telegraf(TOKEN)

// telegram client instance
const tg = bot.telegram

// initializing the lowdb database
const adapter = new FileSync('db.json')
const db = low(adapter)

// setting some defaults (required if your JSON file is empty)
// stores the "ring" (access level) of a user
db.defaults({ rings: [] }).write()

// TODO: database for groups
// - group id
// - token contract address

// TODO: added to a group
// - if bot is added to a group, it has to ask for contract address
// - only an admin can update the contract address

// TODO: on new user
// - every user has to select a group from a list in the private cat with the bot
// - if the user is visiting the bot from the website of a community, this step is skipped
// - the user is added to a group if they has invested enough tokens

/**
 * Simple helper function to make API requests
 * @param url is the url we want to fetch data from
 * @returns response body
 */
function doRequest(url) {
	return new Promise(function (resolve, reject) {
		request(url, function (error, res, body) {
			if (!error && res.statusCode == 200)
				resolve(JSON.parse(JSON.parse(body).result))
			else
				reject(error)
		})
	})
}

// simple helper to wrap the initialization of web3 and the token contract
async function initContract() {
	// initializing web3 with the address of the BSC mainnet
	const web3 = new Web3(new Web3.providers.HttpProvider('https://bsc-dataseed1.binance.org:443'))

	// getting contract abi
	const abi = await doRequest(`${bscscanapi}?module=contract&action=getabi&address=${contract_address}`)

	// initializing the yCAKE contract
	contract = new web3.eth.Contract(abi, contract_address)
}

/**
 * Simple helper function to get the address of a user
 * @param userId is the id of the user
 * @returns the address of the given user
 */
async function getUserAddress(userId) {
	const val = await db.get('accounts')
	.find({ id: userId.toString() })
	.value()

	return (val === undefined) ? undefined : val.address
}

/**
 * Simple helper function to get the access level of a user
 * @param userId is the id of the user
 * @returns the access level of the given user
 */
async function getUserRing(userId) {
	const val = await db.get('rings')
	.find({ id: userId.toString() })
	.value()

	return (val === undefined) ? undefined : val.ring
}

/**
 * Simple helper function to determine whether a user is an admin
 * @param userId is the id of the user
 * @returns true if the user has admin access level, false otherwise
 */
async function isAdmin(userId) {
	for (const admin of await tg.getChatAdministrators(GRP_ID))
		if (admin.user.id.toString() === userId.toString())
			return true

	return false
}

/**
 * Simple helper function to get the balance of a user
 * @param userId is the id of the user
 * @returns the balance of a user
 */
async function howMuchInvested(userId) {
	return await contract.methods.balanceOf(await getUserAddress(userId)).call() / 10 ** 18
}

async function userHasInvestedEnoughTokens(userId) {
	// getting the amount of tokens the user has invested
	const balance = await howMuchInvested(userId)

	if (balance >= 10) {
		// access levels, just like at the Operating Systems
		let newRing = 3

		switch (balance) {
			case 100:
				newRing = 2
				break
			
			case 1000:
				newRing = 1
				break
		}

		if (await isAdmin(userId))
			newRing = 0

		// getting the current access level
		const oldRing = await getUserRing(userId)

		// checking whether the user is already added
		if (oldRing !== undefined)
			await db.get('rings')
			.update({ id: userId, ring: newRing })
			.write()
		else
			await db.get('rings')
			.push({ id: userId, ring: newRing })
			.write()

		return true
	}

	return false
}

// a simple function which greets every user
// when they start a conversation with the bot
async function joinWelcome(ctx) {
	for (const message of [
		`Hello ${ctx.message.from.first_name} 👋`,
		`My name is ${ctx.botInfo.first_name}`,
		'Wanna be a part of something really exciting?',
		'Of course you want 😎',
		'Visit the following link and log in with your Telegram and MetaMask account to join:\nagora.space'
	])
		await ctx.reply(message)
}

// a function to let the user know whether they succeeded
async function joinCheckSuccess(userId) {
	// generate and send an invite link
	await tg.sendMessage(userId,`Congratulations!🎉 Now you can join our super secret group:\n${await tg.exportChatInviteLink(GRP_ID)}`)

	// clapping pepe sticker
	await tg.sendSticker(userId,'CAACAgQAAxkBAAEEjKhf-I1-Vrd1hImudFl7kkTnDXAhgAACTAEAAqghIQZjKrRWscYWyB4E')
}

// a function to let the user know whether they failed (not enough tokens in wallet)
async function joinCheckFailure(userId) { await tg.sendMessage(userId, 'Sorry, there is not enough yCAKE in your wallet 😢') }

/**
 * A function to kick 'em all
 * @param userId is the id of the user we want to kick
 * @param reason is the reason why we kicked the user
 */
async function kickUser(userId, reason) {
	// get the first name of the user we just kicked
	const firstName = (await tg.getChatMember(GRP_ID, userId)).user.first_name

	// kick the member from the group
	await tg.kickChatMember(GRP_ID, userId)

	await db.get('accounts')
	.remove({ id: userId.toString() })
	.write()

	// get the new number of group members
	const survivorCount = await tg.getChatMembersCount(GRP_ID)

	// notify the remaining members about what happened and why
	await tg.sendMessage(GRP_ID, `${firstName} has been kicked because ${reason}, ${survivorCount} survivors remaining`)
}

// listening on new chat with a Telegram user
bot.start(async (ctx) => {
	const userId = ctx.message.from.id

	if (!await isAdmin(userId))
		tg.unbanChatMember(GRP_ID, userId)

	await joinWelcome(ctx)
})

// listening on new members joining our group
bot.on('new_chat_members', async (ctx) => {
	const member = ctx.message.new_chat_member

	if (await getUserAddress(member.id) === undefined)
		await kickUser(member.id) // kick the user if joined accidentally
	else
		await ctx.reply(
			`Hi, ${member.first_name}! 😄 Welcome to the ${(await tg.getChat(GRP_ID)).title}! 🎉`
		)
})

// listening on members leaving the group
bot.on('left_chat_member', async (ctx) => {
	ctx.reply(`Bye, ${ctx.message.left_chat_member.first_name} 😢`)

	const userId = ctx.message.left_chat_member.id

	// remove the user from the accounts database
	await db.get('accounts')
	.remove({ id: userId })
	.write()

	// remove the user from the rings database
	await db.get('rings')
	.remove({ id: userId })
	.write()
})

// custom commands based on user input
bot.on('text', async (ctx) => {
	const message = ctx.message
	const msg = message.text
	const userId = message.from.id
	const username = message.from.username
	const firstName = message.from.first_name
	const repliedTo = message.reply_to_message

	const help =	`*Hello, My name is ${ctx.botInfo.first_name}*\n` +
					'*Call me if you need a helping hand*\n\n' +
					'*Try these commands:*\n\n' +
					'/help - show help\n' +
					'@admin - tag all the admins'

	if (await isAdmin(userId)) {
		if (msg.includes('/help'))
			return ctx.replyWithMarkdown(
				help +
				'\n\n*Only for admins:*\n' +
				'\n/ping - check if the bot is alive\n' +
				'/broadcast <message> - send a message to the group\n' +
				'/userid - get the id of the user who sent the message\n' +
				'/kick - kick the user who sent the message\n' +
				'/stats - get group member statistics\n' +
				'/userinvested - shows the amount of tokens the user has invested\n' +
				'/json - get the message as a JSON object',
				markdown
			)

		if (msg.includes('/ping'))
			// check if the bot is alive
			return ctx.reply('I\'m still standing')

		if (msg.includes('/userid'))
			// get the id of the user who sent the message
			return ctx.reply(repliedTo.from.id)

		if (msg.includes('/userinvested'))
			// returns the amount of tokens the user invested
			return ctx.reply(`${repliedTo.from.first_name} has ${await howMuchInvested(repliedTo.from.id)} ${tokenName} tokens in their wallet`)

		if (msg.includes('/stats')) {
			// get the user statistics
			let users = '', values = ''
			let ring0 = 0, ring1 = 0, ring2 = 0, ring3 = 0

			for (const account of await db.get('accounts')) {
				const userId = account.id

				// get the member object using the user's id
				const member = (await tg.getChatMember(GRP_ID, userId)).user

				const ring = await getUserRing(userId)

				if (ring === 3)
					ring3++
				else if (ring === 2)
					ring2++
				else if (ring === 1)
					ring1++
				else
					ring0++

				users += `'${member.username}',`
				values += `${await howMuchInvested(member.id)},`
			}

			// send a cool doughnut chart
			await tg.sendPhoto(
				ctx.chat.id,
				encodeURI(`https://quickchart.io/chart?bkg=white&c={ type: 'doughnut', data: { datasets: [ { data: [${ring0}, ${ring1}, ${ring2}, ${ring3}], backgroundColor: ['rgb(242, 104, 107)','rgb(106, 212, 116)','rgb(91, 165, 212)','rgb(217, 190, 69)'], label: 'Dispersion of the ${groupName} premium members', }, ], labels: ['Admin', 'Diamond', 'Advanced', 'Premium'], }, options: { plugins: { datalabels: { color: 'white' }}, title: { display: true, text: '${groupName} members', }, },}`),
				{ caption: `Here is a cool doughnut chart which shows the dispersion of premium users in the group '${groupName}'` }
			)

			// send a cool bar chart
			return await tg.sendPhoto(
				ctx.chat.id,
				encodeURI(`https://quickchart.io/chart?bkg=white&c={type:'bar', data: { labels: [${users}], datasets: [{ label: '${tokenName}', data: [${values}], backgroundColor: getGradientFillHelper('horizontal', ['rgb(91, 165, 212)', 'rgb(106, 212, 116)']), }] }}`),
				{ caption: `Here is another cool graph representing the amount of ${tokenName} in each member's wallet` }
			)
		}
		
		if (msg.includes('/json'))
			// get the message as a stringified JSON object
			return ctx.reply(JSON.stringify(repliedTo, null, 2))

		if (msg.includes('/broadcast '))
			// admins can use the bot to broadcast messages
			return tg.sendMessage(GRP_ID, msg.split('/broadcast ')[1])

		if (msg.includes('/kick'))
			// admins can also use the bot to kick chat members
			return kickUser(repliedTo.from.id, msg.split('/kick ')[1])
	} else if (msg.includes('/help'))
		// help function for basic users
		return ctx.replyWithMarkdown(help)

	// tags all the admins
	if (msg.includes('@admin')) {
		let admins = ''

		for (const admin of await tg.getChatAdministrators(GRP_ID))
			if (admin.user.id !== (await tg.getMe()).id)
				admins += `@${admin.user.username} `

		return ctx.reply(admins)
	}
})

// catch any errors and print them to the standard output
bot.catch((err, ctx) => console.log(`Ooops, encountered an error for ${ctx.updateType}`, err))

initContract().then(async () => {
	// start the bot
	bot.launch()

	async function cb() {
		// loop through all the accounts in the database
		for (const account of await db.get('accounts')) {
			const userId = account.id

			console.log(`User ${userId}'s address is ${account.address}`)

			// and kick the user if they do not have enough yCAKE tokens
			if (!await isAdmin(userId) && !await userHasInvestedEnoughTokens(userId))
				await kickUser(userId, 'they didn\'t have enough tokens 😢')
		}
	}

	await cb()

	// repeat this action every half an hour
	await setInterval(await cb, 30 * 60 * 1000)

	// enable graceful stop
	process.once('SIGINT', () => bot.stop('SIGINT'))
	process.once('SIGTERM', () => bot.stop('SIGTERM'))
})

module.exports.notifyBot = async function notifyBot(userId) {
	// TODO: something is really buggy
	if (await userHasInvestedEnoughTokens(userId))
		await joinCheckSuccess(userId)
	else
		await joinCheckFailure(userId)
}

module.exports.getUserAddress = getUserAddress
