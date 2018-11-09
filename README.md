# fxa-email-first-oauth-relier

This is a proof of concept to show how to integrate Firefox Account's "email-first" flow
into a mozilla.org site.

The important files are:

* [src/components/FxAForm.vue](https://github.com/shane-tomlinson/fxa-email-first-oauth-relier/blob/master/src/components/FxAForm.vue) - How to present the form and get the data necessary to redirect to FxA.
* [server/index.js](https://github.com/shane-tomlinson/fxa-email-first-oauth-relier/blob/master/server/index.js) - How to do the server side bits for the OAuth flow, including CSRF protection, getting access to the user's profile data, and subscribing the user to newsletters.

At a high level, you need to do the following:

1. Perform an OAuth flow with FxA.
2. When the OAuth flow is complete, trade the OAuth code for an access token that can then be used to:
3. Get the user's profile information
4. Subscribe to newsletters
5. Set a local session cookie that allows returning users who have already signed in to not sign in again.

## Project setup
```
yarn install
```

Running this locally with a full FxA integration currently requires fxa-local-dev.

Install [fxa-local-dev](https://github.com/mozilla/fxa-local-dev) using the [firefox-special-event](https://github.com/mozilla/fxa-local-dev/tree/firefox-special-event) branch.

```
git clone https://github.com/mozilla/fxa-local-dev.git
cd fxa-local-dev
git pull
git checkout firefox-special-event
npm install
./pm2 start servers.json
```

I'm going to try to get this running on Monday against https://stable.dev.lcip.org (our test environment)
so that you don't have to do all this, but it's late on a Friday and I'm tired.

### Compiles and minifies for production
```
yarn run build
```

## Running

1. Install and run fxa-local-dev (see [Project setup](#project-setup))
2. Start the fake mozilla.org server

> node server

3. Load up http://127.0.0.1:8082

## Running against stable w/o installing fxa-local-dev