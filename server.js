const { addUser, notifyBot } = require('./bot.js')
const http = require('http')
const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')
const util = require('ethereumjs-util')
const utils = require('web3-utils')

// initializing the lowdb database
const adapter = new FileSync('db.json')
const db = low(adapter)

const server = http.createServer(async (req, res) => {
	if (req.url.includes('/signed')) {
		const query = require('url').parse(req.url, true).query

		const sig = util.fromRpcSig(query.signed)
		const publicKey = util.ecrecover(util.toBuffer(utils.sha3('hello friend')), sig.v, sig.r, sig.s)
		const address = `0x${util.pubToAddress(publicKey).toString('hex')}`

		console.log(`userId: ${query.userId}`)
		console.log(`groupId: ${query.groupId}`)
		console.log(`address: ${address}`)
	
		// add the user to the database
		await addUser(query.userId, address, groupId)

		console.log('User added to the database')

		await notifyBot(query.userId, groupId)

		res.writeHead(200, { 'Content-Type': 'text/plain' })
		res.write('success')
		res.end()
	}
})

console.log('Starting server...')
server.listen(8081)
console.log('Node.js web server at port 8081 is up and running...')
