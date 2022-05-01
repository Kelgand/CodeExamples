# File descriptions
Only samples of components are available as the Scout Tool is currently a private project.

## ScoutTool.jsx
The main page of the scout tool application. The scout tool is server-authoritative. Any data changed about a racer or scout is sent to the server through websockets, then passed back to all of the scouts where the view is then updated. This includes the scout who made the change. State is managed here in React Hooks and passed down to child components as needed. Scouts are also able to launch a popup window from this page, which will display the last 30 lines of Twitch chat for all of the streams they are viewing. Channels are added and removed as the scout opens and closes streams, triggered via a broadcast channel.

## Stream.jsx
Streams are the components that display and manage a racer. It displays the Twitch stream of the racer and contains buttons to track their progress in a level and toggle the mute setting, as sound is generally not needed for a racer until they get to the finish line.