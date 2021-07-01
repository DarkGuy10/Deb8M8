if(!window.localStorage.getItem('logged'))
    window.location.assign(`/signup?redirect=${window.location.pathname}`);

const socket = io();
const createField =  document.querySelector('#createField');
const createBtn = document.querySelector('#createBtn');
createBtn.addEventListener('click', event => {
    event.preventDefault();
    if(!createField.value)
        return;
    const data = {
        title: createField.value.toLowerCase().trim(),
    }
    socket.emit('createDebate', data);
});

socket.on('createDebateResponse', response => {
    if(response.error){
        alert(`Error : ${response.error}`);
        return;
    }
    alert('Debate created!');
    window.location.assign(`d/${response}`);
});