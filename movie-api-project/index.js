const fs = require('fs');
const http = require('http');
const https = require('https');
const url = require('url');

const credentials = require("./auth/credentials.json");

const port = 3000;
const server = http.createServer();

server.on('listening', listening_handler);
function listening_handler(){
    console.log(`Listening on port ${port}`);
}
server.listen(3000);

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
        res.writeHead(200, {"Content-Type":"images/favicon.ico"});
        favicon.pipe(res);
    }
    else if(req.url === "/images/banner.jpg"){
        const banner = fs.createReadStream('images/banner.jpg');
        res.writeHead(200, {"Content-Type":"image/jpeg"});
        banner.pipe(res);
    }
    else if(req.url.startsWith("/search")){
        let {genre, year, actor} = url.parse(req.url, true).query;
        get_movie_information(genre, year, actor,res);
    }
    else if(req.url.startsWith("/keyword")){
        let {keyword} = url.parse(req.url, true).query;
        get_keyword_movies(keyword, res);
    }
    else if(req.url.startsWith("/trending")){
        if(req.url.startsWith("/trending?day=Day")){
            get_daytrending_movies(res);
        }else if(req.url.startsWith("/trending?week=Week")){
            get_weektrending_movies(res);
        }else if(req.url.startsWith("/trending?toprated=Top+Rated")){
            get_toprated_movies(res);
        }
    }
    else{
        res.writeHead(404, {"Content-Type":"text/html"});
        res.end(`<h1>404 Not Found<h1>`);
    }
}

function get_keyword_movies(keyword, res){
    if(keyword === ""){
        res.writeHead(400, {"Content-Type":"text/html"});
        res.end(`<h1>404 Error</h1><p>Must enter a keyword(s)`);
    }else{
        let keyword_endpoint = `https://api.themoviedb.org/3/search/movie?query=${keyword}&include_adult=false&language=en-US&page=1`;
        const keyword_request = https.get(keyword_endpoint, {method:"GET", headers:credentials});
        keyword_request.on("response", process_stream);
        function process_stream(keyword_stream){
            let keyword_data = "";
            keyword_stream.on("data", chunk => keyword_data += chunk);
            keyword_stream.on("end", () => display_results(keyword_data, res));
        }
    }
}

function get_toprated_movies(res){
    let toprated_endpoint = `https://api.themoviedb.org/3/movie/top_rated?language=en-US&page=1`;
    const toprated_request = https.get(toprated_endpoint, {method:"GET", headers:credentials});
    toprated_request.on("response", process_stream);
    function process_stream(toprated_stream){
        let toprated_data = "";
        toprated_stream.on("data", chunk => toprated_data += chunk);
        toprated_stream.on("end", () => display_results(toprated_data, res));
    }
}

function get_daytrending_movies(res){
    let trending_endpoint = `https://api.themoviedb.org/3/trending/movie/day?language=en-US`;
    const day_request = https.get(trending_endpoint, {method:"GET", headers:credentials});
    day_request.on("response", process_stream);
    function process_stream(day_stream){
        let day_data = "";
        day_stream.on("data", chunk => day_data += chunk);
        day_stream.on("end", () => display_results(day_data, res));
    }
}

function get_weektrending_movies(res){
    let trending_endpoint = `https://api.themoviedb.org/3/trending/movie/week?language=en-US`;
    const week_request = https.get(trending_endpoint, {method:"GET", headers:credentials});
    week_request.on("response", process_stream);
    function process_stream(week_stream){
        let week_data = "";
        week_stream.on("data", chunk => week_data += chunk);
        week_stream.on("end", () => display_results(week_data, res));
    }
}

function get_movie_information(genre, year, actor, res){
    if(genre === "" && year === "" && actor === ""){
        res.writeHead(404,{"Content-Type":"text/html"});
        res.end(`<h1>404 Error</h1><p>Must have at least one filter</p>`);
    }else{
        const page = Math.ceil(Math.random() * 15);
        let moviedb_endpoint = `https://api.themoviedb.org/3/discover/movie?include_adult=false&include_video=false&language=en-US&sort_by=popularity.desc&page=${page}`;
        if(genre !== ""){
            let genre_id = get_genre_id(genre.toLowerCase());
            if(genre_id === 0){
                res.writeHead(404,{"Content-Type":"text/html"});
                res.end(`<h1>404 Error</h1><p>Unrecognized genre</p>`);
            }else{
                moviedb_endpoint += `${moviedb_endpoint}&with_genres=${genre_id}`;
            }
        }
        if(year !== ""){
            moviedb_endpoint += `${moviedb_endpoint}&primary_release_year=${year}`;
        }
        if(actor !== ""){

        }
        const moviedb_request = https.get(moviedb_endpoint, {method:"GET", headers:credentials});
        moviedb_request.on("response", process_data);
        function process_data(movie_stream){
            let movie_data = "";
            movie_stream.on("data", chunk => movie_data += chunk);
            movie_stream.on("end", () => display_results(movie_data, res));
        }
    }
}

function get_genre_id(genre){
    switch(genre){
        case "action":
            return 28;
            break;
        case "adventure":
            return 12;
            break;
        case "animation":
            return 16;
            break;
        case "comedy":
            return 35;
            break;
        case "crime":
            return 80;
            break;
        case "documentary":
            return 99;
            break;
        case "drama":
            return 18;
            break;
        case "family":
            return 10751;
            break;
        case "fantasy":
            return 14;
            break;
        case "history":
            return 36;
            break;
        case "horror":
            return 27;
            break;
        case "music":
            return 10402;
            break;
        case "musical":
            return 10402;
            break;
        case "mystery":
            return 9648;
            break;
        case "romance":
            return 10749;
            break;
        case "science fiction":
            return 878;
            break;
        case "tv movie":
            return 10770;
            break;
        case "thriller":
            return 53;
            break;
        case "war":
            return 10752;
            break;
        case "western":
            return 37;
            break;
        default:
            return 0;
    }
}

function display_results(movie_data, res){
    let movie_object = JSON.parse(movie_data);
    let movies = movie_object && movie_object.results;
    let results = movies.map(format_movie).join('');
    res.writeHead(200, {"Content-Type": "text/html"});
    res.end(`<p>Results:</p><ol>${results}</ol`);
    
    function format_movie(movie){
        let movie_id = movie && movie.id;
        let movie_name = `<b>${movie && movie.title}</b>`;
        let movie_language = `<p>Language: ${movie && movie.original_language}</p>`;
        let movie_rating = `<p>Movie Rating: ${movie && movie.vote_average}/10 (${movie && movie.vote_count} votes)</p>`;
        let movie_release_date = `<p>Released: ${movie && movie.release_date}</p>`;
        let movie_summary = `<p><i>Summary: </i>${movie && movie.overview}</p>`;
        let img = movie && movie.poster_path;
        let movie_poster = `<img src="https://image.tmdb.org/t/p/w300${img}" alt="${movie && movie.title}" width="300" height="500" />"`;
        return `<li>${movie_name}${movie_summary}${movie_release_date}${movie_language}${movie_rating}${movie_poster}</li>`;
    }

}