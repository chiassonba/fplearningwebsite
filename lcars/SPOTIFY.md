# Personal Spotify playback in FP-LCARS

The basic Spotify embed remains available without an app connection. Spotify may limit it to previews when sign-in or protected-media playback is unavailable. Its iframe retains `allow="encrypted-media"` and uses Spotify's standard unsandboxed embed configuration. Other embedded websites retain their sandbox.

Full playback uses the optional Spotify Web Playback SDK. The controls can also control the account's active Spotify device through the Web API. Spotify Premium is required. This is a personal integration, not a public streaming service.

## One-time Spotify setup

The public Client ID supplied by Blair is configured in `spotify.js`. No client secret is used or needed. In that app's developer dashboard:

1. Enable Web API and Web Playback SDK.
2. Add exactly `https://fplearning.ca/lcars.html` to Redirect URIs.
3. Add any additional permitted account under Users Management, within Spotify's development-mode limits.

Open Subspace Media in LCARS, click Connect LCARS controls and approve access. Signing into Spotify's embed is separate from this authorization. Paste a track, album or playlist link above the controls. Choose Play here, then Play loaded link. Use Spotify's built-in position control or the back/forward 15-second buttons. Adjust the active device's volume with the LCARS volume slider when that device supports it. Back restarts the current song after a 500 ms click window; a second click within that window plays the previous track instead. Next and play/pause operate on the selected Spotify device.

Play here explicitly transfers the account's player to FP-LCARS and stops the embedded preview. Playback is never started automatically on page load. Returning to Command Station or opening another link inside FP-LCARS keeps Spotify running offscreen without removing, reparenting or reloading its iframe. Open the Subspace Media sidebar link to return to the player. There is no floating bottom bar or sidebar Select app shortcut. The Spotify sidebar entry shows the track, time remaining and previous/next, play/pause, stop, Shuffle On/Off and Repeat Off/All/One controls. Stop pauses playback and returns to the beginning when seeking is allowed. Closing or reloading the tab disconnects that playback device. Use Disconnect to clear this tab's sign-in session. Revoke app access in the Spotify account settings to invalidate the grant at Spotify.


## Control the Spotify app

Open Spotify on your computer or phone with the same account. In Subspace Media, click Refresh devices, choose the app/device, then Control app. This explicitly transfers the account's playback device with playback paused and stops the independent embed. Click Play to resume the app's queue, or Play loaded link to play the pasted track or playlist in that app. The sidebar and volume controls target the selected app, even if another device was previously active.

The selected device ID/name is remembered locally, independently of sign-in tokens. An offline or restricted device is not silently replaced with another device. Open the app, play a song once if needed, then refresh and select it again. Choose Play here only when you want the optional player inside LCARS instead.

## App playlist view

Subspace Media displays the app's reported playlist, the current song and a highlighted track in the list. Double-click a song (or focus it and press Enter/Space) to play that position in the playlist on the selected app. A single click does not start playback. Load more fetches another 50 entries. This view reads Spotify data without starting a second player. Shuffle toggles On/Off in the sidebar; Repeat cycles Off, All and One, skipping restricted modes.

Spotify development-mode access may limit playlist items to playlists owned by the user or shared as a collaborator. Private playlists may require additional read permission. When denied without that permission, Allow playlist access opens Spotify's consent flow. Otherwise LCARS retains the current track and Open in Spotify link. Playlist permission failures do not disconnect app controls.

## Storage and network behavior

- OAuth uses Authorization Code with PKCE and a random, expiring state value. Invalid callbacks are rejected before token exchange, and callback parameters are removed from the address bar.
- The public Client ID is remembered locally. Access and refresh tokens are stored only in this tab's session storage. No credentials are sent to an FPL server.
- The SDK loads only after Play here. Playback state is polled every five seconds while the Spotify panel has been opened and the browser tab is visible, including when its player is running offscreen. A local one-second countdown updates remaining time without additional Spotify requests. Spotify retry delays are respected.
- Browser protected-content settings, Spotify app access and account permissions still apply. Denial, expiry, unavailable devices and rate limits produce messages in the panel.

## Validation

Browser checks with mocked Spotify responses covered OAuth PKCE/state rejection, token exchange, seek boundaries, transport commands, SDK device transfer, loaded-link playback, unavailable devices, playback restrictions, retry delays, disconnect and mobile overflow. A persistent-player browser check also verified that a silent test audio stream keeps advancing inside the same iframe while navigating, collapsing and expanding, with no iframe reload. Sidebar transport, stop/reset, countdown and controls after link editing passed, along with volume regressions and mobile overflow checks. App-control browser checks covered restored connection status, discovery and explicit handoff, resume without a current track, targeted app commands and metadata, remembered selection, isolation from another active device, offline/disconnected behavior and mobile layout. Sidebar option checks covered shuffle on/off, all repeat modes and restrictions, selected-device targeting, permanent absence of the bottom bar and Select app shortcut, and continued background audio. Playlist checks covered metadata, current-track highlighting, pagination, stale-response isolation, permission fallback and mobile layout. Native JavaScript syntax and whitespace checks passed. Actual account authorization and protected-media playback require confirmation using the configured Spotify account in Opera GX.

References: [PKCE](https://developer.spotify.com/documentation/web-api/tutorials/code-pkce-flow), [Web Playback SDK](https://developer.spotify.com/documentation/web-playback-sdk/tutorials/getting-started), [seek controls](https://developer.spotify.com/documentation/web-api/reference/seek-to-position-in-currently-playing-track), [embed troubleshooting](https://developer.spotify.com/documentation/embeds/tutorials/troubleshooting).
