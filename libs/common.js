const https = require('https');
const fs = require('fs');
const path = require('path');

function htmlDecode(s) {
    return s.replace(/&amp;/g, "&")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
}

function uri2name2(uri) {
    if (uri.endsWith("/")) {
        uri += "index.html";
    }
    let name = uri.replace(/[\?\&]+/g, `/`).replace(/\/{2,}/g, '/').replace(/[:\<\>\*\"\']/g, '');
    return path.join('cache', name);
}

async function httpsGet(uri, filename, delay, timeout) {
    return new Promise(function(resolve, reject) {
        setTimeout(function(){
            https.get(uri, {headers:{"upgrade-insecure-requests": "1",'X-Requested-With': 'XMLHttpRequest',"User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0"},timeout: timeout}, function(res){
                var chuncks = [];
                if (res.statusCode != 200) {
                    console.error(res);
                    reject(new Error(res.statusMessage))
                    return
                }
                res.on('data', (data)=> chuncks.push(data));
                res.once('end', ()=> {
                    let data = Buffer.concat(chuncks).toString("utf-8");
                    if (filename && filename.length > 0) {
                        fs.mkdirSync(path.dirname(filename), {recursive: true});
                        fs.writeFileSync(filename, data);
                    }
                    resolve(data);
                });
            }).once('error', reject);
        }, delay);
    });
}

async function fetch(uri, option) {
    option = Object.assign({timeout:60000,delay:3000,cache:true}, option);
    let {timeout, delay, cache=true} = option;
    return new Promise(function(resolve, reject){
        let filename = '';
        if (cache) {
            let newname = uri2name2(uri);
            if (fs.existsSync(newname)) {
                resolve(fs.readFileSync(newname).toString('utf-8'));
                return
            }
            filename = newname;
        }
        function onfailure(reason) {
            console.log(uri, reason)
            httpsGet(uri, filename, delay, timeout).then(resolve, onfailure);
        }
        httpsGet(uri, filename, delay, timeout).then(resolve, onfailure);
    });
}

function today() {
    let now = new Date();
    let seconds = parseInt(now.getTime()/1000);
    return seconds - ((now.getHours() * 60 + now.getMinutes()) * 60 + now.getSeconds());
}

function format(v, n = 2) {
    return `${Array(n).join('0')}${v}`.slice(-n)
}

exports.format = format;
exports.fetch = fetch;
exports.htmlDecode = htmlDecode;
exports.today = today;
exports.uri2name = uri2name2;