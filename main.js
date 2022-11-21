"use strict"

const { Client, Language } = require("genshin-kit.js")
const propertiesReader = require("properties-reader")
const notifier = require("node-notifier")
const path = require("path")
const log4js = require("log4js")
const { existsSync, mkdirSync, writeFileSync } = require("fs")
const request = require("request")

const properties = propertiesReader("app.ini")
const logger = log4js.getLogger("system")
logger.level = "debug"

const LTUID = properties.get("LTUID")
const LTOKEN = properties.get("LTOKEN")
const UID = properties.get("UID")
const iconDir = "src/item"



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
            if(c.rewards !== null) { // { status: 'success', code: 0, rewards: { icon: ..., name: ..., count: ... } }
                const { icon, name, count } = c.rewards

                // アイコンがなければダウンロード
                if(!existsSync(`${ iconDir }/${ name }.png`)) {
                    request(icon, {
                        method: "GET",
                        encoding: null
                    }, (error, response, body) => {
                        if(!error && response.statusCode === 200) {
                            if(!existsSync(iconDir)) mkdirSync(iconDir)
                            writeFileSync(`${ iconDir }/${ name }.png`, body, "binary")
                        } else {
                            logger.error(error) // log:リクエストエラー
                        }
                    })
                }

                // 受け取り通知
                notifier.notify({
                    title: "Genshin Daily Getter",
                    message: `デイリー報酬を受け取りました。\n${ name }x${ count }`,
                    icon: path.join(__dirname, `/src/item/${ name }.png`)
                })
            } else { // { status: 'Already claimed', code: -5003, rewards: null }
                notifier.notify({
                    title: "Genshin Daily Getter",
                    message: "デイリー報酬の受け取りに失敗しました。(-1)",
                    icon: path.join(__dirname, "/src/img/gg.png")
                })
            }
            logger.info(c) // log:受け取り情報

        }).catch(error => {
            notifier.notify({
                title: "Genshin Daily Getter",
                message: "デイリー報酬の受け取りに失敗しました。(-2)",
                icon: path.join(__dirname, "/src/img/gg.png")
            })
            logger.error(error) // log:チェックインエラー
        })
    }
    logger.info(result) // log:デイリー報酬の情報

}).catch(error => {
    notifier.notify({
        title: "Genshin Daily Getter",
        message: "デイリー報酬の受け取りに失敗しました。(-3)",
        icon: path.join(__dirname, "/src/img/gg.png")
    })
    logger.error(error) // log:デイリー報酬の情報の取得エラー
})
