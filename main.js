"use strict"

const { Client, Language } = require("genshin-kit.js")
const propertiesReader = require("properties-reader")
const notifier = require("node-notifier")
const path = require("path")
const log4js = require("log4js")

const properties = propertiesReader("./app.ini")
const logger = log4js.getLogger("system")
logger.level = "debug"

const LTUID = properties.get("LTUID")
const LTOKEN = properties.get("LTOKEN")
const UID = properties.get("UID")



// login
const client = new Client({
    language: Language.Japanese
})
client.login(LTUID, LTOKEN)

// logger init
log4js.configure({
    appenders: {
        system: {
            type: "file",
            filename: "system.log"
        }
    },
    categories: {
        default: {
            appenders: ["system"],
            level: "debug"
        }
    }
})




// デイリー報酬の情報をfetch
client.dailyReward.fetchRewardInfo({
    language: Language.Japanese
}).then(result => {

    // デイリー報酬を受け取ったか?
    if(result.is_sign) {
        // 受け取り済み通知
        notifier.notify({
            title: "Genshin Daily Getter",
            message: "今日のデイリー報酬は受け取り済みです。",
            icon: path.join(__dirname, "/src/img/gg.png")
        })
    } else {
        // チェックインfetch
        client.dailyReward.checkIn({
            language: Language.Japanese
        }).then(c => {

            // 報酬が空ではない?
            if(c.rewards !== null) {
                // 受け取り通知
                notifier.notify({
                    title: "Genshin Daily Getter",
                    message: "デイリー報酬を受け取りました。",
                    icon: path.join(__dirname, "/src/img/gg.png")
                })
            } else { // { status: 'Already claimed', code: -5003, rewards: null }
                notifier.notify({
                    title: "Genshin Daily Getter",
                    message: "デイリー報酬を受け取れませんでした。",
                    icon: path.join(__dirname, "/src/img/gg.png")
                })
            }
            logger.info(c) // log:受け取り情報

        }).catch(error => logger.error(error)) // log:チェックインエラー
    }
    logger.info(result) // log:デイリー報酬の情報

}).catch(error => logger.error(error)) // log:デイリー報酬の情報の取得エラー
