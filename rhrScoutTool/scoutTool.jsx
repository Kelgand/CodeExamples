import React, {useState, useEffect, useRef} from 'react';
import ReactDOM from 'react-dom';

import Controls from './components/controls';
import GroupedRacers from './components/groupedRacers';
import Header from './components/header';
import StreamsContainer from './components/streamsContainer';
import Runners from './components/runners';
import Stream from './components/stream';

import * as sockets from '../socketHandler';

const defaultRacerObject = {
	level: 1,
	checkpoint: 1,
	isFinished: false,
	checkpointTimestamp: 1,
}

function ScoutTool(){
	const [loggedIn, setLoggedIn] = useState(false);
	const [username, setUsername] = useState('');
	const [broadcastChannel, setBroadcastChannel] = useState(null);
	const [socketConnected, setSocketConnected] = useState(false);
	const [onlyShowRacers, setOnlyShowRacers] = useState(false);
	const [startTime, setStartTime] = useState(Date.now());
	const [raceType, setRaceType] = useState(null);
	const [scouts, setScouts] = useState({});
	const [racers, setRacers] = useState({});
	const [racersOrder, setRacersOrder] = useState([]); //All racers
	const [streamsToShow, setStreamsToShow] = useState([]); //Names of streams you're watching
	const [streamOrder, setStreamOrder] = useState({grouped: true, streams: []}); //Ordered and/or grouped stream objects
	const [userColor, setUserColor] = useState('');
	const [groupRacers, setGroupRacers] = useState(true);
	const [reverseStreamOrder, setReverseStreamOrder] = useState(false);
	const [refreshTime, setRefreshTime] = useState(10);
	const [autoOpenEnabled, setAutoOpenEnabled] = useState(false);
	const [autoOpenAt, setAutoOpenAt] = useState([1, 1]);

	const racersRef = useRef();
	const scoutsRef = useRef();
	const autoOpenAtRef = useRef();
	const autoToggleRef = useRef();
	const streamsToShowRef = useRef();
	const broadcastChannelRef = useRef();
	racersRef.current = racers;
	scoutsRef.current = scouts;
	autoOpenAtRef.current = autoOpenAt;
	autoToggleRef.current = autoOpenEnabled;
	streamsToShowRef.current = streamsToShow;
	broadcastChannelRef.current = broadcastChannel;

	//On load
	useEffect(() => {
		fetch('/loggedIn')
			.then(res => res.json())
			.then(res => {
				if(res.status){
					setLoggedIn(true);
					setUsername(res.username);
					const urlParams = new URLSearchParams(window.location.search);
					const minimal = urlParams.get('minimal');
					if(minimal === 'true'){
						setOnlyShowRacers(true);
					}
					
					const broadcastChannel = new BroadcastChannel(`ScoutTool${res.username}`);
					broadcastChannel.onmessage = receiveFromTab;
					setBroadcastChannel(broadcastChannel);
				}
			})
	}, []);

	//Name color handling
	useEffect(() => {
		if(userColor && loggedIn){
			document.cookie = `color=${userColor}; expires=Sun, 16 Jul 3567 00:00:00 GMT`;
			updateColor(userColor);
		} else if(!userColor) {
			const colorCookie = (document.cookie)
				.split('; ')
				.find(row => row.startsWith('color='));
			if(colorCookie){
				setUserColor(colorCookie.split('=')[1]);
			} else {
				setUserColor(`#${createRandomColor()}`);
			}
		}
	}, [userColor])

	//Socket handling
	useEffect(() => {
		if(raceType){
			sockets.initiateSocket({race: raceType, username, color: userColor});

			sockets.subscribeToState(data => {
				setRacers(data.runners);
				setScouts(data.scouts);
				setStartTime(data.startTime);
			});

			sockets.subscribeToColorChanges(data => {
				let scout;
				setScouts(scouts => {
					scout = {...scouts[data.scout]};
					scout.color = data.color;
					return {...scouts, [data.scout]: scout};
				});
				setRacers(_racers => {
					let racers = {..._racers};
					Object.keys(scout.watchedRunners).forEach(racer => {
						racers[racer].scoutsWatching[data.scout] = data.color;
					});
					return racers;
				});
			});

			sockets.subscribeToAddRacer(name => {setRacers(racers => {return {...racers, [name]: {...defaultRacerObject, scoutsWatching: {}, name}}})});

			sockets.subscribeToAddScout(data => {setScouts(scouts => {return {...scouts, ...data}});});

			sockets.subscribeToRemoveRacer(name => {
				setRacers(racers => {
					delete racers[name];
					return racers;
				});

				setScouts(scouts => {
					const newScouts = {};
					
					Object.entries(scouts).forEach(([name, data]) => {
						delete data.watchedRunners[name];
						newScouts[name] = data;
					})
					return newScouts;
				})
			});

			sockets.subscribeToScoutingUpdate(({runner, isWatched, scout}) => {
				if(!racersRef.current[runner]){
					return;
				}

				let newScout = {...scoutsRef.current[scout]};
				let newRacer = {...racersRef.current[runner]}
				let newScouts = {...scoutsRef.current};
				let newRacers = {...racersRef.current};
				if(isWatched){
					newScout.watchedRunners[runner] = true;
					newScouts[scout] = newScout;
					newRacer.scoutsWatching[scout] = newScout.color;
					newRacers[runner] = newRacer;
				} else {
					delete newScout.watchedRunners[runner];
					delete newRacer.scoutsWatching[scout];
				}

				setScouts(newScouts);
				setRacers(newRacers);
			});

			sockets.subscribeToRemoveScout(id => {
				setScouts(scouts => {
					const newScouts = {...scouts};
					delete newScouts[id];
					return newScouts;
				});

				setRacers(racers => {
					const newRacers = {...racers};
					Object.entries(racers).forEach(([name, data]) => {
						delete data.scoutsWatching[id];
						newRacers[name] = data; 
					})
					return newRacers;
				})
			})

			sockets.subscribeToRacerProgress(data => {
				let newRacers;
				setRacers(racers => {
					const {runnerName, type, number, checkpointTimestamp} = data;
					newRacers = {...racers};
					let racer = newRacers[runnerName];
					racer[type] = number;
					racer.checkpointTimestamp = checkpointTimestamp;
					if(type === 'level'){
						racer.checkpoint = 1;
					}
					newRacers[runnerName] = racer;
					return newRacers;
				});
				
				if(autoToggleRef.current){
					const racer = newRacers[data.runnerName];
					if(racer.level === autoOpenAtRef.current[0] && racer.checkpoint === autoOpenAtRef.current[1] && !streamsToShowRef.current.includes(data.runnerName)){
						toggleStream(data.runnerName);
					}
				}
			})

			sockets.subscribeToRacerFinished(data => {
				setRacers(racers => {
					const {runner, isFinished, checkpointTimestamp} = data;
					let newRacers = {...racers};
					let racer = {...newRacers[runner]};
					racer.isFinished = isFinished;
					racer.checkpointTimestamp = checkpointTimestamp;
					newRacers[runner] = racer;
					return newRacers;
				});
			})

			sockets.subscribeToStartTimeUpdate(setStartTime);

			setSocketConnected(true);
		}
		return;
	}, [raceType])

	//Sort racers and create stream objects
	useEffect(() => {
		const sortedRacers = Object.entries(racers).sort(sortRacers);
		const racersOrder = sortedRacers.map(([name, data]) => name);
		
		let streams = [];
		if(groupRacers){
			let currentIndex = -1;
			let lastLevelProcessed = null;
			let lastCheckpointProcessed = null;
			let lastIsFinished = false;
			racersOrder.forEach(racer => {
				if(!streamsToShow.includes(racer)){
					return;
				}
				if(racers[racer].level !== lastLevelProcessed || racers[racer].checkpoint !== lastCheckpointProcessed || racers[racer].isFinished !== lastIsFinished){
					currentIndex++;
					lastLevelProcessed = racers[racer].level;
					lastCheckpointProcessed = racers[racer].checkpoint;
					lastIsFinished = racers[racer].isFinished;
					streams.push({id: `${lastLevelProcessed}-${lastCheckpointProcessed}${lastIsFinished ? 'C' : ''}`, streams: []});
				}
				streams[currentIndex].streams.push(<Stream
					racerData={racers[racer]}
					racerName={racer}
					toggleFinished={toggleFinished}
					updateRacer={updateRacer}
					key={racer}
					startTime={startTime}
					maxDelay={refreshTime}
				/>)
			});
			
			if(reverseStreamOrder){
				streams.reverse();
			}
		} else {
			streamsToShow.forEach(racer => {
				if(!racersOrder.includes(racer)){
					return;
				}
				streams.push(<Stream
					racerData={racers[racer]}
					racerName={racer}
					toggleFinished={toggleFinished}
					updateRacer={updateRacer}
					key={racer}
					order={racersOrder.indexOf(racer) * (reverseStreamOrder ? -1 : 1)}
					startTime={startTime}
					maxDelay={refreshTime}
				/>)
			});
		}
		
		setStreamOrder({grouped: groupRacers, streams});
		setRacersOrder(racersOrder);
	}, [racers, groupRacers, reverseStreamOrder, startTime, refreshTime]);

	const addRacer = (racer) => {
		if(racer){
			fetch(`${process.env.DOMAIN}/add/${raceType}/${racer}`);
		}
	}
	
	const updateColor = color => {
		if(socketConnected){
			sockets.sendMessage('updateColor', color);
		}
	}

	const updateRacer = (username, type, value) => {
		sockets.sendMessage('runnerProgress', {
			runnerName: username,
			type,
			number: value
		});
	}

	const toggleFinished = (username, value) => {
		sockets.sendMessage('finishedUpdate', {runner: username, isFinished: value});
	}

	const toggleStream = racerName => {
		let newRacer = racersRef.current[racerName] ? {...racersRef.current[racerName]} : null;
		if(!newRacer){
			return;
		} 
		newRacer.isWatched = !newRacer.isWatched;
		let newRacers = {...racersRef.current, [racerName]: newRacer};
		let newStreamsToShow = [...streamsToShow];

		if(newRacer.isWatched){
			newStreamsToShow.push(racerName);
			sendToTab('join', racerName);
		} else {
			newStreamsToShow.splice(newStreamsToShow.indexOf(racerName), 1);
			sendToTab('part', racerName);
		};

		sockets.sendMessage('watchUpdate', {runner: racerName, isWatched: newRacer.isWatched});
		setRacers(newRacers);
		setStreamsToShow(newStreamsToShow);
	}

	const updateStartTime = (time) => {
		sockets.sendMessage('startTime', time);
	}

	const receiveFromTab = message => {
		const {method, data} = message.data;
		if(method === 'getChannels'){
			sendToTab('channels', streamsToShowRef.current);
		}
	}
	
	const sendToTab = (method, data) => {
		broadcastChannelRef.current.postMessage({method, data});
	}

	if(onlyShowRacers){
		return <div className='scoutToolContainer'>
			<Runners racers={racers} racersOrder={racersOrder} onlyShowRacers={onlyShowRacers} setOnlyShowRacers={setOnlyShowRacers}/>
		</div>
	}
	
	return (
		<div className='scoutToolContainer'>
			<Header userColor={userColor} loggedIn={loggedIn} raceType={raceType} scouts={scouts} setRaceType={setRaceType} setUserColor={setUserColor} />
			<div className='contentContainer'>
				<div className='streamsContainer'>
					{
						streamOrder.grouped ? 
							<GroupedRacers streamOrder={streamOrder.streams} /> :
							<StreamsContainer streamOrder={streamOrder.streams} />
					}
				</div>
				<Runners racers={racers} racersOrder={racersOrder} onlyShowRacers={onlyShowRacers} setOnlyShowRacers={setOnlyShowRacers} toggleStream={toggleStream} />
			</div>
			{
				raceType ? <Controls
					addRacer={addRacer}
					autoOpenAt={{get: autoOpenAt, set: setAutoOpenAt}}
					autoOpenEnabled={{get: autoOpenEnabled, set: setAutoOpenEnabled}}
					groupRacers={{get: groupRacers, set: setGroupRacers}}
					refreshTime={{get: refreshTime, set: setRefreshTime}}
					reverseStreamOrder={{get: reverseStreamOrder, set: setReverseStreamOrder}}
					startTime={startTime}
					updateStartTime={updateStartTime}
					username={username}
				/>
				: null
			}
		</div>
	)
};

const createRandomColor = () => {
	let result = '';
	const characters = '0123456789abcdef';
	for (let i = 0; i < 6; i++ ) {
		result += characters.charAt(Math.floor(Math.random() * characters.length));
	}
	return result;
};

const sortRacers = (a, b) => {
	const [nameA, dataA] = a;
	const [nameB, dataB] = b;

	//if one is finished, but not the other
	if(dataA.isFinished && !dataB.isFinished){
		return -1;
	} else if(dataB.isFinished && !dataA.isFinished){
		return 1;
	}
	//if both are finished
	if(dataA.isFinished && dataB.isFinished){
		return dataA.checkpointTimestamp - dataB.checkpointTimestamp;
	}
	//if one is at a higher level
	if(dataA.level !== dataB.level){
		return dataB.level - dataA.level;
	}
	//compare checkpoints
	if(dataB.checkpoint !== dataA.checkpoint){
		return dataB.checkpoint - dataA.checkpoint;
	} 
	
	//Race hasn't started? Alphabetical
	if(dataB.checkpointTimestamp === dataA.checkpointTimestamp){
		return nameA.toUpperCase() > nameB.toUpperCase() ? 1 : -1;
	} else {
		return dataA.checkpointTimestamp - dataB.checkpointTimestamp;
	}
};

const mountNode = document.getElementById('app');
ReactDOM.render(<ScoutTool />, mountNode);