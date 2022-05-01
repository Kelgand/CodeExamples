import React, {useEffect, useState} from 'react';

import TwitchPlayer from './twitchPlayer';

const stream = ({updateRacer, racerData, racerName, toggleFinished, order, startTime, maxDelay}) => {
	const [showOverlay, setShowOverlay] = useState(false);
	const [playSounds, setPlaySounds] = useState(false);
	const [key, setKey] = useState(Date.now());
	const [finishedTime, setFinishedTime] = useState('1:XX:XX');
	useEffect(() => {
		if(!racerData.isFinished){
			setFinishedTime('');
			return;
		}
		
		let racerTimeInSeconds = (racerData.checkpointTimestamp - startTime) / 1000;
		if(startTime < 0){
			return;
		}
		const hours = Math.floor(racerTimeInSeconds / (1 * 60 * 60));
		racerTimeInSeconds -= hours * 60 * 60;

		const minutes = Math.floor(racerTimeInSeconds / (1 * 60));
		racerTimeInSeconds -= minutes * 60;

		const seconds = Math.floor(racerTimeInSeconds);

		if(hours){
			setFinishedTime(`${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`)
		} else {
			setFinishedTime(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`)
		}

	}, [racerData.isFinished, startTime]);
	
	return <div className='streamContainer' style={{order}} >
		<div className='streamName'>
			<a href={`https://twitch.tv/${racerName}`} target='_blank' noreferrer='true' noopener='true'>{racerName}</a>
		</div>
		<TwitchPlayer racerName={racerName} playSounds={playSounds} key={key} maxDelay={maxDelay} />
		<div className='streamInputs'>
			<label>
				L: <input className='levelProgressInput' type='number' value={racerData.level} readOnly={true}/>
				<button className='levelProgressButton' onClick={() => updateRacer(racerName, 'level', racerData.level+1)} >+</button>
				<button className='levelProgressButton' onClick={() => updateRacer(racerName, 'level', racerData.level-1)} >-</button>
			</label>
			<label>
				C: <input className='levelProgressInput' type='number' value={racerData.checkpoint} readOnly={true}/>
				<button className='levelProgressButton' onClick={() => updateRacer(racerName, 'checkpoint', racerData.checkpoint+1)} >+</button>
				<button className='levelProgressButton' onClick={() => updateRacer(racerName, 'checkpoint', racerData.checkpoint-1)} >-</button>
			</label>
			<label>
				&#9834;<input type='checkbox' checked={playSounds} onChange={(e) => setPlaySounds(!playSounds)} />
			</label>
			<label>
				&#10004;<input type='checkbox' checked={racerData.isFinished} onChange={(e) => toggleFinished(racerName, e.target.checked)} />
			</label>
			<label>
				<input type='text' className='finishedTime' value={finishedTime} readOnly={true} />
			</label>
		</div>
	</div>
}

export default stream;