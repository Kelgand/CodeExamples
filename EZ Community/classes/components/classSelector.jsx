import React from 'react';
import './roleSelector.css';

export default props => {
    return (
        <div className='roleSelectorContainer glowPanel'>
			<div className='classes selectorRow'>
			{
				Object.keys(props.classInfo).map(className => {
					return <div className={`selectorContainer ${props.class === className ? 'miniGlowPanel' : null}`} onClick={() => {
						props.setSkillToShow('');
						props.setRole(props.classInfo[className].roleNames[0]);
						props.setClassName(className);
						props.clicked('class')
					}} key={className}>
						<span>{className}</span>
						<img className='classIcon' src={`/images/classes/${props.classInfo[className].classImage}`} />
					</div>
				})
			}
            </div>
        </div>
    )
};