const http = require('http');
const https = require('https');
const fs = require('fs');
const url = require('url');

const port = 3000;
const server = http.createServer();

const cred = require("./auth/cred.json");
const country_codes = require("./country_codes.json");
const month_codes = require("./month_codes.json")

let articles = [];

server.on('listening', listening_handler);
function listening_handler(){
    console.log(`Listening on port ${port}`);
}
server.listen(port);

server.on('request', request_handler);
function request_handler(req, res){
    console.log(`New request for ${req.url} from ${req.socket.remoteAddress}`);
    if(req.url === "/"){
        const form = fs.createReadStream("html/index.html");
        res.writeHead(200, {"Content-Type":"text/html"});
        form.pipe(res);
    }
    else if(req.url === "/favicon.ico"){
        const favicon = fs.createReadStream('images/favicon.ico');
        res.writeHead(200, {"Content-Type":"image/x-icon"});
        favicon.pipe(res);
    }
    else if(req.url === "/images/background.jpg"){
        const bg = fs.createReadStream('images/background.jpg');
        res.writeHead(200, {"Content-Type": "image/jpeg"});
        bg.pipe(res);
    }
    else if(req.url === "/images/logo.jpg"){
		const banner = fs.createReadStream('images/logo.jpg');
		res.writeHead(200, {"Content-Type": "image/jpeg"});
		banner.pipe(res);
	}
    else if(req.url.startsWith("/keyword")){
        let {keyword} = url.parse(req.url, true).query;
        get_keyword_news(keyword.toLowerCase(), res, req);
    }
    else if(req.url.startsWith("/country")){
        let {country} = url.parse(req.url, true).query;
        get_topheadlines_country(country.toLowerCase(), res, req);
    }
    else{
        res.writeHead(404, {"Content-Type":"text/html"});
        res.end(`<h1>404 Not Found<h1>`);
    }
}

function get_keyword_news(keyword, res, req){
    if(keyword === ""){
        res.writeHead(404, {"Content-Type":"text/html"});
        res.end(`<h1>404 Error</h1><p>Must include a keyword</p>`);
    }else{
        let keyword_endpoint = `https://newsapi.org/v2/everything?q=${keyword}&sortBy=popularity`;
        const newsapi_request = https.get(keyword_endpoint, {method:"GET", headers:cred});
        newsapi_request.on("response", process_data);
        function process_data(keyword_stream){
            let keyword_data = "";
            keyword_stream.on("data", chunk => keyword_data += chunk);
            keyword_stream.on("end", () => display_results(keyword_data, res, req));
        }
    }
}

function get_topheadlines_country(country, res, req){
    if(country === ""){
        res.writeHead(404, {"Content-Type":"text/html"});
        res.end(`<h1>404 Error</h1><p>Must include a country</p>`);
    }else{
        let country_code = getCountryCode(country);
        if(country_code === ""){
            res.end(`<h1>404 Error</h1><p>News from this country is unavailable at the moment</p>`)
        }else{
            let country_endpoint = `https://newsapi.org/v2/top-headlines?country=${country_code}`;
            const newsapi_request = https.get(country_endpoint, {method:"GET", headers:cred});
            newsapi_request.on("response", process_data);
            function process_data(country_stream){
                let country_data = "";
                country_stream.on("data", chunk => country_data += chunk);
                country_stream.on("end", () => display_results(country_data, res, req));
            }
        }
    }
}

function getCountryCode(country){
    if(country === "us" ||country === "america"){
        return country_codes['united states'];
    }else if(country === "britain" || country === "england" || country === "uk"){
        return country_codes['united kingdom'];
    }else{
        if(country_codes[`${country}`] === ""){
            return "";
        }else{
            return country_codes[`${country}`];
        }
    }
}

function display_results(data, res, req){
    let news_object = JSON.parse(data);
    let news = news_object && news_object.articles;
    let results = news.map(format_news).join('');
    res.writeHead(200, {"Content-Type": "text/html"});
    res.end(`<meta charset="utf-8"><h1>Articles Found:</h1><ol>${results}</ol>`);

    function format_news(article){
        articles.push(article);
        let author = article && article.author;
        let title = article && article.title;
        let description = article && article.description;
        let img = article && article.urlToImage;
        let url = article && article.url;
        let date_published = formatDate(article && article.publishedAt);
        return `<li><b>${title} </b><link><button onclick="window.location.href='${url}';">Read!</button></link><p><img src="${img}" alt="${title}" width="500" height="300"></p><p><i>Author(s): </i>${author}</p><p><i>Date Published: </i>${date_published}</p><p><i>Description: </i>${description}</p></li>`;
    }
}

function formatDate(date){
    let input = date.toString(); 
    let year = input.substring(0,4);
    let month = input.substring(5,7);
    let day = input.substring(8,10);
    if(year !== "" && month !== "" && day !== ""){
        return `${month_codes[month]} ${day}, ${year}`;
    }else{
        return "Unable to find date";
    }
}