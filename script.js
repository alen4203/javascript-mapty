'use strict';

class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);
  clicks = 0;

  constructor(coords, distance, duration) {
    this.coords = coords; // [lat, lng]
    this.distance = distance; // km
    this.duration = duration; // min
  }

  _setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    this.description = `${this.type[0].toUpperCase() + this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }

  click() {
    this.clicks++;
  }
}

class Running extends Workout {
  type = 'running';
  #markerId;
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
  }
  calcPace() {
    // min/km
    this.pace = this.duration / this.distance;
  }
}
class Cycling extends Workout {
  type = 'cycling';
  #markerId;
  constructor(coords, distance, duration, elevGain) {
    super(coords, distance, duration);
    this.elevGain = elevGain;
    this.calcSpeed();
    this._setDescription();
  }
  calcSpeed() {
    // km/hr
    this.speed = this.distance / (this.duration / 60);
  }
}

// const run1 = new Running([23, 125], 10, 45, 170);
// const cyc1 = new Cycling([24, 122], 50, 120, 330);
// console.log(run1, cyc1);
//////////////////////////////////
// Application Architecture

const form = document.querySelector('.new__form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
const btnClearWorkouts = document.querySelector('.btn__clearWorkouts');
const btnSortWorkouts = document.querySelector('.btn__sortWorkouts');

class App {
  #map;
  #mapZoomLevel = 13;
  #mapEvent;
  #workouts = [];
  #markers = [];
  #sort = false;
  constructor() {
    // get position from geolocation
    this._getPosition();

    this._getLocalStorage();

    form.addEventListener('submit', this._newWorkout.bind(this));
    // Toggle the form input for running (cadence) and cycling (elevation)
    inputType.addEventListener('change', this._toggleElevationField);

    containerWorkouts.addEventListener('click', this._goToWorkout.bind(this));

    btnClearWorkouts.addEventListener(
      'click',
      this._deleteAllWorkouts.bind(this)
    );

    btnSortWorkouts.addEventListener('click', this._sortWorkouts.bind(this));
  }

  _getPosition() {
    // Geolocation (browser api)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert('Could not get your position.');
        }
      );
    }
  }

  _loadMap(pos) {
    const { latitude, longitude } = pos.coords;
    // const locale = navigator.language;
    // console.log(
    //   `https://www.google.com.tw/maps/@${latitude},${longitude},8z?hl=${locale}`
    // );

    const coords = [latitude, longitude];
    this.#map = L.map('map').setView(coords, this.#mapZoomLevel);

    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);
    // Handling clicks on the map
    this.#map.on('click', this._showForm.bind(this));

    // Markers could only be rendered after the map is loaded
    this.#workouts.forEach(w => this._renderWorkoutMarker(w));
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _hideForm() {
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        '';
    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }

  _toggleElevationField() {
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout(e) {
    e.preventDefault();

    const workout = this._fillWorkoutProps();
    if (!workout) return;
    // Add workout to the workout array
    this.#workouts.push(workout);

    // Render workout on map with a marker
    this._renderWorkoutMarker(workout);

    // Render workout in list
    this._renderWorkout(workout);
    // Hide form & clear input fields
    this._hideForm();
    // Set local storage
    this._setLocalStorage();
  }
  // Parameters are only for edit
  _fillWorkoutProps(workout, form, edit = false) {
    const validInputs = (...inputs) =>
      inputs.every(inp => Number.isFinite(inp));
    const allPositive = (...inputs) => inputs.every(inp => inp > 0);

    // Get form inputs
    const type = edit
      ? form.querySelector('.form__edit--type').value
      : inputType.value;
    const distance = edit
      ? +form.querySelector('.form__edit--distance').value
      : +inputDistance.value;
    const duration = edit
      ? +form.querySelector('.form__edit--duration').value
      : +inputDuration.value;
    // only for new workout
    const lat = this.#mapEvent?.latlng.lat;
    const lng = this.#mapEvent?.latlng.lng;

    // If workout is running, add a running object
    if (type === 'running') {
      // Validate inputs
      const cadence = edit
        ? +form.querySelector('.form__edit--cadence').value
        : +inputCadence.value;
      if (
        !validInputs(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      )
        return alert('Inputs must be positive numbers');

      if (!edit) return new Running([lat, lng], distance, duration, cadence);
      else {
        if (workout.type === 'cycling') {
          const oriId = workout.id;
          const oriDate = workout.date;
          const oriMarker = workout.markerId;
          workout = new Running(workout.coords, distance, duration, cadence);
          workout.id = oriId;
          workout.date = new Date(oriDate);
          workout.markerId = oriMarker;
        }
        workout.type = type;
        workout.distance = distance;
        workout.duration = duration;
        workout.cadence = cadence;
        workout.calcPace();
        workout._setDescription();
        return workout;
      }
    }

    // If workout is cycling, add a cycling object
    if (type === 'cycling') {
      // Validate inputs
      const elevation = edit
        ? +form.querySelector('.form__edit--elevation').value
        : +inputElevation.value;
      if (
        !validInputs(distance, duration, elevation) ||
        !allPositive(distance, duration)
      )
        return alert('Inputs must be positive numbers');
      if (!edit) return new Cycling([lat, lng], distance, duration, elevation);
      else {
        if (workout.type === 'running') {
          const oriId = workout.id;
          const oriDate = workout.date;
          const oriMarker = workout.markerId;
          workout = new Cycling(workout.coords, distance, duration, elevation);
          workout.id = oriId;
          workout.date = new Date(oriDate);
          workout.markerId = oriMarker;
        }
        workout.type = type;
        workout.distance = distance;
        workout.duration = duration;
        workout.elevGain = elevation;
        workout.calcSpeed();
        workout._setDescription();
        return workout;
      }
    }
  }

  _renderWorkoutMarker(workout) {
    const marker = L.marker(workout.coords)
      .addTo(this.#map)
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
        `${this.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`
      )
      .openPopup();

    workout.markerId = marker._leaflet_id;
    this.#markers.push(marker);
  }

  _renderWorkout(workout) {
    let html = `
        <li class="workout workout--${workout.type}" data-id="${workout.id}">
          <h2 class="workout__title">${workout.description} 
            <span>
              <button class="edit__button">
                <i class="fa-solid fa-pen-to-square"></i>
              </button>
              <button class="delete--workout">&times;</button>
            </span>  
          </h2>
          
          <div class="workout__details">
            <span class="workout__icon">${
              workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
            }</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>
      `;
    if (workout.type === 'running')
      html += `
          <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.pace.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.cadence}</span>
            <span class="workout__unit">spm</span>
          </div>
      `;
    if (workout.type === 'cycling')
      html += `
          <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elevGain}</span>
            <span class="workout__unit">m</span>
          </div>
      `;
    html += `
          <form class="edit__form form hidden">
            <h3 class="edit__title">Edit:</h3>
            <div class="form__row">
              <label class="form__label">Type</label>
              <select class="form__input form__edit--type">
                  <option value="running">Running</option>
                  <option value="cycling">Cycling</option>
              </select>
            </div>
            <div class="form__row">
              <label class="form__label">Distance</label>
              <input class="form__input form__edit--distance" placeholder="km" />
            </div>
            <div class="form__row">
              <label class="form__label">Duration</label>
              <input
                  class="form__input form__edit--duration"
                  placeholder="min"
              />
            </div>
            <div class="form__row">
              <label class="form__label">Cadence</label>
              <input
                  class="form__input form__edit--cadence"
                  placeholder="step/min"
              />
            </div>
            <div class="form__row form__row--hidden">
              <label class="form__label">Elev Gain</label>
              <input
                  class="form__input form__edit--elevation"
                  placeholder="meter"
              />
            </div>
            <button class="form__btn">OK</button>
          </form>
        </li>
    `;
    form.insertAdjacentHTML('afterend', html);
  }

  _goToWorkout(e) {
    const workoutEl = e.target.closest('.workout');

    if (!workoutEl) return;

    if (e.target === workoutEl.querySelector('.edit__button i'))
      return this._showEditForm(workoutEl);
    if (e.target === workoutEl.querySelector('.delete--workout'))
      return this._deleteWorkout(workoutEl);

    const workout = this.#workouts.find(w => w.id === workoutEl.dataset.id);

    this.#map.setView(workout.coords, this.#mapZoomLevel, {
      animate: true,
      pan: {
        duration: 0.5,
      },
    });

    // Using the public interface
    workout.click();
  }

  _deleteWorkout(workoutEl) {
    // get index of the workout and marker to be deleted from the workouts and markers array
    const workoutIndex = this.#workouts.findIndex(
      w => w.id === workoutEl.dataset.id
    );
    const markerIndex = this.#markers.findIndex(
      m => m._leaflet_id === this.#workouts[workoutIndex].markerId
    );

    // remove marker from map & from the markers array
    this.#map.removeLayer(this.#markers[markerIndex]);
    this.#markers.splice(markerIndex, 1);

    // remove workout from workouts array & from sidebar UI
    this.#workouts.splice(workoutIndex, 1);
    workoutEl.remove();

    // reset localstorage
    this._setLocalStorage();
  }

  _deleteAllWorkouts() {
    this.#markers.forEach(m => this.#map.removeLayer(m));
    this.#markers = [];

    document.querySelectorAll('.workout').forEach(w => w.remove());
    this.#workouts = [];
    localStorage.removeItem('workouts');
  }

  _sortWorkouts() {
    this.#sort = !this.#sort;

    const workoutsArr = this.#sort
      ? this.#workouts.slice().sort((a, b) => a.distance - b.distance)
      : this.#workouts;

    document.querySelectorAll('.workout').forEach(w => w.remove());
    workoutsArr.forEach(w => this._renderWorkout(w));
  }

  _showEditForm(workoutEl) {
    const editForm = workoutEl.querySelector('.edit__form');

    editForm.classList.toggle('hidden');

    editForm
      .querySelector('.form__edit--type')
      .addEventListener('change', function (e) {
        editForm
          .querySelector('.form__edit--cadence')
          .closest('.form__row')
          .classList.toggle('form__row--hidden');
        editForm
          .querySelector('.form__edit--elevation')
          .closest('.form__row')
          .classList.toggle('form__row--hidden');
      });

    const workout = this.#workouts.find(w => w.id === workoutEl.dataset.id);

    editForm.addEventListener(
      'submit',
      this._editWorkout.bind({ app: this, workout, editForm })
    );
  }

  _editWorkout(e) {
    e.preventDefault();
    // get the edited workout
    const editedWorkout = this.app._fillWorkoutProps(
      this.workout,
      this.editForm,
      true
    );

    // update #workouts array
    this.app.#workouts = this.app.#workouts.map(w =>
      w.id === editedWorkout.id ? editedWorkout : w
    );

    // close edit form
    this.editForm.classList.toggle('hidden');

    // clear workouts on UI and re-render
    document.querySelectorAll('.workout').forEach(w => w.remove());
    this.app.#workouts.forEach(w => this.app._renderWorkout(w));

    // get the edited workout's marker
    const marker = this.app.#markers.find(
      m => m._leaflet_id === editedWorkout.markerId
    );
    // update the marker popup
    marker
      .closePopup()
      .unbindPopup()
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${editedWorkout.type}-popup`,
        })
      )
      .setPopupContent(
        `${editedWorkout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${
          editedWorkout.description
        }`
      )
      .openPopup();

    this.app._setLocalStorage();
  }

  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }

  _getLocalStorage() {
    // NOTE: Objects loaded from local storage will not keep the inheritance information!!
    // So, workouts (running/cycling) from local storage will not have the 'workout' prototype and thus cannot access the properties from 'workout'
    let workoutsData = JSON.parse(localStorage.getItem('workouts'));
    if (!workoutsData) return;

    // rebuild objects from local storage
    workoutsData = workoutsData.map(w => {
      const rebuild =
        w.type === 'running'
          ? new Running(w.coords, w.distance, w.duration, w.cadence)
          : new Cycling(w.coords, w.distance, w.duration, w.elevGain);
      rebuild.date = new Date(w.date);
      rebuild.id = w.id;
      rebuild.markerId = w.markerId;
      return rebuild;
    });

    this.#workouts = workoutsData;
    workoutsData.forEach(w => {
      this._renderWorkout(w);
      // cannot render marker here because the map is not loaded yet at this moment
      //   this._renderWorkoutMarker(w);
    });
  }

  reset() {
    localStorage.removeItem('workouts');
    location.reload();
  }
}

const app = new App();
