/**
 * Created by Peter on 26/08/15.
 */
import passport from 'passport';
import { Strategy as LocalStrategy } from  'passport-local';
import { Strategy as TwitterStrategy } from  'passport-twitter';
import flash from 'connect-flash';
import session from 'express-session';
import User from  './model/user.model';
import twitterConfig from './config';

export default function init(app) {
// required for passport
  app.use(session({ secret: 'SuperSweetSecretSessionBrah' })); // session secret
  app.use(passport.initialize());
  app.use(passport.session()); // persistent login sessions
  app.use(flash()); // use connect-flash for flash messages stored in session


// load the auth variables

  // used to serialize the user for the session
  passport.serializeUser(function(user, done) {
    done(null, user.id);
  });

  // used to deserialize the user
  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });

  // code for login (use('local-login', new LocalStategy))
  // code for signup (use('local-signup', new LocalStategy))
  // code for facebook (use('facebook', new FacebookStrategy))

  // =========================================================================
  // TWITTER AUTHORIZATION =================================================================
  // =========================================================================
  passport.use(new TwitterStrategy({

      consumerKey     : twitterConfig.TWITTER_AUTH.TWITTER_KEY,
      consumerSecret  : twitterConfig.TWITTER_AUTH.TWITTER_SECRET,
      callbackURL     : twitterConfig.TWITTER_AUTH.TWITTER_CALLBACK

    },
    function(token, tokenSecret, profile, done) {

      // NB: This code works, and i'm going to keep it like it is, but i'm worried
      // that it won't be able to handle things like someone's token / secret changing

      // make the code asynchronous
      // User.findOne won't fire until we have all our data back from Twitter
      process.nextTick(function() {
        loginOrCreateNewUserAndLogin(token, tokenSecret, profile, done);
      });

    }));

  return passport;

};

function loginOrCreateNewUserAndLogin(token, tokenSecret, profile, done) {
  User.findOne({'twitter.id': profile.id}, function (err, user) {

    // if there is an error, stop everything and return that
    // ie an error connecting to the database
    if (err)
      return done(err);

    // if the user is found then log them in
    if (user) {
      console.log('user found', user)
      return done(null, user); // user found, return that user
    } else {
      // if there is no user, create them
      var newUser = createNewTwitterUser(profile, token, tokenSecret);
      // save our user into the database
      newUser.save(function (err) {
        if (err)
          throw err;
        return done(null, newUser);
      });
    }

  });
}

function createNewTwitterUser(profile, token, tokenSecret){
  var newUser = new User();

  // set all of the user data that we need
  newUser.twitter.id = profile.id;
  newUser.twitter.token = token;
  newUser.twitter.tokenSecret = tokenSecret;
  newUser.twitter.username = profile.username;
  newUser.twitter.username = profile.username;
  if (profile.photos.length > 0) {
    newUser.twitter.picture = profile.photos[0].value;
  }
  newUser.twitter.displayName = profile.displayName;

  return newUser;

}


// =========================================================================
// TWITTER AUTHENTICATION =================================================================
// =========================================================================

// passport.use('twitter-authz', new TwitterStrategy({
//     consumerKey     : twitterConfig.TWITTER_AUTH.TWITTER_KEY,
//     consumerSecret  : twitterConfig.TWITTER_AUTH.TWITTER_SECRET,
//     callbackURL     : twitterConfig.TWITTER_AUTH.TWITTER_CALLBACK
//   },
//   function(token, tokenSecret, profile, done) {
//     Account.findOne({ domain: 'twitter.com', uid: profile.id }, function(err, account) {
//       if (err) { return done(err); }
//       if (account) { return done(null, account); }
//
//       var account = new Account();
//       account.domain = 'twitter.com';
//       account.uid = profile.id;
//       var t = { kind: 'oauth', token: token, attributes: { tokenSecret: tokenSecret } };
//       account.tokens.push(t);
//       return done(null, account);
//     });
//   }
// ));
