const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ googleId: profile.id });

        if (!user) {
          const existingEmail = await User.findOne({ email: profile.emails[0].value });
          if (existingEmail) {
            existingEmail.googleId = profile.id;
            existingEmail.authProvider = 'google';
            if (profile.photos?.[0]?.value) existingEmail.avatar = profile.photos[0].value;
            await existingEmail.save();
            return done(null, existingEmail);
          }

          user = await User.create({
            googleId: profile.id,
            authProvider: 'google',
            username: profile.displayName.replace(/\s+/g, '_').toLowerCase() + '_' + Math.random().toString(36).slice(2, 6),
            email: profile.emails[0].value,
            avatar: profile.photos?.[0]?.value || '',
            isVerified: true,
          });
        }

        done(null, user);
      } catch (err) {
        done(err, null);
      }
    }
  )
);

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;
