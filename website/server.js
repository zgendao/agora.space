const http = require('http')
const fs = require('fs').promises
const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')
const util = require('ethereumjs-util')
const utils = require('web3-utils')

// initializing the lowdb database
const adapter = new FileSync('../db.json')
const db = low(adapter)

// setting some defaults (required if your JSON file is empty)
// stores the address of a user
db.defaults({ accounts: [] }).write()

/**
 * Simple helper function to get the address of a user
 * @param userId is the id of the user
 * @returns the address of the given user
 */
async function getUserAddress(userId) {
	const val = await db.get('accounts')
	.find({ id: userId })
	.value()

	return (val === undefined) ? undefined : val.address
}

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
		fs.readFile(__dirname + "/src/index.html")
		.then(contents => {
			res.setHeader("Content-Type", "text/html")
			res.writeHead(200)
			res.end(contents)
		})
	} else if (req.url.includes('/signed')) {
		const query = require('url').parse(req.url, true).query
		console.log(`userId: ${query.userId}`)
		console.log(`signed: ${query.signed}`)

		const sig = util.fromRpcSig(query.signed)
		const publicKey = util.ecrecover(util.toBuffer(utils.sha3('hello friend')), sig.v, sig.r, sig.s)
		const address = `0x${util.pubToAddress(publicKey).toString('hex')}`
	
		// add the user to the database
		await addUser(query.userId, address)

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
