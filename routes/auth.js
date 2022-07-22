const express = require('express');

const { check, body } = require('express-validator')

const authController = require('../controllers/auth');

const User = require('../models/user')

const router = express.Router();

router.get('/login', authController.getLogin);

router.get('/signup', authController.getSignup);

router.post('/login',
    [
        check('email')
        .isEmail()
        .withMessage('Please Enter a Valid Email Address!')
        .normalizeEmail(),

        body('password', 'Please Enter a Correct Password!')
        .isLength({min: 5})
        .isAlphanumeric()
        .trim()
    ],
     authController.postLogin);

router.post('/signup',
    [
        check('email')
        .isEmail()
        .withMessage('Please Enter a Valid Email Address!')
        .custom((value, {req}) => {
            // if (value === 'rushikesh77sonje@gmail.com') {
            //     throw new Error('This email address is forbidden!')
            // }
            // return true;
            return User.findOne({ email: value })
            .then(userDoc => {
              if (userDoc) {
                return Promise.reject('E-Mail exists already, please pick a different one.')
              }
            })
        })
        .normalizeEmail(),
        body('password', 'Please Enter a Password with only numbers and text and at least 5 characters.')
        .isLength({min: 5})
        .isAlphanumeric()
        .trim(),
        body('confirmPassword')
        .trim()
        .custom((value, {req}) => {
            if( value !== req.body.password) {
                throw new Error('Password Are not Matching!')
            }
            return true;
        })
    ],
    authController.postSignup);

router.get('/reset', authController.getReset);

router.post('/reset', authController.postReset);

router.get('/reset/:token', authController.getNewPassword);

router.post('/new-password', authController.postNewPassword);

router.post('/logout', authController.postLogout);

module.exports = router;