import React from 'react';

import GesturePanel from './gesturePanel';

export default ({gestures, selectedSkill, setSelectedSkill}) => {
    return <div className='godstonePanel glowPanel'>
        {
            Object.entries(gestures).map(([gesture, gestureData]) => {
				return <GesturePanel gesture={gesture} gestureData={gestureData} selectedSkill={selectedSkill} setSelectedSkill={setSelectedSkill} key={gesture} />
            })
        }
    </div>
}