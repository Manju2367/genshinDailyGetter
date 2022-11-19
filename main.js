"use strict"

const { Client, Language } = require("genshin-kit.js")
const propertiesReader = require("properties-reader")
const notifier = require("node-notifier")
const path = require("path")
const log4js = require("log4js")

const properties = propertiesReader("./app.ini")
const logger = log4js.getLogger()
logger.level = "debug"

const LTUID = properties.get("LTUID")
const LTOKEN = properties.get("LTOKEN")
const UID = properties.get("UID")



const client = new Client({
    language: Language.Japanese
})
client.login(LTUID, LTOKEN)



// client.dailyReward.checkIn({
//     language: Language.Japanese
// }).then(result => {
//     console.log(result)
// })

// client.dailyReward.fetchRewardInfo({
//     language: Language.Japanese
// }).then(result => {
//     if(result.is_sign) {
//         notifier.notify({
//             title: "Genshin Daily Getter",
//             message: "今日のデイリー報酬は受け取り済みです。",
//             icon: path.join(__dirname, "/src/img/gg.png")
//         })
//     } else {
//         notifier.notify({
//             title: "Genshin Daily Getter",
//             message: "デイリー報酬を受け取りました。",
//             icon: path.join(__dirname, "/src/img/gg.png")
//         })
//     }
// })
