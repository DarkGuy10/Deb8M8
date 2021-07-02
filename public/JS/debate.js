const debateName = window.location.pathname.slice(3);
const commentField = document.querySelector('#commentField');
const loggedUser = window.localStorage.getItem('tag');

const socket = io();
socket.emit('requestDebate', {title:debateName, limit: 100, user:loggedUser});

socket.on('requestDebateResponse', debate => {
    if(debate.error && debate.error == 404){
        window.location.assign('/error404'); //to serve 404
        return;
    }
    document.querySelector('#topicBox').innerHTML = decodeURI(debate.title);
    document.title = decodeURI(debate.title);
    
    for(const debater of debate.online) {
        showOnline(debater);
    }
    for(const comment of debate.comments) {
        printComment(comment);
    }
    for(const typingUser of debate.typingUsers) {
        addTypingIndicator(typingUser);
    }
});

// Typing indicator:
let typing = false;
let stopTypingTimeout;

commentField.addEventListener('input', event => {
    if(!typing){
        typing = true;
        socket.emit('typingChange', {typing:typing, debate:debateName, user:loggedUser, token:localStorage.getItem('token')});
        addTypingIndicator(loggedUser);
    }
    if(stopTypingTimeout)
        clearTimeout(stopTypingTimeout);
    stopTypingTimeout = setTimeout(stopTyping, 4000);
});

const stopTyping = () => {
    typing = false;            
    socket.emit('typingChange', {typing:typing, debate:debateName, user:loggedUser, token:localStorage.getItem('token')});
    clearInterval(stopTypingTimeout);
    removeTypingIndicator(loggedUser);
}

socket.on('typingChangeResponse', data => {
    if(data.error){
        alert(`Error : ${data.error}`);
        return;
    }
    if(data.typing)
        addTypingIndicator(data.user);
    else
        removeTypingIndicator(data.user);
});
                
// Send msg
commentField.addEventListener('keyup', event => {
    if(event.key != 'Enter' || !commentField.value.trim()) return;
    const comment = {
        debate: debateName,
        author: localStorage.getItem('tag'),
        content: commentField.value.trim()
    }
    socket.emit('createComment', {token:localStorage.getItem('token'), comment:comment});
    stopTyping();
    commentField.value = "";
});

socket.on('createCommentResponse', comment => {
    if(comment.error){
        alert(`Error : ${comment.error}`);
        return;
    }
    printComment(comment);
});

socket.on('onlineDebaterResponse', debater => {
    showOnline(debater);
});

socket.on('offlineDebaterResponse', debater => {
    hideOffline(debater);
});

const printComment = (comment) => {
    const commentArea = document.querySelector('#commentThreadArea');
    const fullyScrolled = commentArea.scrollTop + commentArea.clientHeight >= commentArea.scrollHeight;

    const contentDiv = document.createElement('div');
    contentDiv.innerHTML = comment.content;
    contentDiv.classList.add('content');

    const lastCommentDiv = commentArea.lastElementChild;
    if(lastCommentDiv){
        const lastCommentAuthor = lastCommentDiv.querySelector('.author').innerHTML;
        if(lastCommentAuthor == comment.author){
            lastCommentDiv.appendChild(contentDiv);
            if(fullyScrolled)
                commentArea.scrollTo(0, commentArea.scrollHeight);
            return;
        }
    }

    const commentDiv = document.createElement('div');
    commentDiv.classList.add('comment');

    const authorDiv = document.createElement('div');
    authorDiv.innerHTML = comment.author;
    authorDiv.classList.add('author');
    commentDiv.appendChild(authorDiv);

    commentDiv.appendChild(contentDiv);

    commentArea.appendChild(commentDiv);

    //Now to fix autoscroll
    if(fullyScrolled)
        commentArea.scrollTo(0, commentArea.scrollHeight);
};

const showOnline = (debater) => {
    const listElement = document.createElement('li');
    listElement.innerHTML = `<i class="fas fa-spinner fa-pulse typingIndicator"></i> ${debater}`;
    listElement.setAttribute('data-debater', debater);
    document.querySelector('#debaterList').appendChild(listElement);
};

const hideOffline = (debater) => {
    const listElement = document.querySelector(`[data-debater='${debater}']`);
    listElement.remove();
};

const addTypingIndicator = (debater) => {
    const indicator = document.querySelector(`[data-debater='${debater}'] i`);
    indicator.style.display = 'inline-block';
}

const removeTypingIndicator = (debater) => {
    const indicator = document.querySelector(`[data-debater='${debater}'] i`);
    indicator.style.display = 'none';
}