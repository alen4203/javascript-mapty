const form = document.querySelector('.new__form');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
const containerWorkouts = document.querySelector('.workouts');
const btnClearWorkouts = document.querySelector('.btn__clearWorkouts');
const btnSortWorkouts = document.querySelector('.btn__sortWorkouts');

export const showForm = function () {
  form.classList.remove('hidden');
  inputDistance.focus();
};

export const hideForm = function () {
  inputDistance.value =
    inputDuration.value =
    inputCadence.value =
    inputElevation.value =
      '';
  form.style.display = 'none';
  form.classList.add('hidden');
  setTimeout(() => (form.style.display = 'grid'), 1000);
};

export const hideEditForm = function (form) {
  const distance = form.querySelector('.form__edit--distance');
  const duration = form.querySelector('.form__edit--duration');
  const cadence = form.querySelector('.form__edit--cadence');
  const elevation = form.querySelector('.form__edit--elevation');

  distance.value = duration.value = cadence.value = elevation.value = '';
  form.classList.add('hidden');
};

export const addHandlerNewWorkout = function (handler) {
  form.addEventListener('submit', function (e) {
    e.preventDefault();

    const data = [...new FormData(this)];
    const dataObj = Object.fromEntries(data);

    handler(dataObj);
  });
};

export const addHandlerToggleElevationField = function () {
  inputType.addEventListener('change', function () {
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
  });
};

export const addHandlerGoToWorkout = function (handler) {
  containerWorkouts.addEventListener('click', function (e) {
    const workoutEl = e.target.closest('.workout');

    if (
      !workoutEl ||
      e.target === workoutEl.querySelector('.edit__button i') ||
      e.target === workoutEl.querySelector('.delete--workout')
    )
      return;

    handler(workoutEl);
  });
};

export const addHandlerDeleteWorkout = function (handler) {
  containerWorkouts.addEventListener('click', function (e) {
    const btn = e.target.closest('.delete--workout');
    if (!btn) return;
    const workoutEl = e.target.closest('.workout');

    handler(workoutEl);
  });
};

export const addHandlerShowEditForm = function (handler) {
  containerWorkouts.addEventListener('click', function (e) {
    const btn = e.target.closest('.edit__button');
    if (!btn) return;

    const workoutEl = e.target.closest('.workout');
    const editForm = workoutEl.querySelector('.edit__form');

    editForm.classList.toggle('hidden');
    addListenerToggleEditType(editForm);

    handler(workoutEl, editForm);
  });
};

const addListenerToggleEditType = function (editForm) {
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
};

export const addHandlerEditWorkout = function (editForm, workout, handler) {
  editForm.addEventListener('submit', function (e) {
    e.preventDefault();
    const data = [...new FormData(this)];
    const dataObj = Object.fromEntries(data);

    handler(workout, dataObj, editForm);
  });
};

export const addHandlerClearWorkouts = function (handler) {
  btnClearWorkouts.addEventListener('click', handler);
};

export const addHandlerSortWorkouts = function (handler) {
  btnSortWorkouts.addEventListener('click', handler);
};

export const clearWorkouts = function () {
  document.querySelectorAll('.workout').forEach(w => w.remove());
};

export const deleteWorkout = function (workoutEl) {
  workoutEl.remove();
};

export const renderWorkouts = function (workoutsArr) {
  if (!workoutsArr) return;

  form.insertAdjacentHTML(
    'afterend',
    workoutsArr.map(workout => _generateMarkup(workout)).join('')
  );
};

const _generateMarkup = function (workout) {
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
            <span class="workout__value">${workout.elevation}</span>
            <span class="workout__unit">m</span>
          </div>
      `;
  html += `
          <form class="edit__form form hidden">
            <h3 class="edit__title">Edit:</h3>
            <div class="form__row">
              <label class="form__label">Type</label>
              <select class="form__input form__edit--type" name="type" >
                  <option value="running">Running</option>
                  <option value="cycling">Cycling</option>
              </select>
            </div>
            <div class="form__row">
              <label class="form__label">Distance</label>
              <input class="form__input form__edit--distance" placeholder="km" name="distance" />
            </div>
            <div class="form__row">
              <label class="form__label">Duration</label>
              <input
                  class="form__input form__edit--duration"
                  placeholder="min"
                  name="duration"
              />
            </div>
            <div class="form__row">
              <label class="form__label">Cadence</label>
              <input
                  class="form__input form__edit--cadence"
                  placeholder="step/min"
                  name="cadence"
              />
            </div>
            <div class="form__row form__row--hidden">
              <label class="form__label">Elev Gain</label>
              <input
                  class="form__input form__edit--elevation"
                  placeholder="meter"
                  name="elevation"
              />
            </div>
            <button class="form__btn">OK</button>
          </form>
        </li>
    `;
  return html;
};
