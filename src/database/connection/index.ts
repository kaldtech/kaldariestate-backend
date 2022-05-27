require('dotenv').config()
import config from 'config'
import mongoose from 'mongoose'
import express from 'express'
const mongooseConnection = express()
const dbUrl: any = config.get('db_url')

mongoose.connect(
    dbUrl,
    {
        useNewUrlParser: true,
        useCreateIndex: true,
        useUnifiedTopology: true,
        useFindAndModify: false,
    }
).then(result => console.log('Database successfully connected')).catch(err => console.log(err))


export { mongooseConnection, }
