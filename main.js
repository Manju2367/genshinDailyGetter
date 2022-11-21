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



client.dailyReward.fetchRewardInfo().then(async result => { // fetch reward info

    const { is_sign, total_sign_day } = result
    if(!is_sign) {
        return await client.dailyReward.fetchDayReward(total_sign_day + 1)
    } else {
        throw new Error("received")
    }

}).then(async result => { // succeed fetch reward info

    let ci = await client.dailyReward.checkIn()
    if(ci.code === 0) {
        ci.rewards = result
        return ci
    } else if(ci.code === -5003) {
        throw new Error("already_claimed")
    } else {
        throw new Error("failed_check_in")
    }

}).then(async result => { // succeed check in

        const { icon, name, count } = result.rewards

        new Promise((resolve, reject) => {

            // download icon if it does not exist
            if(!existsSync(`${ iconDir }/${ name }.png`)) {
                request(icon, {
                    method: "GET",
                    encoding: null
                }, (error, response, body) => {
                    if(!error && response.statusCode === 200) {
                        if(!existsSync(iconDir)) mkdirSync(iconDir)
                        writeFileSync(`${ iconDir }/${ name }.png`, body, "binary")
                        resolve()
                    } else {
                        reject(error)
                    }
                })
            }

        }).then(() => {

            // succeed receive notification
            notifier.notify({
                title: "Genshin Daily Getter",
                message: `デイリー報酬を受け取りました。\n${ name }x${ count }`,
                icon: path.join(__dirname, `/src/item/${ name }.png`)
            })
            logger.info(result) // log:result object

        }).catch(error => {

            logger.error(error) // log:request error

        })
    
}).catch(
    /**
     * 
     * @param {Error} error 
     */
    error => {

    switch(error.message) {
        case "received": // received notification
            notifier.notify({
                title: "Genshin Daily Getter",
                message: "今日のデイリー報酬は受け取り済みです。",
                icon: path.join(__dirname, "/src/img/gg.png")
            })
            break

        case "already_claimed": // already claimed notification
            notifier.notify({
                title: "Genshin Daily Getter",
                message: "今日のデイリー報酬は受け取り済みです。",
                icon: path.join(__dirname, "/src/img/gg.png")
            })
            break

        case "failed_check_in": // failed check in notification
            notifier.notify({
                title: "Genshin Daily Getter",
                message: "チェックインに失敗しました。",
                icon: path.join(__dirname, "/src/img/gg.png")
            })
            break

        default: // failed receive notification
            notifier.notify({
                title: "Genshin Daily Getter",
                message: "デイリー報酬の受け取りに失敗しました。",
                icon: path.join(__dirname, "/src/img/gg.png")
            })
            break
    }
    logger.error(error.message)

})
