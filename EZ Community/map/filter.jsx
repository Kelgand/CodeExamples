import React, {useState, useEffect} from 'react';

import './filter.css';

export default props => {
	return <div className='mapFilterContainer'>
		<div className='filterTitle' onClick={() => props.setSelectedFilter(props.selectedFilter === props.name ? '' : props.name)}>
			{props.name}
		</div>
		<div className={`filterBody ${props.selectedFilter === props.name ? 'selectedFilter' : ''}`}>
			<div className='filterAllNoneToggles'>
				<div className='filterToggle' onClick={() => {
					const newItems = {...props.filterItems};
					Object.keys(newItems).forEach(name => newItems[name] = true);
					props.toggleItem(newItems);
				}}>
					Show All
				</div>
				<div className='filterToggle' onClick={() => {
					const newItems = {...props.filterItems};
					Object.keys(newItems).forEach(name => newItems[name] = false);
					props.toggleItem(newItems);
				}}>
					Show None
				</div>
			</div>
			{
				Object.entries(props.filterItems).map(([name, toggled]) => {
				return <div className={`filterItem ${toggled ? 'filterItemToggledOn' : 'filterItemToggledOff'}`} key={name} onClick={() => {
					const newItems = {...props.filterItems};
					newItems[name] = !toggled;
					props.toggleItem(newItems);
				}}>
					{name}
				</div>
				})
			}
			{
				props.children
			}
		</div>
	</div>
}