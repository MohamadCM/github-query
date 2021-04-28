/* Send Query to github */
function sendQuery() {
    const username = document.getElementById("username").value;
    if (username && username.length > 0) {
        document.getElementById("submit__button").style.background = "silver"; /* Make button look disabled */
        if(localStorage.getItem(username)){
            validateAndSet(JSON.parse(localStorage.getItem(username)));
        } else {
            fetch(`https://api.github.com/users/${username}`).then((response) => {
                if (response.ok) { // OK situation
                    response.json().then((data) => {
                        const userInfo = {
                            username: data.login,
                            avatar_url: data.avatar_url,
                            name: data.name,
                            location: data.location,
                            blog: data.blog,
                            bio: data.bio,
                            language: undefined
                        }
                        findFavoriteLanguage(userInfo.username).then(lang => {
                            userInfo.language = lang;
                            localStorage.setItem(userInfo.username, JSON.stringify(userInfo))  // Add info to localstorage
                        })
                        validateAndSet(userInfo);
                    })
                } else {
                    if (response.status === 404) { // User not-found situation
                        handleError(404);
                    } else if (response.status === 403) { // Forbidden situation
                        handleError(403);
                    }
                }
            }).catch(response => {
                handleError(undefined);
            })
        }
    }
}
// Handle showing errors
function handleError(status) {
    if(status === 404) {
        document.getElementById("error__box").innerText = "Error: User not found!";
        document.getElementById("error__box").style.display = "block";
        document.getElementById("submit__button").style.background = "limegreen";
    } else {
		document.getElementById("error__box").innerText = "Error: Unable to connect to github servers!";
        document.getElementById("error__box").style.display = "block";
        document.getElementById("submit__button").style.background = "limegreen";
	}
}

/* Validate received JSON and Change HTML elements*/
function validateAndSet(data) {
    document.getElementById("error__box").style.display = "none"; // Hide error block
    document.getElementById("git__container").style.display = "grid"; // Start showing git box
    document.getElementById("avatar").setAttribute("src", data.avatar_url || "");
    if(data.avatar_url) document.getElementById("avatar").style.marginRight = "15px"; // Create margin for picture
    document.getElementById("user__name").innerText = data.name ? `Name: ${data.name}` : ""; // Show name
    document.getElementById("user__address").innerText = data.location ? `Location: ${data.location}` : ""; // Show location
    document.getElementById("user__blog").innerText = data.blog ? `Blog: ${data.blog}` : ""; // Show blog
    document.getElementById("user__bio").innerText = data.bio ? data.bio : ""; // Show bio
    // Find favorite language and set it
    findFavoriteLanguage(data.username).then(lang =>
        document.getElementById("user__language").innerText = lang ? `Favourite language: ${lang}` : "" // Show favourite language
    );
    document.getElementById("submit__button").style.background = "limegreen"; /* Make button look enables */
}

// Finding favourite programming language
async function findFavoriteLanguage(username) {
    const languages = [];
    const response = await fetch(`https://api.github.com/users/${username}/repos?sort=pushed&per_page=5`) // Finding repose
    if (response.ok) {
        const data = await response.json();
        for (const repo of data) {
            const response = await fetch(repo.languages_url) // Getting repos languages
            const langs = await response.json()
            for ([key, val] of Object.entries(langs)) {
                languages.push({[key]: val});
            }
        }
        const uniqueLangs = new Set();
        languages.forEach(lang => uniqueLangs.add(Object.keys(lang)[0]));
        const cumulativeScores = {};
        uniqueLangs.forEach(ul => cumulativeScores[ul] = 0);
        for (const lang of languages) { // Adding Scores on different repos
            [key, val] = Object.entries(lang)[0];
            cumulativeScores[key] += val;
        }

        let maxVal = 0, maxLang = undefined;
        for ([key, val] of Object.entries(cumulativeScores)) {
            if (val > maxVal) {
                maxVal = val;
                maxLang = key;
            }
        }
        return maxLang;
    }
    return undefined;
}
