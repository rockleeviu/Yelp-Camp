if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}

const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const ejsMate = require('ejs-mate');;
const session = require('express-session');
const methodOverride = require('method-override');
const ExpressError = require('./utils/ExpressError');
const flash = require('connect-flash');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user')
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require('helmet');

// const dbUrl = process.env.DB_URL;
const dbUrl = 'mongodb://localhost:27017/yelp-camp';

const userRoutes = require('./routes/users');
const campgroundRoutes = require('./routes/campgrounds');
const reviewRoutes = require('./routes/reviews');

const MongoStore = require("connect-mongo");

const app = express();

main().catch(err => console.log('OH NO, ERROR', err));

// mongodb://localhost:27017/yelp-camp
async function main() {
    await mongoose.connect(dbUrl); 
    console.log('MONGO Connection Open!');
    }

app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'))

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(mongoSanitize({
    replaceWith: '_'
}));

const store = MongoStore.create({
    mongoUrl: dbUrl,
    touchAfter: 24 * 60 * 60,
    crypto: {
        secret: 'squirrel'
    }
});

store.on("error", function (e) {
    console.log("Session Store Error!!!", e)
})

const sessionConfig = {
    store,
    name : 'session',
    secret: 'thisshouldbeabettersecret',
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        // secure: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge:  1000 * 60 * 60 * 24 * 7
    }
}
app.use(session(sessionConfig));
app.use(flash());
// app.use(helmet());

// const scriptSrcUrls = [
//     "https://stackpath.bootstrapcdn.com/",
//     "https://api.tiles.mapbox.com/",
//     "https://api.mapbox.com/",
//     "https://kit.fontawesome.com/",
//     "https://cdnjs.cloudflare.com/",
//     "https://cdn.jsdelivr.net",
//     "https://ka-f.fontawesome.com/releases/v6.4.0/css/",
//     "https://ka-f.fontawesome.com/releases/v6.4.0/webfonts/"
// ];
// //This is the array that needs added to
// const styleSrcUrls = [
//     "https://kit-free.fontawesome.com/",
//     "https://api.mapbox.com/",
//     "https://api.tiles.mapbox.com/",
//     "https://fonts.googleapis.com/",
//     "https://use.fontawesome.com/",
//     "https://cdn.jsdelivr.net",
//     "https://ka-f.fontawesome.com/releases/v6.4.0/css/",
//     "https://ka-f.fontawesome.com/releases/v6.4.0/webfonts/"
// ];
// const connectSrcUrls = [
//     "https://api.mapbox.com/",
//     "https://a.tiles.mapbox.com/",
//     "https://b.tiles.mapbox.com/",
//     "https://events.mapbox.com/",
//     "https://ka-f.fontawesome.com/releases/v6.4.0/css/",
//     "https://ka-f.fontawesome.com/releases/v6.4.0/webfonts/"
// ];
// const fontSrcUrls = [];
// app.use(
//     helmet.contentSecurityPolicy({
//         directives: {
//             defaultSrc: [],
//             connectSrc: ["'self'", ...connectSrcUrls],
//             scriptSrc: ["'unsafe-inline'", "'self'", ...scriptSrcUrls],
//             styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
//             workerSrc: ["'self'", "blob:"],
//             objectSrc: [],
//             imgSrc: [
//                 "'self'",
//                 "blob:",
//                 "data:",
//                 "https://res.cloudinary.com/drytjdqfm/", //SHOULD MATCH YOUR CLOUDINARY ACCOUNT! 
//                 "https://images.unsplash.com/",
//                 "https://ka-f.fontawesome.com/releases/v6.4.0/css/",
//                 "https://ka-f.fontawesome.com/releases/v6.4.0/webfonts/"
//             ],
//             fontSrc: ["'self'", ...fontSrcUrls],
//         },
//     })
// );

app.use(helmet({ contentSecurityPolicy: false }));


passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
})


app.use('/', userRoutes);
app.use('/campgrounds', campgroundRoutes);
app.use('/campgrounds/:id/reviews', reviewRoutes);


app.get('/', (req, res) => {
    res.render('home');
})

app.all('*', (req, res, next) => {
    next(new ExpressError('Page Not Found', 404));
})

app.use((err, req, res, next) => {
    const { statusCode = 500, message = "Something went wrong!!" } = err;
    if (!err.message) err.message = 'Oh no, something went wrong!';
    res.status(statusCode).render('error', {err});
})

app.listen(3000, () => {
    console.log('Serving on port 3000');
})