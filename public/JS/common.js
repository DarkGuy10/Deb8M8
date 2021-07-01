document.querySelector('#logout').addEventListener('click', () => {
    window.localStorage.clear();
    window.location.assign('/signup');
});

const userTooltip = document.querySelector('#userTooltip');
userTooltip.innerText = `Logged in as ${localStorage.getItem('tag')}`;
document.querySelector('.fa-user-circle').onclick = () => {
    const tooltip = document.querySelector('#userTooltip');
    navigator.clipboard.writeText(localStorage.getItem('tag')).then(() => {
        tooltip.innerText = `Copied!`;
    }, error => {
        console.error(error);
    });
};
document.querySelectorAll('.reverseFloat li').forEach(li => {
    const tooltip = li.querySelector('span');
    const icon = li.querySelector('i');
    icon.onmouseover = () => {
        tooltip.style.display = 'inline';
        tooltip.style.animation = 'slide-fade 0.2s 1 forwards ease-out';
    };
    icon.onmouseout = () => {
        tooltip.style.display = 'none';        
        if(tooltip.getAttribute('id') == 'userTooltip')
            tooltip.innerText = `Logged in as ${localStorage.getItem('tag')}`;
    }
});
