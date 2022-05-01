import React from 'react';
import './roleSelector.css';

const RoleSelector = props => {
    return (
        <div className='roleSelectorContainer glowPanel'>
            <div className='roles selectorRow'>
				{
					props.classInfo[props.class].roleNames.map(roleName => {
						return <div className={`selectorContainer ${props.role === roleName ? 'miniGlowPanel' : null}`} onClick={() => {
								props.setSkillToShow('');
								props.setRole(roleName);
								props.clicked('role');
							}} key={roleName}>
							<span>{roleName}</span>
							<img className='classIcon' src={`/images/classes/${props.classInfo[props.class][roleName].image}`} />
						</div>
					})
				}
            </div>
        </div>
    )
};

export default RoleSelector;