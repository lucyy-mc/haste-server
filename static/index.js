let isNavigatingAway = false;

function setLanguage(lang) {
    for (let obj of Prism.Live.allInstances) {
        obj.setLanguage(lang);
    }
    document.getElementById("language").innerText = lang;
    window.location.hash = '#' + lang;
    endSearch();
}

function update() {
    for (let obj of Prism.Live.allInstances) {
        obj.update(true);
    }
}

function search() {
    let input = document.getElementById("dropdown-search").value;
    let languages = Object.keys(Prism.languages);
    let outElement = document.getElementById("dropdown-inner");

    outElement.querySelectorAll("div").forEach(x => x.remove());
    if (input === "") {
        for (let lang of ["java", "yaml", "html", "css", "javascript", "json", "python", "csharp"]) {
            outElement.innerHTML += `<div onclick="setLanguage('${lang}')">${lang}</div>`
        }
	    outElement.innerHTML += `<div>[search for more]</div>`
        return;
    }
    for (let lang of languages) {
        if (lang.includes(input)) outElement.innerHTML += `<div onclick="setLanguage('${lang}')">${lang}</div>`
    }
}

function endSearch() {
    document.getElementById("dropdown-content").classList.add("hidden");
}

function startSearch() {
    document.getElementById("dropdown-content").classList.remove("hidden");
    let searchBox = document.getElementById("dropdown-search");
    searchBox.focus();
    searchBox.value = "";
    search();

}

function updateHash() {
    if (window.location.hash !== "") setLanguage(window.location.hash.substring(1));
}

function isEditMode() {
    return document.getElementById("button-copy").classList.contains("disabled");
}

function setEditMode() {
    document.getElementById("button-copy").classList.add("disabled");
    document.getElementById("button-link").classList.add("disabled");
    document.getElementById("button-save").classList.remove("disabled");
    document.querySelector("textarea").readOnly = false;
}

function setReadMode() {
    document.getElementById("button-copy").classList.remove("disabled");
    document.getElementById("button-link").classList.remove("disabled");
    document.getElementById("button-save").classList.add("disabled");
    document.querySelector("textarea").readOnly = true;
}

function retrieveDocument(docId) {
    let split = window.location.pathname.split("/");
    if (docId === undefined) {
        docId = split[split.length - 1];
    }

    if (docId === "") {
        setEditMode();
        return;
    }

    fetch("/documents/" + docId)
        .then(data => data.json())
        .then(data => {
            if (!!data["data"]) {
                document.querySelector("textarea").value = data["data"];
                setReadMode();
                update();
                if (split[split.length - 2] === "copy") {
                    setEditMode();
                }
            } else {
                window.location = "/";
                isNavigatingAway = true;
            }
        }).catch(e => alert("An error has occurred. Please report this (details on https://lucyy.me)!"));
}

function newDocument() {
    if (isEditMode()) {
        if (confirm("This will reset your current document. Are you sure?"))
            document.querySelector("textarea").value = "";
        update();
        return;
    }
    window.location = "/";
}

function putDocument() {
    if (!isEditMode()) return;
    fetch("/documents", {
        method: 'POST',
        body: document.querySelector("textarea").value
    }).then(data => data.json())
        .then(data => {
            isNavigatingAway = true;
            window.location = `/${data['key']}${window.location.hash}`;
        }).catch(error => alert("An error has occurred. Please report this (details on https://lucyy.me)!"));
}

function copyDocument() {
    if (isEditMode()) return;
    let splitName = window.location.pathname.split("/");
    splitName[0] = "copy"
    isNavigatingAway = true;
    window.location = `/${splitName.join("/")}${window.location.hash}`
}

function copyLink() {
    if (isEditMode()) return;
    navigator.clipboard.writeText(window.location).then(() => {
    }, () => {
    })
    document.getElementById("copy-link-indicator").classList.remove("hidden");
    setTimeout(() => document.getElementById("copy-link-indicator").classList.add("hidden"), 1000);
}

function infoPage() {
    window.location = `/about#md`;
}

window.onhashchange = updateHash;
window.onload = ev => {
    retrieveDocument();
    updateHash();
    document.querySelector('textarea').addEventListener('keydown', function (event) {
        if (event.keyCode === 9) {
            let selectionStartPos = this.selectionStart;
            let selectionEndPos = this.selectionEnd;
            let oldContent = this.value;
            this.value = oldContent.substring(0, selectionStartPos) + "\t" + oldContent.substring(selectionEndPos);
            this.selectionStart = this.selectionEnd = selectionStartPos + 1;
            event.preventDefault();
        }
    });
};
window.onbeforeunload = function (e) {
    if (isEditMode() && !isNavigatingAway) {
        if (document.querySelector("textarea").value.trim() !== "") {
            let msg = "You have unsaved changes! Are you sure?"
            e = e || window.event;
            // For IE and Firefox prior to version 4
            if (e) {
                e.returnValue = msg;
            }

            // For Safari
            return msg;
        }
    }
}
document.onpaste = function (e) {
    let element = document.querySelector("textarea");
    if (element.value === " ") element.value = e.clipboardData.getData("text/plain");
}

// keybinds
document.onkeydown = function (e) {
    if (e.code === "Escape") {
        endSearch();
    }
    if (e.code === "KeyN" && e.ctrlKey && e.shiftKey) {
        e.preventDefault();
        e.stopPropagation();
        newDocument();
    } else if (e.code === "KeyD" && e.ctrlKey) {
        e.preventDefault();
        e.stopPropagation();
        copyDocument();
    } else if (e.code === "KeyS" && e.ctrlKey) {
        e.preventDefault();
        e.stopPropagation();
        putDocument();
    } else if (e.code === "KeyC" && e.ctrlKey && e.shiftKey) {
        e.preventDefault();
        e.stopPropagation();
        copyLink();
    }
};
