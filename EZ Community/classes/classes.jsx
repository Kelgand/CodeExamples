import React, {useState, useEffect} from 'react';

import ClassSelector from './components/classSelector';
import RoleSelector from './components/roleSelector';
import GodstonePanel from './components/godstonePanel';

import classDescriptions from './resources/classDescriptions.json';
import ClassInfo from './resources/classInfo.json';

import './classes.css';

export default function Classes(props){
    const [lastClickedType, setLastClickedType] = useState('');
    const [className, setClassName] = useState('Blade Master');
    const [role, setRole] = useState('Reaver');
    const [selectedSkill, setSelectedSkill] = useState('');

    useEffect(() => {
        if(lastClickedType === 'class'){
            window.history.replaceState(null, 'EZ Community', `/classes/${className}`)
        } else if(lastClickedType === 'role'){
            window.history.replaceState(null, 'EZ Community', `/classes/${className}/${role}`);
        } else if(lastClickedType === 'skill'){
            window.history.replaceState(null, 'EZ Community', `/classes/${className}/${role}/${ClassInfo[className][role].skills[ClassInfo[className][role].order[skillToShow]].name}`);
        }
        setLastClickedType('');
    }, [lastClickedType]);

    useEffect(() => {
        const [_, __, _class, _role, _skill] = props.location.pathname.split('/');
        if(_class && ClassInfo[_class]){
            setClassName(_class);
            if(_role && ClassInfo[_class][_role]){
                setRole(_role);
            } else {
                setRole(ClassInfo[_class].roleNames[0]);
            }
        }
    }, []);
    
    return (
        <div className='classContainer'>
            <ClassSelector classInfo={ClassInfo} class={className} setClassName={setClassName} setRole={setRole} setSkillToShow={setSelectedSkill} clicked={setLastClickedType} />
			<div className='classDescriptions'>
				{
					classDescriptions[className].map((descriptionText, index) => <p key={descriptionText.slice(0, 20)}>{descriptionText}</p>)
				}
			</div>
            <RoleSelector classInfo={ClassInfo} class={className} role={role} setRole={setRole} setSkillToShow={setSelectedSkill} clicked={setLastClickedType} />
            <GodstonePanel gestures={ClassInfo[className][role].skills} selectedSkill={selectedSkill} setSelectedSkill={setSelectedSkill} />
            {/*<SkillInfo skills={ClassInfo[className][role]} skillToShow={skillToShow} setSkillToShow={setSkillToShow} data={ClassInfo[className][role].skills[ClassInfo[className][role].order[skillToShow]]} clicked={setLastClickedType} />*/}
        </div>
    )
}
