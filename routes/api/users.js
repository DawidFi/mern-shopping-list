const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');
const config = require('config');
const User = require('../../models/User');


router
    .post('/', [
        check('username', 'Username is required')
            .not()
            .isEmpty(),
        check('password', 'Password is required')
            .not()
            .isEmpty(),
        check('email', 'Email is required')
            .not()
            .isEmpty()
    ], async (req, res) => {

        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { username, email, password } = req.body;

        try {
            let user = await User.findOne({ email });

            if (user) {
                return res.status(400).json({ errors: [{ msg: 'Email already registered' }] });
            }

            user = await User.findOne({ username });
            if (user) {
                return res.status(400).json({ errors: [{ msg: 'Username already registered' }] });
            }

            user = new User({
                username,
                email,
                password
            });

            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);

            await user.save();

            const payload = {
                user: {
                    id: user.id
                }
            };

            jwt.sign(
                payload,
                config.get('jwtSecret'), {
                expiresIn: 3600000
            }, (err, token) => {
                if (err) throw err;
                res.json({ token })
            }
            );

        } catch (error) {
            console.error(error.message);
            res.status(500).send('Server error');
        }
    });

module.exports = router;