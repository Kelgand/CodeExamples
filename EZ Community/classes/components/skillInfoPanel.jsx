import React from 'react';

import godstones from '../resources/godstones.json';

export default ({godstoneName, gestureText}) => {
	const godstoneData = godstones[godstoneName]
    return <div className='godstoneInfoPanel'>
		<div className='godstoneInfoPanelRow'>
			<div className='godstoneInfoPanelTitle'>
				Description
			</div>
			<div className='godstoneInfoPanelContent'>
        		{godstoneData.description}
			</div>
		</div>
		{
			gestureText ? <div className='godstoneInfoPanelRow'>
				<div className='godstoneInfoPanelTitle'>
					Gesture
				</div>
				<div className='godstoneInfoPanelContent'>
					{gestureText}
				</div>
			</div> : null
		}
		<div className='flexRow'>
			{
				godstoneData.cost ? 
				<div className='godstoneInfoPanelRow'>
					<div className='godstoneInfoPanelTitle'>
						Cost
					</div>
					<div className='godstoneInfoPanelContent centerText'>
						{godstoneData.cost}
					</div>
				</div> : null
			}
			{
				godstoneData.cooldown ? 
				<div className='godstoneInfoPanelRow'>
					<div className='godstoneInfoPanelTitle'>
						Cooldown
					</div>
					<div className='godstoneInfoPanelContent centerText'>
						{godstoneData.cooldown}
					</div>
				</div> : null
			}
		</div>
    </div>
}