
const fs = require('mz/fs');
var http = require('http');
var url = require('url');

const host = '192.168.0.21';
const port = 8080;


const requestListener = function (req, res) {

    var parsedUrl = url.parse(req.url, true);
    var query = parsedUrl.query;
    
    if(parsedUrl.pathname === '/photo'){
        console.log("Query", parsedUrl.pathname, query['id']);

        var imagePath = ''
        if(query['id'] == '1'){
            imagePath = 'image1.jpg'
        }   
        if(query['id'] == '2'){
            imagePath = 'image2.jpg'
        }             

        res.setHeader("Content-Type", "application/json");
        res.writeHead(200);
        fs.readFile('./'+ imagePath).then((data) => {
            // res.writeHead(200, {'Content-Type': 'image/jpeg'})
            // res.end(data)
            // res.end(data.toString('base64'));
            res.end(`{"image64": "${data.toString('base64')}"}`)
        })
        .catch(err => console.error(err));
    }


}

const server = http.createServer(requestListener);
server.listen(port, host, () => {
    console.log(`Server is running on http://${host}:${port}`);
});

