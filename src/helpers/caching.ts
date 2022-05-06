import NodeCache from "node-cache"
const myCache = new NodeCache({ stdTTL: 100, checkperiod: 120 })

export const set_cache = async (key: any, data: any, time: any) => {
    return myCache.set(key, data, time)
}

export const get_cache = async (key: any) => {
    let get_data: any = myCache.get(key)
    if (get_data) return get_data
    else return false
}