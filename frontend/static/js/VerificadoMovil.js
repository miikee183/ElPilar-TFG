function redirectApp(path, token) {
    setTimeout(function() {
        window.location.href = "pescaapp://" + path + "?token=" + token;
    }, 600);
}
