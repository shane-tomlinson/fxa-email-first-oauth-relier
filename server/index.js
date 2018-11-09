const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const express = require('express');
const path = require('path');
const request = require('request-promise-native');


const STATIC_DIR = path.join(__dirname, '..', 'dist');
const sessionCookieToState = {};

// Note to mozilla.org team:
// You'll need to get these from the fxa team
const OAUTH_CLIENT_ID = '42c02d0c1e811cd5';
const OAUTH_CLIENT_SECRET = '57943698ac6e8726e4b114cf30f0488d9f4d9a55abf9b4ce2a3a394ea6e0a736';


// Note to mozilla.org team
// These are local values for working with fxa-local-dev, see https://github.com/mozilla/fxa-local-dev.
// prod values are in comments next to the local dev values.
const FXA_OAUTH_ROOT = 'http://127.0.0.1:9010/v1';  // https://oauth.accounts.firefox.com
const FXA_PROFILE_ROOT = 'http://127.0.0.1:1111/v1'; // https://profile.accounts.firefox.com

// Note to mozilla.org team
// Basket is the name of the salesforce newsletter integration. With the OAuth
// code, you should be able to subscribe to the correct newsletters yourself. FxA isn't
// set up to subscribe to arbitrary newsletters. :pmac can inform you how to pass utm_params,
// I'm not sure if that currently exists. We don't pass them AFAICT.
// lniolet should be able to tell you which NEWSLETTER_IDS are needed.
const BASKET_ROOT = 'http://127.0.0.1:1114'; // https://basket.mozilla.org/news
const NEWSLETTER_IDS = 'a,b,c';

const app = express();
app.use(cookieParser());
app.use(bodyParser());

// This route is the `redirect_uri` that is set up when provisioning
// OAuth creds. It's responsibilities are:
//
// 1. Get the sessionCookie.
// 2. Get the stored state for the sessionCookie. Call this state `eexpectedState`
// 3. Compare the `expectedState` vs the `state` passed in the URL params. This is CSRF protection.
// 4. If a match, continue, if no match, exit.
// 5. Trade the `code` in the query parameters for an OAuth Access token.
// 6. Use the access token to fetch the user's profile info (if any info is needed from there)
//   6a. If the access token is valid and profile info is returned, you could set a cookie that says "this user is signed in!"
// 7. Use the same access code to sign the user up to the concert newsletters via Basket
app.get('/login_complete', async (req, res) => {
  const sessionCookie = req.cookies['_s'];
  const expectedState = sessionCookieToState[sessionCookie];

  console.log('cookie', sessionCookie);
  console.log('expected state', expectedState);
  console.log('actual state', req.query.state);
  console.log('code', req.query.code);

  if (expectedState !== parseFloat(req.query.state)) {
    res.status(401).send('state mismatch');
    return
  }

  let accessToken;
  let profile;

  try {
    accessToken = await tradeCodeForToken(req.query.code);
    profile = await tradeTokenForProfile(accessToken);
    const status = await subscribeToNewsletter(accessToken);
  } catch (err) {
    res.status(401).send('ixnay ' + String(err));
    return;
  }

  res.sendFile(path.join(STATIC_DIR, 'login_complete.html'))
});

// This route is called by the front end to get a state
// token that can be sent to FxA when initiating the OAuth
// request. State tokens are a form of CSRF
// protection. Use them.
// 1. Create a state token (opaque, but is passed in a URL).
// 2. Create a random session cookie.
// 3. In a DB somewhere, associate the state token with the session cookie.
// 4. Set the session cookie in the response.
// 5. Send the state token back the the caller. It'll be sent to FxA
//    as part of the OAuth process.
app.get('/oauth/state', (req, res) => {
  const state = Math.random();
  const sessionCookie = Math.random();

  sessionCookieToState[sessionCookie] = state;

  res.cookie('_s', sessionCookie, { httpOnly: true, sameSite: true, expires: 0 });

  res.json({ state });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(STATIC_DIR, 'index.html'))
});

app.use(express.static(STATIC_DIR));

app.listen(8082);

async function tradeCodeForToken(code) {
  // see https://github.com/mozilla/fxa-auth-server/blob/master/fxa-oauth-server/docs/api.md#post-v1token
  const tokenResponse = await request.post(`${FXA_OAUTH_ROOT}/token`, {
    form: {
      grant_type: 'authorization_code',
      client_id: OAUTH_CLIENT_ID,
      client_secret: OAUTH_CLIENT_SECRET,
      code
    },
    json: true
  });
  // response will be of the form:
  // {
  //   access_token: 'a74a67250768e6220c2faea1e4d3f504dad59eec0eed96ee75cf2f72199b517b',
  //   token_type: 'bearer',
  //   scope: 'profile basket',
  //   auth_at: 1541781367,
  //   expires_in: 1209600
  // }
  console.log('tokenResponse', tokenResponse);

  return tokenResponse.access_token;
}

async function tradeTokenForProfile(token) {
  // See https://github.com/mozilla/fxa-profile-server/blob/master/docs/API.md#get-v1profile

  const response = await request.get(`${FXA_PROFILE_ROOT}/profile`, {
    headers: {
      'Authorization': `Bearer ${token}`
    },
    json: true
  })

  // response will be of the form:
  // {
  //   email: 'stomlinson@mozilla.com',
  //   locale: 'en-US,en;q=0.5',
  //   amrValues: [ 'pwd', 'email' ],
  //   twoFactorAuthentication: false,
  //   uid: '18c7c6a7ca7a4868a2d0a457da384502',
  //   avatar: 'http://127.0.0.1:1112/a/00000000000000000000000000000000',
  //   avatarDefault: true
  // }
  const profile = response;
  console.log('profile', profile);

  return profile;
}

async function subscribeToNewsletter(token) {
  const response = await request.post(`${BASKET_ROOT}/subscribe`, {
    form: {
      newsletters: NEWSLETTER_IDS
    },
    json: true,
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  // response will be of the form:
  // {
  //   status: 'ok'
  // }
  console.log('basket', response);

  return response.status;
}