const { TOKEN, GRP_ID } = require('./.secret.js')
const { Telegraf, Markup } = require('telegraf')
const Extra = require('telegraf/extra')
const Web3 = require('web3')
const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')
const request = require('request')

const BSC_MAINNET = 'ws://bsc-dataseed1.binance.org:443'
const BSC_TESTNET = 'wss://data-seed-prebsc-2-s3.binance.org:8545'

// bscscan API
const BSCSCAN_MAINNET_API = 'https://api.bscscan.com/api'
const BSCSCAN_TESTNET_API = 'https://api-testnet.bscscan.com/api'

// address for the Agora yCAKE Space contract
const CONTRACT_ADDRESS = '0x4eF9e3A96B4d6d8d55c6a1a89BD3493Fc15f9D65'
const TOKEN_ADDRESS = '0xB32e35AfFc06FB8928537a64dc8BdE18d4d720b9'
const GROUP_NAME = 'yCAKE Gang'

// web3 instance
let web3

// the yCAKE token contract
let contract
let tokenContract

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

// stores group info
// group id, token contract address, token name
db.defaults({ groups: [] }).write()

/**
 * @brief Simple helper function to make API requests
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
	console.log('Initializing contracts...')

	const options = {
		// Enable auto reconnection
		reconnect: {
			auto: true,
			delay: 100, // ms
			maxAttempts: 1000,
			onTimeout: true
		}
	};

	// initializing web3 with the address of the BSC mainnet
	web3 = new Web3(new Web3.providers.WebsocketProvider(BSC_TESTNET, options))

	// getting contract abis
	//const contractAbi = await doRequest(`${BSCSCAN_MAINNET_API}?module=contract&action=getabi&address=${CONTRACT_ADDRESS}`)
	spaceAbi = [{"inputs":[{"internalType":"address","name":"_stakeTokenAddress","type":"address"},{"internalType":"address","name":"_returnTokenAddress","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"account","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"Deposit","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"account","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"Withdraw","type":"event"},{"inputs":[{"internalType":"uint256","name":"_amount","type":"uint256"}],"name":"deposit","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"lockInterval","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"renounceOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_minutes","type":"uint256"}],"name":"setLockInterval","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"},{"internalType":"uint256","name":"","type":"uint256"}],"name":"timelocks","outputs":[{"internalType":"uint256","name":"expires","type":"uint256"},{"internalType":"uint256","name":"amount","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_amount","type":"uint256"}],"name":"withdraw","outputs":[],"stateMutability":"nonpayable","type":"function"}]
	const tokenAbi = await doRequest(`${BSCSCAN_MAINNET_API}?module=contract&action=getabi&address=${TOKEN_ADDRESS}`)

	// initializing the Agora yCAKE Space and Agora Token contracts
	contract = new web3.eth.Contract(spaceAbi, CONTRACT_ADDRESS)
	tokenContract = new web3.eth.Contract(tokenAbi, TOKEN_ADDRESS)
}

/**
 * @brief Simple helper function to get the address of a user
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
 * @brief Simple helper function to get the access level of a user
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
 * @brief Simple helper function to determine whether a user is an admin
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
 * @brief Wrapper function to add groups into the database
 * @param groupId is the id of the Telegram group
 * @param contractAddr is the address of the "pool" contract
 * @param tokenAddr is the address of the token contract
 */
async function addGroup(groupId, contractAddr, tokenAddr, limit) {

}

/**
 * @brief Wrapper function to update a group in the database
 * @param groupId is the id of the Telegram group
 * @param contractAddr is the address of the new "pool" contract
 * @param tokenAddr is the address of the new token contract
 * @note just put -1 in place of an address if you don't want to update it
 */
async function updateGroup(groupId, contractAddr, tokenAddr, limit) {
	
}

/**
 * @param Simple helper function to get the balance of a user
 * @param userId is the id of the user
 * @returns the balance of a user
 */
async function howMuchInvested(userId) {
	return await tokenContract.methods.balanceOf(await getUserAddress(userId)) / 10 ** 18
}

// Checks if a user has enough tokens
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
	])
		await ctx.reply(message)

	const keyboard = Markup.inlineKeyboard([
		[Markup.urlButton('Agora 😍', 'https://agora.space')],
		[Markup.urlButton('Test1 📘', 'https://agora.space')],
		[Markup.urlButton('Test2 🐧', 'https://agora.space')],
		[Markup.urlButton('Test3 🎓', 'https://agora.space')],
		[Markup.urlButton('Test4 🏎', 'https://agora.space')],
		[Markup.urlButton('Test5 🖥', 'https://agora.space')],
		[Markup.callbackButton("Not now", "nope")]
	])

	await ctx.replyWithMarkdown('Choose one of the following communities:', markdown.markup(keyboard))
}

// a function to let the user know whether they succeeded
async function joinCheckSuccess(userId) {
	// TODO: we need to export the chat link after we added the bot to the group
	// and we gave her the needed administrator rights in the group
	// REF: https://github.com/irazasyed/telegram-bot-sdk/issues/487

	// generate and send an invite link
	await tg.sendMessage(userId,`Congratulations!🎉 Now you can join our super secret group:\n${(await tg.getChat(GRP_ID)).invite_link}`)

	// clapping pepe sticker
	await tg.sendSticker(userId,'CAACAgQAAxkBAAEEjKhf-I1-Vrd1hImudFl7kkTnDXAhgAACTAEAAqghIQZjKrRWscYWyB4E')
}

// a function to let the user know whether they failed (not enough tokens in wallet)
async function joinCheckFailure(userId) { await tg.sendMessage(userId, `Sorry, there is not enough ${await tokenContract.methods.name().call()} in your wallet 😢`) }

/**
 * @brief A function to kick 'em all
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

	if (member.id !== (await tg.getMe()).id) {
		if (await getUserAddress(member.id) === undefined)
			await kickUser(member.id) // kick the user if joined accidentally
		else
			await ctx.reply(
				`Hi, ${member.first_name}! 😄 Welcome to the ${(await tg.getChat(GRP_ID)).title}! 🎉`
			)
	} else {
		await ctx.reply("Hello guys, good to see you!")
		await ctx.reply(
			"Please reply on this message with the contract address of your token in the following form:\n" +
			"0xa1b2c3d4efghijklmnopqrstuvwxyz1234567890"
		)
		// TODO: listen for this action, then get the name of the token
	}
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
			return ctx.reply(`${repliedTo.from.first_name} has ${await howMuchInvested(repliedTo.from.id)} ${await tokenContract.name()} tokens in their wallet`)

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
				encodeURI(`https://quickchart.io/chart?bkg=white&c={ type: 'doughnut', data: { datasets: [ { data: [${ring0}, ${ring1}, ${ring2}, ${ring3}], backgroundColor: ['rgb(242, 104, 107)','rgb(106, 212, 116)','rgb(91, 165, 212)','rgb(217, 190, 69)'], label: 'Dispersion of the ${GROUP_NAME} premium members', }, ], labels: ['Admin', 'Diamond', 'Advanced', 'Premium'], }, options: { plugins: { datalabels: { color: 'white' }}, title: { display: true, text: '${GROUP_NAME} members', }, },}`),
				{ caption: `Here is a cool doughnut chart which shows the dispersion of premium users in the group '${GROUP_NAME}'` }
			)

			// send a cool bar chart
			return await tg.sendPhoto(
				ctx.chat.id,
				encodeURI(`https://quickchart.io/chart?bkg=white&c={type:'bar', data: { labels: [${users}], datasets: [{ label: '${TOKEN_NAME}', data: [${values}], backgroundColor: getGradientFillHelper('horizontal', ['rgb(91, 165, 212)', 'rgb(106, 212, 116)']), }] }}`),
				{ caption: `Here is another cool graph representing the amount of ${TOKEN_NAME} in each member's wallet` }
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

async function checkKick(address) {
	// loop through all the accounts in the database
	for (const account of await db.get('accounts')) {
		if (account.address == address) {
			const userId = account.id

			// and kick the user if they do not have enough yCAKE tokens
			if (!await userHasInvestedEnoughTokens(userId))
				await kickUser(userId, 'they didn\'t have enough tokens 😢')
		}
	}
}

initContract().then(async () => {
	console.log('Starting the bot...')

	// start the bot
	await bot.launch()

	console.log('Starting listeners...')

	// listen on deposit events
	contract.events.Deposit({ fromBlock: 'latest' })
	.on('data', event => console.log(event.returnValues))
	.on('error', console.error)

	// listen on withdraw events
	contract.events.Withdraw({ fromBlock: 'latest' })
	// kick the user who does not have enough tokens
	.on('data', event => checkKick(event.returnValues.account))
	.on('error', console.error)

	// enable graceful stop
	process.once('SIGINT', () => bot.stop('SIGINT'))
	process.once('SIGTERM', () => bot.stop('SIGTERM'))

	console.log('Medousa is alive...')

	//console.log(await tokenContract.methods.symbol())
})

module.exports.notifyBot = async function notifyBot(userId) {
	// TODO: something is really buggy
	if (await userHasInvestedEnoughTokens(userId))
		await joinCheckSuccess(userId)
	else
		await joinCheckFailure(userId)
}

module.exports.getUserAddress = getUserAddress
