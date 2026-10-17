# Personal Spotify playback in FP-LCARS

The basic Spotify embed remains available without an app connection. Spotify may limit it to previews when sign-in or protected-media playback is unavailable. Its iframe retains `allow="encrypted-media"` and uses Spotify's standard unsandboxed embed configuration. Other embedded websites retain their sandbox.

Full playback uses the optional Spotify Web Playback SDK. The controls can also control the account's active Spotify device through the Web API. Spotify Premium is required. This is a personal integration, not a public streaming service.

## One-time Spotify setup

The public Client ID supplied by Blair is configured in `spotify.js`. No client secret is used or needed. In that app's developer dashboard:

1. Enable Web API and Web Playback SDK.
2. Add exactly `https://fplearning.ca/lcars.html` to Redirect URIs.
3. Add any additional permitted account under Users Management, within Spotify's development-mode limits.

Open Subspace Media in LCARS, click Connect Spotify and approve access. Paste a track, album or playlist link above the controls. Choose Play here, then Play loaded link. Use the song position slider to seek, or the back/forward 15-second buttons. Previous/next and play/pause operate on the active Spotify device shown above the controls.

Play here explicitly transfers the account's player to FP-LCARS and stops the embedded preview. Playback is never started automatically on page load. Returning to Command Station keeps the connected player available in this tab. Closing or reloading the tab disconnects that playback device. Use Disconnect to clear this tab's sign-in session. Revoke app access in the Spotify account settings to invalidate the grant at Spotify.

## Storage and network behavior

- OAuth uses Authorization Code with PKCE and a random, expiring state value. Invalid callbacks are rejected before token exchange, and callback parameters are removed from the address bar.
- The public Client ID is remembered locally. Access and refresh tokens are stored only in this tab's session storage. No credentials are sent to an FPL server.
- The SDK loads only after Play here. Playback state is polled every five seconds while the Spotify panel and browser tab are visible. Spotify retry delays are respected.
- Browser protected-content settings, Spotify app access and account permissions still apply. Denial, expiry, unavailable devices and rate limits produce messages in the panel.

## Validation

Browser checks with mocked Spotify responses covered OAuth PKCE/state rejection, token exchange, seek boundaries, transport commands, SDK device transfer, loaded-link playback, unavailable devices, playback restrictions, retry delays, disconnect and mobile overflow. Native JavaScript syntax and whitespace checks passed. Actual account authorization and protected-media playback require confirmation using the configured Spotify account in Opera GX.

References: [PKCE](https://developer.spotify.com/documentation/web-api/tutorials/code-pkce-flow), [Web Playback SDK](https://developer.spotify.com/documentation/web-playback-sdk/tutorials/getting-started), [seek controls](https://developer.spotify.com/documentation/web-api/reference/seek-to-position-in-currently-playing-track), [embed troubleshooting](https://developer.spotify.com/documentation/embeds/tutorials/troubleshooting).
