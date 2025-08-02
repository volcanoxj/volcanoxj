// 使用模板自动生成网站
const ejs = require('ejs');
const fs = require('node:fs');
const path = require('node:path');
async function build({title, items}) {
    let index = await ejs.renderFile(`${__dirname}/views/index.ejs`, {items:items});
    fs.writeFileSync("docs/index.html", index);
    items.forEach(function(category){
        category.items.forEach(function(book){
            book.items.forEach(async function(article){
                fs.mkdirSync(path.dirname(`docs/${article.uri}.html`), {recursive: true});
                let rootdir = path.dirname(article.uri).replace(/\w+/g, '..');
                let data = await ejs.renderFile(`${__dirname}/views/article.ejs`, {keys:[category.title, book.title, article.title], article:article, rootdir:rootdir});
                fs.writeFileSync(`docs/${article.uri}.html`, data);
            });
        });
    });
}

if (require.main == module) {
    const {snapshot} = require('./video');
    snapshot().then(build);
}