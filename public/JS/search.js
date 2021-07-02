const socket = io();
const query = window.location.search.substr(1).replace('query=', '');
if(!query)
    window.location.assign('/');

socket.emit('search', query);
socket.on('searchResponse', matched => {
    const h3 = document.querySelector('#searchResults h3');
    if(!matched.length){
        h3.innerText = 'Your search yielded no result!';
        return;
    }
    h3.innerText = 'Search Results';
    matched.sort((a, b) => { //based on number of matches
        return a.matches - b.matches;
    });
    const ul = document.querySelector('#searchResults ul');
    for(const debate of matched) {
        const li = document.createElement('li');
        li.innerText = `/d/${decodeURI(debate.data.title)}`;
        li.innerHTML += `<span class='userCounts'>online ${debate.data.onlineCount} / ${debate.data.debaterCount}</span`
        li.onclick = () => {
            window.location.assign(`/d/${debate.data.title}`);
        };
        ul.appendChild(li);
    }
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