export function mouseClick(map, payload) {
	map.fire('mousedown', payload);
	map.fire('mouseup', payload);
}
