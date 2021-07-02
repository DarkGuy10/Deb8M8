const socket = io();
const createField =  document.querySelector('#createField');
const createBtn = document.querySelector('#createBtn');

createBtn.addEventListener('click', event => {
    event.preventDefault();
    createDebate();
});

createField.addEventListener('keyup', event => {
    if(event.key == 'Enter')
        createDebate();
});

const createDebate = () => {
    if(window.getComputedStyle(createField).display === 'none'){
        createField.style.display = 'block';
        createBtn.innerHTML = '<i class="fas fa-plus-circle fa-fw"></i>';
        createBtn.classList.remove('createBtn');
        return;
    }
    if(!createField.value.trim())
        return;
    const data = {
        title: createField.value.toLowerCase().trim(),
    }
    socket.emit('createDebate', data);
};

socket.on('createDebateResponse', response => {
    if(response.error){
        alert(`Error : ${response.error}`);
        if(response.error === 'Debate already exists!'){
            window.location.assign(`/d/${response.title}`);
        }
        return;
    }
    alert('Debate created!');
    window.location.assign(`/d/${response}`);
});


const searchField =  document.querySelector('#searchField');
const searchBtn = document.querySelector('#searchBtn');

searchBtn.addEventListener('click', event => {
    event.preventDefault();
    search();
});

searchField.addEventListener('keyup', event => {
    if(event.key == 'Enter')
        search();
});

const search = () => {
    if(!searchField.value.trim())
        return;
    window.location.assign(`/search?query=${searchField.value.trim()}`);
};