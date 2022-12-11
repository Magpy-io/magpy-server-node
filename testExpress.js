const express = require('express')
const fs = require('mz/fs');

const app = express()
const host = '192.168.0.21';
const port = 8000

const rootPath = '/home/chaimaa/Ants/Photos/'
const idToPathArray = [['1', 'image1.jpg'], ['2', 'image2.jpg']];
const idToPath = new Map(idToPathArray)

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.get('/photo/:id', (req, res) => {
    
    var imagePath = idToPath.get(req.params['id'])
    
    fs.readFile(rootPath + imagePath).then((data) => {
        res.json({image64 : `${data.toString('base64')}`})
    })
    .catch(err => console.error(err));
})

app.get('/photos', (req, res) => {
    res.json({photos : Array.from(idToPath.keys())})
  })  

app.listen(port, host, () => {
    console.log(`Server is running on http://${host}:${port}`);
})