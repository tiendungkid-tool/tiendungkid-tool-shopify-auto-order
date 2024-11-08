const express = require('express')
const app = express()
const port = 3000
const runCrawler = require('./crawler')
const bodyParser = require('body-parser')

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.static(__dirname + '/public'));
app.set('view engine', 'html');

app.get('/', (_, res) => {
  res.render('index')
})

app.post('/run', async (req, res) => {
  try {
    runCrawler(req.body)
  } catch (error) {
    console.log(error)
  }
  return res.json({})
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})