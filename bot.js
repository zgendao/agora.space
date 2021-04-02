const { BOT_API_KEY, ETH_API_KEY, INF_API_KEY } = require('./.secret.js')
const { Telegraf, Markup } = require('telegraf')
const Extra = require('telegraf/extra')
const Web3 = require('web3')
const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')
const request = require('request')

//////////////////////////////////////
////        Web3 constants        ////
//////////////////////////////////////

// Binance network websocket URLs
const BSC_MAINNET = 'wss://bsc-dataseed1.binance.org:443'
const BSC_TESTNET = 'wss://data-seed-prebsc-2-s3.binance.org:8545'

// Ethereum network websocket URLs
const ETH_MAINNET = `wss://mainnet.infura.io/ws/v3/${INF_API_KEY}`
const ETH_TESTNET = `wss://ropsten.infura.io/ws/v3/${INF_API_KEY}`

// bscscan API
const BSCSCAN_MAINNET_API = 'https://api.bscscan.com/api'
const BSCSCAN_TESTNET_API = 'https://api-testnet.bscscan.com/api'

// etherscan API
const ETHSCAN_MAINNET_API = 'https://api.etherscan.io/api'
const ETHSCAN_TESTNET_API = 'https://api-ropsten.etherscan.io/api'

// API helper constants
const GET_ABI = 'module=contract&action=getabi'

// web3 instance
let web3

// dictionary to store pool contracts for every group
let poolContracts = {}

// dictionary to store token contracts for every group
let tokenContracts = {}

//////////////////////////////////////
////      Telegram constants      ////
//////////////////////////////////////

// initializing the chatbot with our API token
const bot = new Telegraf(BOT_API_KEY)

// telegram client instance
const tg = bot.telegram

// this helps us use markdown in our messages
const markdown = Extra.markdown()

//////////////////////////////////////
////           LowDb              ////
//////////////////////////////////////

// initializing the lowdb database
const adapter = new FileSync('db.json')
const db = low(adapter)

// stores group info
// { group id, pool contract address, token contract address }
db.defaults({ groups: [] }).write()

// stores information about users in different groups
// { user id, wallet address, group id }
db.defaults({ users: [] }).write()

//////////////////////////////////////
////           Groups             ////
//////////////////////////////////////

/**
 * Returns a group object which contains
 * the id, pool contract address and token contract address of a group.
 * @param {String} groupId is the id o the Telegram group
 * @returns {[String, String, String, Array<Number> ]} the group id, pool address, token address and levels
 */
async function getGroup(groupId) {
	const val = await db.get('groups')
	.find({ id: groupId.toString() })
	.value()

	return (val === undefined) ? undefined : { groupId: val.id, contractAddress: val.contractAddress, tokenAddress: val.tokenAddress, levels: val.levels }
}

/**
 * Adds a new group to the database or updates an already existing group.
 * @param {String} groupId is the id o the Telegram group
 * @param {String} contractAddress is the address of the pool contract
 * @param {String} tokenAddress is the address of the token contract
 * @param {Array<Number>} levels is the array of levels in the group
 * @returns {Boolean} true if the group already exists, false otherwise
 */
async function addGroup(groupId, contractAddress, tokenAddress, levels) {
	if (await getGroup(groupId) !== undefined) {
		await db.get('groups')
		.find({ id: groupId })
		.assign({ id: groupId, contractAddress: contractAddress, tokenAddress: tokenAddress, levels: levels })
		.write()

		onNewGroup(groupId)

		return true
	} else {
		await db.get('groups')
		.push({ id: groupId, contractAddress: contractAddress, tokenAddress: tokenAddress, levels: levels })
		.write()

		return false
	}
}

/**
 * Registers the event listeners for a freshly added group.
 * @param {String} groupId is the id o the Telegram group
 */
async function onNewGroup(groupId) {
	setupListeners(groupId)
}

//////////////////////////////////////
////           Users              ////
//////////////////////////////////////

/**
 * Returns a user object which contains the id, account address and group id.
 * @param {String} userId is the id of the Telegram user
 * @param {String} groupId is the id of the Telegram group
 * @returns {[String, String, String]} the user id, account address and group id
 */
async function getUser(userId, groupId) {
	const val = await db.get('users')
	.find({ id: userId.toString(), groupId: groupId.toString() })
	.value()

	return (val === undefined) ? undefined : { userId: val.id, account: val.account, groupId: val.groupId }
}

/**
 * Returns a list of users that are members of the specified group.
 * @param {String} groupId is the id of the Telegram group
 * @returns {[Any]} the user id, account address and group id for every user
 */
 async function getUsersOfGroup(groupId) {
	let users = []
	
	for (const user of await db.get('users'))
		if (user.groupId == groupId.toString())
			users.push(user)

	return users
}

/**
 * Adds a user to the specified group.
 * @param {String} userId is the id o the Telegram user
 * @param {String} account is the address of the user's wallet
 * @param {String} groupId is the id of the group
 * @returns {Boolean} true if the user is already a member of the group, false otherwise
 */
async function addUser(userId, account, groupId) {
	if (await getUser(userId, groupId) !== undefined)
		await db.get('users')
		.find({ id: userId, groupId: groupId })
		.assign({ id: userId, account: account, groupId: groupId })
		.write()
	else
		await db.get('users')
		.push({ id: userId, account: account, groupId: groupId })
		.write()

	return false
}

/**
 * Simple helper function to determine whether a user is an admin.
 * @param {String} userId is the id of the user
 * @param {String} groupId is the id of the group
 * @returns {Boolean} true if the user has admin access level, false otherwise
 */
async function isAdmin(userId, groupId) {
	for (const admin of await tg.getChatAdministrators(groupId))
		if (admin.user.id.toString() === userId.toString())
			return true

	return false
}

/**
 * Simple helper function to get the balance of a user.
 * @param {String} userId is the id of the user
 * @param {String} groupId is the id of the group
 * @returns {Number} the balance of a user
 */
async function howMuchInvested(userId, groupId) {
	return (await tokenContracts[groupId].methods.balanceOf((await getUser(userId, groupId)).account).call()) / 10 ** 18
}

/**
 * A wrapper for getting the ring number of a user.
 * @param {String} userId is the id of the user
 * @param {String} groupId is the id of the group
 * @returns {Number} the ring number of a user
 */
async function getUserRing(userId, groupId) {
	// getting the amount of tokens the user has invested
	const balance = await howMuchInvested(userId, groupId)

	const group = await getGroup(groupId)
	const levels = group.levels

	if (balance >= levels[0])
		return 1
	else if (balance >= levels[1])
		return 2
	else if (balance >= levels[2])
		return 3

	return -1
}

/**
 * Checks if a user has enough tokens.
 * @param {String} userId is the id of the user
 * @param {String} groupId is the id of the group
 * @returns {Boolean} true if the user has enough tokens, false otherwise
 */
async function userHasInvestedEnoughTokens(userId, groupId) {
	return await getUserRing(userId, groupId) !== -1
}

/**
 * A simple function which greets every user
 * when they start a conversation with the bot.
 * @param {Any} ctx is the context of the message
 */
async function joinWelcome(ctx) {
	for (const message of [
		`Hello ${ctx.message.from.first_name} 👋`,
		`My name is ${ctx.botInfo.first_name}`,
		'Wanna be a part of something really exciting?',
		'Of course you want 😎',
	])
		await ctx.reply(message)

	let communityList = []

	for (const group of await db.get('groups'))
		communityList.push([Markup.loginButton((await tg.getChat(group.id)).title, `https://agora.space?grp=${group.id}`, {
			bot_username: 'medousa_bot',
			request_write_access: true
		})])

	const keyboard = Markup.inlineKeyboard(communityList)

	await ctx.replyWithMarkdown('Choose one of the following communities:', markdown.markup(keyboard))
}

/**
 * A function to let the user know whether they succeeded.
 * @param {String} userId is the id of the user
 * @param {String} groupId is the id of the group
 */
async function joinCheckSuccess(userId, groupId) {
	// TODO: we need to export the chat link after we added the bot to the group
	// and we gave her the needed administrator rights in the group
	// REF: https://github.com/irazasyed/telegram-bot-sdk/issues/487

	// generate and send an invite link
	await tg.sendMessage(userId,`Congratulations!🎉 Now you can join our super secret group:\n${(await tg.getChat(groupId)).invite_link}`)

	// clapping pepe sticker
	await tg.sendSticker(userId,'CAACAgQAAxkBAAEEjKhf-I1-Vrd1hImudFl7kkTnDXAhgAACTAEAAqghIQZjKrRWscYWyB4E')
}

/**
 * A function to let the user know whether they failed (not enough tokens in wallet).
 * @param {String} userId is the id of the user
 * @param {String} groupId is the id of the group
 */
async function joinCheckFailure(userId, groupId) {
	await tg.sendMessage(userId, `Sorry, there is not enough ${await tokenContracts[groupId].methods.name().call()} in your wallet 😢`)
}

/**
 * @brief A function to kick 'em all
 * @param {String} userId is the id of the user we want to kick
 * @param {String} groupId is the id of the group
 * @param {String} reason is the reason why we kicked the user
 */
async function kickUser(userId, groupId, reason) {
	// get the first name of the user we just kicked
	const firstName = (await tg.getChatMember(groupId, userId)).user.first_name

	// kick the member from the group
	await tg.kickChatMember(groupId, userId)

	await db.get('accounts')
	.remove({ id: userId, groupId: groupId })
	.write()

	// get the new number of group members
	const survivorCount = await tg.getChatMembersCount(groupId)

	// notify the remaining members about what happened and why
	await tg.sendMessage(groupId, `${firstName} has been kicked because ${reason}, ${survivorCount} survivors remaining`)
}

//////////////////////////////////////
////    Telegram Bot functions    ////
//////////////////////////////////////

// listening on new chat with a Telegram user
bot.start(async (ctx) => await joinWelcome(ctx))

// listening on new members joining our group
bot.on('new_chat_members', async (ctx) => {
	const member = ctx.message.new_chat_member
	const groupId = ctx.message.chat.id

	if (member.id !== (await tg.getMe()).id) {
		if (await getUser(member.id, groupId) === undefined)
			await kickUser(member.id, groupId) // kick the user if they joined accidentally
		else {
			await ctx.reply(`Hi, ${member.first_name}!`)
			await ctx.reply(`😄 Welcome to the ${(await tg.getChat(groupId)).title}! 🎉`)
		}
	} else {
		await ctx.reply("Hello guys, good to see you! 👋")

		if (await getGroup(groupId) === undefined)
		{
			await ctx.reply("This group is not yet configured to use Medousa")
			await ctx.replyWithMarkdown(
				'Give me admin rights then hit the configure button to configure me so I can manage your group:',
				markdown.markup(
					Markup.inlineKeyboard([
						[Markup.loginButton('Configure ⚙', `https://agora.space/configure?grp=${groupId}`, {
							bot_username: 'medousa_bot',
							request_write_access: true
						})],
						[Markup.callbackButton("Not now", "nope")]
					])
				)
			)
		}
	}
})

// listening on members leaving the group
bot.on('left_chat_member', async (ctx) => {
	const msg		= ctx.message
	const member	= msg.left_chat_member
	const userId	= member.id
	const groupId	= msg.chat.id

	if (userId !== (await tg.getMe()).id)
	{
		ctx.reply(`Bye, ${member.first_name} 😢`)
	
		// remove the user from the database
		await db.get('users')
		.remove({ id: userId, groupId: groupId })
		.write()
	} else
		await db.get('groups')
		.remove({ id: groupId })
})

// custom commands based on user input
bot.on('text', async (ctx) => {
	const message	=	ctx.message
	const msg		=	message.text
	const userId	=	message.from.id
	const groupId	=	message.chat.id
	const username	=	message.from.username
	const firstName =	message.from.first_name
	const repliedTo =	message.reply_to_message

	const help		=	`*Hello, My name is ${ctx.botInfo.first_name}*\n` +
						'*Call me if you need a helping hand*\n\n' +
						'*Try these commands:*\n\n' +
						'/help - show help\n' +
						'@admin - tag all the admins'

	if (groupId < 0 && await isAdmin(userId, groupId)) {
		const groupName = (await tg.getChat(groupId)).title
		const tokenName = await tokenContracts[groupId].methods.name().call()

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
			return ctx.reply(`${repliedTo.from.first_name} has ${await howMuchInvested(repliedTo.from.id, groupId)} ${tokenName} tokens in their wallet`)

		if (msg.includes('/stats')) {
			// get the user statistics
			let users = '', values = ''
			let ring0 = 0, ring1 = 0, ring2 = 0, ring3 = 0

			for (const user of await getUsersOfGroup(groupId)) {
				const userId = user.id
				const ring = await getUserRing(userId, groupId)

				if (ring === 3)
					ring3++
				else if (ring === 2)
					ring2++
				else if (ring === 1)
					ring1++
				else
					ring0++

				users += `'${(await tg.getChatMember(groupId, userId)).user.username}',`
				values += `${await howMuchInvested(userId, groupId)},`
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
			return tg.sendMessage(groupId, msg.split('/broadcast ')[1])

		if (msg.includes('/kick'))
			// admins can also use the bot to kick chat members
			return kickUser(repliedTo.from.id, groupId, msg.split('/kick ')[1])
	} else if (msg.includes('/help'))
		// help function for basic users
		return ctx.replyWithMarkdown(help)

	// tags all the admins
	if (msg.includes('@admin')) {
		let admins = ''

		for (const admin of await tg.getChatAdministrators(groupId))
			if (admin.user.id !== (await tg.getMe()).id)
				admins += `@${admin.user.username} `

		return ctx.reply(admins)
	}
})

//////////////////////////////////////
////    Contract initialization   ////
//////////////////////////////////////

/**
 * Simple helper function to make API requests.
 * @param {String} url is the url we want to fetch data from
 * @returns {Promise<JSON>} response body
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

/**
 * Simple helper function to get the ABI of a smart contract.
 * @param {String} address is the address of the smart contract
 * @returns the ABI of the smart contract
 */
async function getAbi(address) {
	return await doRequest(`${ETHSCAN_TESTNET_API}?${GET_ABI}&address=${address}&apikey=${ETH_API_KEY}`)
}

/**
 * Simple helper to wrap the initialization of web3 and the token contract.
 */
async function initContracts() {
	const options = {
		// enable auto reconnection
		reconnect: {
			auto: true,
			delay: 100, // ms
			maxAttempts: 1000,
			onTimeout: true
		}
	};

	console.log('Initializing Web3...')

	// initializing web3
	web3 = new Web3(new Web3.providers.WebsocketProvider(ETH_TESTNET, options))
	
	console.log('Getting contracts...')

	for (const group of await db.get('groups')) {
		// initializing the pool and token contracts
		poolContracts[group.id] = new web3.eth.Contract(
			await getAbi(group.contractAddress),
			group.contractAddress
		)
		tokenContracts[group.id] = new web3.eth.Contract(
			await getAbi(group.tokenAddress),
			group.tokenAddress
		)
	}
}

/**
 * Sets up listeners for the given group.
 * @param {String} groupId is the id of the group
 */
async function setupListeners(groupId) {
	const contract = poolContracts[groupId]

	// listen on deposit events
	contract.events.Deposit({ fromBlock: 'latest' })
	.on('data', event => console.log(event.returnValues))
	.on('error', console.error)

	// listen on withdraw events
	contract.events.Withdraw({ fromBlock: 'latest' })
	// kick the user who does not have enough tokens
	.on('data', event => checkKick(event.returnValues.account))
	.on('error', console.error)
}

initContracts().then(async () => {
	console.log('Starting the bot...')

	// disgusting hackish way to clear updates queue
	bot.polling.offset = -1

	// start the bot
	await bot.launch()

	console.log('Starting listeners...')

	for (const group of await db.get('groups'))
		setupListeners(group.id)

	// enable graceful stop
	process.once('SIGINT', () => bot.stop('SIGINT'))
	process.once('SIGTERM', () => bot.stop('SIGTERM'))

	console.log('Medousa is alive...')

	console.log(await tg.exportChatInviteLink("-1001431174128"))
})

//////////////////////////////////////
////            Exports           ////
//////////////////////////////////////

module.exports.addGroup = addGroup
module.exports.addUser = addUser
module.exports.notifyBot = async function notifyBot(userId, groupId) {
	if (await userHasInvestedEnoughTokens(userId, groupId))
		await joinCheckSuccess(userId, groupId)
	else
		await joinCheckFailure(userId, groupId)
}
