const { addUser, notifyBot } = require("./bot.js")
const querystring = require("querystring")
const http = require("http")
const util = require("ethereumjs-util")
const utils = require("web3-utils")

const server = http.createServer(async (req, res) => {
	if (req.url.includes("/signed")) {
		// getting the URL query parameters
		const parsedUrl = new URL(`https://agora.space${req.url}`)
		const query = querystring.parse(parsedUrl.search.split('?')[1])

		// getting the signed message
		const sig = util.fromRpcSig(query.signed)

		// getting public key from the signed message
		const publicKey = util.ecrecover(
			util.toBuffer(utils.sha3("hello friend")),
			sig.v,
			sig.r,
			sig.s
		)

		// converting the public key to address
		const address = `0x${util.pubToAddress(publicKey).toString("hex")}`
		const groupId = "-1001431174128"

		console.log(`userId: ${query.userId}`)
		console.log(`groupId: ${groupId}`)
		console.log(`address: ${address}`)

		// add the user to the database
		await addUser(query.userId, address, groupId)

		console.log("User added to the database")

		// let the bot know that a new user has been added
		await notifyBot(query.userId, groupId)

		// let the website know the request was successful
		res.writeHead(200, { "Content-Type": "text/plain" })
		res.write("success")
		res.end()
	}
})

console.log("Starting server...")
server.listen(8081)
console.log("Node.js web server at port 8081 is up and running...")
