const cheerio = require('cheerio');
const { fetch } = require('./common');

async function index() {
    let uri = 'https://video.enlighten.org.tw/zh-tw/';
    let data = await fetch(uri, {cache: false});
    let $ = cheerio.load(data);
    let title = $('head>title').text().trim();
    let items = [];
    $('div.menu-block').find('li.parent').each((_, e) => {
        let item = $('a:first', e);
        let uri = $(item).attr('href').replace(/^\/zh-tw\//, '');
        if (/^https?:\/\//.test(uri)) return;
        if (['enlighten', '', 'visit_category'].includes(uri)) return;
        let category = {uri: uri, title: $(item).text().trim(), items:[]};
        $('ul>li', e).each((_, e) => {
            let item = $('a:first', e);
            let uri = $(item).attr('href').replace(/^\/zh-tw\//, '');
            category.items.push({uri: uri, title: $(item).text().trim()});
        });
        // console.table(category.items);
        items.push(category);
    });
    return {title, items};
}

async function category(href) {
    let uri = `https://video.enlighten.org.tw/zh-tw/${href}/`;
    let data = await fetch(uri, {cache: false});
    let $ = cheerio.load(data);
    let image = $('meta[property="og:image"]:last').attr('content');
    let items = [];
    $('div.enlighten-video-list').find('tr').each((_, tr) => {
        let article = {};
        $('td', tr).each((i, td) => {
            switch(i) {
            case 0: { article.index = $(td).text().trim(); } break;
            case 1: {
                let item = $('a:first', td);
                article.uri = $(item).attr('href').replace(/^\/zh-tw\//, '');
                article.title = $(item).text().trim();
            } break;
            case 2: {
                article.mp3 = $('a:first', td).attr('href');
            } break;
            case 3: { article.author = $(td).text().trim(); } break;
            }
        });
        items.push(article);
    });
    console.table(items);
    return {image, items};
}

async function article(href) {
    let uri = `https://video.enlighten.org.tw/zh-tw/${href}`;
    let data = await fetch(uri);
    let $ = cheerio.load(data);
    let image = $('meta[property="og:image"]:last').attr('content');
    let video = $('div#youtubeplayer>iframe').attr('src');
    let content = $('div.enlighten-video-content').html();
    let previous = $('div.enlighten-pagination>ul>li.previous>a');
    let next = $('div.enlighten-pagination>ul>li.next>a');
    return {image, video, content,
        previous: previous && previous.length>0?{href: $(previous).attr('href').replace(/^\/zh-tw\//, ''), title: $(previous).attr('title')}: null,
        next: next && next.length>0?{href: $(next).attr('href').replace(/^\/zh-tw\//, ''), title: $(next).attr('title')}: null,
    }
}

async function snapshot() {
    let {title, items} = await index();
    for(let i = 0; i < items.length; i++) {
        let item = items[i];
        for(let j = 0; j < item.items.length; j++) {
            let sub = item.items[j];
            let {image, items} = await category(sub.uri);
            Object.assign(sub, {image, items});
            for(let n = 0; n < items.length; n++) {
                let item = items[n];
                let data = await article(item.uri);
                Object.assign(item, data);
            }
        }
    }
    return {title, items};
}

if (require.main === module) {
    snapshot().then(console.log, console.error);
}