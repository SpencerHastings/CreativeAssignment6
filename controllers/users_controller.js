var crypto = require('crypto');
var mongoose = require('mongoose'),
    User = mongoose.model('User');

function hashPW(pwd)
{
    return crypto.createHash('sha256').update(pwd).
    digest('base64').toString();
}

exports.signup = function(req, res)
{
    console.log("Begin exports.signup");

    if (req.body.username.length <= 0)
    {
        res.session.error = "Please enter a username.";
        res.redirect('/signup');
    }
    User.findOne({ username: req.body.username }).exec(function(err, userCheck)
    {
        if (!userCheck)
        {
            if (req.body.password.length <= 6)
            {
                res.session.error = "Please enter a passwrd with at elast 6 characters.";
                res.redirect('/signup');
            }

            var user = new User({ username: req.body.username });
            console.log("after new user exports.signup");
            user.set('hashed_password', hashPW(req.body.password));
            user.set('color', "<To be determined>")
            console.log("after hashing user exports.signup");
            user.save(function(err)
            {
                console.log("In exports.signup");
                console.log(err);
                if (err)
                {
                    res.session.error = err;
                    res.redirect('/signup');
                }
                else
                {
                    req.session.user = user.id;
                    req.session.username = user.username;
                    req.session.msg = 'Authenticated as ' + user.username;
                    res.redirect('/');
                }
            });
        }
        else
        {
            err = "User already exists";
        }
        if (err)
        {
            req.session.regenerate(function()
            {
                req.session.msg = err;
                res.redirect('/signup');
            });
        }
    });
};
exports.login = function(req, res)
{
    User.findOne({ username: req.body.username })
        .exec(function(err, user)
        {
            if (!user)
            {
                err = 'User Not Found.';
            }
            else if (user.hashed_password ===
                hashPW(req.body.password.toString()))
            {
                req.session.regenerate(function()
                {
                    console.log("login");
                    console.log(user);
                    req.session.user = user.id;
                    req.session.username = user.username;
                    req.session.msg = 'Authenticated as ' + user.username;
                    req.session.color = user.color;
                    res.redirect('/');
                });
            }
            else
            {
                err = 'Authentication failed.';
            }
            if (err)
            {
                req.session.regenerate(function()
                {
                    req.session.msg = err;
                    res.redirect('/login');
                });
            }
        });
};
exports.getUserProfile = function(req, res)
{
    User.findOne({ _id: req.session.user })
        .exec(function(err, user)
        {
            if (!user)
            {
                res.json(404, { err: 'User Not Found.' });
            }
            else
            {
                User.find({}).exec(function(err, users)
                {

                    var quotes = [];
                    for (var i = 0; i < users.length; i++)
                    {
                        quotes[i] = users[i].color;
                    }
                    var user2 = user.toObject();
                    user2.quotes = quotes;
                    console.log("HERE");
                    console.log(user2);
                    res.json(user2);
                });
                
            }
        });
};
exports.updateUser = function(req, res)
{
    User.findOne({ _id: req.session.user })
        .exec(function(err, user)
        {
            user.set('color', req.body.color);
            user.save(function(err)
            {
                if (err)
                {
                    res.sessor.error = err;
                }
                else
                {
                    req.session.msg = 'User Updated.';
                    req.session.color = req.body.color;
                }
                res.redirect('/user');
            });
        });
};
exports.deleteUser = function(req, res)
{
    User.findOne({ _id: req.session.user })
        .exec(function(err, user)
        {
            if (user)
            {
                user.remove(function(err)
                {
                    if (err)
                    {
                        req.session.msg = err;
                    }
                    req.session.destroy(function()
                    {
                        res.redirect('/login');
                    });
                });
            }
            else
            {
                req.session.msg = "User Not Found!";
                req.session.destroy(function()
                {
                    res.redirect('/login');
                });
            }
        });
};
