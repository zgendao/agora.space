const { BOT_API_KEY, ETH_API_KEY, INF_API_KEY } = require("./.secret.js")
const { Telegraf, Markup } = require("telegraf")
const ethers = require("ethers")
const low = require("lowdb")
const FileSync = require("lowdb/adapters/FileSync")
const request = require("request")

//////////////////////////////////////
////     Blockchain constants     ////
//////////////////////////////////////

// EtherScan API
const ETHSCAN_MAINNET_API = `https://api.etherscan.io/api`
const ETHSCAN_TESTNET_API = `https://api-ropsten.etherscan.io/api`

// API helper constants
const GET_ABI = "module=contract&action=getabi"

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

//////////////////////////////////////
////           LowDb              ////
//////////////////////////////////////

// initializing the lowdb database
const adapter = new FileSync("db.json")
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
 * @returns {[String, String, String, Array<Number> ]} the group id, pool
 * address, token address and levels
 */
async function getGroup(groupId) {
  const val = await db.get("groups").find({ id: groupId.toString() }).value()

  return val === undefined
    ? undefined
    : {
        groupId: val.id,
        contractAddress: val.contractAddress,
        tokenAddress: val.tokenAddress,
        levels: val.levels,
      }
}

/**
 * Returns the minimum level of a group.
 * @param {String} groupId is the id o the Telegram group
 * @returns {Number} the minimum level
 */
async function getMinimum(groupId) {
  const val = await getGroup(groupId)

  return val === undefined ? undefined : val.levels[2]
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
  if ((await getGroup(groupId)) !== undefined) {
    await db
      .get("groups")
      .find({ id: groupId })
      .assign({
        id: groupId,
        contractAddress: contractAddress,
        tokenAddress: tokenAddress,
        levels: levels,
      })
      .write()

    onNewGroup(groupId)

    return true
  } else {
    await db
      .get("groups")
      .push({
        id: groupId,
        contractAddress: contractAddress,
        tokenAddress: tokenAddress,
        levels: levels,
      })
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
  const val = await db
    .get("users")
    .find({ id: userId.toString(), groupId: groupId.toString() })
    .value()

  return val === undefined
    ? undefined
    : {
        userId: val.id,
        account: val.account,
        groupId: val.groupId,
      }
}

/**
 * Returns a user object which contains the id, account address and group id.
 * @param {String} address is the address of the Telegram user's wallet
 * @param {String} groupId is the id of the Telegram group
 * @returns {[String, String, String]} the user id, account address and group id
 */
async function getUserByAddress(address, groupId) {
  const val = await db
    .get("users")
    .find({
      account: address.toString().toLowerCase(),
      groupId: groupId.toString(),
    })
    .value()

  return val === undefined
    ? undefined
    : {
        id: val.id,
        account: val.account,
        groupId: val.groupId,
      }
}

/**
 * Returns a list of users that are members of the specified group.
 * @param {String} groupId is the id of the Telegram group
 * @returns {[Any]} the user id, account address and group id for every user
 */
async function getUsersOfGroup(groupId) {
  let users = []

  for (const user of await db.get("users"))
    if (user.groupId == groupId.toString()) users.push(user)

  return users
}

/**
 * Adds a user to the specified group.
 * @param {String} userId is the id o the Telegram user
 * @param {String} account is the address of the user's wallet
 * @param {String} groupId is the id of the group
 * @returns {Boolean} true if the user is already a member of the group, false
 * otherwise
 */
async function addUser(userId, account, groupId) {
  if ((await getUser(userId, groupId)) !== undefined)
    await db
      .get("users")
      .find({ id: userId, groupId: groupId })
      .assign({
        id: userId,
        account: account.toString().toLowerCase(),
        groupId: groupId,
      })
      .write()
  else
    await db
      .get("users")
      .push({
        id: userId,
        account: account.toString().toLowerCase(),
        groupId: groupId,
      })
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
    if (admin.user.id.toString() === userId.toString()) return true

  return false
}

/**
 * Simple helper function to get the balance of a user.
 * @param {String} userId is the id of the user
 * @param {String} groupId is the id of the group
 * @returns {Number} the balance of a user
 */
async function howMuchInvested(userId, groupId) {
  return (
    (await tokenContracts[groupId].balanceOf(
      (await getUser(userId, groupId)).account
    )) /
    10 ** (await tokenContracts[groupId].decimals())
  )
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

  if (balance >= levels[0]) return 1
  else if (balance >= levels[1]) return 2
  else if (balance >= levels[2]) return 3

  return -1
}

/**
 * Checks if a user has enough tokens.
 * @param {String} userId is the id of the user
 * @param {String} groupId is the id of the group
 * @returns {Boolean} true if the user has enough tokens, false otherwise
 */
async function userHasInvestedEnoughTokens(userId, groupId) {
  return (await getUserRing(userId, groupId)) !== -1
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
    "Wanna be a part of something really exciting?",
    "Of course you want 😎",
  ])
    await ctx.reply(message)

  let communityList = []

  for (const group of await db.get("groups"))
    communityList.push([
      Markup.button.login(
        (await tg.getChat(group.id)).title,
        `https://agora.space?grp=${group.id}`,
        {
          bot_username: "medousa_bot",
          request_write_access: true,
        }
      ),
    ])

  await ctx.replyWithMarkdown(
    "Choose one of the following communities:",
    Markup.inlineKeyboard(communityList)
  )
}

/**
 * A function to let the user know whether they succeeded.
 * @param {String} userId is the id of the user
 * @param {String} groupId is the id of the group
 */
async function joinCheckSuccess(userId, groupId) {
  // unban the chat member
  await tg.unbanChatMember(groupId, userId, { only_if_banned: true })

  // generate and send an invite link
  await tg.sendMessage(
    userId,
    `Congratulations!🎉 Now you can join our super secret group:\n${
      (
        await tg.createChatInviteLink(groupId, {
          expire_date: Math.floor(new Date() / 1000) + 600, // 10 minutes in the future
          member_limit: 1,
        })
      ).invite_link
    }`
  )

  // clapping pepe sticker
  await tg.sendSticker(
    userId,
    "CAACAgQAAxkBAAEEjKhf-I1-Vrd1hImudFl7kkTnDXAhgAACTAEAAqghIQZjKrRWscYWyB4E"
  )

  await tg.sendMessage(
    userId,
    "PS.: Hurry, you only have 10 minutes until the invitation link expires! 😱"
  )
}

/**
 * A function to let the user know whether they failed (not enough tokens in wallet).
 * @param {String} userId is the id of the user
 * @param {String} groupId is the id of the group
 */
async function joinCheckFailure(userId, groupId) {
  await tg.sendMessage(
    userId,
    `Sorry, there is not enough ${await tokenContracts[
      groupId
    ].name()} in your wallet 😢`
  )
  await tg.sendMessage(
    userId,
    `You have ${await howMuchInvested(
      userId,
      groupId
    )}, but the minimum is ${await getMinimum(groupId)}`
  )
}

/**
 * @brief A function to kick 'em all
 * @param {String} userId is the id of the user we want to kick
 * @param {String} groupId is the id of the group
 * @param {String} reason is the reason why we kicked the user
 */
async function kickUser(userId, groupId, reason) {
  if (!(await isAdmin(userId, groupId))) {
    // get the first name of the user we just kicked
    const firstName = (await tg.getChatMember(groupId, userId)).user.first_name

    // kick the member from the group
    await tg.kickChatMember(groupId, userId)

    await db.get("users").remove({ id: userId, groupId: groupId }).write()

    // get the new number of group members
    const survivorCount = await tg.getChatMembersCount(groupId)

    // notify the remaining members about what happened and why
    await tg.sendMessage(
      groupId,
      `${firstName} has been kicked because ${reason},` +
        ` ${survivorCount} survivors remaining`
    )
  }
}

//////////////////////////////////////
////    Telegram Bot functions    ////
//////////////////////////////////////

// listening on new chat with a Telegram user
bot.start(async (ctx) => await joinWelcome(ctx))

// listening on new members joining our group
bot.on("new_chat_members", async (ctx) => {
  const member = ctx.message.new_chat_member
  const groupId = ctx.message.chat.id

  if (member.id !== (await tg.getMe()).id) {
    if ((await getUser(member.id, groupId)) === undefined)
      await kickUser(
        member.id,
        groupId,
        "they shouldn't have had access to this group"
      )
    // kick the user if they joined accidentally
    else {
      await ctx.reply(`Hi, ${member.first_name}!`)
      await ctx.reply(
        `😄 Welcome to the ${(await tg.getChat(groupId)).title}! 🎉`
      )
    }
  } else {
    await ctx.reply("Hello guys, good to see you! 👋")

    if ((await getGroup(groupId)) === undefined) {
      await ctx.reply("This group is not yet configured to use Medousa")
      await ctx.replyWithMarkdown(
        "Give me admin rights then hit the configure" +
          " button to configure me so I can manage your group:",
        Markup.inlineKeyboard([
          [
            Markup.button.login(
              "Configure ⚙",
              `https://agora.space/configure?grp=${groupId}`,
              {
                bot_username: "medousa_bot",
                request_write_access: true,
              }
            ),
          ],
          [Markup.button.callback("Not now", "nope")],
        ])
      )
    }
  }
})

// listening on members leaving the group
bot.on("left_chat_member", async (ctx) => {
  const msg = ctx.message
  const member = msg.left_chat_member
  const userId = member.id
  const groupId = msg.chat.id

  if (userId !== (await tg.getMe()).id) {
    ctx.reply(`Bye, ${member.first_name} 😢`)

    // remove the user from the database
    await db.get("users").remove({ id: userId, groupId: groupId }).write()
  } else await db.get("groups").remove({ id: groupId })
})

// custom commands based on user input
bot.on("text", async (ctx) => {
  const message = ctx.message
  const msg = message.text
  const userId = message.from.id
  const groupId = message.chat.id
  const username = message.from.username
  const firstName = message.from.first_name
  const repliedTo = message.reply_to_message

  const help =
    `**Hello, My name is ${ctx.botInfo.first_name}**\n` +
    "**Call me if you need a helping hand**\n\n" +
    "**Try these commands:**\n\n" +
    "/help - show help\n" +
    "@admin - tag all the admins"

  if (groupId < 0 && (await isAdmin(userId, groupId))) {
    const groupName = (await tg.getChat(groupId)).title
    const tokenContract = await tokenContracts[groupId]
    const tokenName =
      tokenContract !== undefined ? await tokenContract.name() : undefined

    if (msg.includes("/help"))
      return ctx.replyWithMarkdown(
        help +
          "\n\n**Only for admins:**\n" +
          "\n/ping - check if the bot is alive\n" +
          "/broadcast <message> - send a message to the group\n" +
          "/userid - get the id of the user who sent the message\n" +
          "/kick - kick the user who sent the message\n" +
          "/stats - get group member statistics\n" +
          "/userinvested - shows the amount of tokens the user has invested\n" +
          "/json - get the message as a JSON object"
      )

    if (msg.includes("/ping"))
      // check if the bot is alive
      return ctx.reply("I'm still standing")

    if (msg.includes("/userid"))
      // get the id of the user who sent the message
      return ctx.reply(repliedTo.from.id)

    if (msg.includes("/userinvested"))
      // returns the amount of tokens the user invested
      return ctx.reply(
        `${repliedTo.from.first_name} has ${await howMuchInvested(
          repliedTo.from.id,
          groupId
        )} ${tokenName} tokens in their wallet`
      )

    if (msg.includes("/stats")) {
      // get the user statistics
      let users = "",
        values = ""
      let ring0 = 0,
        ring1 = 0,
        ring2 = 0,
        ring3 = 0

      for (const user of await getUsersOfGroup(groupId)) {
        const userId = user.id
        const ring = await getUserRing(userId, groupId)

        if (ring === 3) ring3++
        else if (ring === 2) ring2++
        else if (ring === 1) ring1++
        else ring0++

        users += `'${(await tg.getChatMember(groupId, userId)).user.username}',`
        values += `${await howMuchInvested(userId, groupId)},`
      }

      // send a cool doughnut chart
      await tg.sendPhoto(
        ctx.chat.id,
        encodeURI(
          "https://quickchart.io/chart?bkg=white&c={ type: 'doughnut', data: " +
            `{ datasets: [ { data: [${ring0}, ${ring1}, ${ring2}, ${ring3}], ` +
            "backgroundColor: ['rgb(242, 104, 107)','rgb(106, 212, 116)'," +
            "'rgb(91, 165, 212)','rgb(217, 190, 69)'], label: 'Dispersion of " +
            `the ${groupName} premium members', }, ], labels: ['Admin', 'Diamond', ` +
            "'Advanced', 'Premium'], }, options: { plugins: { datalabels: { color: " +
            `'white' }}, title: { display: true, text: '${groupName} members', }, },}`
        ),
        {
          caption:
            "Here is a cool doughnut chart which shows the dispersion of " +
            `premium users in the group '${groupName}'`,
        }
      )

      // send a cool bar chart
      return await tg.sendPhoto(
        ctx.chat.id,
        encodeURI(
          "https://quickchart.io/chart?bkg=white&c={type:'bar', data: { labels: " +
            `[${users}], datasets: [{ label: '${tokenName}', data: [${values}], ` +
            "backgroundColor: getGradientFillHelper('horizontal', " +
            "['rgb(91, 165, 212)', 'rgb(106, 212, 116)']), }] }}"
        ),
        {
          caption:
            "Here is another cool graph representing the amount of " +
            `${tokenName} in each member's wallet`,
        }
      )
    }

    if (msg.includes("/json"))
      // get the message as a stringified JSON object
      return ctx.reply(JSON.stringify(repliedTo, null, 2))

    if (msg.includes("/broadcast "))
      // admins can use the bot to broadcast messages
      return tg.sendMessage(groupId, msg.split("/broadcast ")[1])

    if (msg.includes("/kick"))
      // admins can also use the bot to kick chat members
      return kickUser(repliedTo.from.id, groupId, msg.split("/kick ")[1])
  } else if (msg.includes("/help"))
    // help function for basic users
    return ctx.replyWithMarkdown(help)

  // tags all the admins
  if (msg.includes("@admin")) {
    let admins = ""

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
      else reject(error)
    })
  })
}

/**
 * Simple helper function to get the ABI of a smart contract.
 * @param {String} address is the address of the smart contract
 * @returns the ABI of the smart contract
 */
async function getAbi(address) {
  return await doRequest(
    `${ETHSCAN_TESTNET_API}?${GET_ABI}&address=${address}&apikey=${ETH_API_KEY}`
  )
}

/**
 * Simple helper to wrap the initialization of the provider and contracts.
 */
async function initContracts() {
  const options = {
    // enable auto reconnection
    reconnect: {
      auto: true,
      delay: 100, // ms
      maxAttempts: 1000,
      onTimeout: true,
    },
  }

  console.log("Initializing Ethers provider...")

  // initializing Ethers
  const provider = new ethers.providers.InfuraProvider("ropsten", INF_API_KEY)

  console.log("Getting contracts...")

  for (const group of await db.get("groups")) {
    // initializing the pool and token contracts
    poolContracts[group.id] = new ethers.Contract(
      group.contractAddress,
      await getAbi(group.contractAddress),
      provider
    )
    tokenContracts[group.id] = new ethers.Contract(
      group.tokenAddress,
      await getAbi(group.tokenAddress),
      provider
    )
  }
}

/**
 * Sets up listeners for the given group.
 * @param {String} groupId is the id of the group
 */
async function setupListeners(groupId) {
  const contract = poolContracts[groupId]

  // listen on deposit and withdraw events
  contract
    .on("Deposit", async (address) => console.log(address))
    .on(
      "Withdraw",
      async (address) =>
        await kickUser(
          (await getUserByAddress(`${address}`, groupId)).id,
          groupId,
          "they did't have enough tokens"
        )
    )
}

initContracts().then(async () => {
  console.log("Starting the bot...")

  // start the bot
  await bot.launch()

  console.log("Starting listeners...")

  for (const group of await db.get("groups")) await setupListeners(group.id)

  // enable graceful stop
  process.once("SIGINT", () => bot.stop("SIGINT"))
  process.once("SIGTERM", () => bot.stop("SIGTERM"))

  console.log("Medousa is alive...")
})

//////////////////////////////////////
////            Exports           ////
//////////////////////////////////////

module.exports.addGroup = addGroup
module.exports.addUser = addUser
module.exports.notifyBot = async function notifyBot(userId, groupId) {
  if (await userHasInvestedEnoughTokens(userId, groupId))
    await joinCheckSuccess(userId, groupId)
  else await joinCheckFailure(userId, groupId)
}
