if(!window.localStorage.getItem('logged'))
    window.location.assign(`/signup?redirect=${window.location.pathname}`);

// Separate file bc this loads before the body