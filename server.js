const { TOKEN, GRP_ID } = require('./.secret.js')
const { getUserAddress, notifyBot } = require('./bot.js')
const http = require('http')
const https = require('https')
const fs = require('fs').promises
const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')
const util = require('ethereumjs-util')
const utils = require('web3-utils')

// the url for the tg bot api
const tgURL = `https://api.telegram.org/bot${TOKEN}`

// initializing the lowdb database
const adapter = new FileSync('db.json')
const db = low(adapter)

// setting some defaults (required if your JSON file is empty)
// stores the address of a user
db.defaults({ accounts: [] }).write()

/**
 * Simple wrapper function for adding users into the database
 * @param userId is the id of the user
 * @param address is the address of the user
 */
async function addUser(userId, address) {
	const oldValue = await getUserAddress(userId)

	if (oldValue !== undefined)
		await db.get('accounts')
		.update({ id: userId, address: address })
		.write()
	else
		await db.get('accounts')
		.push({ id: userId, address: address })
		.write()
}

const server = http.createServer(async (req, res) => {
	if (req.url === '/') {
		fs.readFile(__dirname + "/website/index.html")
		.then(contents => {
			res.setHeader("Content-Type", "text/html")
			res.writeHead(200)
			res.end(contents)
		})
	} else if (req.url.includes('/signed')) {
		const query = require('url').parse(req.url, true).query

		const sig = util.fromRpcSig(query.signed)
		const publicKey = util.ecrecover(util.toBuffer(utils.sha3('hello friend')), sig.v, sig.r, sig.s)
		const address = `0x${util.pubToAddress(publicKey).toString('hex')}`

		console.log(`userId: ${query.userId}`)
		console.log(`address: ${address}`)
	
		// add the user to the database
		await addUser(query.userId, address)

		console.log('User added to the database')

		await notifyBot(query.userId)

		res.writeHead(200, { 'Content-Type': 'text/plain' })
		res.write('success')
		res.end()
	} else {
		res.writeHead(404, { 'Content-Type': 'text/html' })
		res.write(`<html><body><p>${req.url} not found!</p></body></html>`)
		res.end()
	}
})

server.listen(8080)
console.log('Node.js web server at port 8080 is running..')
