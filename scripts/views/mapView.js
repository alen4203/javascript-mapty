import 'leaflet/dist/leaflet.css';
import icon from 'leaflet/dist/images/marker-icon.png';
import shadow from 'leaflet/dist/images/marker-shadow.png';
import 'leaflet';

export const map = L.map('map');
const zoomLevel = 13;
const zoomPanOption = {
  animate: true,
  pan: {
    duration: 0.5,
  },
};

export const initMap = function (coords) {
  map.setView(coords, zoomLevel);

  L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);
};

export const changeView = function (coords) {
  map.setView(coords, zoomLevel, zoomPanOption);
};

export const clearMarkers = function (markersArr) {
  markersArr.forEach(m => map.removeLayer(m));
};

export const deleteMarker = function (marker) {
  map.removeLayer(marker);
};

export const addHandlerShowForm = function (handler) {
  map.on('click', handler);
};

export const renderWorkoutMarker = function (workout) {
  const marker = L.marker(workout.coords, {
    icon: new L.Icon({
      iconUrl: icon,
      shadowUrl: shadow,
    }),
  })
    .addTo(map)
    .bindPopup(
      L.popup({
        maxWidth: 250,
        minWidth: 100,
        autoClose: false,
        closeOnClick: false,
        className: `${workout.type}-popup`,
      })
    )
    .setPopupContent(
      `${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`
    )
    .openPopup();

  return marker;
};
