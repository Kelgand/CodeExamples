import React from 'react';

import SkillInfoPanel from './skillInfoPanel';
import godstones from '../resources/godstones.json';

export default ({gesture, gestureData, selectedSkill, setSelectedSkill}) => {
    return <div className='godstoneGesturePanel'>
		<div className='godstoneGestureRow'>
			<div className='godstoneGestureName'>
				{
					gestureData.noIcon ? 
					<div className='godstoneGestureImage' /> : 
					<img className='godstoneGestureImage' src={`/images/skills/gestures/${gesture}.png`} />
				}
				<div className='godstoneGestureText'>
					{gesture}
				</div>
			</div>
			<div className='godstoneIconsRow'>
				{
					gestureData.skills.map(skill => <div 
						className={`godstoneIconContainer ${skill.name === selectedSkill ? 'miniGlowPanel' : null}`}
						onClick={() => setSelectedSkill(skill.name)}
						key={skill.name}
					>
						{skill.name}
						<img className='godstoneIcon' src={godstones[skill.name].missingIcon ? `/images/skills/Unknown.png`: `/images/skills/${skill.name}.png`} />
						Level: {skill.level}
					</div>)
				}
			</div>
		</div>
		{
			gestureData.skills.find(skill => skill.name === selectedSkill) ? 
			<div className='godstoneGestureRow'>
				<SkillInfoPanel godstoneName={selectedSkill} gestureText={gestureData.text} />
			</div> : null
		}
    </div>
}