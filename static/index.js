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
    let outLanguages = [];
    let outElement = document.getElementById("dropdown-inner");

    outElement.querySelectorAll("div").forEach(x => x.remove());
    if (input == "") return;
    for (let lang of languages) {
        if (lang.includes(input)) outElement.innerHTML += `<div onclick="setLanguage('${lang}')">${lang}</div>`
    }
}

function endSearch() {
    document.getElementById("dropdown-content").classList.add("hidden");
}

function startSearch() {
    document.getElementById("dropdown-content").classList.remove("hidden");
    let search = document.getElementById("dropdown-search");
    search.focus();
    search.value = "";
    search();

}

function updateHash(ev) {
    if (window.location.hash != "") setLanguage(window.location.hash.substring(1));
}

function isEditMode() {
    return  document.getElementById("button-copy").classList.contains("disabled");
}

function setEditMode() {
    document.getElementById("button-copy").classList.add("disabled");
    document.getElementById("button-link").classList.add("disabled");
    document.getElementById("button-save").classList.remove("disabled");
}

function setReadMode() {
    document.getElementById("button-copy").classList.remove("disabled");
    document.getElementById("button-link").classList.remove("disabled");
    document.getElementById("button-save").classList.add("disabled");
}

function retrieveDocument(docId) {
    let split = window.location.pathname.split("/");
    if (docId == undefined) {
        docId = split[split.length - 1];
    }

    if (docId == "") {
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
            if (split[split.length - 2] == "copy") {
                setEditMode();
            }
        }
        else window.location = "/";
    }).catch( error => alert("An error has occurred. Please report this (details on https://lucyy.me)!"));
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
        window.location = `/${data['key']}${window.location.hash}`;
    }).catch( error => alert("An error has occurred. Please report this (details on https://lucyy.me)!"));
}

function copyDocument() {
    if (isEditMode()) return;
    let splitName = window.location.pathname.split("/");
    splitName[0] = "copy"
    window.location = `/${splitName.join("/")}${window.location.hash}`
}

function copyLink() {
    if (isEditMode()) return;
    navigator.clipboard.writeText(window.location).then(() => {}, () => {})
}

window.onhashchange = updateHash;
window.onload = ev => {retrieveDocument(); updateHash()};
window.onbeforeunload = function (e) {
    if (isEditMode()) {
        let msg = "You have unsaved changes! Are you sure?"
        e = e || window.event;
        // For IE and Firefox prior to version 4
        if (e) {
            e.returnValue = msg;
        }

        // For Safari
        return msg;
    }
};