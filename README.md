# fxa-email-first-oauth-relier

This is a proof of concept to show how to integrate Firefox Account's "email-first" flow
into a mozilla.org site.

The important files are:

* src/components/FxAForm.vue - How to present the form and get the data necessary to redirect to FxA.
* server/index.js - How to do the server side bits for the OAuth flow, including CSRF protection, getting access to the user's profile data, and subscribing the user to newsletters.

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

### Compiles and minifies for production
```
yarn run build
```

Getting this running fully requires [fxa-local-dev](https://github.com/mozilla/fxa-local-dev) using the [firefox-special-event](https://github.com/mozilla/fxa-local-dev/tree/firefox-special-event) branch.
