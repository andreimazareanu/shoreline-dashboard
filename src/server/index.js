const express = require('express');
const async = require('async');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const path = require('path');
const nconf = require('nconf');
const process = require('process');
const { mockDAO } = require('./utils');

const DAO = new mockDAO();

nconf.env();

const app = express();
const api = require('./api.js');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(api);

app.use(express.static('dist'));
app.use('/', (req, res) => {
    const fp = path.join(__dirname, '..', '..', 'dist', 'index.html');
    res.sendFile(fp);
});
app.use('*', (req, res) => {
    const fp = path.join(__dirname, '..', '..', 'dist', 'index.html');
    res.sendFile(fp);
});

async.auto({
    dummy_init: cb => {
        // We could connect to all sorts of databases here if we chose to have global connexions across our app
        // If not, each module would have it's own connection
        cb();
    }
}, (err, results) => {
    if(err) {
        console.error(err);
        process.exit(1);
    }
    
    app.locals.DAO = DAO;
    app.set('superSecret', 'Super secret secret ASDFASFAFG@#2342frgh264fSDFA!$R@3!?'); //This would be read from env, not hardcoded
    
    const port = parseInt(nconf.get('PORT') || '80', 10);
    app.listen(port, () => {console.log(`Listening on port ${port}!`)})
});