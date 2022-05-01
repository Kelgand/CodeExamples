import React, {useState, useEffect, useRef} from "react";
import { useLocation } from 'react-router-dom';
import { Map, Marker, Popup, Polygon, TileLayer } from 'react-leaflet';
import {CRS, divIcon, map} from 'leaflet';

import {regionList, fastTravelList, gatherableList, npcList} from './resources/filterLists';
import MapFilter from './components/filters/filter';
import MapFilterNoList from './components/filters/filterNoList';
import MapFilterNested from './components/filters/nestedFilter';
import TearTracker from './components/tearTracker';
import TearTrackerSlots from './components/tearTrackerSlots';

import 'leaflet/dist/leaflet.css';
import './worldMap.css';

import {fastTravelIcon, markerIcon, NPCIcon, regionEntranceIcon, resourceIcons} from './resources/icons';
import { fastTravelLocations } from "./resources/fastTravelLocations";
import { npcLocationList } from "./resources/npcLocations";
import { getGatherables } from './resources/getGatherables';
import regions from './resources/regions.json';

export default props => {
	const mapRef = useRef(null);
	const [resourcesAreLoaded, setResourcesAreLoaded] = useState(false);
	const [hideFilters, setHideFilters] = useState(false);
	const [gatherables, setGatherables] = useState([]);
	const [gatherablesToShow, setGatherablesToShow] = useState(gatherableList);
	const [gatherableMarkers, setGatherableMarkers] = useState([]);
	const [regionsToShow, setRegionsToShow] = useState(regionList);
	const [center, setCenter] = useState([2160, 3840]);
	const [zoom, setZoom] = useState(-2);
	const [selectedFilter, setSelectedFilter] = useState('');
	//Deep copying because otherwise the useEffect below modifies the original imported list, causing NPC state to leek through.
	const [npcsToShow, setNpcsToShow] = useState(JSON.parse(JSON.stringify(npcList)));
	const [npcMarkers, setNpcMarkers] = useState([]);
	const [showFastTravelPoints, setShowFastTravelPoints] = useState(false);
	const [fastTravelMarkers, setFastTravelMarkers] = useState([]);
	const [regionPolygons, setRegionPolygons] = useState([]);
	const [regionNameMarkers, setRegionNameMarkers] = useState([]);
	const [foundTears, setFoundTears] = useState({});
	const [tearSaveSlot, setTearSaveSlot] = useState(1);

	const location = useLocation();

	//Get gatherable list
	useEffect(async () => {
		setGatherables(await getGatherables());
	}, []);

	//"On Start" functions
	useEffect(() => {
		props.setWidthClass('mapFullScreen');
		const query = new URLSearchParams(location.search);
		let npcs = query.getAll('npc').reduce((npcs, npc) => {
			if(npcLocationList[npc]){
				npcs.push(npc);
			}
			return npcs;
		}, []);
		
		if(npcs.length > 0){
			const newNpcs = {...npcsToShow};
			Object.values(newNpcs).forEach((regionData) => {
				Object.entries(regionData.nestedList).forEach(([npcName, npcData]) => {
					if(npcs.includes(npcData.altName)){
						regionData.toggled = true;
						npcData.toggled = true;
					}
				})
			})
			setNpcsToShow(newNpcs);
			setSelectedFilter('NPCs');
		}

		//Get last used save slot
		try {
			const lastUsedSlot = Number(window.localStorage.getItem('tearSaveSlot') || 1)
			setTearSaveSlot(lastUsedSlot);
		} catch (error) {
			console.log(error);
		}
		
		setResourcesAreLoaded(true);
		return function cleanup(){
			props.setWidthClass('');
		}
	}, []);

	//Load saved Tears
	useEffect(() => {
		try {
			const savedTears = JSON.parse(window.localStorage.getItem(`tears-${tearSaveSlot}`) || "[]")
			const savedTearsAsObject = savedTears.reduce((tears, tearId) => {
				tears[tearId] = true;
				return tears;
			}, {});

			setFoundTears(savedTearsAsObject);
		} catch (error) {
			console.log(error);
		}

		try {
			window.localStorage.setItem('tearSaveSlot', tearSaveSlot.toString());
		} catch (error) {
			//
		}
	}, [tearSaveSlot]);

	//Create fast travel markers
	useEffect(() => {
		const markers = Object.entries(fastTravelLocations).map(([regionName, position]) => {
			return <Marker position={position} icon={fastTravelIcon} key={regionName} >
					<Popup>{regionName}</Popup>
				</Marker>
		})
		setFastTravelMarkers(markers);
	}, [showFastTravelPoints])
	
	//Create NPC markers
	useEffect(() => {
		const markers = [];
		Object.values(npcsToShow).forEach((regionData) => {
			Object.entries(regionData.nestedList).forEach(([npcName, npcData]) => {
				if(npcData.toggled){
					try {
					const [locationX, locationY] = npcLocationList[npcData.altName];
					markers.push(<Marker position={[Number(locationX), Number(locationY)]} icon={NPCIcon} key={npcData.altName} >
							<Popup>{npcName}</Popup>
						</Marker>);
						
					} catch (error) {
					}
				}
			})
		})
		
		setNpcMarkers(markers);
	}, [npcsToShow]);

	//Create Gatherable markers
	useEffect(() => {
		const markers = [];
		gatherables.forEach(gatherable => {
			if(gatherablesToShow[gatherable.name]){
				if(gatherable.name === 'Amara\'s Tear'){
					markers.push(<Marker
							position={[gatherable.location[0], gatherable.location[1]]}
							icon={foundTears[gatherable.id] ? resourceIcons["Found Tear"] : resourceIcons[gatherable.name]}
							key={gatherable.id}
							zIndexOffset={gatherable.id}
						>
							<Popup>
								<TearTracker tearId={gatherable.id} foundTears={foundTears} setFoundTears={setFoundTears} storageSlot={tearSaveSlot} />
							</Popup>
						</Marker>);
				} else {
					markers.push(<Marker
						position={[gatherable.location[0], gatherable.location[1]]}
						icon={resourceIcons[gatherable.name]}
						key={gatherable.id}
						zIndexOffset={gatherable.id}
					/>);
				}
			}
		});
		
		setGatherableMarkers(markers);
	}, [gatherablesToShow, foundTears]);

	//Create Region related markers
	useEffect(() => {
		const polygons = [];
		const nameMarkers = [];

		Object.entries(regionsToShow).forEach(([region, enabled]) => {
			if(!enabled){
				return;
			}
			if(!regions[region]){
				return;
			}
			polygons.push(<Polygon on positions={regions[region].zoneBoundries} color='blue' key={region} />);
			nameMarkers.push(<Marker position={regions[region].zoneNamePoint} icon={divIcon({html: region, iconSize: [300, 20]})} key={region} />)
			/*regions[region].zoneEntrances.forEach((position, index) => {
				regionMarkers.push(<Marker position={position} icon={regionEntranceIcon} key={`${region}${index}`} />);
			})*/
		});
		setRegionPolygons(polygons);
		setRegionNameMarkers(nameMarkers);
	}, [regionsToShow])

	if(!resourcesAreLoaded){
		return <div className='worldMapContainer'>
			Loading map...
		</div>
	}
	
    return (
        <div className='worldMapContainer'>
			<div className={`mapFiltersContainer ${hideFilters ? 'hideMapFilters' : ''}`} onTransitionEnd={() => mapRef.current.leafletElement.invalidateSize(true)} >
				<div className='hideFilterToggle' onClick={() => setHideFilters(!hideFilters)}>{ hideFilters ? '<' : '>'}</div>
				<MapFilter selectedFilter={selectedFilter} setSelectedFilter={setSelectedFilter} toggleItem={setGatherablesToShow} filterItems={gatherablesToShow} name='Gatherables'>
					<TearTrackerSlots storageSlot={tearSaveSlot} setStorageSlot={setTearSaveSlot} setFoundTears={setFoundTears} />
				</MapFilter>
				<MapFilter selectedFilter={selectedFilter} setSelectedFilter={setSelectedFilter} toggleItem={setRegionsToShow} filterItems={regionsToShow} name='Regions' />
				<MapFilterNested selectedFilter={selectedFilter} setSelectedFilter={setSelectedFilter} toggleItem={setNpcsToShow} filterItems={npcsToShow} iconUrl='/images/map/NPC.png' name='NPCs' />
				{<MapFilterNoList selectedFilter={selectedFilter} setSelectedFilter={setSelectedFilter} toggleItem={setShowFastTravelPoints} name='Fast Travel' iconUrl='/images/map/FastTravel.png' />}
			</div>
			
			<div className='mapContainer'>
				<Map 
					ref={mapRef}
					onclick={e => /*console.log([Number(e.latlng.lat.toFixed(0)), Number(e.latlng.lng.toFixed(0))])*/{}} 
					style={{width: '100%', height: '100%'}}
					center={center}
					maxBounds={[[0, -100], [4520, 7680]]}
					zoom={zoom}
					scrollWheelZoom={true}
					crs={CRS.Simple}
					attributionControl={false}
					wheelPxPerZoomLevel={70}
				>
					<TileLayer
						url={`${process.env.SERVER_URL}/images/map/{z}/{x}/{y}.jpg`}
						tileSize={256}
						bounds={[[0, 0], [4320, 7680]]}
						minZoom={-3}
						maxZoom={2}
					/>
					{gatherableMarkers}
					{showFastTravelPoints ? fastTravelMarkers : null}
					{npcMarkers}
					{regionPolygons}
					{regionNameMarkers}
				</Map>
			</div>
        </div>
    )
}