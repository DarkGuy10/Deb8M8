if(window.localStorage.getItem('logged'))
    window.location.assign('/');
const socket = io();
const userField = document.querySelector('#userField');
const form = document.querySelector('form');
form.addEventListener('submit', event => {
    event.preventDefault();
    socket.emit('createUser', userField.value);
});
socket.on('createUserResponse', user => {
    if(user.error){
        alert(`Error : ${user.error}`);
        return;
    }
    window.localStorage.setItem('token', user.token);
    window.localStorage.setItem('username', user.username);
    window.localStorage.setItem('discriminator', user.discriminator);
    window.localStorage.setItem('tag', `${user.username}#${user.discriminator}`);
    window.localStorage.setItem('logged', true);
    alert('Signup Success!');
    const redirect = window.location.search.substr(1).replace('redirect=', '') || '/';
    window.location.assign(redirect);
});