const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');  // used for form data converting to text only
const mongoose = require('mongoose');
const session = require('express-session');   // for logged in user to remember him 
const MongoDBStore = require('connect-mongodb-session')(session);
const csrf = require('csurf');  // security purpose
const flash = require('connect-flash');  // for flash message to user
const multer = require('multer');  // use for uploading files just like bodyparser

const errorController = require('./controllers/error');
const User = require('./models/user');

const MONGODB_URI = 'mongodb://rushisonje:Rushikesh123@cluster0-shard-00-00.ijmxv.mongodb.net:27017,cluster0-shard-00-01.ijmxv.mongodb.net:27017,cluster0-shard-00-02.ijmxv.mongodb.net:27017/shop?ssl=true&replicaSet=atlas-7tpwpf-shard-0&authSource=admin&retryWrites=true&w=majority';

const app = express();
const store = new MongoDBStore({
  uri: MONGODB_URI,
  collection: 'sessions'
});
const csrfProtection = csrf();

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'images');
  },
  filename: (req, file, cb) => {
    const dateStr = new Date().toISOString().replace(/:/g, '-');
    cb(null, dateStr + '-' + file.originalname);
    // cb(null, file.filename + '-' + file.originalname)  // showing filename as undifined-boat.png
  }
})

const fileFilter = (req, file, cb) => {
  if(
    file.mimetype === 'image/jpg' ||
    file.mimetype === 'image/png' ||
    file.mimetype === 'image/jpeg'
  ) {
    cb(null, true)
  } else {
    cb(null, false)
  }
}

app.set('view engine', 'ejs');
app.set('views', 'views');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');

app.use(bodyParser.urlencoded({ extended: false }));
// app.use(multer({dest: 'images'}).single('image'));  // for creating images folder in your app folder
app.use(multer({ storage: fileStorage, fileFilter: fileFilter }).single('image'));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use(
  session({
    secret: 'my secret',
    resave: false,
    saveUninitialized: false,
    store: store
  })
);
app.use(csrfProtection);
app.use(flash());

app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn;
  res.locals.csrfToken = req.csrfToken();
  next();
});

app.use((req, res, next) => {
  // throw new Error('sync dummy');
  if (!req.session.user) {
    return next();
  }
  User.findById(req.session.user._id)
    .then(user => {
      // throw new Error('dummy');
      if(!user) {
        return next();
      }
      req.user = user;
      // console.log(req.user);
      next();
    })
    .catch(err => {
      // console.log(err)
      next(new Error(err))
    });
});


app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.get('/500', errorController.get500)

app.use((error, req, res, next) => {
  // res.status(error.httpStatusCode).render(...)
  res.redirect('/500')
})

app.use(errorController.get404);

mongoose
  .connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(result => {
    app.listen(3000);
    console.log('Port Started On 3000: http://localhost:3000')
  })
  .catch(err => {
    console.log(err);
  });
