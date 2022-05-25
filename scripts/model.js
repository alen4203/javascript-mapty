import Running from './workouts/running.js';
import Cycling from './workouts/cycling.js';

/**
 * Get current location using geolocation API
 * @returns {Promise} A promise with current location if resolved or an error if rejected
 */
export const getLocation = async function () {
  try {
    // Geolocation (browser api)
    if (navigator.geolocation) {
      return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, function () {
          reject(new Error('Could not get your position.'));
        });
      });
    }
  } catch (error) {
    throw error;
  }
};

export const state = {
  mapLocation: { lat: '', lng: '' },
  workoutsArr: [],
  markersArr: [],
};

export const setLocalStorage = function () {
  localStorage.setItem('workouts', JSON.stringify(state.workoutsArr));
};

export const getLocalStorage = function () {
  // NOTE: Objects loaded from local storage will not keep the inheritance information!!
  // So, workouts (running/cycling) from local storage will not have the 'workout' prototype and thus cannot access the properties from 'workout'
  let workouts = JSON.parse(localStorage.getItem('workouts'));
  if (!workouts) return;

  // rebuild objects from local storage
  return workouts.map(w => {
    const rebuild =
      w.type === 'running'
        ? new Running(w.coords, w.distance, w.duration, w.cadence)
        : new Cycling(w.coords, w.distance, w.duration, w.elevation);
    rebuild.date = new Date(w.date);
    rebuild.id = w.id;
    rebuild.markerId = w.markerId;
    return rebuild;
  });
};

const init = function () {
  const workoutsLS = getLocalStorage();
  state.workoutsArr = workoutsLS ? workoutsLS : [];
};
init();

export const addWorkoutMarker = function (workout, marker) {
  workout.markerId = marker._leaflet_id;
  state.markersArr.push(marker);
};

export const deleteWorkoutMarker = function (markerId) {
  const index = state.markersArr.findIndex(m => m._leaflet_id === markerId);
  state.markersArr.splice(index, 1);
};

/**
 * Clear workouts & markers array from state and clear local storage
 */
export const clearAll = function () {
  state.workoutsArr.splice(0, state.workoutsArr.length);
  state.markersArr.splice(0, state.markersArr.length);
  localStorage.removeItem('workouts');
};

export const getMarkerById = function (id) {
  return state.markersArr.find(m => m._leaflet_id === id);
};

export const getWorkoutByElement = function (el) {
  return state.workoutsArr.find(w => w.id === el.dataset.id);
};

/**
 * Get index of the corresponding workout and marker from workouts / markers array
 * @param {Element} workoutEl Receiving html element of the workout
 * @returns {Array} An array containing workoutId & markerId
 */
export const getIndexFromArr = function (workoutEl) {
  // get index of the workout and marker to be deleted from the workouts and markers array
  const workoutId = state.workoutsArr.findIndex(
    w => w.id === workoutEl.dataset.id
  );
  const markerId = state.markersArr.findIndex(
    m => m._leaflet_id === state.workoutsArr[workoutId].markerId
  );
  return [workoutId, markerId];
};

export const deleteWorkout = function (workoutId, markerId) {
  // remove marker from map & from the markers array
  state.workoutsArr.splice(workoutId, 1);
  state.markersArr.splice(markerId, 1);
};

const validInputs = (...inputs) => inputs.every(inp => Number.isFinite(inp));
const allPositive = (...inputs) => inputs.every(inp => inp > 0);

/**
 * Validate form input
 * @param {Object} formData Transformed input data object
 */
export const validateInput = function (formData) {
  const type = formData.type;
  const distance = +formData.distance;
  const duration = +formData.duration;
  const cadence = +formData.cadence;
  const elevation = +formData.elevation;

  // Input Validation
  if (
    !validInputs(
      distance,
      duration,
      type === 'running' ? cadence : elevation
    ) ||
    !allPositive(distance, duration, type === 'running' ? cadence : elevation)
  ) {
    throw new Error('Inputs must be positive numbers');
  }
};

/**
 * Create a new workout as form input
 * @param {Object} formData Transformed input data object
 * @returns {Workout} Created workout object
 */
export const createNewWorkout = function (formData) {
  const type = formData.type;
  const distance = +formData.distance;
  const duration = +formData.duration;
  const cadence = +formData.cadence;
  const elevation = +formData.elevation;
  const { lat, lng } = state.mapLocation;

  return type === 'running'
    ? new Running([lat, lng], distance, duration, cadence)
    : new Cycling([lat, lng], distance, duration, elevation);
};

/**
 * Reassign workout properties as edit form input
 * @param {Workout} workout Original workout object
 * @param {Object} formData Transformed input data object
 * @returns {Workout} updated workout object
 */
export const reassignWorkoutAttr = function (workout, formData) {
  const type = formData.type;
  const distance = +formData.distance;
  const duration = +formData.duration;
  const cadence = +formData.cadence;
  const elevation = +formData.elevation;

  // Edited type != original type
  if (workout.type !== type) {
    const markerId = workout.markerId;
    const date = workout.date;
    const id = workout.id;
    workout =
      type === 'running'
        ? new Running(workout.coords, distance, duration, cadence)
        : new Cycling(workout.coords, distance, duration, elevation);

    // Keep original id / date / markerId
    workout.id = id;
    workout.date = new Date(date);
    workout.markerId = markerId;
  } else {
    // Edited type === original type
    // Update properties, re-calc Pace/Speed & reset description
    workout.distance = distance;
    workout.duration = duration;

    if (type === 'running') {
      workout.cadence = cadence;
      workout.calcPace();
      workout._setDescription();
    }
    if (type === 'cycling') {
      workout.elevation = elevation;
      workout.calcSpeed();
      workout._setDescription();
    }
  }
  return workout;
};

export const updateWorkoutsArr = function (workout) {
  state.workoutsArr = state.workoutsArr
    .slice()
    .map(w => (w.id === workout.id ? workout : w));
};

export const sortWorkoutsArr = function (sort) {
  return sort
    ? state.workoutsArr.slice().sort((a, b) => a.distance - b.distance)
    : state.workoutsArr;
};
