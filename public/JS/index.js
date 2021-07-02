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
        title: createField.value.trim(),
        user: window.localStorage.getItem('tag'),
        token: window.localStorage.getItem('token')
    }
    socket.emit('createDebate', data);
};

socket.on('createDebateResponse', response => {
    if(response.error){
        alert(`Error : ${response.error}`);
        if(response.error === 'Debate already exists!'){
            window.location.assign(`/d/${response.title}`);
        }
        if(response.error === 'Invald user token!')
            logout();
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

// loading user's debates
socket.emit('requestUserDebates', {token:window.localStorage.getItem('token'), user: window.localStorage.getItem('tag')});
socket.on('requestUserDebatesResponse', debates => {
    if(debates.error){
        alert(`Error : ${debates.error}`);
        if(debates.error === 'Invald user token!')
            logout();
        return;
    }
    const h3 = document.querySelector('#debatesWrapper h3');
    if(!debates.length){
        h3.innerText = 'Your debates will appear here';
        return;
    }
    h3.innerText = 'Debates you have spoken in';
    const ul = document.querySelector('#debatesWrapper ul');
    for(const debate of debates) {
        const li = document.createElement('li');
        li.innerText = `/d/${decodeURI(debate.title)}`;
        li.innerHTML += `<span class='userCounts'>online ${debate.onlineCount} / ${debate.debaterCount}</span`
        li.onclick = () => {
            window.location.assign(`/d/${debate.title}`);
        };
        ul.appendChild(li);
    }
});